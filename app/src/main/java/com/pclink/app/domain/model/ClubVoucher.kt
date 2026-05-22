package com.pclink.app.domain.model

data class ClubVoucher(
    val id: String = "",
    val discountPercent: Int = 0,
    val pointsCost: Int = 0,
    val title: String = "",
    val description: String = "",
    val color: String = "emerald",
    val tag: String = ""
)
