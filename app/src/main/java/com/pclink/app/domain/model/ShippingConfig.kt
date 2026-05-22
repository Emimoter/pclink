package com.pclink.app.domain.model

data class ShippingConfig(
    val standard: Double = 4500.0,
    val express: Double = 8500.0,
    val pickup: Double = 0.0,
    val freeThreshold: Double = 80000.0
)
