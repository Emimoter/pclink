package com.pclink.app.ui.screens.product

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.outlined.AddShoppingCart
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Memory
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.res.painterResource
import coil.compose.AsyncImage
import com.pclink.app.domain.model.Product
import com.pclink.app.domain.model.Spec
import com.pclink.app.ui.components.CompactProductCard
import com.pclink.app.ui.components.SectionHeader
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.theme.PriceGreen
import com.pclink.app.ui.theme.SaleRed
import com.pclink.app.ui.theme.SuccessGreen
import com.pclink.app.ui.util.Format

@Composable
fun ProductDetailScreen(
    onBack: () -> Unit,
    onProductClick: (Product) -> Unit,
    onCartClick: () -> Unit,
    onCheckoutClick: () -> Unit,
    onLoginClick: () -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: ProductDetailViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val favoriteIds by viewModel.favoriteIds.collectAsState()
    val product = state.product

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        if (state.isLoading) {
            Box(
                Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = PClinkCyan)
            }
            return@Box
        }

        if (product == null) {
            Column(
                Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "Producto no encontrado",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            return@Box
        }

        val isFav = product.id in favoriteIds

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 110.dp + contentPadding.calculateBottomPadding())
        ) {
            ImageGallery(
                images = product.images,
                discountPercent = product.discountPercent,
                onBack = onBack,
                onShare = { /* hook for share intent */ },
                onCart = onCartClick,
                isFavorite = isFav,
                onToggleFavorite = viewModel::toggleFavorite
            )

            Column(Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        product.brand.uppercase(),
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                        color = PClinkCyan
                    )
                    Spacer(Modifier.width(8.dp))
                    Surface(
                        color = PClinkSurface,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            product.model,
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    product.name,
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold)
                )

                Spacer(Modifier.height(18.dp))
                if (product.originalPrice != null && product.originalPrice > product.price) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            Format.price(product.originalPrice),
                            style = MaterialTheme.typography.titleSmall.copy(textDecoration = TextDecoration.LineThrough),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.width(8.dp))
                        Surface(color = SaleRed, shape = RoundedCornerShape(6.dp)) {
                            Text(
                                "-${product.discountPercent}%",
                                color = Color.White,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                if (product.price <= 0) {
                    Text(
                        "Precio a consultar",
                        style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Black),
                        color = PClinkCyan
                    )
                } else {
                    Text(
                        Format.price(product.price),
                        style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.Black)
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        Format.installments(product.price),
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = PriceGreen
                    )
                }

                if (product.freeShipping) {
                    Spacer(Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.LocalShipping, null, tint = PriceGreen, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            "Envío gratis a todo el país",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = PriceGreen
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
                StockBadge(stock = product.stock)

                Spacer(Modifier.height(20.dp))
                if (product.price > 0) {
                    QuantitySelector(
                        quantity = state.quantity,
                        max = product.stock,
                        onChange = viewModel::setQuantity
                    )
                }

                Spacer(Modifier.height(28.dp))
                SectionHeader(
                    title = "Descripción",
                    modifier = Modifier.padding(horizontal = 0.dp)
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    product.description,
                    style = MaterialTheme.typography.bodyMedium.copy(lineHeight = 22.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (product.specs.isNotEmpty()) {
                    Spacer(Modifier.height(20.dp))
                    SectionHeader(title = "Especificaciones técnicas", modifier = Modifier.padding(horizontal = 0.dp))
                    Spacer(Modifier.height(8.dp))
                    SpecsTable(product.specs)
                }

            }

            if (state.related.isNotEmpty()) {
                SectionHeader(title = "Productos relacionados")
                Spacer(Modifier.height(8.dp))
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.related) { related ->
                        CompactProductCard(
                            product = related,
                            isFavorite = related.id in favoriteIds,
                            onClick = { onProductClick(related) },
                            onToggleFavorite = { /* requires another VM action - simplified */ }
                        )
                    }
                }
                Spacer(Modifier.height(20.dp))
            }
        }

        // Bottom action bar
        val context = androidx.compose.ui.platform.LocalContext.current
        BuyActionBar(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = contentPadding.calculateBottomPadding()),
            onAddToCart = {
                viewModel.addToCart()
                onCartClick()
            },
            onBuyNow = {
                viewModel.addToCart()
                if (state.isLoggedIn) {
                    onCheckoutClick()
                } else {
                    onLoginClick()
                }
            },
            isAdded = state.isAdded,
            price = product.price,
            onConsultWhatsApp = {
                val messageText = if (product.price <= 0) {
                    "Hola PC Link, estoy interesado en el producto \"${product.name}\" (código: ${product.id}). ¿Cuál es el precio y disponibilidad?"
                } else {
                    "Hola PC Link, estoy interesado en el producto \"${product.name}\" (Precio: ${Format.price(product.price)}). ¿Tienen stock disponible?"
                }
                val text = java.net.URLEncoder.encode(messageText, "UTF-8")
                val intent = android.content.Intent(
                    android.content.Intent.ACTION_VIEW,
                    android.net.Uri.parse("https://wa.me/5492235468972?text=$text")
                )
                context.startActivity(intent)
            }
        )
    }
}

