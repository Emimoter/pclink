package com.pclink.app.ui.screens.categoryproducts

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.FavoritesRepository
import com.pclink.app.data.repository.ProductRepository
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.ProductFilters
import com.pclink.app.domain.model.SortOption
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class CategoryProductsUiState(
    val category: CategoryId,
    val isLoading: Boolean = true,
    val all: List<Product> = emptyList(),
    val filtered: List<Product> = emptyList(),
    val filters: ProductFilters = ProductFilters(),
    val brands: List<String> = emptyList(),
    val priceRange: Pair<Double, Double> = 0.0 to 0.0,
    val availableSockets: List<String> = emptyList()
)

@HiltViewModel
class CategoryProductsViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val productRepository: ProductRepository,
    private val favoritesRepository: FavoritesRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val categoryId: CategoryId =
        runCatching { CategoryId.valueOf(savedStateHandle.get<String>("categoryId") ?: "") }
            .getOrDefault(CategoryId.GPU)

    private val _state = MutableStateFlow(CategoryProductsUiState(category = categoryId))
    val state: StateFlow<CategoryProductsUiState> = _state.asStateFlow()

    val favoriteIds: StateFlow<Set<String>> = favoritesRepository
        .observeFavoriteIds()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptySet())

    init {
        viewModelScope.launch {
            productRepository.observeAll().collect {
                load()
            }
        }
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val products = productRepository.getByCategory(categoryId)
            val brands = productRepository.availableBrands(categoryId)
            val price = productRepository.priceRange(categoryId)
            val sockets = productRepository.availableSockets(categoryId)
            _state.value = _state.value.copy(
                isLoading = false,
                all = products,
                filtered = productRepository.applyFilters(products, _state.value.filters),
                brands = brands,
                priceRange = price,
                availableSockets = sockets
            )
        }
    }

    fun updateFilters(filters: ProductFilters) {
        val s = _state.value
        _state.value = s.copy(
            filters = filters,
            filtered = productRepository.applyFilters(s.all, filters)
        )
    }

    fun updateSearchQuery(query: String) {
        updateFilters(_state.value.filters.copy(searchQuery = query))
    }

    fun updateSort(sort: SortOption) {
        updateFilters(_state.value.filters.copy(sort = sort))
    }

    fun resetFilters() {
        updateFilters(ProductFilters())
    }

    fun toggleFavorite(productId: String) {
        viewModelScope.launch { favoritesRepository.toggle(productId) }
    }

    fun addToCart(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }
}
