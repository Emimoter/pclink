package com.pclink.app.data.repository

import com.pclink.app.data.remote.NotificationDataSource
import com.pclink.app.domain.model.AppNotification
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val dataSource: NotificationDataSource
) {
    fun observeAll(): Flow<List<AppNotification>> = dataSource.observeAll()

    fun observeUnread(): Flow<List<AppNotification>> = dataSource.observeAll()

    suspend fun markAsRead(ids: List<String>) = dataSource.markAsRead(ids)
}
