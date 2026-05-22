package com.pclink.app.ui.screens.extras

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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Build
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.pclink.app.data.repository.CartRepository
import com.pclink.app.data.repository.ProductRepository
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.theme.PriceGreen
import com.pclink.app.ui.theme.SuccessGreen
import com.pclink.app.ui.theme.WarningAmber
import com.pclink.app.ui.util.Format
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

private val BUILD_SLOTS = listOf(
    CategoryId.CPU,
    CategoryId.MOTHERBOARD,
    CategoryId.RAM,
    CategoryId.GPU,
    CategoryId.STORAGE,
    CategoryId.PSU,
    CategoryId.CASE,
    CategoryId.COOLING
)

data class BuilderUiState(
    val selected: Map<CategoryId, Product> = emptyMap(),
    val productsByCategory: Map<CategoryId, List<Product>> = emptyMap(),
    val isLoading: Boolean = true
)

@HiltViewModel
class PcBuilderViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _state = MutableStateFlow(BuilderUiState())
    val state: StateFlow<BuilderUiState> = _state.asStateFlow()

    init { load() }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val map = BUILD_SLOTS.associateWith { cat -> productRepository.getByCategory(cat) }
            _state.value = _state.value.copy(productsByCategory = map, isLoading = false)
        }
    }

    fun select(category: CategoryId, product: Product) {
        _state.value = _state.value.copy(selected = _state.value.selected + (category to product))
    }

    fun remove(category: CategoryId) {
        _state.value = _state.value.copy(selected = _state.value.selected - category)
    }

    fun addAllToCart(onDone: () -> Unit) {
        viewModelScope.launch {
            _state.value.selected.values.forEach { p -> cartRepository.add(p.id, 1) }
            onDone()
        }
    }

    /**
     * Compatibility check: CPU socket should match motherboard socket.
     */
    fun compatibilityWarnings(): List<String> {
        val cpu = _state.value.selected[CategoryId.CPU]
        val mobo = _state.value.selected[CategoryId.MOTHERBOARD]
        val warnings = mutableListOf<String>()
        if (cpu?.socket != null && mobo?.socket != null && cpu.socket != mobo.socket) {
            warnings += "El socket del CPU (${cpu.socket}) no coincide con el de la motherboard (${mobo.socket})."
        }
        return warnings
    }
}

@Composable
fun PcBuilderScreen(
    onBack: () -> Unit,
    onProductClick: (Product) -> Unit,
    onCheckout: () -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: PcBuilderViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val warnings = viewModel.compatibilityWarnings()
    val total = state.selected.values.sumOf { it.price }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(title = "Armá tu PC", onBackClick = onBack)

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(
                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 16.dp
            ),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item { HeroBuilderCard(componentsSelected = state.selected.size, totalSlots = BUILD_SLOTS.size) }
            if (warnings.isNotEmpty()) {
                item { WarningCard(messages = warnings) }
            }
            items(BUILD_SLOTS) { slot ->
                BuildSlot(
                    category = slot,
                    selected = state.selected[slot],
                    suggestions = state.productsByCategory[slot] ?: emptyList(),
                    onSelect = { viewModel.select(slot, it) },
                    onRemove = { viewModel.remove(slot) },
                    onProductClick = onProductClick
                )
            }
        }

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 6.dp
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Tu build", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(
                        Format.price(total),
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black)
                    )
                    Text(
                        "${state.selected.size}/${BUILD_SLOTS.size} componentes",
                        style = MaterialTheme.typography.labelSmall,
                        color = PriceGreen
                    )
                }
                Surface(
                    modifier = Modifier
                        .clickable(enabled = state.selected.isNotEmpty()) {
                            viewModel.addAllToCart(onCheckout)
                        },
                    color = if (state.selected.isNotEmpty()) PClinkCyan else PClinkBorder,
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        "Comprar build",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                        modifier = Modifier.padding(horizontal = 22.dp, vertical = 14.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun HeroBuilderCard(componentsSelected: Int, totalSlots: Int) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp),
        shape = RoundedCornerShape(20.dp),
        color = PClinkBlack
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(Brush.horizontalGradient(listOf(PClinkBlack, Color(0xFF0E2B33))))
        ) {
            Row(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = PClinkCyan.copy(alpha = 0.18f),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(
                        Icons.Outlined.Build,
                        null,
                        tint = PClinkCyan,
                        modifier = Modifier.padding(14.dp).size(28.dp)
                    )
                }
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        "Constructor de PC",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                    Text(
                        "Compatibilidad asegurada · Sin sorpresas",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    Spacer(Modifier.size(6.dp))
                    Text(
                        "$componentsSelected de $totalSlots componentes seleccionados",
                        style = MaterialTheme.typography.labelMedium,
                        color = PClinkCyan
                    )
                }
            }
        }
    }
}

