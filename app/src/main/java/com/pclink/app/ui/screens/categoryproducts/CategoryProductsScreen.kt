package com.pclink.app.ui.screens.categoryproducts

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material.icons.automirrored.outlined.Sort
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.SortOption
import com.pclink.app.ui.components.FiltersSheet
import com.pclink.app.ui.components.ProductCard
import com.pclink.app.ui.components.ShimmerProductCard
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryProductsScreen(
    onBack: () -> Unit,
    onProductClick: (Product) -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: CategoryProductsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val favoriteIds by viewModel.favoriteIds.collectAsState()
    var showFilters by remember { mutableStateOf(false) }
    var showSort by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(
            title = state.category.displayName,
            onBackClick = onBack,
            actions = {
                Surface(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .clickable { showSort = true }
                        .border(1.dp, PClinkBorder, CircleShape),
                    color = MaterialTheme.colorScheme.surface,
                    shape = CircleShape
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.AutoMirrored.Outlined.Sort, contentDescription = "Ordenar", modifier = Modifier.size(20.dp))
                    }
                }
                Spacer(Modifier.width(8.dp))
                Surface(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .clickable { showFilters = true }
                        .border(
                            1.dp,
                            if (state.filters.isActive) PClinkCyan else PClinkBorder,
                            CircleShape
                        ),
                    color = if (state.filters.isActive) PClinkCyan.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface,
                    shape = CircleShape
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Outlined.FilterList,
                            contentDescription = "Filtros",
                            tint = if (state.filters.isActive) PClinkCyan else PClinkBlack,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Spacer(Modifier.width(8.dp))
            }
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { query ->
                searchQuery = query
                viewModel.updateSearchQuery(query)
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Buscar en ${state.category.displayName.lowercase()}...") },
            leadingIcon = {
                Icon(Icons.Outlined.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = {
                        searchQuery = ""
                        viewModel.updateSearchQuery("")
                    }) {
                        Icon(Icons.Filled.Close, contentDescription = "Limpiar", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = {}),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedBorderColor = PClinkCyan,
                unfocusedBorderColor = PClinkBorder
            )
        )

        Spacer(Modifier.height(8.dp))
        ResultsHeader(state.filtered.size, state.filters.sort)

        if (state.isLoading) {
            ProductGridSkeleton(contentPadding)
        } else if (state.filtered.isEmpty()) {
            EmptyResults(
                hasActiveFilters = state.filters.isActive,
                onResetFilters = { viewModel.resetFilters() }
            )
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(
                    start = 12.dp,
                    end = 12.dp,
                    top = 12.dp,
                    bottom = 24.dp + contentPadding.calculateBottomPadding()
                ),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(state.filtered, key = { it.id }) { product ->
                    ProductCard(
                        product = product,
                        isFavorite = product.id in favoriteIds,
                        onClick = { onProductClick(product) },
                        onToggleFavorite = { viewModel.toggleFavorite(product.id) },
                        onAddToCart = { viewModel.addToCart(product.id) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }

    if (showFilters) {
        FiltersSheet(
            initialFilters = state.filters,
            brands = state.brands,
            sockets = state.availableSockets,
            priceRange = state.priceRange,
            onDismiss = { showFilters = false },
            onApply = { viewModel.updateFilters(it) }
        )
    }
    if (showSort) {
        SortBottomSheet(
            current = state.filters.sort,
            onDismiss = { showSort = false },
            onSelect = { viewModel.updateSort(it); showSort = false }
        )
    }
}

@Composable
private fun ResultsHeader(count: Int, sort: SortOption) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            "$count resultados",
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
        )
        Spacer(Modifier.weight(1f))
        Text(
            sort.label,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ProductGridSkeleton(contentPadding: PaddingValues) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(
            start = 12.dp,
            end = 12.dp,
            top = 12.dp,
            bottom = 24.dp + contentPadding.calculateBottomPadding()
        ),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(8) {
            ShimmerProductCard(Modifier.fillMaxWidth().height(280.dp))
        }
    }
}

@Composable
private fun EmptyResults(hasActiveFilters: Boolean, onResetFilters: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Outlined.SearchOff,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(56.dp)
        )
        Spacer(Modifier.height(16.dp))
        Text(
            "No encontramos productos",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
        )
        Spacer(Modifier.height(6.dp))
        Text(
            "Intentá ajustando los filtros o buscando otra categoría.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        if (hasActiveFilters) {
            Spacer(Modifier.height(20.dp))
            Surface(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onResetFilters() },
                color = PClinkCyan,
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    "Limpiar filtros",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp)
                )
            }
        }
    }
}

@androidx.compose.material3.ExperimentalMaterial3Api
@Composable
private fun SortBottomSheet(
    current: SortOption,
    onDismiss: () -> Unit,
    onSelect: (SortOption) -> Unit
) {
    val sheetState = androidx.compose.material3.rememberModalBottomSheetState()
    androidx.compose.material3.ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(
                "Ordenar por",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold)
            )
            Spacer(Modifier.height(16.dp))
            SortOption.entries.forEach { opt ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onSelect(opt) }
                        .padding(horizontal = 8.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        opt.label,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = if (current == opt) FontWeight.ExtraBold else FontWeight.Medium
                        ),
                        color = if (current == opt) PClinkCyan else MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f)
                    )
                    if (current == opt) {
                        Surface(
                            modifier = Modifier.size(10.dp),
                            shape = CircleShape,
                            color = PClinkCyan
                        ) {}
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}
