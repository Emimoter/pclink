package com.pclink.app.ui.util

import java.text.NumberFormat
import java.util.Locale

object Format {
    private val arsFormatter: NumberFormat = NumberFormat.getInstance(Locale("es", "AR")).apply {
        maximumFractionDigits = 0
    }

    fun price(value: Double, currency: String = "ARS"): String {
        val symbol = when (currency.uppercase()) {
            "ARS" -> "$"
            "USD" -> "U\$D "
            else -> ""
        }
        return "$symbol${arsFormatter.format(value)}"
    }

    fun installments(price: Double, months: Int = 12): String {
        return ""
    }
}
