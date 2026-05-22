package com.pclink.app.data.repository

import com.pclink.app.data.remote.FirestoreAddressDataSource
import com.pclink.app.domain.model.Address
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AddressRepository @Inject constructor(
    private val firestore: FirestoreAddressDataSource
) {
    fun observeAddresses(): Flow<List<Address>> = firestore.observeAddresses()

    suspend fun addAddress(address: Address): Result<Unit> {
        return firestore.addAddress(address)
    }

    suspend fun deleteAddress(id: String): Result<Unit> {
        return firestore.deleteAddress(id)
    }

    suspend fun updateAddress(address: Address): Result<Unit> {
        return firestore.addAddress(address) // upsert
    }
}
