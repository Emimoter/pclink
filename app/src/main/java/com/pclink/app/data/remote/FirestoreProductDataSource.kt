package com.pclink.app.data.remote

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.ProductTag
import com.pclink.app.domain.model.Spec
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreProductDataSource @Inject constructor() {
    private val db = FirebaseFirestore.getInstance()
    private val productsCol = db.collection("products")

    fun observeAll(): Flow<List<Product>> = callbackFlow {
        val subscription = productsCol.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            if (snapshot != null) {
                val products = snapshot.documents.mapNotNull { it.toProduct() }
                trySend(products)
            }
        }
        awaitClose { subscription.remove() }
    }

    suspend fun getAll(): List<Product> {
        return try {
            val snapshot = productsCol
                .get()
                .await()
            snapshot.documents.mapNotNull { it.toProduct() }.sortedByDescending { it.releasedAt }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getById(id: String): Product? {
        return try {
            productsCol.document(id).get().await().toProduct()
        } catch (e: Exception) {
            null
        }
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.toProduct(): Product? {
        val data = data ?: return null
        return try {
            Product(
                id = id,
                name = getString("name") ?: "",
                brand = getString("brand") ?: "",
                model = getString("model") ?: "",
                category = runCatching { CategoryId.valueOf(getString("category") ?: "GAMING") }.getOrDefault(CategoryId.GAMING),
                price = getDouble("price") ?: 0.0,
                originalPrice = getDouble("originalPrice"),
                currency = getString("currency") ?: "ARS",
                stock = getLong("stock")?.toInt() ?: 0,
                rating = getDouble("rating")?.toFloat() ?: 0f,
                reviewCount = getLong("reviewCount")?.toInt() ?: 0,
                description = getString("description") ?: "",
                specs = (get("specs") as? List<Map<String, String>>)?.mapNotNull {
                    val label = it["label"]
                    val value = it["value"]
                    if (label != null && value != null) Spec(label, value) else null
                } ?: emptyList(),
                images = (get("images") as? List<String>) ?: emptyList(),
                tags = (get("tags") as? List<String>)?.mapNotNull {
                    runCatching { ProductTag.valueOf(it) }.getOrNull()
                } ?: emptyList(),
                socket = getString("socket"),
                onSale = getBoolean("onSale") ?: false,
                showInFlashDeals = getBoolean("showInFlashDeals") ?: false,
                freeShipping = getBoolean("freeShipping") ?: false,
                isFeatured = getBoolean("isFeatured") ?: false,
                isBestSeller = getBoolean("isBestSeller") ?: false,
                isNewArrival = getBoolean("isNewArrival") ?: false,
                inRecommendedFeed = getBoolean("inRecommendedFeed") ?: false,
                soldUnits = getLong("soldUnits")?.toInt() ?: 0,
                releasedAt = getLong("releasedAt") ?: 0L
            )
        } catch (e: Exception) {
            null
        }
    }
}
