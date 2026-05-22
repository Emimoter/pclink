package com.pclink.app.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.pclink.app.ui.screens.addresses.AddAddressScreen
import com.pclink.app.ui.screens.addresses.AddressesScreen
import com.pclink.app.ui.screens.auth.LoginScreen
import com.pclink.app.ui.screens.cart.CartScreen
import com.pclink.app.ui.screens.categories.CategoriesScreen
import com.pclink.app.ui.screens.categoryproducts.CategoryProductsScreen
import com.pclink.app.ui.screens.checkout.CheckoutScreen
import com.pclink.app.ui.screens.checkout.OrderConfirmationScreen

import com.pclink.app.ui.screens.home.HomeScreen
import com.pclink.app.ui.screens.home.HomeViewModel
import com.pclink.app.ui.screens.misc.NotificationsScreen
import com.pclink.app.ui.screens.misc.OrdersScreen
import com.pclink.app.ui.screens.misc.PaymentsScreen
import com.pclink.app.ui.screens.misc.SettingsScreen
import com.pclink.app.ui.screens.product.ProductDetailScreen
import com.pclink.app.ui.screens.profile.PClinkClubScreen
import com.pclink.app.ui.screens.profile.ProfileScreen
import com.pclink.app.ui.screens.search.SearchScreen
import com.pclink.app.ui.screens.wishlist.WishlistScreen

