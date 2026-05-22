package com.pclink.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

@HiltViewModel
class AppShellViewModel @Inject constructor(
    cartRepository: CartRepository,
    notificationRepository: NotificationRepository
) : ViewModel() {
    val cartCount: StateFlow<Int> = cartRepository.itemCountFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    val unreadCount: StateFlow<Int> = notificationRepository
        .observeAll()
        .map { notifs -> notifs.count { !it.read } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)
}
