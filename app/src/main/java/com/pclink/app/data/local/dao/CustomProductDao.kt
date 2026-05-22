package com.pclink.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.pclink.app.data.local.entity.CustomProductEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CustomProductDao {

    @Query("SELECT * FROM custom_products ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<CustomProductEntity>>

    @Query("SELECT * FROM custom_products ORDER BY createdAt DESC")
    suspend fun getAll(): List<CustomProductEntity>

    @Query("SELECT * FROM custom_products WHERE id = :id")
    suspend fun getById(id: String): CustomProductEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: CustomProductEntity)

    @Query("DELETE FROM custom_products WHERE id = :id")
    suspend fun delete(id: String)
}