@Composable
fun PClinkNavGraph(
    navController: NavHostController,
    contentPadding: PaddingValues = PaddingValues(),
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Routes.HOME,
        modifier = modifier,
        enterTransition = { fadeIn(tween(220)) },
        exitTransition = { fadeOut(tween(220)) },
        popEnterTransition = { fadeIn(tween(220)) },
        popExitTransition = { fadeOut(tween(220)) }
    ) {
        composable(Routes.HOME) {
            val vm: HomeViewModel = hiltViewModel()
            val state by vm.state.collectAsState()
            val favIds by vm.favoriteIds.collectAsState()
            HomeScreen(
                state = state,
                favoriteIds = favIds,
                onSearchClick = { navController.navigate(Routes.SEARCH) },
                onCategoryClick = { id -> navController.navigate(Routes.categoryProducts(id.name)) },
                onProductClick = { p -> navController.navigate(Routes.productDetail(p.id)) },
                onToggleFavorite = vm::toggleFavorite,
                onAddToCart = vm::addToCart,
                onSeeAllOffers = { navController.navigate(Routes.categoryProducts(com.pclink.app.domain.model.CategoryId.OFFERS.name)) },
                onSeeAllNew = { navController.navigate(Routes.categoryProducts(com.pclink.app.domain.model.CategoryId.GPU.name)) },
                onSeeAllBestSellers = { navController.navigate(Routes.categoryProducts(com.pclink.app.domain.model.CategoryId.GPU.name)) },
                contentPadding = contentPadding
            )
        }

        composable(Routes.CATEGORIES) {
            CategoriesScreen(
                onCategoryClick = { id -> navController.navigate(Routes.categoryProducts(id.name)) },
                contentPadding = contentPadding
            )
        }

        composable(Routes.WISHLIST) {
            WishlistScreen(
                onProductClick = { p -> navController.navigate(Routes.productDetail(p.id)) },
                onContinueShopping = { navController.navigate(Routes.HOME) { popUpTo(Routes.HOME) { inclusive = false } } },
                contentPadding = contentPadding
            )
        }

        composable(Routes.CART) {
            CartScreen(
                onBack = { navController.popBackStack() },
                onCheckoutClick = { navController.navigate(Routes.CHECKOUT) },
                onLoginClick = { navController.navigate(Routes.LOGIN) },
                onContinueShopping = { navController.navigate(Routes.HOME) { popUpTo(Routes.HOME) { inclusive = false } } },
                onProductClick = { id -> navController.navigate(Routes.productDetail(id)) },
                contentPadding = contentPadding
            )
        }

        composable(Routes.PROFILE) {
            ProfileScreen(
                onLoginClick = { navController.navigate(Routes.LOGIN) },
                onOrdersClick = { navController.navigate(Routes.ORDERS) },
                onAddressesClick = { navController.navigate(Routes.ADDRESSES) },
                onSettingsClick = { navController.navigate(Routes.SETTINGS) },
                onEditAddress = { id -> navController.navigate(Routes.addAddress(id)) },
                onClubClick = { navController.navigate(Routes.PCCLUB) },
                contentPadding = contentPadding
            )
        }

        composable(Routes.SEARCH) {
            SearchScreen(
                onBack = { navController.popBackStack() },
                onProductClick = { p -> navController.navigate(Routes.productDetail(p.id)) },
                contentPadding = contentPadding
            )
        }

        composable(
            route = Routes.PRODUCT_DETAIL,
            arguments = listOf(navArgument("productId") { type = NavType.StringType })
        ) {
            ProductDetailScreen(
                onBack = { navController.popBackStack() },
                onProductClick = { p ->
                    navController.navigate(Routes.productDetail(p.id))
                },
                onCartClick = { navController.navigate(Routes.CART) },
                onCheckoutClick = { navController.navigate(Routes.CHECKOUT) },
                onLoginClick = { navController.navigate(Routes.LOGIN) },
                contentPadding = contentPadding
            )
        }

        composable(
            route = Routes.CATEGORY_PRODUCTS,
            arguments = listOf(navArgument("categoryId") { type = NavType.StringType })
        ) {
            CategoryProductsScreen(
                onBack = { navController.popBackStack() },
                onProductClick = { p -> navController.navigate(Routes.productDetail(p.id)) },
                contentPadding = contentPadding
            )
        }

        composable(Routes.CHECKOUT) {
            CheckoutScreen(
                onBack = { navController.popBackStack() },
                onOrderPlaced = { id ->
                    navController.navigate(Routes.orderConfirmation(id)) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                onAddAddress = {
                    navController.navigate(Routes.addAddress("new"))
                },
                onEditAddress = { id ->
                    navController.navigate(Routes.addAddress(id))
                },
                contentPadding = contentPadding
            )
        }

        composable(
            route = Routes.ORDER_CONFIRMATION,
            arguments = listOf(navArgument("orderId") { type = NavType.StringType })
        ) { entry ->
            val orderId = entry.arguments?.getString("orderId").orEmpty()
            OrderConfirmationScreen(
                orderId = orderId,
                onContinue = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                onTrackOrder = {
                    navController.navigate(Routes.ORDERS) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                contentPadding = contentPadding
            )
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                onBack = { navController.popBackStack() },
                onLoggedIn = { navController.popBackStack() }
            )
        }

        composable(Routes.ADDRESSES) {
            AddressesScreen(
                onBack = { navController.popBackStack() },
                onAddAddress = { navController.navigate(Routes.addAddress("new")) },
                onEditAddress = { id -> navController.navigate(Routes.addAddress(id)) }
            )
        }

        composable(
            Routes.ADD_ADDRESS,
            arguments = listOf(navArgument("addressId") { type = NavType.StringType })
        ) {
            AddAddressScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.ORDERS) {
            OrdersScreen(onBack = { navController.popBackStack() }, contentPadding = contentPadding)
        }

        composable(Routes.PAYMENTS) {
            PaymentsScreen(onBack = { navController.popBackStack() }, contentPadding = contentPadding)
        }

        composable(Routes.NOTIFICATIONS) {
            NotificationsScreen(onBack = { navController.popBackStack() }, contentPadding = contentPadding)
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(onBack = { navController.popBackStack() }, contentPadding = contentPadding)
        }

        composable(Routes.PCCLUB) {
            PClinkClubScreen(onBack = { navController.popBackStack() }, contentPadding = contentPadding)
        }




    }
}
