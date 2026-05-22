package com.pclink.app.ui.screens.misc

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Policy
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan

private const val SUPPORT_EMAIL = "emiliano.gimenez.96@gmail.com"
private const val PRIVACY_URL = "https://pclink.com.ar/privacidad"
private const val TERMS_URL = "https://pclink.com.ar/terminos"
private const val DELETE_ACCOUNT_URL = "https://pclink-f6e0d.web.app/delete-account.html"

@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val pushEnabled by viewModel.isPushEnabled.collectAsStateWithLifecycle()
    val context = LocalContext.current

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(title = "Configuración", onBackClick = onBack)
        LazyColumn(
            contentPadding = PaddingValues(
                start = 16.dp, end = 16.dp, top = 8.dp,
                bottom = 24.dp + contentPadding.calculateBottomPadding()
            ),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Notificaciones push
            item {
                ToggleRow(
                    icon = Icons.Outlined.NotificationsActive,
                    title = "Notificaciones push",
                    subtitle = "Ofertas, ingresos y estado del pedido",
                    value = pushEnabled,
                    onChange = { viewModel.setPushEnabled(it) }
                )
            }

            // Privacidad y seguridad
            item {
                NavRow(
                    icon = Icons.Outlined.Security,
                    title = "Privacidad y seguridad",
                    subtitle = "Cuenta, sesiones y datos",
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(PRIVACY_URL))
                        context.startActivity(intent)
                    }
                )
            }

            // Ayuda y soporte — abre email
            item {
                NavRow(
                    icon = Icons.Outlined.HelpOutline,
                    title = "Ayuda y soporte",
                    subtitle = "Contactanos por email",
                    onClick = {
                        val intent = Intent(Intent.ACTION_SENDTO).apply {
                            data = Uri.parse("mailto:$SUPPORT_EMAIL")
                            putExtra(Intent.EXTRA_SUBJECT, "Soporte PClink")
                        }
                        context.startActivity(Intent.createChooser(intent, "Enviar email"))
                    }
                )
            }

            // Términos y condiciones
            item {
                NavRow(
                    icon = Icons.Outlined.Policy,
                    title = "Términos y condiciones",
                    subtitle = "Políticas de uso y privacidad",
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(TERMS_URL))
                        context.startActivity(intent)
                    }
                )
            }

            // Eliminar cuenta
            item {
                NavRow(
                    icon = Icons.Outlined.Security,
                    title = "Eliminar cuenta",
                    subtitle = "Solicitar eliminación de cuenta y datos",
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(DELETE_ACCOUNT_URL))
                        context.startActivity(intent)
                    }
                )
            }
        }
    }

}

@Composable
private fun ToggleRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    value: Boolean,
    onChange: (Boolean) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, PClinkBorder)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = PClinkCyan.copy(alpha = 0.12f),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(icon, null, tint = PClinkCyan, modifier = Modifier.padding(8.dp).size(20.dp))
            }
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold))
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Switch(
                checked = value,
                onCheckedChange = onChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.White,
                    checkedTrackColor = PClinkCyan,
                    uncheckedTrackColor = PClinkBorder
                )
            )
        }
    }
}

@Composable
private fun NavRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, PClinkBorder)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = PClinkCyan.copy(alpha = 0.12f),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(icon, null, tint = PClinkCyan, modifier = Modifier.padding(8.dp).size(20.dp))
            }
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold))
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
