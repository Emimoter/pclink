package com.pclink.app.data.repository

import com.google.firebase.functions.FirebaseFunctions
import com.pclink.app.domain.model.CartItem
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MercadoPagoRepository @Inject constructor() {
    private val functions = FirebaseFunctions.getInstance("us-central1") // Ajusta la región si es necesario

    suspend fun createPreference(items: List<CartItem>, shippingCost: Double): String? {
        val data = hashMapOf(
            "items" to items.map { 
                hashMapOf(
                    "id" to it.product.id,
                    "quantity" to it.quantity
                )
            },
            "shippingCost" to shippingCost
        )

        return try {
            val result = functions
                .getHttpsCallable("createPreference")
                .call(data)
                .await()

            val response = result.data as? Map<*, *>
            response?.get("initPoint") as? String
        } catch (e: Exception) {
            if (com.pclink.app.BuildConfig.DEBUG) {
                e.printStackTrace()
            }
            null
        }
    }
}
