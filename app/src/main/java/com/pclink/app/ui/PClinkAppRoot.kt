package com.pclink.app.ui

import android.os.Bundle
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.ContentTransform
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.pclink.app.domain.model.CategoryId
import com.pclink.app.navigation.DeepLink
import com.pclink.app.ui.components.PClinkHomeTopBar
import com.pclink.app.ui.navigation.BottomTab
import com.pclink.app.ui.navigation.PClinkBottomBar
import com.pclink.app.ui.navigation.PClinkNavGraph
import com.pclink.app.ui.navigation.Routes
import com.pclink.app.ui.screens.home.HomeViewModel
import com.pclink.app.ui.screens.splash.SplashScreen
import kotlinx.coroutines.delay

@Composable
fun PClinkAppRoot(
    pendingDeepLink: MutableState<Bundle?> = remember { mutableStateOf(null) }
) {
    // Splash: observe the HomeViewModel loading state
    val homeVm: HomeViewModel = hiltViewModel()
    val homeState by homeVm.state.collectAsState()
    var splashDone by remember { mutableStateOf(false) }

    AnimatedContent(
        targetState = splashDone,
        transitionSpec = {
            ContentTransform(
                targetContentEnter = fadeIn(tween(600)),
                initialContentExit = fadeOut(tween(600))
            )
        },
        label = "splash_to_app"
    ) { showApp ->
        if (!showApp) {
            SplashScreen(
                isLoading = homeState.isLoading,
                onFinished = { splashDone = true }
            )
        } else {
            AppShell(pendingDeepLink = pendingDeepLink)
        }
    }
}

@Composable
private fun AppShell(
    pendingDeepLink: MutableState<Bundle?>
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    val shellVm: AppShellViewModel = hiltViewModel()
    val cartCount by shellVm.cartCount.collectAsState()
    val unreadCount by shellVm.unreadCount.collectAsState()

    val showBottomBar = currentRoute in BOTTOM_BAR_ROUTES || currentRoute == Routes.CATEGORY_PRODUCTS
    val showHomeTopBar = currentRoute == Routes.HOME

    val deepLinkBundle by pendingDeepLink
    LaunchedEffect(deepLinkBundle) {
        val b = deepLinkBundle ?: return@LaunchedEffect
        delay(280)
        when (b.getString(DeepLink.EXTRA_KIND)) {
            DeepLink.KIND_OFFERS -> {
                navController.navigate(Routes.categoryProducts(CategoryId.OFFERS.name)) {
                    launchSingleTop = true
                }
            }
            DeepLink.KIND_PRODUCT -> {
                val id = b.getString(DeepLink.EXTRA_PRODUCT_ID).orEmpty()
                if (id.isNotEmpty()) {
                    navController.navigate(Routes.productDetail(id)) {
                        launchSingleTop = true
                    }
                }
            }
        }
        pendingDeepLink.value = null
    }

    Scaffold(
        topBar = {
            AnimatedVisibility(
                visible = showHomeTopBar,
                enter = fadeIn() + slideInVertically(),
                exit = fadeOut() + slideOutVertically()
            ) {
                PClinkHomeTopBar(
                    cartCount = cartCount,
                    unreadCount = unreadCount,
                    onSearchClick = { navController.navigate(Routes.SEARCH) },
                    onCartClick = { navController.navigate(Routes.CART) },
                    onNotificationsClick = { navController.navigate(Routes.NOTIFICATIONS) },
                    onProfileClick = { navController.navigate(Routes.PROFILE) }
                )
            }
        },
        bottomBar = {
            AnimatedVisibility(
                visible = showBottomBar,
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it })
            ) {
                PClinkBottomBar(
                    currentRoute = currentRoute,
                    cartCount = cartCount,
                    onTabClick = { tab ->
                        navController.navigate(tab.route) {
                            popUpTo(Routes.HOME) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(top = padding.calculateTopPadding())
        ) {
            PClinkNavGraph(
                navController = navController,
                contentPadding = PaddingValues(bottom = padding.calculateBottomPadding())
            )
        }
    }
}

private val BOTTOM_BAR_ROUTES = setOf(
    Routes.HOME,
    Routes.CATEGORIES,
    Routes.WISHLIST,
    Routes.CART,
    Routes.PROFILE
)
