package com.pclink.app.data.repository

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.pclink.app.domain.model.ClubVoucher
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.catch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VoucherRepository @Inject constructor() {
    private val db = FirebaseFirestore.getInstance()
    private val vouchersCol = db.collection("vouchers")

    fun observeVouchers(): Flow<List<ClubVoucher>> = callbackFlow {
        val subscription = vouchersCol.addSnapshotListener { snapshot, error ->
            if (error != null) {
                // Don't close the flow — log the error and emit empty list so UI doesn't hang
                Log.e("VoucherRepository", "Error fetching vouchers: ${error.message}", error)
                trySend(emptyList())
                return@addSnapshotListener
            }
            if (snapshot != null) {
                val vouchers = snapshot.documents.mapNotNull { doc ->
                    try {
                        ClubVoucher(
                            id = doc.id,
                            discountPercent = doc.getLong("discountPercent")?.toInt() ?: 0,
                            pointsCost = doc.getLong("pointsCost")?.toInt() ?: 0,
                            title = doc.getString("title") ?: "",
                            description = doc.getString("description") ?: "",
                            color = doc.getString("color") ?: "emerald",
                            tag = doc.getString("tag") ?: ""
                        )
                    } catch (e: Exception) {
                        Log.w("VoucherRepository", "Skipping malformed voucher doc ${doc.id}", e)
                        null
                    }
                }
                trySend(vouchers)
            }
        }
        awaitClose { subscription.remove() }
    }.catch { e ->
        Log.e("VoucherRepository", "Flow error: ${e.message}", e)
        emit(emptyList())
    }
}
