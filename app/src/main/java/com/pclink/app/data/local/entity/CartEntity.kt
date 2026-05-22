package com.pclink.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cart")
data class CartEntity(
    @PrimaryKey val productId: String,
    val quantity: Int,
    val updatedAt: Long = System.currentTimeMillis()
)
