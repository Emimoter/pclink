package com.pclink.app.ui.screens.cart

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.pclink.app.domain.model.CartItem
import com.pclink.app.domain.model.CartSummary
import com.pclink.app.domain.model.Coupon
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.theme.PriceGreen
import com.pclink.app.ui.theme.SaleRed
import com.pclink.app.ui.theme.SuccessGreen
import com.pclink.app.ui.util.Format

@Composable
fun CartScreen(
    onBack: () -> Unit,
    onCheckoutClick: () -> Unit,
    onLoginClick: () -> Unit,
    onContinueShopping: () -> Unit,
    onProductClick: (String) -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: CartViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val cart = state.cart
    val event by viewModel.event.collectAsState()
    val availableCoupons by viewModel.availableCoupons.collectAsState()

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(Modifier.fillMaxSize()) {
            SimpleTopBar(
                title = if (cart.isEmpty) "Carrito" else "Carrito (${cart.itemCount})",
                onBackClick = onBack,
                actions = {
                    if (!cart.isEmpty) {
                        Text(
                            "Vaciar",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .padding(end = 12.dp)
                                .clickable { viewModel.clear() }
                        )
                    }
                }
            )

            if (state.isLoading) {
                Box(
                    Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.material3.CircularProgressIndicator(color = PClinkCyan)
                }
            } else if (cart.isEmpty) {
                EmptyCart(onContinueShopping = onContinueShopping)
            } else {
                CartContent(
                    cart = cart,
                    coupons = availableCoupons,
                    onSetQuantity = viewModel::setQuantity,
                    onRemove = viewModel::remove,
                    onProductClick = onProductClick,
                    onApplyCoupon = viewModel::applyCoupon,
                    onRemoveCoupon = viewModel::removeCoupon,
                    onCheckout = {
                        if (state.isLoggedIn) {
                            onCheckoutClick()
                        } else {
                            onLoginClick()
                        }
                    },
                    contentPadding = contentPadding
                )
            }
        }

        AnimatedVisibility(
            visible = event != null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            event?.let {
                LaunchedEffect(it) {
                    kotlinx.coroutines.delay(2000)
                    viewModel.consumeEvent()
                }
                Surface(
                    color = if (it.isError) SaleRed else PClinkBlack,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .padding(bottom = 200.dp + contentPadding.calculateBottomPadding(), start = 24.dp, end = 24.dp)
                ) {
                    Text(
                        it.message,
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyCart(onContinueShopping: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            color = PClinkCyan.copy(alpha = 0.12f),
            shape = CircleShape,
            modifier = Modifier.size(120.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    Icons.Outlined.ShoppingCart,
                    null,
                    tint = PClinkCyan,
                    modifier = Modifier.size(56.dp)
                )
            }
        }
        Spacer(Modifier.height(20.dp))
        Text(
            "Tu carrito está vacío",
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold)
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Agregá productos para empezar a armar tu pedido.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(Modifier.height(24.dp))
        Surface(
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .clickable { onContinueShopping() },
            color = PClinkCyan,
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                "Explorar productos",
                color = Color.White,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 12.dp)
            )
        }
    }
}

@Composable
private fun CartContent(
    cart: CartSummary,
    coupons: List<Coupon>,
    onSetQuantity: (String, Int) -> Unit,
    onRemove: (String) -> Unit,
    onProductClick: (String) -> Unit,
    onApplyCoupon: (String) -> Unit,
    onRemoveCoupon: () -> Unit,
    onCheckout: () -> Unit,
    contentPadding: PaddingValues
) {
    Box(Modifier.fillMaxSize()) {
        LazyColumn(
            contentPadding = PaddingValues(
                start = 16.dp, end = 16.dp, top = 8.dp,
                bottom = 240.dp + contentPadding.calculateBottomPadding()
            ),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(cart.items, key = { it.product.id }) { item ->
                CartRow(
                    item = item,
                    onClick = { onProductClick(item.product.id) },
                    onIncrease = { onSetQuantity(item.product.id, item.quantity + 1) },
                    onDecrease = { onSetQuantity(item.product.id, item.quantity - 1) },
                    onRemove = { onRemove(item.product.id) }
                )
            }
            item {
                Spacer(Modifier.height(4.dp))
                CouponCard(
                    coupon = cart.coupon,
                    suggestions = coupons,
                    onApply = onApplyCoupon,
                    onRemove = onRemoveCoupon
                )
            }
        }

        // Bottom summary
        SummaryBottomBar(
            cart = cart,
            onCheckout = onCheckout,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = contentPadding.calculateBottomPadding())
        )
    }
}

