package com.pclink.app.domain.model

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb

data class Banner(
    val id: String,
    val title: String,
    val subtitle: String,
    val ctaLabel: String,
    val accentColorHex: String,
    val gradientStartHex: String,
    val gradientEndHex: String,
    val targetCategory: CategoryId? = null,
    val targetProductId: String? = null,
    val badge: String? = null,
    val imageUrl: String? = null,
    val active: Boolean = true,
    val order: Int = 0
) {
    val accentColor: Color get() = parseHex(accentColorHex)
    val gradientStart: Color get() = parseHex(gradientStartHex)
    val gradientEnd: Color get() = parseHex(gradientEndHex)

    companion object {
        fun parseHex(hex: String): Color {
            return try {
                val clean = hex.removePrefix("#")
                val longHex = when (clean.length) {
                    6 -> "FF$clean"
                    8 -> clean
                    else -> return Color.Gray
                }
                Color(longHex.toLong(16))
            } catch (_: Exception) {
                Color.Gray
            }
        }
    }
}
