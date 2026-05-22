package com.pclink.app.data.repository

import com.pclink.app.data.local.dao.CartDao
import com.pclink.app.data.local.entity.CartEntity
import com.pclink.app.domain.model.CartItem
import com.pclink.app.domain.model.CartSummary
import com.pclink.app.domain.model.Coupon
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.MutableStateFlow

@Singleton
class CartRepository @Inject constructor(
    private val cartDao: CartDao,
    private val productRepository: ProductRepository
) {
    private val _coupon = MutableStateFlow<Coupon?>(null)
    val couponFlow: Flow<Coupon?> = _coupon

    val itemCountFlow: Flow<Int> = cartDao.observeItemCount()

    fun observeCart(): Flow<CartSummary> {
        return combine(cartDao.observeAll(), _coupon) { entities, coupon ->
            val items = entities.mapNotNull { entity ->
                val product = productRepository.getById(entity.productId) ?: return@mapNotNull null
                CartItem(product, entity.quantity)
            }
            CartSummary(items, coupon)
        }
    }

    suspend fun add(productId: String, quantity: Int = 1) {
        val existing = cartDao.get(productId)
        val newQty = (existing?.quantity ?: 0) + quantity
        cartDao.upsert(CartEntity(productId, newQty))
    }

    suspend fun setQuantity(productId: String, quantity: Int) {
        if (quantity <= 0) {
            cartDao.remove(productId)
        } else {
            cartDao.upsert(CartEntity(productId, quantity))
        }
    }

    suspend fun remove(productId: String) {
        cartDao.remove(productId)
    }

    suspend fun clear() {
        cartDao.clear()
        _coupon.value = null
    }

    fun applyCoupon(code: String): Result<Coupon> {
        val normalized = code.trim().uppercase()
        val regex = Regex("^PCCLUB-(\\d+)-\\d+$")
        val match = regex.find(normalized)
        
        return if (match != null) {
            val discount = match.groupValues[1].toIntOrNull() ?: 0
            val coupon = Coupon(normalized, discount, "$discount% de descuento (PcClub)")
            _coupon.value = coupon
            Result.success(coupon)
        } else {
            Result.failure(IllegalArgumentException("Cupón no válido"))
        }
    }

    fun removeCoupon() {
        _coupon.value = null
    }
}
