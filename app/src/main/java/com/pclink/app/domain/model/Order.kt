package com.pclink.app.domain.model

data class Order(
    val id: String,
    val number: String,
    val date: Long,
    val items: List<CartItem>,
    val subtotal: Double,
    val shippingCost: Double,
    val discount: Double,
    val total: Double,
    val status: OrderStatus,
    val shippingAddress: Address,
    val paymentMethod: PaymentMethod,
    val tracking: String? = null,
    val userPhone: String? = null,
    val statusHistory: Map<String, Long> = emptyMap()
)

enum class OrderStatus(val label: String) {
    PENDING("Pendiente"),
    PAID("Pagado"),
    PREPARING("En preparación"),
    SHIPPED("Enviado"),
    IN_TRANSIT("En reparto"),
    DELIVERED("Recibido"),
    CANCELLED("Cancelado")
}