@Composable
private fun ImageGallery(
    images: List<String>,
    discountPercent: Int,
    isFavorite: Boolean,
    onBack: () -> Unit,
    onShare: () -> Unit,
    onCart: () -> Unit,
    onToggleFavorite: () -> Unit
) {
    val pagerState = rememberPagerState(pageCount = { images.size })
    Box {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .background(
                    Brush.verticalGradient(
                        listOf(PClinkSurface, MaterialTheme.colorScheme.surface)
                    )
                )
        ) { idx ->
            AsyncImage(
                model = images.getOrNull(idx),
                contentDescription = null,
                placeholder = painterResource(com.pclink.app.R.drawable.brand_p_mark),
                error = painterResource(com.pclink.app.R.drawable.brand_p_mark),
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
                    .clip(RoundedCornerShape(20.dp))
            )
        }

        // Top actions
        Row(
            modifier = Modifier
                .statusBarsPadding()
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CircleIcon(icon = Icons.AutoMirrored.Filled.ArrowBack, onClick = onBack)
            Spacer(Modifier.weight(1f))
            CircleIcon(icon = Icons.Outlined.Share, onClick = onShare)
            Spacer(Modifier.width(8.dp))
            CircleIcon(
                icon = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                tint = if (isFavorite) SaleRed else PClinkBlack,
                onClick = onToggleFavorite
            )
            Spacer(Modifier.width(8.dp))
            CircleIcon(icon = Icons.Outlined.AddShoppingCart, onClick = onCart)
        }

        if (discountPercent > 0) {
            Surface(
                modifier = Modifier
                    .padding(top = 60.dp, start = 20.dp)
                    .align(Alignment.TopStart),
                color = SaleRed,
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    "-$discountPercent% OFF",
                    color = Color.White,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }

        // Page indicators
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(images.size) { i ->
                val active = i == pagerState.currentPage
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .size(width = if (active) 22.dp else 8.dp, height = 8.dp)
                        .clip(CircleShape)
                        .background(if (active) PClinkCyan else PClinkBorder)
                )
            }
        }
    }
}

@Composable
private fun CircleIcon(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    tint: Color = PClinkBlack,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
        shape = CircleShape,
        shadowElevation = 2.dp
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun StockBadge(stock: Int) {
    val (label, color, icon) = when {
        stock <= 0 -> Triple("Sin stock", SaleRed, Icons.Outlined.Memory)
        stock <= 5 -> Triple("Últimas $stock unidades", PClinkCyan, Icons.Outlined.Verified)
        else -> Triple("Stock disponible · $stock unidades", SuccessGreen, Icons.Outlined.Verified)
    }
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                label,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                color = color
            )
        }
    }
}

@Composable
private fun QuantitySelector(
    quantity: Int,
    max: Int,
    onChange: (Int) -> Unit
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            "Cantidad",
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
            modifier = Modifier.weight(1f)
        )
        Surface(
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder),
            color = MaterialTheme.colorScheme.surface
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconBtn(icon = Icons.Filled.Remove, enabled = quantity > 1) { onChange(quantity - 1) }
                Text(
                    quantity.toString(),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                )
                IconBtn(icon = Icons.Filled.Add, enabled = quantity < max) { onChange(quantity + 1) }
            }
        }
    }
}

@Composable
private fun IconBtn(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            icon,
            null,
            tint = if (enabled) PClinkBlack else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
private fun SpecsTable(specs: List<Spec>) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder),
        color = MaterialTheme.colorScheme.surface
    ) {
        Column {
            specs.forEachIndexed { index, spec ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (index % 2 == 0) PClinkSurface else MaterialTheme.colorScheme.surface)
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        spec.label,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(0.45f)
                    )
                    Text(
                        spec.value,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                        modifier = Modifier.weight(0.55f)
                    )
                }
            }
        }
    }
}

@Composable
private fun BuyActionBar(
    onAddToCart: () -> Unit,
    onBuyNow: () -> Unit,
    isAdded: Boolean,
    price: Double,
    onConsultWhatsApp: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 12.dp),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 16.dp
    ) {
        if (price <= 0) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
                    .padding(10.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onConsultWhatsApp() },
                color = PriceGreen,
                shape = RoundedCornerShape(14.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        "Consultar precio por WhatsApp",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                }
            }
        } else {
            Row(
                modifier = Modifier
                    .padding(10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .height(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { if (!isAdded) onAddToCart() }
                    .border(
                        1.5.dp, 
                        if (isAdded) SuccessGreen else PClinkBlack, 
                        RoundedCornerShape(14.dp)
                    ),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        if (isAdded) Icons.Filled.Check else Icons.Outlined.AddShoppingCart, 
                        null, 
                        modifier = Modifier.size(18.dp),
                        tint = if (isAdded) SuccessGreen else PClinkBlack
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        if (isAdded) "¡Agregado! ✅" else "Agregar",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = if (isAdded) SuccessGreen else PClinkBlack
                    )
                }
            }
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .height(54.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onBuyNow() },
                color = PClinkCyan,
                shape = RoundedCornerShape(14.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        "Comprar ahora",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                }
            }
            }
        }
    }
}
