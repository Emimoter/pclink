package com.pclink.app.domain.model

data class Product(
    val id: String,
    val name: String,
    val brand: String,
    val model: String,
    val category: CategoryId,
    val price: Double,
    val originalPrice: Double? = null,
    val currency: String = "ARS",
    val stock: Int,
    val rating: Float,
    val reviewCount: Int,
    val description: String,
    val specs: List<Spec>,
    val images: List<String>,
    val tags: List<ProductTag> = emptyList(),
    val socket: String? = null,
    val onSale: Boolean = false,
    /** Promoted into the home "Ofertas Flash" row (in addition to items with active discounts). */
    val showInFlashDeals: Boolean = false,
    val freeShipping: Boolean = false,
    val isFeatured: Boolean = false,
    val isBestSeller: Boolean = false,
    val isNewArrival: Boolean = false,
    /** Shown in the home "Recomendados para vos" carousel when true. */
    val inRecommendedFeed: Boolean = false,
    val soldUnits: Int = 0,
    val releasedAt: Long = 0L
) {
    val discountPercent: Int
        get() = originalPrice?.let { op ->
            if (op > price) ((op - price) / op * 100).toInt() else 0
        } ?: 0

    val inStock: Boolean get() = stock > 0
}

data class Spec(val label: String, val value: String)

enum class ProductTag {
    OFFER, NEW, BEST_SELLER, FEATURED, FREE_SHIPPING, LOW_STOCK
}
