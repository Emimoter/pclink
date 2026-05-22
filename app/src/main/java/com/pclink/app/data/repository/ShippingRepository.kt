package com.pclink.app.data.repository

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.pclink.app.domain.model.ShippingConfig
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.catch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ShippingRepository @Inject constructor() {
    private val db = FirebaseFirestore.getInstance()
    private val settingsDoc = db.collection("settings").document("shipping")

    fun observeShippingConfig(): Flow<ShippingConfig> = callbackFlow {
        val subscription = settingsDoc.addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("ShippingRepository", "Error fetching shipping settings: ${error.message}", error)
                trySend(ShippingConfig()) // Emit default config on error
                return@addSnapshotListener
            }
            if (snapshot != null && snapshot.exists()) {
                try {
                    val config = ShippingConfig(
                        standard = snapshot.getDouble("standard") ?: 4500.0,
                        express = snapshot.getDouble("express") ?: 8500.0,
                        pickup = snapshot.getDouble("pickup") ?: 0.0,
                        freeThreshold = snapshot.getDouble("freeThreshold") ?: 80000.0
                    )
                    trySend(config)
                } catch (e: Exception) {
                    Log.w("ShippingRepository", "Malformed shipping doc", e)
                    trySend(ShippingConfig()) // Emit default
                }
            } else {
                // If it doesn't exist yet, emit default
                trySend(ShippingConfig())
            }
        }
        awaitClose { subscription.remove() }
    }.catch { e ->
        Log.e("ShippingRepository", "Flow error: ${e.message}", e)
        emit(ShippingConfig())
    }
}
