package com.pclink.app.data.remote

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.pclink.app.domain.model.Address
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreAddressDataSource @Inject constructor() {
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()

    private val userId: String? get() = auth.currentUser?.uid

    private fun getAddressesCol(): com.google.firebase.firestore.CollectionReference? {
        val currentUid = FirebaseAuth.getInstance().currentUser?.uid
        return currentUid?.let {
            db.collection("users").document(it).collection("addresses")
        }
    }

    fun observeAddresses(): Flow<List<Address>> = callbackFlow {
        val col = getAddressesCol()
        if (col == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val subscription = col.orderBy("isDefault", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val addresses = snapshot.documents.mapNotNull { it.toAddress() }
                    trySend(addresses)
                }
            }
        awaitClose { subscription.remove() }
    }

    suspend fun addAddress(address: Address): Result<Unit> {
        var col = getAddressesCol()
        
        if (col == null) {
            // Intento de recuperación: si no hay usuario, forzamos un login anónimo
            try {
                auth.signInAnonymously().await()
                col = getAddressesCol()
            } catch (e: Exception) {
                return Result.failure(Exception("No se pudo establecer una sesión segura: ${e.message}"))
            }
        }
        
        if (col == null) return Result.failure(Exception("Usuario no autenticado (Sesión no disponible)"))
        return try {
            val docRef = if (address.id.isBlank()) col.document() else col.document(address.id)
            val data = address.toMap().toMutableMap()
            data["id"] = docRef.id
            docRef.set(data).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteAddress(id: String): Result<Unit> {
        val col = getAddressesCol() ?: return Result.failure(Exception("Usuario no autenticado"))
        return try {
            col.document(id).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.toAddress(): Address? {
        val data = data ?: return null
        return try {
            Address(
                id = id,
                label = getString("label") ?: "Dirección",
                recipient = getString("recipient") ?: "",
                phone = getString("phone") ?: "",
                street = getString("street") ?: "",
                number = getString("number") ?: "",
                apartment = getString("apartment"),
                city = getString("city") ?: "",
                state = getString("state") ?: "",
                zip = getString("zip") ?: "",
                country = getString("country") ?: "Argentina",
                isDefault = getBoolean("isDefault") ?: false
            )
        } catch (e: Exception) {
            null
        }
    }

    private fun Address.toMap() = mapOf(
        "label" to label,
        "recipient" to recipient,
        "phone" to phone,
        "street" to street,
        "number" to number,
        "apartment" to apartment,
        "city" to city,
        "state" to state,
        "zip" to zip,
        "country" to country,
        "isDefault" to isDefault
    )
}
