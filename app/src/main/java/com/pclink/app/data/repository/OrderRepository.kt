package com.pclink.app.data.repository

import com.pclink.app.domain.model.Address
import com.pclink.app.domain.model.CartItem
import com.pclink.app.domain.model.Order
import com.pclink.app.domain.model.OrderStatus
import com.pclink.app.domain.model.PaymentMethod
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.CategoryId
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.DocumentSnapshot
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

@Singleton
class OrderRepository @Inject constructor() {

    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()

    private var snapshotListenerRegistration: ListenerRegistration? = null

    init {
        FirebaseAuth.getInstance().addAuthStateListener { firebaseAuth ->
            val currentUser = firebaseAuth.currentUser
            snapshotListenerRegistration?.remove()
            snapshotListenerRegistration = null
            
            if (currentUser != null) {
                snapshotListenerRegistration = FirebaseFirestore.getInstance()
                    .collection("orders")
                    .whereEqualTo("userId", currentUser.uid)
                    .addSnapshotListener { snapshot, error ->
                        if (error != null) {
                            return@addSnapshotListener
                        }
                        if (snapshot != null) {
                            val ordersList = snapshot.documents.mapNotNull { doc ->
                                doc.toOrder()
                            }.sortedByDescending { it.date }
                            _orders.value = ordersList
                        }
                    }
            } else {
                _orders.value = emptyList()
            }
        }
    }

    private fun DocumentSnapshot.toOrder(): Order? {
        return try {
            val id = getString("id") ?: id
            val number = getString("number") ?: "PC-000000"
            val date = getLong("createdAt") ?: getLong("date") ?: 0L
            val subtotal = getDouble("subtotal") ?: 0.0
            val shippingCost = getDouble("shippingCost") ?: 0.0
            val discount = getDouble("discount") ?: 0.0
            val total = getDouble("total") ?: 0.0
            
            val statusStr = getString("status") ?: "PAID"
            val status = try {
                OrderStatus.valueOf(statusStr)
            } catch (e: Exception) {
                OrderStatus.PAID
            }
            
            val tracking = getString("tracking")

            val paymentBrand = getString("paymentMethod") ?: "Mercado Pago"
            val paymentMethod = PaymentMethod(
                id = "pm-parsed",
                type = com.pclink.app.domain.model.PaymentType.MERCADO_PAGO,
                brand = paymentBrand,
                last4 = "·· 4242",
                isDefault = true
            )

            val addressMap = get("shippingAddress") as? Map<String, Any>
            val shippingAddress = Address(
                id = addressMap?.get("id") as? String ?: "addr-parsed",
                label = addressMap?.get("label") as? String ?: "Dirección",
                recipient = addressMap?.get("recipient") as? String ?: "",
                phone = addressMap?.get("phone") as? String ?: "",
                street = addressMap?.get("street") as? String ?: "",
                number = addressMap?.get("number") as? String ?: "",
                apartment = addressMap?.get("apartment") as? String,
                city = addressMap?.get("city") as? String ?: "",
                state = addressMap?.get("state") as? String ?: "",
                zip = addressMap?.get("zip") as? String ?: "",
                country = addressMap?.get("country") as? String ?: "Argentina"
            )

            val itemsListMap = get("items") as? List<Any> ?: emptyList()
            val items = itemsListMap.mapNotNull { itemObj ->
                val itemMap = itemObj as? Map<String, Any>
                val productId = itemMap?.get("productId") as? String ?: return@mapNotNull null
                val productName = itemMap?.get("productName") as? String ?: ""
                
                val priceNumber = itemMap["price"] as? Number
                val price = priceNumber?.toDouble() ?: 0.0
                
                val quantityNumber = itemMap["quantity"] as? Number
                val quantity = quantityNumber?.toInt() ?: 1
                
                val imageUrl = itemMap["imageUrl"] as? String

                val product = Product(
                    id = productId,
                    name = productName,
                    brand = "",
                    model = "",
                    category = CategoryId.OFFERS,
                    price = price,
                    stock = quantity,
                    rating = 5f,
                    reviewCount = 0,
                    description = "",
                    specs = emptyList(),
                    images = if (imageUrl != null) listOf(imageUrl) else emptyList()
                )
                CartItem(product, quantity)
            }

            val userPhone = getString("userPhone")
            val statusHistoryRaw = get("statusHistory") as? Map<String, Any> ?: emptyMap()
            val statusHistory = statusHistoryRaw.mapValues { (_, value) ->
                (value as? Number)?.toLong() ?: 0L
            }

            Order(
                id = id,
                number = number,
                date = date,
                items = items,
                subtotal = subtotal,
                shippingCost = shippingCost,
                discount = discount,
                total = total,
                status = status,
                shippingAddress = shippingAddress,
                paymentMethod = paymentMethod,
                tracking = tracking,
                userPhone = userPhone,
                statusHistory = statusHistory
            )
        } catch (e: Exception) {
            null
        }
    }

    fun place(
        items: List<CartItem>,
        subtotal: Double,
        shipping: Double,
        discount: Double,
        total: Double,
        address: Address,
        payment: PaymentMethod,
        status: OrderStatus = OrderStatus.PAID
    ): Order {
        val order = Order(
            id = "ord-${System.currentTimeMillis()}",
            number = "PC-${(100000..999999).random()}",
            date = System.currentTimeMillis(),
            items = items,
            subtotal = subtotal,
            shippingCost = shipping,
            discount = discount,
            total = total,
            status = status,
            shippingAddress = address,
            paymentMethod = payment,
            tracking = "TRK-${(1000..9999).random()}",
            userPhone = address.phone,
            statusHistory = mapOf(status.name to System.currentTimeMillis())
        )
        
        // Persist order in Firestore
        val currentUser = FirebaseAuth.getInstance().currentUser
        val userId = currentUser?.uid ?: "anonymous"
        val userEmail = currentUser?.email ?: "anonymous@ejemplo.com"
        val userName = currentUser?.displayName ?: userEmail.substringBefore("@")

        val addressMap = mapOf(
            "label" to address.label,
            "recipient" to address.recipient,
            "phone" to address.phone,
            "street" to address.street,
            "number" to address.number,
            "apartment" to address.apartment,
            "city" to address.city,
            "state" to address.state,
            "zip" to address.zip,
            "country" to address.country
        )

        val itemsMap = items.map { item ->
            mapOf(
                "productId" to item.product.id,
                "productName" to item.product.name,
                "price" to item.product.price,
                "quantity" to item.quantity,
                "imageUrl" to item.product.images.firstOrNull()
            )
        }

        val orderMap = mapOf(
            "id" to order.id,
            "number" to order.number,
            "createdAt" to order.date,
            "subtotal" to order.subtotal,
            "shippingCost" to order.shippingCost,
            "discount" to order.discount,
            "total" to order.total,
            "status" to order.status.name,
            "userId" to userId,
            "userName" to userName,
            "userEmail" to userEmail,
            "paymentMethod" to order.paymentMethod.brand,
            "shippingAddress" to addressMap,
            "items" to itemsMap,
            "userPhone" to order.userPhone,
            "statusHistory" to order.statusHistory
        )

        try {
            FirebaseFirestore.getInstance()
                .collection("orders")
                .document(order.id)
                .set(orderMap)
        } catch (_: Exception) { }

        _orders.value = listOf(order) + (_orders.value.filter { it.id != order.id })
        return order
    }
}
