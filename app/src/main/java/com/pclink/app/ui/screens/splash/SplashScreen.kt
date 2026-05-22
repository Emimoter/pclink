package com.pclink.app.ui.screens.splash

import androidx.compose.foundation.Image
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pclink.app.R
import com.pclink.app.ui.theme.PClinkCyan
import kotlinx.coroutines.delay

private val SplashBackground = Color(0xFF0A0F14)

@Composable
fun SplashScreen(isLoading: Boolean, onFinished: () -> Unit) {
    var logoVisible by remember { mutableStateOf(false) }
    var taglineVisible by remember { mutableStateOf(false) }
    var progressVisible by remember { mutableStateOf(false) }

    val logoAlpha by animateFloatAsState(
        targetValue = if (logoVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "logoAlpha"
    )
    val logoScale by animateFloatAsState(
        targetValue = if (logoVisible) 1f else 0.7f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "logoScale"
    )
    val taglineAlpha by animateFloatAsState(
        targetValue = if (taglineVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing),
        label = "taglineAlpha"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "glow")

    // Glow pulsante detrás del logo
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.20f,
        targetValue = 0.50f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )
    val glowScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowScale"
    )

    // Shimmer de la barra de progreso (0..1 en loop)
    val shimmerProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1300, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerProgress"
    )

    LaunchedEffect(Unit) {
        delay(80)
        logoVisible = true
        delay(450)
        taglineVisible = true
        delay(300)
        progressVisible = true
    }

    LaunchedEffect(isLoading, progressVisible) {
        if (!isLoading && progressVisible) {
            delay(600)
            onFinished()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SplashBackground),
        contentAlignment = Alignment.Center
    ) {
        // Halo de fondo detrás del logo
        Box(
            modifier = Modifier
                .size(340.dp)
                .graphicsLayer {
                    scaleX = glowScale
                    scaleY = glowScale
                    alpha = glowAlpha
                }
                .background(
                    Brush.radialGradient(
                        0.0f to PClinkCyan.copy(alpha = 0.35f),
                        0.5f to PClinkCyan.copy(alpha = 0.12f),
                        1.0f to Color.Transparent
                    ),
                    shape = CircleShape
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            Spacer(Modifier.weight(1f))

            // Logo de marca PClink (el mismo que usa la app)
            Image(
                painter = painterResource(id = R.drawable.ic_pclink_brand),
                contentDescription = "PClink",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(160.dp)
                    .graphicsLayer {
                        alpha = logoAlpha
                        scaleX = logoScale
                        scaleY = logoScale
                    }
                    .clip(CircleShape)
            )

            Spacer(Modifier.height(24.dp))

            // Tagline
            Text(
                text = "Tu tienda de tecnología",
                color = PClinkCyan.copy(alpha = 0.80f),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                letterSpacing = 1.5.sp,
                modifier = Modifier.graphicsLayer {
                    alpha = taglineAlpha
                }
            )

            Spacer(Modifier.weight(1f))

            // Barra shimmer de carga
            if (progressVisible) {
                ShimmerBar(
                    progressProvider = { shimmerProgress },
                    modifier = Modifier
                        .padding(horizontal = 48.dp)
                        .padding(bottom = 80.dp)
                )
            }
        }
    }
}

@Composable
private fun ShimmerBar(progressProvider: () -> Float, modifier: Modifier = Modifier) {
    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .height(3.dp)
            .clip(RoundedCornerShape(50))
            .background(Color.White.copy(alpha = 0.10f))
    ) {
        val totalWidthPx = constraints.maxWidth.toFloat()
        val shimmerWidthPx = totalWidthPx * 0.40f

        Box(
            modifier = Modifier
                .width(with(LocalDensity.current) { shimmerWidthPx.toDp() })
                .height(3.dp)
                .graphicsLayer {
                    val progress = progressProvider()
                    this.translationX = (progress * (totalWidthPx + shimmerWidthPx)) - shimmerWidthPx
                }
                .clip(RoundedCornerShape(50))
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color.Transparent,
                            PClinkCyan.copy(alpha = 0.7f),
                            PClinkCyan,
                            PClinkCyan.copy(alpha = 0.7f),
                            Color.Transparent
                        )
                    )
                )
        )
    }
}
