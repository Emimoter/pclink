package com.pclink.app.ui.screens.addresses

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.AddressRepository
import com.pclink.app.domain.model.Address
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AddAddressUiState(
    val id: String = "",
    val label: String = "",
    val recipient: String = "",
    val phone: String = "",
    val street: String = "",
    val number: String = "",
    val apartment: String? = null,
    val city: String = "Mar del Plata",
    val state: String = "Buenos Aires",
    val zip: String = "7600",
    val country: String = "Argentina",
    val isDefault: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isEditing: Boolean = false
)

@HiltViewModel
class AddAddressViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val addressRepository: AddressRepository
) : ViewModel() {

    private val _state = MutableStateFlow(AddAddressUiState())
    val state = _state.asStateFlow()

    init {
        val addressId: String? = savedStateHandle["addressId"]
        if (addressId != null && addressId != "new") {
            _state.value = _state.value.copy(id = addressId, isEditing = true)
            viewModelScope.launch {
                addressRepository.observeAddresses().collect { list ->
                    list.firstOrNull { it.id == addressId }?.let { addr ->
                        _state.value = _state.value.copy(
                            label = addr.label,
                            recipient = addr.recipient,
                            phone = com.pclink.app.ui.util.PhoneValidator.getDisplayPhone(addr.phone),
                            street = addr.street,
                            number = addr.number,
                            apartment = addr.apartment,
                            city = addr.city,
                            state = addr.state,
                            zip = addr.zip,
                            country = addr.country,
                            isDefault = addr.isDefault
                        )
                    }
                }
            }
        }
    }

    fun updateState(reducer: (AddAddressUiState) -> AddAddressUiState) {
        _state.value = reducer(_state.value)
    }

    fun save(onSuccess: () -> Unit) {
        val s = _state.value
        if (s.label.isBlank() || s.recipient.isBlank() || s.phone.isBlank() || s.street.isBlank() || s.number.isBlank() || s.city.isBlank()) {
            _state.value = s.copy(error = "Por favor, completa los campos obligatorios")
            return
        }
        if (!com.pclink.app.ui.util.PhoneValidator.isValidArgentinePhone(s.phone)) {
            _state.value = s.copy(error = "Por favor, ingresa un número de teléfono válido de Argentina")
            return
        }

        viewModelScope.launch {
            _state.value = s.copy(isLoading = true, error = null)
            val address = Address(
                id = s.id,
                label = s.label,
                recipient = s.recipient,
                phone = com.pclink.app.ui.util.PhoneValidator.formatToArgentineDb(s.phone),
                street = s.street,
                number = s.number,
                apartment = s.apartment,
                city = s.city,
                state = s.state,
                zip = s.zip,
                country = s.country,
                isDefault = s.isDefault
            )
            val result = addressRepository.addAddress(address)
            if (result.isSuccess) {
                onSuccess()
            } else {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = result.exceptionOrNull()?.message ?: "Error al guardar"
                )
            }
        }
    }
}
