package com.pclink.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A product uploaded by a vendor through the in-app admin panel.
 * Lists are persisted as JSON strings to keep the schema simple while still
 * being type-safe at the repository layer.
 */
@Entity(tableName = "custom_products")
data class CustomProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val brand: String,
    val model: String,
    val category: String,
    val price: Double,
    val originalPrice: Double?,
    val stock: Int,
    val description: String,
    val specsJson: String,
    val imagesJson: String,
    val onSale: Boolean,
    /** Home "Ofertas Flash" row */
    val dashboardFlashDeals: Boolean = false,
    /** Home "Productos destacados" */
    val dashboardFeatured: Boolean = false,
    /** Second curated row on home (see [Product.isBestSeller]). */
    val dashboardBestSeller: Boolean = false,
    /** Home "Nuevos ingresos" */
    val dashboardNewArrival: Boolean = false,
    /** Home "Recomendados para vos" */
    val dashboardRecommended: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
