package com.pclink.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.pclink.app.data.local.entity.CartEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CartDao {

    @Query("SELECT * FROM cart ORDER BY updatedAt DESC")
    fun observeAll(): Flow<List<CartEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: CartEntity)

    @Query("DELETE FROM cart WHERE productId = :productId")
    suspend fun remove(productId: String)

    @Query("DELETE FROM cart")
    suspend fun clear()

    @Query("SELECT * FROM cart WHERE productId = :productId LIMIT 1")
    suspend fun get(productId: String): CartEntity?

    @Query("SELECT COUNT(*) FROM cart")
    fun observeItemCount(): Flow<Int>
}
