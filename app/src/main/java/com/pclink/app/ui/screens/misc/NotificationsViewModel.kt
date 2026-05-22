package com.pclink.app.ui.screens.misc

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.NotificationRepository
import com.pclink.app.domain.model.AppNotification
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repository: NotificationRepository
) : ViewModel() {

    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()

    init {
        viewModelScope.launch {
            repository.observeAll().collect { _notifications.value = it }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            _notifications.collect { list ->
                val unreadIds = list.filter { !it.read }.map { it.id }
                if (unreadIds.isNotEmpty()) {
                    repository.markAsRead(unreadIds)
                }
            }
        }
    }
}