@Composable
private fun CartRow(
    item: CartItem,
    onClick: () -> Unit,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
    onRemove: () -> Unit
) {
    val product = item.product
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, PClinkBorder, RoundedCornerShape(16.dp))
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(modifier = Modifier.padding(12.dp)) {
            Surface(
                modifier = Modifier.size(82.dp),
                color = PClinkSurface,
                shape = RoundedCornerShape(12.dp)
            ) {
                AsyncImage(
                    model = product.images.firstOrNull(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(4.dp)
                        .clip(RoundedCornerShape(10.dp))
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    product.brand.uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                    color = PClinkCyan
                )
                Text(
                    product.name,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        Format.price(product.price),
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
                    )
                    if (product.originalPrice != null && product.originalPrice > product.price) {
                        Spacer(Modifier.width(8.dp))
                        Text(
                            Format.price(product.originalPrice),
                            style = MaterialTheme.typography.labelMedium.copy(textDecoration = TextDecoration.LineThrough),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    QuantityControl(
                        quantity = item.quantity,
                        max = product.stock,
                        onIncrease = onIncrease,
                        onDecrease = onDecrease
                    )
                    Spacer(Modifier.weight(1f))
                    Surface(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .clickable { onRemove() },
                        color = PClinkSurface,
                        shape = CircleShape
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Outlined.DeleteOutline,
                                contentDescription = "Eliminar",
                                tint = SaleRed,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuantityControl(
    quantity: Int,
    max: Int,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder),
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clickable(enabled = quantity > 1) { onDecrease() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.Remove,
                    null,
                    tint = if (quantity > 1) PClinkBlack else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
            }
            Text(
                quantity.toString(),
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
                modifier = Modifier.padding(horizontal = 12.dp)
            )
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clickable(enabled = quantity < max) { onIncrease() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.Add,
                    null,
                    tint = if (quantity < max) PClinkBlack else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun CouponCard(
    coupon: Coupon?,
    suggestions: List<Coupon>,
    onApply: (String) -> Unit,
    onRemove: () -> Unit
) {
    var code by remember { mutableStateOf("") }
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Outlined.LocalOffer,
                    null,
                    tint = PClinkCyan
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "Cupón de descuento",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
                )
            }

            Spacer(Modifier.height(10.dp))
            if (coupon != null) {
                Surface(
                    color = SuccessGreen.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.Check, null, tint = SuccessGreen)
                        Spacer(Modifier.width(8.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                "Cupón ${coupon.code}",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
                            )
                            Text(
                                coupon.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            "Quitar",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                            color = SaleRed,
                            modifier = Modifier.clickable { onRemove() }
                        )
                    }
                }
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = code,
                        onValueChange = { code = it },
                        placeholder = { Text("Ingresá tu cupón") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions.Default
                    )
                    Spacer(Modifier.width(8.dp))
                    Surface(
                        modifier = Modifier
                            .height(54.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                if (code.isNotBlank()) {
                                    onApply(code)
                                    code = ""
                                }
                            },
                        color = PClinkBlack,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                "Aplicar",
                                color = Color.White,
                                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    "Cupones disponibles:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                suggestions.forEach { c ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.LocalFireDepartment,
                            null,
                            tint = PClinkCyan,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "${c.code} · ${c.description}",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            "Aplicar",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = PClinkCyan,
                            modifier = Modifier.clickable { onApply(c.code) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryBottomBar(
    cart: CartSummary,
    onCheckout: () -> Unit,
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
        Column(Modifier.padding(16.dp)) {
            SummaryRow("Subtotal", Format.price(cart.subtotal))
            if (cart.couponDiscount > 0) {
                SummaryRow(
                    "Descuento (cupón)",
                    "- ${Format.price(cart.couponDiscount)}",
                    valueColor = SuccessGreen
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Subtotal",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                    modifier = Modifier.weight(1f)
                )
                Text(
                    Format.price(cart.subtotal - cart.couponDiscount),
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                    color = PClinkBlack
                )
            }
            Spacer(Modifier.height(12.dp))
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onCheckout() },
                color = PClinkCyan,
                shape = RoundedCornerShape(14.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        "Continuar al checkout",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun SummaryRow(
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold), color = valueColor)
    }
}
