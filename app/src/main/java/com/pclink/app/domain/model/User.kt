package com.pclink.app.domain.model

data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String? = null,
    val phone: String? = null,
    val addresses: List<Address> = emptyList(),
    val paymentMethods: List<PaymentMethod> = emptyList(),
    val memberSince: Long = System.currentTimeMillis(),
    val tier: MembershipTier = MembershipTier.STANDARD
)

enum class MembershipTier(val label: String) {
    STANDARD("Standard"),
    PREMIUM("Premium"),
    GAMER("Gamer Elite")
}

data class Address(
    val id: String,
    val label: String,
    val recipient: String,
    val phone: String = "",
    val street: String,
    val number: String,
    val apartment: String? = null,
    val city: String,
    val state: String,
    val zip: String,
    val country: String,
    val isDefault: Boolean = false
)

data class PaymentMethod(
    val id: String,
    val type: PaymentType,
    val brand: String,
    val last4: String,
    val expiry: String? = null,
    val isDefault: Boolean = false
)

enum class PaymentType { CREDIT, DEBIT, MERCADO_PAGO, PAYPAL, STRIPE, BANK_TRANSFER }
