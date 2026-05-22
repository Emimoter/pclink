package com.pclink.app.ui.screens.checkout

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.AddLocationAlt
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.pclink.app.domain.model.Address
import com.pclink.app.domain.model.PaymentMethod
import com.pclink.app.domain.model.PaymentType
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.theme.PriceGreen
import com.pclink.app.ui.theme.SuccessGreen
import com.pclink.app.ui.util.Format
import coil.compose.AsyncImage
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.toArgb
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

@Composable
fun CheckoutScreen(
    onBack: () -> Unit,
    onOrderPlaced: (String) -> Unit,
    onAddAddress: () -> Unit,
    onEditAddress: (String) -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: CheckoutViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(state.paymentUrl) {
        state.paymentUrl?.let { url ->
            val intent = CustomTabsIntent.Builder()
                .setToolbarColor(PClinkCyan.toArgb())
                .setShowTitle(true)
                .build()
            intent.launchUrl(context, Uri.parse(url))
            viewModel.consumePaymentUrl()
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(title = "Checkout", onBackClick = onBack)
        Box(modifier = Modifier.weight(1f)) {
            LazyColumn(
                contentPadding = PaddingValues(
                    start = 16.dp, end = 16.dp, top = 8.dp,
                    bottom = 220.dp + contentPadding.calculateBottomPadding()
                ),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item { CheckoutStepHeader("1", "Dirección de envío") }
                item {
                    AddressCard(
                        addresses = state.addresses,
                        selected = state.selectedAddress,
                        onSelect = viewModel::selectAddress,
                        onAddAddress = onAddAddress,
                        onEditAddress = onEditAddress
                    )
                }
                item { CheckoutStepHeader("2", "Método de envío") }
                item {
                    ShippingOptions(
                        selected = state.shipping,
                        shippingCosts = state.shippingCosts,
                        onSelect = viewModel::selectShipping
                    )
                }
                item { CheckoutStepHeader("3", "Revisión de productos") }
                item {
                    CheckoutProductList(items = state.cart.items)
                }

                item { CheckoutStepHeader("4", "Resumen del pedido") }
                item {
                    val shippingCost = state.shippingCosts[state.shipping] ?: 0.0
                    OrderSummary(
                        itemCount = state.cart.itemCount,
                        subtotal = state.cart.subtotal,
                        discount = state.cart.couponDiscount,
                        shipping = shippingCost,
                        total = state.cart.subtotal - state.cart.couponDiscount + shippingCost
                    )
                }
                item {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .clickable(enabled = !state.processing) {
                                viewModel.simulateOrder(onOrderPlaced)
                            }
                            .border(1.dp, PClinkCyan.copy(alpha = 0.5f), RoundedCornerShape(14.dp)),
                        color = PClinkCyan.copy(alpha = 0.05f),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                "Simular Compra (Prueba)",
                                color = PClinkCyan,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }
                state.error?.let { errorMsg ->
                    item {
                        Surface(
                            color = Color(0xFFF8F9FA),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE4E7EC))
                        ) {
                            Text(
                                text = errorMsg,
                                modifier = Modifier.padding(12.dp),
                                color = Color(0xFF475467),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }

            ConfirmActionBar(
                total = state.cart.subtotal - state.cart.couponDiscount + (state.shippingCosts[state.shipping] ?: 0.0),
                processing = state.processing,
                onPlaceOrder = { viewModel.placeOrder(onOrderPlaced) },
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = contentPadding.calculateBottomPadding())
            )
        }
    }
}

@Composable
private fun CheckoutStepHeader(step: String, title: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(
            modifier = Modifier.size(28.dp),
            color = PClinkCyan,
            shape = CircleShape
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    step,
                    color = Color.White,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold)
                )
            }
        }
        Spacer(Modifier.width(10.dp))
        Text(
            title,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
        )
    }
}

@Composable
private fun AddressCard(
    addresses: List<Address>,
    selected: Address?,
    onSelect: (Address) -> Unit,
    onAddAddress: () -> Unit,
    onEditAddress: (String) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
    ) {
        Column(Modifier.padding(8.dp)) {
            addresses.forEach { addr ->
                val isSelected = selected?.id == addr.id
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onSelect(addr) }
                        .border(
                            1.dp,
                            if (isSelected) PClinkCyan else Color.Transparent,
                            RoundedCornerShape(12.dp)
                        )
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = if (isSelected) PClinkCyan.copy(alpha = 0.15f) else PClinkSurface,
                        shape = CircleShape
                    ) {
                        Icon(
                            Icons.Outlined.LocationOn,
                            null,
                            tint = PClinkCyan,
                            modifier = Modifier
                                .padding(8.dp)
                                .size(20.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                addr.label,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
                            )
                            if (addr.isDefault) {
                                Spacer(Modifier.width(8.dp))
                                Surface(
                                    color = PClinkCyan.copy(alpha = 0.12f),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        "Predeterminada",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                        color = PClinkCyan,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            "${addr.street} ${addr.number}${addr.apartment?.let { ", $it" } ?: ""}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            "${addr.city} · ${addr.state} · CP ${addr.zip}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (com.pclink.app.ui.util.PhoneValidator.isValidArgentinePhone(addr.phone)) {
                            Text(
                                "Teléfono: ${addr.phone}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    "Sin teléfono de contacto ⚠️",
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                                    color = Color.Gray
                                )
                                Text(
                                    "Completar",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = PClinkCyan
                                    ),
                                    modifier = Modifier.clickable { onEditAddress(addr.id) }
                                )
                            }
                        }
                    }
                    if (isSelected) {
                        Icon(Icons.Filled.Check, null, tint = PClinkCyan)
                    }
                }
            }
            // Inline add/complete phone option if missing for selected address
            selected?.let { addr ->
                val isPhoneValid = com.pclink.app.ui.util.PhoneValidator.isValidArgentinePhone(addr.phone)
                if (!isPhoneValid) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onEditAddress(addr.id) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Phone, null, tint = PClinkCyan)
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Agregar número de teléfono a la dirección",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                            color = PClinkCyan
                        )
                    }
                }
            }
            // Add address row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onAddAddress() }
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.AddLocationAlt, null, tint = PClinkCyan)
                Spacer(Modifier.width(8.dp))
                Text(
                    "Agregar nueva dirección",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                    color = PClinkCyan
                )
            }
        }
    }
}

