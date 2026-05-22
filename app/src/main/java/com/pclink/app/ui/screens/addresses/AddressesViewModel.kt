package com.pclink.app.ui.screens.addresses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.AddressRepository
import com.pclink.app.domain.model.Address
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class AddressesViewModel @Inject constructor(
    private val addressRepository: AddressRepository
) : ViewModel() {

    val addresses: StateFlow<List<Address>> = addressRepository.observeAddresses()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun deleteAddress(id: String) {
        viewModelScope.launch {
            addressRepository.deleteAddress(id)
        }
    }
}
