package com.pclink.app.ui.screens.checkout

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.OrderRepository
import com.pclink.app.data.repository.UserRepository
import com.pclink.app.domain.model.Address
import com.pclink.app.domain.model.CartSummary
import com.pclink.app.domain.model.Order
import com.pclink.app.domain.model.PaymentMethod
import com.pclink.app.domain.model.PaymentType
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class ShippingOption(val label: String, val eta: String) {
    STANDARD("Estándar", "5 a 7 días hábiles"),
    EXPRESS("Express", "24 a 48 hs"),
    PICKUP("Retiro en sucursal", "Disponible hoy mismo")
}

data class CheckoutUiState(
    val cart: CartSummary = CartSummary(emptyList()),
    val addresses: List<Address> = emptyList(),
    val selectedAddress: Address? = null,
    val payments: List<PaymentMethod> = emptyList(),
    val selectedPayment: PaymentMethod? = null,
    val shipping: ShippingOption = ShippingOption.STANDARD,
    val shippingCosts: Map<ShippingOption, Double> = mapOf(
        ShippingOption.STANDARD to 4500.0,
        ShippingOption.EXPRESS to 8500.0,
        ShippingOption.PICKUP to 0.0
    ),
    val processing: Boolean = false,
    val paymentUrl: String? = null,
    val placedOrder: Order? = null,
    val error: String? = null,
    val isEmailVerified: Boolean = false,
    val emailVerificationSent: Boolean = false,
    val checkingVerification: Boolean = false
)

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val cartRepository: CartRepository,
    private val userRepository: UserRepository,
    private val addressRepository: com.pclink.app.data.repository.AddressRepository,
    private val orderRepository: OrderRepository,
    private val mpRepository: com.pclink.app.data.repository.MercadoPagoRepository,
    private val shippingRepository: com.pclink.app.data.repository.ShippingRepository
) : ViewModel() {

    private val _state = MutableStateFlow(CheckoutUiState())
    val state: StateFlow<CheckoutUiState> = _state.asStateFlow()

    private var currentShippingConfig = com.pclink.app.domain.model.ShippingConfig()

    init { observe() }

    private fun observe() {
        viewModelScope.launch {
            cartRepository.observeCart().collect { cart ->
                _state.value = _state.value.copy(cart = cart)
                updateShippingCosts(currentShippingConfig, cart.subtotal)
            }
        }
        viewModelScope.launch {
            shippingRepository.observeShippingConfig().collect { config ->
                currentShippingConfig = config
                updateShippingCosts(config, _state.value.cart.subtotal)
            }
        }
        viewModelScope.launch {
            addressRepository.observeAddresses().collect { list ->
                _state.value = _state.value.copy(
                    addresses = list,
                    selectedAddress = _state.value.selectedAddress
                        ?: list.firstOrNull { it.isDefault }
                        ?: list.firstOrNull()
                )
            }
        }
        viewModelScope.launch {
            userRepository.user.collect { user ->
                _state.value = _state.value.copy(
                    payments = AVAILABLE_PAYMENTS,
                    selectedPayment = _state.value.selectedPayment ?: AVAILABLE_PAYMENTS.first(),
                    isEmailVerified = user.isEmailVerified
                )
            }
        }
    }

    private fun updateShippingCosts(config: com.pclink.app.domain.model.ShippingConfig, subtotal: Double) {
        val standardCost = if (subtotal >= config.freeThreshold) 0.0 else config.standard
        _state.value = _state.value.copy(
            shippingCosts = mapOf(
                ShippingOption.STANDARD to standardCost,
                ShippingOption.EXPRESS to config.express,
                ShippingOption.PICKUP to config.pickup
            )
        )
    }

    fun selectAddress(a: Address) {
        _state.value = _state.value.copy(selectedAddress = a)
    }

    fun selectShipping(s: ShippingOption) {
        _state.value = _state.value.copy(shipping = s)
    }

    fun selectPayment(p: PaymentMethod) {
        _state.value = _state.value.copy(selectedPayment = p)
    }

    private fun isPhoneValid(phone: String): Boolean {
        return com.pclink.app.ui.util.PhoneValidator.isValidArgentinePhone(phone)
    }

    fun placeOrder(onPlaced: (String) -> Unit) {
        val s = _state.value
        if (!s.isEmailVerified) {
            _state.value = s.copy(error = "Debes verificar tu email antes de confirmar la compra.")
            return
        }
        val address = s.selectedAddress ?: run {
            _state.value = s.copy(error = "Por favor, agrega o selecciona una dirección de envío")
            return
        }
        if (!isPhoneValid(address.phone)) {
            _state.value = s.copy(error = "La dirección seleccionada requiere un teléfono de contacto de Argentina válido")
            return
        }
        val payment = s.selectedPayment ?: run {
            _state.value = s.copy(error = "Seleccioná un método de pago")
            return
        }
        if (s.cart.isEmpty) {
            _state.value = s.copy(error = "Carrito vacío")
            return
        }
        viewModelScope.launch {
            _state.value = s.copy(processing = true, error = null)
            
            val effectiveShipping = s.shippingCosts[s.shipping] ?: 0.0

            if (payment.type == PaymentType.MERCADO_PAGO) {
                // Flujo de pago REAL con MercadoPago
                val total = s.cart.subtotal - s.cart.couponDiscount + effectiveShipping
                val order = orderRepository.place(
                    items = s.cart.items,
                    subtotal = s.cart.subtotal,
                    shipping = effectiveShipping,
                    discount = s.cart.couponDiscount,
                    total = total,
                    address = address,
                    payment = payment,
                    status = com.pclink.app.domain.model.OrderStatus.PENDING
                )
                val url = mpRepository.createPreference(s.cart.items, effectiveShipping, order.id)
                if (url != null) {
                    cartRepository.clear()
                    _state.value = _state.value.copy(processing = false, paymentUrl = url, placedOrder = order)
                    onPlaced(order.id)
                } else {
                    _state.value = _state.value.copy(processing = false, error = "Error al conectar con MercadoPago")
                }
            } else {
                // Simulación para otros métodos por ahora
                kotlinx.coroutines.delay(1200)
                val total = s.cart.subtotal - s.cart.couponDiscount + effectiveShipping
                val order = orderRepository.place(
                    items = s.cart.items,
                    subtotal = s.cart.subtotal,
                    shipping = effectiveShipping,
                    discount = s.cart.couponDiscount,
                    total = total,
                    address = address,
                    payment = payment
                )
                cartRepository.clear()
                _state.value = _state.value.copy(processing = false, placedOrder = order)
                onPlaced(order.id)
            }
        }
    }


    fun checkVerification() {
        viewModelScope.launch {
            _state.value = _state.value.copy(checkingVerification = true, error = null)
            val result = userRepository.reloadUser()
            _state.value = _state.value.copy(
                checkingVerification = false,
                isEmailVerified = result.getOrDefault(false)
            )
            if (result.isFailure) {
                _state.value = _state.value.copy(error = "No se pudo actualizar el estado de verificación")
            }
        }
    }

    fun resendVerificationEmail() {
        viewModelScope.launch {
            _state.value = _state.value.copy(error = null)
            val result = userRepository.sendVerificationEmail()
            if (result.isSuccess) {
                _state.value = _state.value.copy(emailVerificationSent = true)
            } else {
                _state.value = _state.value.copy(error = "Error al enviar el correo: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    fun consumePaymentUrl() {
        _state.value = _state.value.copy(paymentUrl = null)
    }

    fun clearError() { _state.value = _state.value.copy(error = null) }

    companion object {
        val AVAILABLE_PAYMENTS = listOf(
            PaymentMethod("pm-mp", PaymentType.MERCADO_PAGO, "Mercado Pago", "Saldo + tarjetas", isDefault = true)
        )
    }
}
