package com.pclink.app.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.FavoritesRepository
import com.pclink.app.data.repository.ProductRepository
import com.pclink.app.data.repository.SearchHistoryRepository
import com.pclink.app.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SearchUiState(
    val query: String = "",
    val results: List<Product> = emptyList(),
    val suggestions: List<String> = emptyList(),
    val isSearching: Boolean = false,
    val recent: List<String> = emptyList(),
    val popular: List<String> = listOf(
        "RTX 4090",
        "Ryzen 9",
        "DDR5",
        "SSD NVMe",
        "Monitor 4K",
        "Mouse gamer",
        "Notebook gaming",
        "Auriculares HyperX"
    )
)

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    private val historyRepository: SearchHistoryRepository,
    private val favoritesRepository: FavoritesRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _state = MutableStateFlow(SearchUiState())
    val state: StateFlow<SearchUiState> = _state.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    val favoriteIds: StateFlow<Set<String>> = favoritesRepository
        .observeFavoriteIds()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptySet())

    init {
        viewModelScope.launch {
            historyRepository.observeRecent().collectLatest { recents ->
                _state.value = _state.value.copy(recent = recents)
            }
        }
        observeQuery()
    }

    @OptIn(FlowPreview::class)
    private fun observeQuery() {
        viewModelScope.launch {
            queryFlow.debounce(220).collectLatest { q ->
                if (q.isBlank()) {
                    _state.value = _state.value.copy(
                        results = emptyList(),
                        suggestions = emptyList(),
                        isSearching = false
                    )
                } else {
                    _state.value = _state.value.copy(isSearching = true)
                    val results = productRepository.search(q)
                    val sugg = productRepository.suggestions(q)
                    _state.value = _state.value.copy(
                        results = results,
                        suggestions = sugg,
                        isSearching = false
                    )
                }
            }
        }
    }

    fun setQuery(q: String) {
        _state.value = _state.value.copy(query = q)
        queryFlow.value = q
    }

    fun submit(query: String) {
        if (query.isBlank()) return
        viewModelScope.launch { historyRepository.record(query) }
        setQuery(query)
    }

    fun clearQuery() = setQuery("")
    fun clearHistory() { viewModelScope.launch { historyRepository.clear() } }
    fun deleteHistory(query: String) { viewModelScope.launch { historyRepository.delete(query) } }

    fun toggleFavorite(productId: String) {
        viewModelScope.launch { favoritesRepository.toggle(productId) }
    }

    fun addToCart(productId: String) {
        viewModelScope.launch { cartRepository.add(productId) }
    }
}
