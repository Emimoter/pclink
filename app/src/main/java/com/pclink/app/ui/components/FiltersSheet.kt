package com.pclink.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import com.pclink.app.domain.model.ProductFilters
import com.pclink.app.domain.model.SortOption
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.util.Format

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun FiltersSheet(
    initialFilters: ProductFilters,
    brands: List<String>,
    sockets: List<String>,
    priceRange: Pair<Double, Double>,
    onDismiss: () -> Unit,
    onApply: (ProductFilters) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var filters by remember { mutableStateOf(initialFilters) }
    var minPriceText by remember {
        mutableStateOf(TextFieldValue(initialFilters.priceMin?.toLong()?.toString() ?: ""))
    }
    var maxPriceText by remember {
        mutableStateOf(TextFieldValue(initialFilters.priceMax?.toLong()?.toString() ?: ""))
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            Modifier
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 24.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Outlined.Tune,
                    contentDescription = null,
                    tint = PClinkCyan
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    "Filtros",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold)
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "Limpiar",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.clickable {
                        filters = ProductFilters()
                        minPriceText = TextFieldValue("")
                        maxPriceText = TextFieldValue("")
                    }
                )
            }
            Spacer(Modifier.height(20.dp))

            // Sort
            FilterSectionTitle("Ordenar por")
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SortOption.entries.forEach { opt ->
                    SelectableChip(
                        label = opt.label,
                        selected = filters.sort == opt,
                        onClick = { filters = filters.copy(sort = opt) }
                    )
                }
            }

            Spacer(Modifier.height(20.dp))
            FilterSectionTitle("Precio")
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = minPriceText,
                    onValueChange = { minPriceText = it; filters = filters.copy(priceMin = it.text.toDoubleOrNull()) },
                    label = { Text("Mínimo") },
                    placeholder = { Text(Format.price(priceRange.first)) },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                OutlinedTextField(
                    value = maxPriceText,
                    onValueChange = { maxPriceText = it; filters = filters.copy(priceMax = it.text.toDoubleOrNull()) },
                    label = { Text("Máximo") },
                    placeholder = { Text(Format.price(priceRange.second)) },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            }

            if (brands.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                FilterSectionTitle("Marca")
                Spacer(Modifier.height(8.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    brands.forEach { brand ->
                        val selected = brand in filters.brands
                        SelectableChip(
                            label = brand,
                            selected = selected,
                            onClick = {
                                val updated = filters.brands.toMutableSet().apply {
                                    if (selected) remove(brand) else add(brand)
                                }
                                filters = filters.copy(brands = updated)
                            }
                        )
                    }
                }
            }

            if (sockets.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                FilterSectionTitle("Socket / Compatibilidad")
                Spacer(Modifier.height(8.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    sockets.forEach { sock ->
                        SelectableChip(
                            label = sock,
                            selected = filters.socket == sock,
                            onClick = {
                                filters = filters.copy(socket = if (filters.socket == sock) null else sock)
                            }
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            ToggleRow("Solo disponibles", filters.onlyAvailable) { filters = filters.copy(onlyAvailable = it) }
            ToggleRow("Solo ofertas", filters.onlyOffers) { filters = filters.copy(onlyOffers = it) }
            ToggleRow("Envío gratis", filters.freeShippingOnly) { filters = filters.copy(freeShippingOnly = it) }

            Spacer(Modifier.height(24.dp))

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onApply(filters); onDismiss() },
                color = PClinkCyan,
                shape = RoundedCornerShape(14.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        "Aplicar filtros",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun FilterSectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
    )
}

@Composable
fun SelectableChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    leading: (@Composable () -> Unit)? = null
) {
    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .border(
                1.dp,
                if (selected) PClinkCyan else PClinkBorder,
                RoundedCornerShape(12.dp)
            ),
        color = if (selected) PClinkCyan.copy(alpha = 0.12f) else PClinkSurface,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (leading != null) {
                leading()
                Spacer(Modifier.width(4.dp))
            }
            Text(
                label,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                color = if (selected) PClinkCyan else PClinkBlack
            )
        }
    }
}

@Composable
private fun ToggleRow(label: String, value: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Switch(
            checked = value,
            onCheckedChange = onChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = PClinkCyan,
                uncheckedThumbColor = Color.White,
                uncheckedTrackColor = PClinkBorder
            )
        )
    }
}
