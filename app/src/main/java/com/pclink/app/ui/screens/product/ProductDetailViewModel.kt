package com.pclink.app.ui.screens.product

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.FavoritesRepository
import com.pclink.app.data.repository.ProductRepository
import com.pclink.app.data.repository.UserRepository
import com.pclink.app.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ProductDetailUiState(
    val isLoading: Boolean = true,
    val product: Product? = null,
    val related: List<Product> = emptyList(),
    val quantity: Int = 1,
    val selectedImageIndex: Int = 0,
    val isAdded: Boolean = false,
    val isLoggedIn: Boolean = false
)

@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val productRepository: ProductRepository,
    private val favoritesRepository: FavoritesRepository,
    private val cartRepository: CartRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val productId: String = savedStateHandle.get<String>("productId").orEmpty()

    private val _state = MutableStateFlow(ProductDetailUiState())
    val state: StateFlow<ProductDetailUiState> = _state.asStateFlow()

    val favoriteIds: StateFlow<Set<String>> = favoritesRepository
        .observeFavoriteIds()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptySet())

    init {
        load()
        viewModelScope.launch {
            userRepository.user.collect { user ->
                _state.value = _state.value.copy(isLoggedIn = user.id != UserRepository.GUEST.id)
            }
        }
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val product = productRepository.getById(productId)
            val related = productRepository.getRecommendations(productId, limit = 8)
            _state.value = _state.value.copy(
                isLoading = false,
                product = product,
                related = related
            )
        }
    }

    fun selectImage(index: Int) {
        _state.value = _state.value.copy(selectedImageIndex = index)
    }

    fun setQuantity(qty: Int) {
        val product = _state.value.product ?: return
        val safe = qty.coerceIn(1, product.stock.coerceAtLeast(1))
        _state.value = _state.value.copy(quantity = safe)
    }

    fun toggleFavorite() {
        val id = _state.value.product?.id ?: return
        viewModelScope.launch { favoritesRepository.toggle(id) }
    }

    fun addToCart() {
        val product = _state.value.product ?: return
        viewModelScope.launch {
            cartRepository.add(product.id, _state.value.quantity)
            _state.value = _state.value.copy(isAdded = true)
            kotlinx.coroutines.delay(2000)
            _state.value = _state.value.copy(isAdded = false)
        }
    }
}
