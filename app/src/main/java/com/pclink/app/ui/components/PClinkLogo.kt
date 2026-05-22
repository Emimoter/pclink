package com.pclink.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.pclink.app.R

/**
 * PClink brand logo mark using the real PNG asset.
 */
@Composable
fun PClinkLogoMark(
    modifier: Modifier = Modifier,
    size: Int = 36,
    bgColor: Color = Color.Transparent,
    fgColor: Color = Color.White
) {
    Image(
        painter = painterResource(R.drawable.ic_pclink_brand),
        contentDescription = "PClink",
        contentScale = ContentScale.Fit,
        modifier = modifier.size(size.dp)
    )
}

/**
 * Full PClink wordmark: just the logo image at a larger size.
 * Using the real brand PNG provided by the user.
 */
@Composable
fun PClinkWordmark(
    modifier: Modifier = Modifier,
    height: Dp = 40.dp,
    onSurface: Color = Color.Unspecified
) {
    Image(
        painter = painterResource(R.drawable.ic_pclink_brand),
        contentDescription = "PClink",
        contentScale = ContentScale.Fit,
        modifier = modifier.size(height)
    )
}
