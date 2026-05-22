package com.pclink.app.data.repository

import com.pclink.app.data.local.dao.CustomProductDao
import com.pclink.app.data.local.entity.CustomProductEntity
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.ProductTag
import com.pclink.app.domain.model.Spec
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

/**
 * Repository for products uploaded by vendors through the in-app admin panel.
 */
@Singleton
class CustomProductRepository @Inject constructor(
    private val dao: CustomProductDao
) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private val stringListSerializer = ListSerializer(String.serializer())
    private val specDelimiter = "\u0001"

    fun observeAll(): Flow<List<Product>> = dao.observeAll().map { list ->
        list.map { it.toProduct() }
    }

    suspend fun getAll(): List<Product> = dao.getAll().map { it.toProduct() }

    suspend fun getById(id: String): Product? = dao.getById(id)?.toProduct()

    suspend fun delete(id: String) = dao.delete(id)

    suspend fun upsert(
        id: String,
        name: String,
        brand: String,
        model: String,
        category: CategoryId,
        price: Double,
        originalPrice: Double?,
        stock: Int,
        description: String,
        specs: List<Spec>,
        images: List<String>,
        onSale: Boolean,
        dashboardFlashDeals: Boolean,
        dashboardFeatured: Boolean,
        dashboardBestSeller: Boolean,
        dashboardNewArrival: Boolean,
        dashboardRecommended: Boolean
    ) {
        val specsAsStrings = specs.map { "${it.label}$specDelimiter${it.value}" }
        val entity = CustomProductEntity(
            id = id,
            name = name,
            brand = brand.ifBlank { "PClink Store" },
            model = model,
            category = category.name,
            price = price,
            originalPrice = originalPrice,
            stock = stock,
            description = description,
            specsJson = json.encodeToString(stringListSerializer, specsAsStrings),
            imagesJson = json.encodeToString(stringListSerializer, images),
            onSale = onSale,
            dashboardFlashDeals = dashboardFlashDeals,
            dashboardFeatured = dashboardFeatured,
            dashboardBestSeller = dashboardBestSeller,
            dashboardNewArrival = dashboardNewArrival,
            dashboardRecommended = dashboardRecommended
        )
        dao.upsert(entity)
    }

    private fun CustomProductEntity.toProduct(): Product {
        val specs = runCatching { json.decodeFromString(stringListSerializer, specsJson) }
            .getOrDefault(emptyList())
            .mapNotNull { raw ->
                val parts = raw.split(specDelimiter, limit = 2)
                if (parts.size == 2) Spec(parts[0], parts[1]) else null
            }
        val images = runCatching { json.decodeFromString(stringListSerializer, imagesJson) }
            .getOrDefault(emptyList())
        val cat = runCatching { CategoryId.valueOf(category) }.getOrDefault(CategoryId.GAMING)

        val computedOnSale = onSale && originalPrice != null && originalPrice > price

        val tags = buildList {
            if (computedOnSale || dashboardFlashDeals) add(ProductTag.OFFER)
            if (dashboardNewArrival) add(ProductTag.NEW)
            if (dashboardFeatured) add(ProductTag.FEATURED)
            if (dashboardBestSeller) add(ProductTag.BEST_SELLER)
            if (stock in 1..3) add(ProductTag.LOW_STOCK)
        }

        return Product(
            id = id,
            name = name,
            brand = brand,
            model = model,
            category = cat,
            price = price,
            originalPrice = originalPrice,
            stock = stock,
            rating = 0f,
            reviewCount = 0,
            description = description,
            specs = specs,
            images = images,
            tags = tags,
            onSale = computedOnSale,
            showInFlashDeals = dashboardFlashDeals,
            isFeatured = dashboardFeatured,
            isBestSeller = dashboardBestSeller,
            isNewArrival = dashboardNewArrival,
            inRecommendedFeed = dashboardRecommended,
            releasedAt = createdAt
        )
    }
}