@Composable
private fun ShippingOptions(
    selected: ShippingOption,
    shippingCosts: Map<ShippingOption, Double>,
    onSelect: (ShippingOption) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ShippingOption.entries.forEach { option ->
            ShippingRow(
                option = option,
                cost = shippingCosts[option] ?: 0.0,
                selected = selected == option,
                onClick = { onSelect(option) }
            )
        }
    }
}

@Composable
private fun ShippingRow(
    option: ShippingOption,
    cost: Double,
    selected: Boolean,
    onClick: () -> Unit
) {
    val icon = when (option) {
        ShippingOption.STANDARD -> Icons.Outlined.LocalShipping
        ShippingOption.EXPRESS -> Icons.Outlined.LocalShipping
        ShippingOption.PICKUP -> Icons.Outlined.Storefront
    }
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .border(
                1.dp,
                if (selected) PClinkCyan else PClinkBorder,
                RoundedCornerShape(14.dp)
            ),
        color = if (selected) PClinkCyan.copy(alpha = 0.06f) else MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = PClinkCyan)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    option.label,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
                )
                Text(
                    option.eta,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                if (cost == 0.0) "Gratis" else Format.price(cost),
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
                color = if (cost == 0.0) PriceGreen else PClinkBlack
            )
            Spacer(Modifier.width(8.dp))
            if (selected) Icon(Icons.Filled.Check, null, tint = PClinkCyan)
        }
    }
}

@Composable
private fun CheckoutProductList(items: List<com.pclink.app.domain.model.CartItem>) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
    ) {
        Column(Modifier.padding(8.dp)) {
            items.forEach { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(54.dp),
                        color = PClinkSurface,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        AsyncImage(
                            model = item.product.images.firstOrNull(),
                            contentDescription = null,
                            modifier = Modifier.padding(6.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(
                            item.product.name,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1
                        )
                        Text(
                            "Cantidad: ${item.quantity}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        Format.price(item.product.price * item.quantity),
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Black)
                    )
                }
            }
        }
    }
}

@Composable
private fun PaymentMethods(
    methods: List<PaymentMethod>,
    selected: PaymentMethod?,
    onSelect: (PaymentMethod) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        methods.forEach { method ->
            PaymentRow(
                method = method,
                selected = selected?.id == method.id,
                onClick = { onSelect(method) }
            )
        }
    }
}

@Composable
private fun PaymentRow(
    method: PaymentMethod,
    selected: Boolean,
    onClick: () -> Unit
) {
    val icon: ImageVector = when (method.type) {
        PaymentType.CREDIT, PaymentType.DEBIT -> Icons.Outlined.CreditCard
        PaymentType.MERCADO_PAGO -> Icons.Outlined.AccountBalanceWallet
        PaymentType.PAYPAL -> Icons.Outlined.AccountBalanceWallet
        PaymentType.STRIPE -> Icons.Outlined.CreditCard
        PaymentType.BANK_TRANSFER -> Icons.Outlined.AccountBalance
    }
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .border(
                1.dp,
                if (selected) PClinkCyan else PClinkBorder,
                RoundedCornerShape(14.dp)
            ),
        color = if (selected) PClinkCyan.copy(alpha = 0.06f) else MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                color = PClinkSurface,
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(
                    icon,
                    null,
                    tint = PClinkCyan,
                    modifier = Modifier
                        .padding(8.dp)
                        .size(20.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    method.brand,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
                )
                Text(
                    method.last4,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (selected) Icon(Icons.Filled.Check, null, tint = PClinkCyan)
        }
    }
}

@Composable
private fun OrderSummary(
    itemCount: Int,
    subtotal: Double,
    discount: Double,
    shipping: Double,
    total: Double
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
    ) {
        Column(Modifier.padding(16.dp)) {
            SummaryRow("Productos ($itemCount)", Format.price(subtotal))
            if (discount > 0) {
                SummaryRow("Descuentos", "- ${Format.price(discount)}", color = SuccessGreen)
            }
            SummaryRow(
                "Envío",
                if (shipping == 0.0) "Gratis" else Format.price(shipping),
                color = if (shipping == 0.0) PriceGreen else MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(6.dp))
            Row {
                Text(
                    "Total",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                    modifier = Modifier.weight(1f)
                )
                Text(
                    Format.price(total),
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black)
                )
            }
            Text(
                Format.installments(total),
                style = MaterialTheme.typography.labelMedium,
                color = PriceGreen
            )
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String, color: Color = MaterialTheme.colorScheme.onSurface) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold), color = color)
    }
}

@Composable
private fun ConfirmActionBar(
    total: Double,
    processing: Boolean,
    onPlaceOrder: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 12.dp),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 18.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text("Total a pagar", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    Format.price(total),
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black)
                )
            }
            Surface(
                modifier = Modifier
                    .height(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable(enabled = !processing) { onPlaceOrder() },
                color = PClinkCyan,
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier
                        .padding(horizontal = 22.dp)
                        .fillMaxHeight(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (processing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(
                            "Procesando...",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
                        )
                    } else {
                        Text(
                            "Pagar ahora",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
                        )
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Color.White)
                    }
                }
            }
        }
    }
}
