package com.pclink.app.ui.screens.home

import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pclink.app.domain.model.Banner
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.domain.model.Product
import com.pclink.app.ui.components.CompactProductCard
import com.pclink.app.ui.components.ProductCard
import com.pclink.app.ui.components.SectionHeader
import com.pclink.app.ui.components.ShimmerCategoryChips
import com.pclink.app.ui.components.ShimmerHorizontalRow
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.PClinkSurface
import com.pclink.app.ui.theme.SaleRed
import kotlinx.coroutines.delay

@Composable
fun HomeScreen(
    state: HomeUiState,
    favoriteIds: Set<String>,
    onSearchClick: () -> Unit,
    onCategoryClick: (CategoryId) -> Unit,
    onProductClick: (Product) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onAddToCart: (String) -> Unit,
    onSeeAllOffers: () -> Unit,
    onSeeAllNew: () -> Unit,
    onSeeAllBestSellers: () -> Unit,
    contentPadding: PaddingValues = PaddingValues()
) {
    val scroll = rememberScrollState()
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scroll)
            .padding(top = 8.dp, bottom = 96.dp + contentPadding.calculateBottomPadding())
    ) {
        // ==== Banner carousel ====
        if (state.isLoading) {
            BannerSkeleton()
        } else {
            BannerCarousel(
                banners = state.banners,
                onBannerClick = { banner ->
                    banner.targetCategory?.let(onCategoryClick)
                }
            )
        }

        Spacer(Modifier.height(20.dp))

        // ==== Categories ====
        SectionHeader(title = "Categorías", subtitle = "Encontrá lo que buscás")
        Spacer(Modifier.height(10.dp))
        if (state.isLoading) {
            ShimmerCategoryChips()
        } else {
            CategoryRow(state.categories, onCategoryClick)
        }

        Spacer(Modifier.height(24.dp))

        // ==== Flash deals ====
        SectionHeader(
            title = "Ofertas Flash",
            subtitle = "Descuentos por tiempo limitado",
            actionLabel = "Ver todo",
            onActionClick = onSeeAllOffers
        )
        Spacer(Modifier.height(8.dp))
        if (state.isLoading) {
            ShimmerHorizontalRow()
        } else {
            FlashDealsRow(
                products = state.flashDeals,
                favoriteIds = favoriteIds,
                onProductClick = onProductClick,
                onToggleFavorite = onToggleFavorite,
                onAddToCart = onAddToCart
            )
        }

        Spacer(Modifier.height(24.dp))

        // ==== Recommendations ====
        SectionHeader(
            title = "Recomendados para vos",
            subtitle = "Te puede interesar"
        )
        Spacer(Modifier.height(8.dp))
        if (state.isLoading) {
            ShimmerHorizontalRow()
        } else {
            CompactProductRow(
                products = state.recommendations,
                favoriteIds = favoriteIds,
                onProductClick = onProductClick,
                onToggleFavorite = onToggleFavorite
            )
        }

        Spacer(Modifier.height(24.dp))

        // ==== Featured ====
        SectionHeader(
            title = "Productos destacados",
            subtitle = "Lo mejor de PClink"
        )
        Spacer(Modifier.height(8.dp))
        if (state.isLoading) {
            ShimmerHorizontalRow()
        } else {
            FeaturedFullCardRow(
                products = state.featured,
                favoriteIds = favoriteIds,
                onProductClick = onProductClick,
                onToggleFavorite = onToggleFavorite,
                onAddToCart = onAddToCart
            )
        }

        Spacer(Modifier.height(24.dp))

        // ==== New arrivals ====
        SectionHeader(
            title = "Nuevos ingresos",
            subtitle = "Recién llegados al stock",
            actionLabel = "Ver todo",
            onActionClick = onSeeAllNew
        )
        Spacer(Modifier.height(8.dp))
        if (state.isLoading) {
            ShimmerHorizontalRow()
        } else {
            CompactProductRow(
                products = state.newArrivals,
                favoriteIds = favoriteIds,
                onProductClick = onProductClick,
                onToggleFavorite = onToggleFavorite
            )
        }

        Spacer(Modifier.height(24.dp))

        // ==== Curated row (isBestSeller) ====
        SectionHeader(
            title = "Selección PClink",
            subtitle = "Productos elegidos por nuestro equipo",
            actionLabel = "Ver todo",
            onActionClick = onSeeAllBestSellers
        )
        Spacer(Modifier.height(8.dp))
        if (state.isLoading) {
            ShimmerHorizontalRow()
        } else {
            CompactProductRow(
                products = state.bestSellers,
                favoriteIds = favoriteIds,
                onProductClick = onProductClick,
                onToggleFavorite = onToggleFavorite
            )
        }

        Spacer(Modifier.height(40.dp))
    }
}

