package com.pclink.app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pclink.app.ui.theme.PClinkBlack
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.SaleRed

enum class BottomTab(
    val route: String,
    val label: String,
    val outlined: ImageVector,
    val filled: ImageVector
) {
    Home(Routes.HOME, "Inicio", Icons.Outlined.Home, Icons.Filled.Home),
    Categories(Routes.CATEGORIES, "Categorías", Icons.Outlined.Category, Icons.Filled.Category),
    Wishlist(Routes.WISHLIST, "Favoritos", Icons.Outlined.FavoriteBorder, Icons.Filled.Favorite),
    Cart(Routes.CART, "Carrito", Icons.Outlined.ShoppingCart, Icons.Filled.ShoppingCart),
    Profile(Routes.PROFILE, "Perfil", Icons.Outlined.Person, Icons.Filled.Person)
}

@Composable
fun PClinkBottomBar(
    currentRoute: String?,
    cartCount: Int,
    onTabClick: (BottomTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .shadow(elevation = 18.dp, shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp), clip = false),
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Row(
            modifier = Modifier
                .navigationBarsPadding()
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp)
                .height(56.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomTab.entries.forEach { tab ->
                val selected = currentRoute == tab.route
                BottomTabItem(
                    tab = tab,
                    selected = selected,
                    badge = if (tab == BottomTab.Cart && cartCount > 0) cartCount.toString() else null,
                    onClick = { onTabClick(tab) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun BottomTabItem(
    tab: BottomTab,
    selected: Boolean,
    badge: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .background(if (selected) PClinkCyan.copy(alpha = 0.12f) else Color.Transparent)
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(contentAlignment = Alignment.TopEnd) {
            Icon(
                imageVector = if (selected) tab.filled else tab.outlined,
                contentDescription = tab.label,
                tint = if (selected) PClinkCyan else PClinkBlack,
                modifier = Modifier.size(26.dp)
            )
            if (badge != null) {
                Surface(
                    color = SaleRed,
                    shape = CircleShape
                ) {
                    Text(
                        badge,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                    )
                }
            }
        }
    }
}
