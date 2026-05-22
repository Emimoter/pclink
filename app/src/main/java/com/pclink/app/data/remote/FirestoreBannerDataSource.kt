package com.pclink.app.data.remote

import com.google.firebase.firestore.FirebaseFirestore
import com.pclink.app.domain.model.Banner
import com.pclink.app.domain.model.CategoryId
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreBannerDataSource @Inject constructor() {
    private val db = FirebaseFirestore.getInstance()
    private val bannersCol = db.collection("banners")

    fun observeAll(): Flow<List<Banner>> = callbackFlow {
        val subscription = bannersCol
            .orderBy("order", com.google.firebase.firestore.Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val banners = snapshot.documents.mapNotNull { it.toBanner() }
                    trySend(banners)
                }
            }
        awaitClose { subscription.remove() }
    }

    suspend fun getAll(): List<Banner> {
        return try {
            val snapshot = bannersCol
                .orderBy("order")
                .get()
                .await()
            snapshot.documents.mapNotNull { it.toBanner() }
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.toBanner(): Banner? {
        val data = data ?: return null
        return try {
            Banner(
                id = id,
                title = getString("title") ?: "",
                subtitle = getString("subtitle") ?: "",
                ctaLabel = getString("ctaLabel") ?: "",
                accentColorHex = getString("accentColor") ?: "#00BCD4",
                gradientStartHex = getString("gradientStart") ?: "#06090C",
                gradientEndHex = getString("gradientEnd") ?: "#0E2B33",
                targetCategory = getString("targetCategory")?.let {
                    runCatching { CategoryId.valueOf(it) }.getOrNull()
                },
                targetProductId = getString("targetProductId"),
                badge = getString("badge"),
                imageUrl = getString("imageUrl"),
                active = getBoolean("active") ?: true,
                order = getLong("order")?.toInt() ?: 0
            )
        } catch (_: Exception) {
            null
        }
    }
}
