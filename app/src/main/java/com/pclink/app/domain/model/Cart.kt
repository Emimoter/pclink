package com.pclink.app.domain.model

data class CartItem(
    val product: Product,
    val quantity: Int
) {
    val lineTotal: Double get() = product.price * quantity
}

data class Coupon(
    val code: String,
    val discountPercent: Int,
    val description: String
)

data class CartSummary(
    val items: List<CartItem>,
    val coupon: Coupon? = null
) {
    val itemCount: Int get() = items.sumOf { it.quantity }
    val subtotal: Double get() = items.sumOf { it.lineTotal }
    val couponDiscount: Double get() = coupon?.let { subtotal * it.discountPercent / 100.0 } ?: 0.0
    val total: Double get() = subtotal - couponDiscount
    val isEmpty: Boolean get() = items.isEmpty()
}