@Composable
private fun WarningCard(messages: List<String>) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = WarningAmber.copy(alpha = 0.1f)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.WarningAmber, null, tint = WarningAmber)
                Spacer(Modifier.width(8.dp))
                Text(
                    "Compatibilidad",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
                    color = WarningAmber
                )
            }
            messages.forEach {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = 4.dp, start = 28.dp)
                )
            }
        }
    }
}

@Composable
private fun BuildSlot(
    category: CategoryId,
    selected: Product?,
    suggestions: List<Product>,
    onSelect: (Product) -> Unit,
    onRemove: () -> Unit,
    onProductClick: (Product) -> Unit
) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                color = PClinkCyan.copy(alpha = 0.12f),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(category.icon, null, tint = PClinkCyan, modifier = Modifier.padding(8.dp).size(20.dp))
            }
            Spacer(Modifier.width(10.dp))
            Text(
                category.displayName,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                modifier = Modifier.weight(1f)
            )
            if (selected != null) {
                Text(
                    "Quitar",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.clickable { onRemove() }
                )
            }
        }
        Spacer(Modifier.size(8.dp))
        if (selected != null) {
            SelectedSlotCard(product = selected, onClick = { onProductClick(selected) })
        } else {
            SuggestionsRow(items = suggestions.take(6), onSelect = onSelect)
        }
    }
}

@Composable
private fun SelectedSlotCard(product: Product, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .border(1.dp, SuccessGreen.copy(alpha = 0.4f), RoundedCornerShape(16.dp)),
        color = SuccessGreen.copy(alpha = 0.05f),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                modifier = Modifier.size(72.dp),
                color = PClinkSurface,
                shape = RoundedCornerShape(12.dp)
            ) {
                AsyncImage(
                    model = product.images.firstOrNull(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.padding(4.dp).clip(RoundedCornerShape(10.dp))
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Check, null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "Seleccionado",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                        color = SuccessGreen
                    )
                }
                Text(
                    product.name,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    Format.price(product.price),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black)
                )
            }
        }
    }
}

@Composable
private fun SuggestionsRow(items: List<Product>, onSelect: (Product) -> Unit) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        items(items) { p ->
            Surface(
                modifier = Modifier
                    .width(160.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onSelect(p) }
                    .border(1.dp, PClinkBorder, RoundedCornerShape(14.dp)),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(Modifier.padding(10.dp)) {
                    Surface(color = PClinkSurface, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().height(80.dp)) {
                        AsyncImage(
                            model = p.images.firstOrNull(),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.padding(4.dp).clip(RoundedCornerShape(8.dp))
                        )
                    }
                    Spacer(Modifier.size(6.dp))
                    Text(
                        p.brand.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                        color = PClinkCyan
                    )
                    Text(
                        p.name,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        Format.price(p.price),
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
                    )
                    Spacer(Modifier.size(6.dp))
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = PClinkCyan.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Outlined.Add, null, tint = PClinkCyan, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.size(4.dp))
                            Text(
                                "Elegir",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                                color = PClinkCyan
                            )
                        }
                    }
                }
            }
        }
    }
}
