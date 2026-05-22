package com.pclink.app.ui.navigation

object Routes {
    const val HOME = "home"
    const val CATEGORIES = "categories"
    const val WISHLIST = "wishlist"
    const val CART = "cart"
    const val PROFILE = "profile"

    const val SEARCH = "search"
    const val PRODUCT_DETAIL = "product/{productId}"
    fun productDetail(id: String) = "product/$id"
    const val CATEGORY_PRODUCTS = "category/{categoryId}"
    fun categoryProducts(id: String) = "category/$id"

    const val CHECKOUT = "checkout"
    const val ORDER_CONFIRMATION = "order_confirmation/{orderId}"
    fun orderConfirmation(id: String) = "order_confirmation/$id"

    const val LOGIN = "login"
    const val ORDERS = "orders"
    const val ADDRESSES = "addresses"
    const val ADD_ADDRESS = "add_address/{addressId}"
    fun addAddress(id: String = "new") = "add_address/$id"
    const val PAYMENTS = "payments"
    const val NOTIFICATIONS = "notifications"
    const val SETTINGS = "settings"
    const val PCCLUB = "pcclub"

    const val PC_BUILDER = "pc_builder"
    const val COMPARATOR = "comparator"


}
