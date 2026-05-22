package com.pclink.app.data.repository

import com.pclink.app.data.remote.FirestoreBannerDataSource
import com.pclink.app.domain.model.Banner
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.ProductFilters
import com.pclink.app.domain.model.SortOption
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

@Singleton
class ProductRepository @Inject constructor(
    private val firestore: com.pclink.app.data.remote.FirestoreProductDataSource,
    private val firestoreBanners: FirestoreBannerDataSource,
    private val customProducts: CustomProductRepository
) {
    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val productsFlow: Flow<List<Product>> = _products.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoadingFlow: StateFlow<Boolean> = _isLoading.asStateFlow()
    val isLoading: Boolean get() = _isLoading.value

    init {
        val repositoryScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
        repositoryScope.launch {
            try {
                combine(
                    firestore.observeAll(),
                    customProducts.observeAll()
                ) { remote, custom ->
                    remote + custom
                }.collect { combinedList ->
                    _products.value = combinedList
                    _isLoading.value = false
                }
            } catch (e: Exception) {
                _isLoading.value = false
            }
        }
    }

    private val mockBanners: List<Banner> = emptyList()

    val banners: Flow<List<Banner>> = firestoreBanners.observeAll().map { remote ->
        if (remote.isNotEmpty()) remote.filter { it.active } else mockBanners
    }

    suspend fun getBanners(): List<Banner> {
        val remote = firestoreBanners.getAll()
        return if (remote.isNotEmpty()) remote.filter { it.active } else mockBanners
    }

    fun observeAll(): Flow<List<Product>> = productsFlow

    private fun all(): List<Product> = _products.value

    suspend fun getAll(): List<Product> {
        return all()
    }

    suspend fun getById(id: String): Product? {
        delay(40)
        return all().firstOrNull { it.id == id } ?: firestore.getById(id) ?: customProducts.getById(id)
    }

    suspend fun getByCategory(category: CategoryId): List<Product> {
        delay(40)
        val source = getAll()
        return when (category) {
            CategoryId.OFFERS -> source.filter { it.onSale || it.showInFlashDeals }
            else -> source.filter { it.category == category }
        }
    }

    suspend fun getFeatured(): List<Product> {
        delay(40)
        return getAll().filter { it.isFeatured }
    }

    suspend fun getBestSellers(): List<Product> {
        delay(40)
        return getAll()
            .filter { it.isBestSeller }
            .sortedWith(compareByDescending<Product> { it.releasedAt }.thenBy { it.name })
    }

    suspend fun getNewArrivals(): List<Product> {
        delay(40)
        return getAll().filter { it.isNewArrival }.sortedByDescending { it.releasedAt }
    }

    suspend fun getOffers(): List<Product> {
        delay(40)
        return getAll().filter { it.onSale || it.showInFlashDeals }
            .sortedByDescending { it.discountPercent }
    }

    suspend fun getRecommendations(referenceId: String? = null, limit: Int = 8): List<Product> {
        delay(40)
        val source = getAll().filter { it.inStock }
        if (referenceId == null) {
            return source.filter { it.isFeatured || it.inRecommendedFeed }.take(limit)
        }

        val ref = source.firstOrNull { it.id == referenceId } ?: return source.take(limit)

        val scoredProducts = source
            .filter { it.id != ref.id }
            .map { candidate ->
                var score = 0
                
                // 1. Same Category
                if (candidate.category == ref.category) {
                    score += 15
                }
                
                // 2. Compatibility mapping (e.g. CPU <-> MOTHERBOARD with same socket)
                if (ref.category == CategoryId.CPU && candidate.category == CategoryId.MOTHERBOARD) {
                    if (ref.socket != null && candidate.socket != null && ref.socket.equals(candidate.socket, ignoreCase = true)) {
                        score += 12
                    }
                }
                if (ref.category == CategoryId.MOTHERBOARD && candidate.category == CategoryId.CPU) {
                    if (ref.socket != null && candidate.socket != null && ref.socket.equals(candidate.socket, ignoreCase = true)) {
                        score += 12
                    }
                }
                if (ref.category == CategoryId.MOTHERBOARD && candidate.category == CategoryId.RAM) {
                    score += 8
                }
                if (ref.category == CategoryId.GPU && candidate.category == CategoryId.PSU) {
                    score += 10
                }

                // 3. Price Proximity (Budget matching)
                val priceRatio = if (ref.price > 0) candidate.price / ref.price else 1.0
                if (priceRatio in 0.8..1.2) {
                    score += 8
                } else if (priceRatio in 0.6..1.4) {
                    score += 3
                }

                // 4. Same Brand
                if (candidate.brand.equals(ref.brand, ignoreCase = true)) {
                    score += 5
                }

                // 5. Commercial boost (On Sale)
                if (candidate.onSale) {
                    score += 3
                }

                candidate to score
            }

        return scoredProducts
            .sortedByDescending { it.second }
            .map { it.first }
            .take(limit)
    }

    suspend fun search(query: String): List<Product> {
        delay(40)
        if (query.isBlank()) return emptyList()
        val q = query.trim().lowercase()
        return all().filter {
            it.name.lowercase().contains(q) ||
                it.brand.lowercase().contains(q) ||
                it.category.displayName.lowercase().contains(q) ||
                it.model.lowercase().contains(q)
        }
    }

    suspend fun suggestions(query: String): List<String> {
        if (query.isBlank()) return emptyList()
        val q = query.trim().lowercase()
        val source = all()
        val brands = source.map { it.brand }.distinct().filter { it.lowercase().contains(q) }
        val categories = CategoryId.shopCategories().map { it.displayName }.filter { it.lowercase().contains(q) }
        val products = source.map { it.name }.filter { it.lowercase().contains(q) }.take(6)
        return (brands.take(3) + categories.take(2) + products).distinct().take(8)
    }

    fun applyFilters(items: List<Product>, filters: ProductFilters): List<Product> {
        var list = items
        if (filters.searchQuery.isNotBlank()) {
            val q = filters.searchQuery.trim().lowercase()
            list = list.filter {
                it.name.lowercase().contains(q) ||
                it.brand.lowercase().contains(q) ||
                it.model.lowercase().contains(q)
            }
        }
        filters.priceMin?.let { v -> list = list.filter { it.price >= v } }
        filters.priceMax?.let { v -> list = list.filter { it.price <= v } }
        if (filters.brands.isNotEmpty()) list = list.filter { it.brand in filters.brands }
        if (filters.onlyAvailable) list = list.filter { it.inStock }
        if (filters.onlyOffers) list = list.filter { it.onSale }
        if (filters.freeShippingOnly) list = list.filter { it.freeShipping }
        filters.socket?.let { socket -> list = list.filter { it.socket == socket } }
        return when (filters.sort) {
            SortOption.RELEVANCE -> list.sortedWith(
                compareByDescending<Product> { it.isFeatured }
                    .thenByDescending { it.releasedAt }
                    .thenBy { it.name }
            )
            SortOption.PRICE_LOW -> list.sortedBy { it.price }
            SortOption.PRICE_HIGH -> list.sortedByDescending { it.price }
            SortOption.NEWEST -> list.sortedByDescending { it.releasedAt }
        }
    }

    suspend fun availableBrands(category: CategoryId? = null): List<String> {
        val source = all()
        val pool = if (category == null || category == CategoryId.OFFERS) source
        else source.filter { it.category == category }
        return pool.map { it.brand }.distinct().sorted()
    }

    suspend fun priceRange(category: CategoryId? = null): Pair<Double, Double> {
        val source = all()
        val pool = if (category == null || category == CategoryId.OFFERS) source
        else source.filter { it.category == category }
        if (pool.isEmpty()) return 0.0 to 0.0
        return pool.minOf { it.price } to pool.maxOf { it.price }
    }

    suspend fun availableSockets(category: CategoryId? = null): List<String> {
        val source = all()
        val pool = if (category == null) source else source.filter { it.category == category }
        return pool.mapNotNull { it.socket }.distinct().sorted()
    }
}
