package com.pclink.app.domain.model

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

data class AppNotification(
    val id: String,
    val title: String,
    val body: String,
    val type: String,
    val iconName: String? = null,
    val toneHex: String? = null,
    val targetCategory: String? = null,
    val targetProductId: String? = null,
    val createdAt: Long = 0L,
    val read: Boolean = false
)
