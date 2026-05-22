package org.aalb.lurieconference.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Teal = Color(0xFF0E5566)
private val TealDark = Color(0xFF0A3F4D)
private val Blue = Color(0xFF0066B3)

private val LightColors = lightColorScheme(
    primary = Teal,
    onPrimary = Color.White,
    secondary = Blue,
    onSecondary = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = Teal,
    onPrimary = Color.White,
    secondary = Blue,
    onSecondary = Color.White,
    background = Color(0xFF0B1220),
    onBackground = Color(0xFFE6EAF2),
    surface = Color(0xFF111827),
    onSurface = Color(0xFFE6EAF2),
)

@Composable
fun LurieTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
