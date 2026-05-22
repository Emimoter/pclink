package com.pclink.app.data.remote

import com.google.firebase.firestore.FirebaseFirestore
import com.pclink.app.domain.model.AppNotification
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationDataSource @Inject constructor() {
    private val db = FirebaseFirestore.getInstance()
    private val notifsCol = db.collection("notifications")

    fun observeAll(): Flow<List<AppNotification>> = callbackFlow {
        val subscription = notifsCol
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val notifs = snapshot.documents.mapNotNull { it.toNotification() }
                    trySend(notifs)
                }
            }
        awaitClose { subscription.remove() }
    }

    suspend fun getAll(): List<AppNotification> {
        return try {
            val snapshot = notifsCol.orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING).get().await()
            snapshot.documents.mapNotNull { it.toNotification() }
        } catch (_: Exception) {
            emptyList()
        }
    }

    suspend fun markAsRead(ids: List<String>) {
        try {
            val batch = db.batch()
            ids.forEach { id ->
                batch.update(notifsCol.document(id), "read", true)
            }
            batch.commit().await()
        } catch (_: Exception) { }
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.toNotification(): AppNotification? {
        val data = data ?: return null
        return try {
            AppNotification(
                id = id,
                title = getString("title") ?: "",
                body = getString("body") ?: "",
                type = getString("type") ?: "general",
                iconName = getString("icon"),
                toneHex = getString("tone"),
                targetCategory = getString("targetCategory"),
                targetProductId = getString("targetProductId"),
                createdAt = getLong("createdAt") ?: 0L,
                read = getBoolean("read") ?: false
            )
        } catch (_: Exception) {
            null
        }
    }
}
