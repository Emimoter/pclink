package com.pclink.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.CustomProductRepository
import com.pclink.app.data.repository.FavoritesRepository
import com.pclink.app.data.repository.ProductRepository
import com.pclink.app.domain.model.Banner
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val banners: List<Banner> = emptyList(),
    val categories: List<CategoryId> = CategoryId.shopCategories(),
    val flashDeals: List<Product> = emptyList(),
    val featured: List<Product> = emptyList(),
    val bestSellers: List<Product> = emptyList(),
    val newArrivals: List<Product> = emptyList(),
    val recommendations: List<Product> = emptyList()
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    private val customProductRepository: CustomProductRepository,
    private val favoritesRepository: FavoritesRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    private var loadJob: kotlinx.coroutines.Job? = null

    val favoriteIds: StateFlow<Set<String>> = favoritesRepository
        .observeFavoriteIds()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptySet())

    val cartCount: StateFlow<Int> = cartRepository
        .itemCountFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    init {
        viewModelScope.launch {
            productRepository.observeAll().collect {
                load()
            }
        }
        viewModelScope.launch {
            productRepository.isLoadingFlow.collect {
                load()
            }
        }
        viewModelScope.launch {
            productRepository.banners.collect { banners ->
                _state.value = _state.value.copy(banners = banners)
            }
        }
    }

    fun load() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            val isRepoLoading = productRepository.isLoading
            val flash = productRepository.getOffers().take(8)
            val featured = productRepository.getFeatured()
            val best = productRepository.getBestSellers()
            val newArr = productRepository.getNewArrivals()
            val recs = productRepository.getRecommendations()
            _state.value = HomeUiState(
                isLoading = isRepoLoading,
                banners = _state.value.banners,
                flashDeals = flash,
                featured = featured,
                bestSellers = best,
                newArrivals = newArr,
                recommendations = recs
            )
        }
    }

    fun toggleFavorite(productId: String) {
        viewModelScope.launch { favoritesRepository.toggle(productId) }
    }

    fun addToCart(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }
}
