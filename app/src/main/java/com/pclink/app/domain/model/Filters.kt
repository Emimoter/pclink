package com.pclink.app.domain.model

data class ProductFilters(
    val searchQuery: String = "",
    val priceMin: Double? = null,
    val priceMax: Double? = null,
    val brands: Set<String> = emptySet(),
    val onlyAvailable: Boolean = false,
    val onlyOffers: Boolean = false,
    val socket: String? = null,
    val sort: SortOption = SortOption.RELEVANCE,
    val freeShippingOnly: Boolean = false
) {
    val isActive: Boolean
        get() = searchQuery.isNotBlank() || priceMin != null || priceMax != null || brands.isNotEmpty() ||
                onlyAvailable || onlyOffers ||
                socket != null || freeShippingOnly || sort != SortOption.RELEVANCE
}

enum class SortOption(val label: String) {
    RELEVANCE("Relevancia"),
    PRICE_LOW("Menor precio"),
    PRICE_HIGH("Mayor precio"),
    NEWEST("Más recientes")
}