@Composable
private fun BannerSkeleton() {
    com.pclink.app.ui.components.ShimmerBox(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(170.dp)
            .clip(RoundedCornerShape(20.dp))
    )
}

@Composable
private fun BannerCarousel(
    banners: List<Banner>,
    onBannerClick: (Banner) -> Unit
) {
    if (banners.isEmpty()) return
    val pagerState = rememberPagerState(pageCount = { banners.size })
    LaunchedEffect(banners) {
        while (true) {
            delay(4500)
            val next = (pagerState.currentPage + 1) % banners.size
            pagerState.animateScrollToPage(next, animationSpec = tween(700, easing = LinearOutSlowInEasing))
        }
    }
    Column {
        HorizontalPager(
            state = pagerState,
            contentPadding = PaddingValues(horizontal = 16.dp),
            pageSpacing = 12.dp,
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
        ) { index ->
            BannerCard(banner = banners[index], onClick = { onBannerClick(banners[index]) })
        }
        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(banners.size) { i ->
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
private fun BannerCard(banner: Banner, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        color = banner.gradientStart
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(listOf(banner.gradientStart, banner.gradientEnd))
                )
        ) {
            if (banner.imageUrl != null) {
                AsyncImage(
                    model = banner.imageUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }
            // Dark overlay for readability
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = if (banner.imageUrl != null) 0.35f else 0f))
            )
            // Decorative circles (only when no image)
            if (banner.imageUrl == null) {
                Box(
                    Modifier
                        .padding(end = 8.dp)
                        .align(Alignment.CenterEnd)
                        .size(180.dp)
                        .clip(CircleShape)
                        .background(banner.accentColor.copy(alpha = 0.15f))
                )
                Box(
                    Modifier
                        .align(Alignment.CenterEnd)
                        .padding(end = 30.dp)
                        .size(110.dp)
                        .clip(CircleShape)
                        .background(banner.accentColor.copy(alpha = 0.25f))
                )
            }

            Column(
                Modifier
                    .padding(20.dp)
                    .fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                if (banner.badge != null) {
                    Surface(
                        color = banner.accentColor.copy(alpha = 0.18f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Icon(
                                Icons.Outlined.Bolt,
                                contentDescription = null,
                                tint = banner.accentColor,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text(
                                banner.badge,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                                color = banner.accentColor
                            )
                        }
                    }
                }
                Column {
                    Text(
                        banner.title,
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        banner.subtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }
                Surface(
                    color = banner.accentColor,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        banner.ctaLabel,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun CategoryRow(
    categories: List<CategoryId>,
    onCategoryClick: (CategoryId) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(categories) { cat ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .width(86.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .clickable { onCategoryClick(cat) }
                    .padding(8.dp)
            ) {
                Surface(
                    modifier = Modifier.size(58.dp),
                    color = PClinkSurface,
                    shape = RoundedCornerShape(18.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            cat.icon,
                            contentDescription = cat.displayName,
                            tint = PClinkCyan,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    cat.displayName,
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
private fun FlashDealsRow(
    products: List<Product>,
    favoriteIds: Set<String>,
    onProductClick: (Product) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onAddToCart: (String) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        items(products) { product ->
            Box(Modifier.width(170.dp)) {
                ProductCard(
                    product = product,
                    isFavorite = product.id in favoriteIds,
                    onClick = { onProductClick(product) },
                    onToggleFavorite = { onToggleFavorite(product.id) },
                    onAddToCart = { onAddToCart(product.id) },
                    showAddToCart = false,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun FeaturedFullCardRow(
    products: List<Product>,
    favoriteIds: Set<String>,
    onProductClick: (Product) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onAddToCart: (String) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(products) { product ->
            ProductCard(
                product = product,
                isFavorite = product.id in favoriteIds,
                onClick = { onProductClick(product) },
                onToggleFavorite = { onToggleFavorite(product.id) },
                onAddToCart = { onAddToCart(product.id) },
                modifier = Modifier.width(220.dp)
            )
        }
    }
}

@Composable
private fun CompactProductRow(
    products: List<Product>,
    favoriteIds: Set<String>,
    onProductClick: (Product) -> Unit,
    onToggleFavorite: (String) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(products) { product ->
            CompactProductCard(
                product = product,
                isFavorite = product.id in favoriteIds,
                onClick = { onProductClick(product) },
                onToggleFavorite = { onToggleFavorite(product.id) }
            )
        }
    }
}
