package com.pclink.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.pclink.app.data.repository.OrderRepository
import com.pclink.app.data.repository.UserRepository
import com.pclink.app.data.repository.SettingsRepository
import com.pclink.app.data.repository.VoucherRepository
import com.pclink.app.domain.model.Order
import com.pclink.app.domain.model.User
import com.pclink.app.domain.model.ClubVoucher
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.combine

data class ClubUserData(
    val tier: String = "Bronce",
    val basePoints: Int = 800,
    val netPoints: Int = 800
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val orderRepository: OrderRepository,
    private val addressRepository: com.pclink.app.data.repository.AddressRepository,
    private val settingsRepository: SettingsRepository,
    private val voucherRepository: VoucherRepository
) : ViewModel() {

    val user: StateFlow<User> = userRepository.user
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UserRepository.GUEST)

    val orders: StateFlow<List<Order>> = orderRepository.orders
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val savedAddressesCount: StateFlow<Int> = addressRepository.observeAddresses()
        .map { it.size }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    val defaultAddressPhone: StateFlow<String?> = addressRepository.observeAddresses()
        .map { list ->
            list.firstOrNull { it.isDefault }?.phone
                ?: list.firstOrNull()?.phone
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val defaultAddressId: StateFlow<String?> = addressRepository.observeAddresses()
        .map { list ->
            list.firstOrNull { it.isDefault }?.id
                ?: list.firstOrNull()?.id
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val savedCoupons: StateFlow<Set<String>> = settingsRepository.savedCoupons
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptySet())

    val vouchers: StateFlow<List<ClubVoucher>> = voucherRepository.observeVouchers()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val clubUserData: StateFlow<ClubUserData> =
        combine(orderRepository.orders, settingsRepository.savedCoupons) { orders, coupons ->
            val totalSpent = orders.sumOf { it.total.toDouble() }
            val ordersCount = orders.size

            val tier = when {
                ordersCount >= 10 || totalSpent >= 500000 -> "Oro"
                ordersCount >= 5 || totalSpent >= 250000 -> "Plata"
                else -> "Bronce"
            }
            val multiplier = when (tier) {
                "Oro" -> 1.2
                "Plata" -> 1.1
                else -> 1.0
            }
            val basePoints = ((totalSpent / 100.0) * multiplier + 800).toInt()

            // Deduct points spent on redeemed coupons from local saved coupons
            val redeemedCost = coupons.sumOf { code ->
                val match = Regex("^PCCLUB-(\\d+)-\\d+$").find(code)
                val discount = match?.groupValues?.get(1)?.toIntOrNull() ?: 0
                when (discount) {
                    10 -> 1000L
                    15 -> 1000L
                    20 -> 1800L
                    25 -> 2500L
                    else -> 0L
                }
            }.toInt()
            val netPoints = maxOf(0, basePoints - redeemedCost)
            ClubUserData(tier = tier, basePoints = basePoints, netPoints = netPoints)
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ClubUserData())

    fun saveCoupon(code: String) {
        viewModelScope.launch {
            settingsRepository.addSavedCoupon(code)
        }
    }

    fun signOut() = userRepository.signOut()

    suspend fun signInWithGoogle(idToken: String) = userRepository.signInWithGoogleToken(idToken)

    suspend fun signIn(email: String, password: String) = userRepository.signIn(email, password)

    suspend fun register(name: String, email: String, password: String) =
        userRepository.register(name, email, password)

    val isLoggedIn: Boolean get() = userRepository.isLoggedIn
}
