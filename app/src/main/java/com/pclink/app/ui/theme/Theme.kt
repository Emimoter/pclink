package com.pclink.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val PClinkLightColors = lightColorScheme(
    primary = PClinkCyan,
    onPrimary = Color.White,
    primaryContainer = PClinkCyanLight,
    onPrimaryContainer = PClinkBlack,
    secondary = PClinkBlack,
    onSecondary = Color.White,
    secondaryContainer = PClinkSurfaceVariant,
    onSecondaryContainer = PClinkBlack,
    tertiary = PClinkCyanDeep,
    onTertiary = Color.White,
    background = Color.White,
    onBackground = PClinkBlack,
    surface = Color.White,
    onSurface = PClinkBlack,
    surfaceVariant = PClinkSurfaceVariant,
    onSurfaceVariant = PClinkMutedText,
    surfaceTint = PClinkCyan,
    outline = PClinkBorder,
    outlineVariant = PClinkBorder,
    error = ErrorRed,
    onError = Color.White
)

private val PClinkDarkColors = darkColorScheme(
    primary = PClinkCyan,
    onPrimary = PClinkBlack,
    primaryContainer = PClinkCyanDeep,
    onPrimaryContainer = Color.White,
    secondary = PClinkCyanLight,
    onSecondary = PClinkBlack,
    secondaryContainer = DarkSurfaceElevated,
    onSecondaryContainer = Color.White,
    tertiary = PClinkCyanLight,
    onTertiary = PClinkBlack,
    background = DarkBg,
    onBackground = Color.White,
    surface = DarkSurface,
    onSurface = Color.White,
    surfaceVariant = DarkSurfaceElevated,
    onSurfaceVariant = DarkMutedText,
    surfaceTint = PClinkCyan,
    outline = DarkBorder,
    outlineVariant = DarkBorder,
    error = ErrorRed,
    onError = Color.White
)

@Composable
fun PClinkTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) PClinkDarkColors else PClinkLightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = PClinkTypography,
        shapes = PClinkShapes,
        content = content
    )
}
