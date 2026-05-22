package com.pclink.app.ui.screens.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.SettingsRepository
import com.pclink.app.data.repository.UserRepository
import com.pclink.app.domain.model.CartSummary
import com.pclink.app.domain.model.Coupon
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class CartUiState(
    val cart: CartSummary = CartSummary(emptyList()),
    val isLoading: Boolean = true,
    val isLoggedIn: Boolean = false
)

data class CartUiEvent(val message: String, val isError: Boolean = false)

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepository: CartRepository,
    private val settingsRepository: SettingsRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _state = MutableStateFlow(CartUiState())
    val state: StateFlow<CartUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            cartRepository.observeCart().collect { cart ->
                _state.value = _state.value.copy(cart = cart, isLoading = false)
            }
        }
        viewModelScope.launch {
            userRepository.user.collect { user ->
                _state.value = _state.value.copy(isLoggedIn = user.id != UserRepository.GUEST.id)
            }
        }
    }

    private val _event = MutableStateFlow<CartUiEvent?>(null)
    val event: StateFlow<CartUiEvent?> = _event.asStateFlow()

    val availableCoupons: StateFlow<List<Coupon>> = settingsRepository.savedCoupons.map { codes ->
        codes.mapNotNull { code ->
            val regex = Regex("^PCCLUB-(\\d+)-\\d+$")
            val match = regex.find(code)
            if (match != null) {
                val discount = match.groupValues[1].toIntOrNull() ?: 0
                Coupon(code, discount, "$discount% de descuento (PcClub)")
            } else null
        }.toList()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun setQuantity(productId: String, quantity: Int) {
        viewModelScope.launch { cartRepository.setQuantity(productId, quantity) }
    }

    fun remove(productId: String) {
        viewModelScope.launch { cartRepository.remove(productId) }
    }

    fun clear() {
        viewModelScope.launch { cartRepository.clear() }
    }

    fun applyCoupon(code: String) {
        val result = cartRepository.applyCoupon(code)
        _event.value = if (result.isSuccess) {
            val c = result.getOrThrow()
            CartUiEvent("Cupón ${c.code} aplicado · ${c.discountPercent}% off")
        } else {
            CartUiEvent("Cupón no válido", isError = true)
        }
    }

    fun removeCoupon() {
        cartRepository.removeCoupon()
    }

    fun consumeEvent() {
        _event.value = null
    }
}
