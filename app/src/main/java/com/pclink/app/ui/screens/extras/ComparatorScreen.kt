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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CompareArrows
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.pclink.app.data.repository.ProductRepository
import com.pclink.app.domain.model.Product
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.util.Format
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class ComparatorViewModel @Inject constructor(
    private val productRepository: ProductRepository
) : ViewModel() {
    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _suggestions = MutableStateFlow<List<Product>>(emptyList())
    val suggestions: StateFlow<List<Product>> = _suggestions.asStateFlow()

    init {
        viewModelScope.launch {
            _suggestions.value = productRepository.getAll().sortedWith(
                compareByDescending<Product> { it.releasedAt }.thenBy { it.name }
            ).take(20)
        }
    }

    fun add(product: Product) {
        if (_products.value.size < 4 && _products.value.none { it.id == product.id }) {
            _products.value = _products.value + product
        }
    }

    fun remove(productId: String) {
        _products.value = _products.value.filter { it.id != productId }
    }
}

@Composable
fun ComparatorScreen(
    onBack: () -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: ComparatorViewModel = hiltViewModel()
) {
    val products by viewModel.products.collectAsState()
    val suggestions by viewModel.suggestions.collectAsState()
    var pickerOpen by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(title = "Comparador", onBackClick = onBack)
        Hero()
        Spacer(Modifier.height(16.dp))
        if (products.isEmpty()) {
            EmptyState(onAdd = { pickerOpen = true })
        } else {
            ComparisonTable(
                products = products,
                onRemove = viewModel::remove,
                onAdd = { pickerOpen = true }
            )
        }
    }

    if (pickerOpen) {
        ProductPickerSheet(
            suggestions = suggestions,
            existing = products.map { it.id }.toSet(),
            onPick = { viewModel.add(it); pickerOpen = false },
            onDismiss = { pickerOpen = false }
        )
    }
}

@Composable
private fun Hero() {
    Surface(
        modifier = Modifier
            .padding(horizontal = 16.dp)
            .fillMaxWidth()
            .height(110.dp),
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
                        Icons.Outlined.CompareArrows,
                        null,
                        tint = PClinkCyan,
                        modifier = Modifier.padding(12.dp).size(28.dp)
                    )
                }
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(
                        "Compará hasta 4 productos",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                    Text(
                        "Especificaciones y precio lado a lado",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyState(onAdd: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Outlined.CompareArrows, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(50.dp))
        Spacer(Modifier.height(16.dp))
        Text(
            "Empezá agregando productos",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
        )
        Text(
            "Podés comparar hasta 4 productos a la vez.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(20.dp))
        Surface(
            modifier = Modifier.clip(RoundedCornerShape(12.dp)).clickable { onAdd() },
            color = PClinkCyan,
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                "Agregar producto",
                color = Color.White,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 12.dp)
            )
        }
    }
}

@Composable
private fun ComparisonTable(
    products: List<Product>,
    onRemove: (String) -> Unit,
    onAdd: () -> Unit
) {
    val attrs: List<Pair<String, (Product) -> String>> = listOf(
        "Marca" to { it.brand },
        "Precio" to { Format.price(it.price) },
        "Descuento" to { if (it.discountPercent > 0) "-${it.discountPercent}%" else "—" },
        "Stock" to { if (it.inStock) "Sí (${it.stock})" else "Sin stock" },
        "Envío gratis" to { if (it.freeShipping) "Sí" else "No" },
        "Socket" to { it.socket ?: "—" }
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
            ) {
                products.forEach { p ->
                    ProductHeaderCard(p, onRemove = { onRemove(p.id) })
                    Spacer(Modifier.width(10.dp))
                }
                if (products.size < 4) {
                    AddProductCard(onClick = onAdd)
                }
            }
        }
        items(attrs) { (label, extractor) ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surface,
                border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text(
                        label,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.size(6.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                    ) {
                        products.forEach { p ->
                            Box(modifier = Modifier.width(160.dp).padding(end = 10.dp)) {
                                Text(
                                    extractor(p),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductHeaderCard(p: Product, onRemove: () -> Unit) {
    Surface(
        modifier = Modifier
            .width(160.dp),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
    ) {
        Box {
            Column(Modifier.padding(10.dp)) {
                Surface(
                    color = PClinkSurface,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().height(110.dp)
                ) {
                    AsyncImage(
                        model = p.images.firstOrNull(),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.padding(6.dp).clip(RoundedCornerShape(8.dp))
                    )
                }
                Spacer(Modifier.size(8.dp))
                Text(
                    p.name,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Surface(
                modifier = Modifier
                    .padding(6.dp)
                    .size(28.dp)
                    .clip(RoundedCornerShape(50))
                    .clickable { onRemove() },
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                shape = RoundedCornerShape(50)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.Close, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
private fun AddProductCard(onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .width(160.dp)
            .height(180.dp)
            .clip(RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .border(1.5.dp, PClinkCyan.copy(alpha = 0.5f), RoundedCornerShape(14.dp)),
        color = PClinkCyan.copy(alpha = 0.06f),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(Icons.Outlined.Add, null, tint = PClinkCyan, modifier = Modifier.size(28.dp))
            Spacer(Modifier.size(6.dp))
            Text(
                "Agregar",
                color = PClinkCyan,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
            )
        }
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
private fun ProductPickerSheet(
    suggestions: List<Product>,
    existing: Set<String>,
    onPick: (Product) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = androidx.compose.material3.rememberModalBottomSheetState(skipPartiallyExpanded = true)
    androidx.compose.material3.ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(
                "Elegí un producto para comparar",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold)
            )
            Spacer(Modifier.size(12.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.height(500.dp)) {
                items(suggestions.filter { it.id !in existing }) { p ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onPick(p) }
                            .border(1.dp, PClinkBorder, RoundedCornerShape(12.dp)),
                        color = MaterialTheme.colorScheme.surface,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Surface(modifier = Modifier.size(56.dp), color = PClinkSurface, shape = RoundedCornerShape(10.dp)) {
                                AsyncImage(
                                    model = p.images.firstOrNull(),
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.padding(4.dp).clip(RoundedCornerShape(8.dp))
                                )
                            }
                            Spacer(Modifier.size(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(
                                    p.name,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    Format.price(p.price),
                                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
