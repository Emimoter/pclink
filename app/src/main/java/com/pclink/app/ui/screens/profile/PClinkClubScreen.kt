package com.pclink.app.ui.screens.profile

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ConfirmationNumber
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.EmojiEvents
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.pclink.app.domain.model.ClubVoucher
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan

// Maps voucher color strings from Firestore to actual compose colors
private fun voucherColor(color: String): Color = when (color) {
    "emerald" -> Color(0xFF2E7D32)
    "cyan"    -> Color(0xFF0097A7)
    "amber"   -> Color(0xFFE65100)
    "indigo"  -> Color(0xFF3700B3)
    "rose"    -> Color(0xFFC62828)
    else      -> Color(0xFF2E7D32)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PClinkClubScreen(
    onBack: () -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val clubData by viewModel.clubUserData.collectAsState()
    val firestoreVouchers by viewModel.vouchers.collectAsState()
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    // Track whether vouchers are still loading (give Firestore 5 seconds to respond)
    var isVouchersLoading by remember { mutableStateOf(true) }
    LaunchedEffect(firestoreVouchers) {
        if (firestoreVouchers.isNotEmpty()) {
            isVouchersLoading = false
        }
    }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(5000)
        isVouchersLoading = false // stop spinner after 5s regardless
    }

    // Fallback vouchers if Firestore fails or collection is truly empty
    val fallbackVouchers = remember {
        listOf(
            ClubVoucher("v1", 15, 1000, "15% DESCUENTO VOUCHER", "Válido para compras en toda la tienda online de PClink.", "emerald", "CUPÓN CLUB"),
            ClubVoucher("v2", 20, 1800, "20% DESCUENTO VOUCHER", "Cupón especial de nivel Plata y Oro.", "cyan", "PRODUCTOS SELECCIONADOS"),
            ClubVoucher("v3", 25, 2500, "25% DESCUENTO VOUCHER", "¡Nuestra mayor recompensa! Válido en toda tu próxima compra.", "amber", "BENEFICIO EXCLUSIVO")
        )
    }
    val displayVouchers = if (firestoreVouchers.isNotEmpty()) firestoreVouchers else fallbackVouchers

    // netPoints is kept in sync from the ViewModel (it already reflects redeemed coupons)
    var livePoints by remember(clubData.netPoints) { mutableStateOf(clubData.netPoints) }

    LaunchedEffect(clubData.netPoints) {
        livePoints = clubData.netPoints
    }

    var activeTab by remember { mutableStateOf(0) } // 0: Canjear, 1: Niveles
    var selectedVoucherCode by remember { mutableStateOf<String?>(null) }
    var showRedeemDialog by remember { mutableStateOf(false) }
    var lastRedeemedValue by remember { mutableStateOf(0) }

    val computedTier = clubData.tier

    val tierColor = when (computedTier) {
        "Oro"   -> Color(0xFFFFB300)
        "Plata" -> Color(0xFFB0BEC5)
        else    -> Color(0xFFFF7043)
    }
    val tierBgGradient = when (computedTier) {
        "Oro"   -> Brush.verticalGradient(listOf(Color(0xFF2C2512), Color(0xFF14120B)))
        "Plata" -> Brush.verticalGradient(listOf(Color(0xFF20272B), Color(0xFF0F1214)))
        else    -> Brush.verticalGradient(listOf(Color(0xFF2E1C15), Color(0xFF160E0A)))
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(title = "PClink Club", onBackClick = onBack)

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = 16.dp, end = 16.dp, top = 8.dp,
                bottom = 24.dp + contentPadding.calculateBottomPadding()
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Tier Card Header
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.5.dp, tierColor.copy(alpha = 0.4f))
                ) {
                    Box(
                        modifier = Modifier
                            .background(tierBgGradient)
                            .padding(20.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Outlined.Verified,
                                        null,
                                        tint = tierColor,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        "Nivel $computedTier",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Black,
                                            letterSpacing = 1.sp
                                        ),
                                        color = Color.White
                                    )
                                }
                                Text(
                                    "pcClub Member",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White.copy(alpha = 0.5f)
                                )
                            }

                            Spacer(Modifier.height(18.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(54.dp)
                                        .background(Color.White.copy(alpha = 0.08f), CircleShape)
                                        .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Outlined.Star,
                                        null,
                                        tint = tierColor,
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                                Spacer(Modifier.width(14.dp))
                                Column {
                                    Text(
                                        "${livePoints.toLocaleString()} Puntos",
                                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                                        color = Color.White
                                    )
                                    Text(
                                        "para gastar en vouchers",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.White.copy(alpha = 0.7f)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 2. Navigation Tabs
            item {
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color.Transparent,
                    contentColor = PClinkCyan,
                    divider = { HorizontalDivider(color = PClinkBorder) }
                ) {
                    Tab(
                        selected = activeTab == 0,
                        onClick = { activeTab = 0 },
                        text = { Text("Canjear", fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                    )
                    Tab(
                        selected = activeTab == 1,
                        onClick = { activeTab = 1 },
                        text = { Text("Niveles", fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                    )
                }
            }

            if (activeTab == 0) {
                // TAB 0: Vouchers List from Firestore
                item {
                    Text(
                        "Beneficios de Canje Exclusivos",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Black),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                if (isVouchersLoading) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = PClinkCyan, modifier = Modifier.size(32.dp))
                        }
                    }
                } else {
                    items(displayVouchers) { voucher ->
                        val brandColor = voucherColor(voucher.color)
                        val canRedeem = livePoints >= voucher.pointsCost
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, PClinkBorder)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Surface(
                                        color = brandColor.copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            voucher.tag.ifEmpty { "COLECCIÓN PCCLUB" },
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 9.sp
                                            ),
                                            color = brandColor,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        "${voucher.discountPercent}% DE DESCUENTO",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        voucher.description.ifEmpty { "Válido para todo el catálogo" },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Outlined.Star,
                                            null,
                                            tint = brandColor,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(Modifier.width(4.dp))
                                        Text(
                                            "${voucher.pointsCost.toLocaleString()} pts",
                                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                                            color = brandColor
                                        )
                                    }
                                }

                                Button(
                                    onClick = {
                                        if (canRedeem) {
                                            livePoints -= voucher.pointsCost
                                            lastRedeemedValue = voucher.discountPercent
                                            val code = "PCCLUB-${voucher.discountPercent}-${(100000..999999).random()}"
                                            selectedVoucherCode = code
                                            viewModel.saveCoupon(code)
                                            showRedeemDialog = true
                                        } else {
                                            Toast.makeText(context, "Puntos insuficientes", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    enabled = canRedeem,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = brandColor,
                                        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant
                                    ),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        "Canjear",
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 1: Niveles y Reglas
                item {
                    Text(
                        "Reglas de Acumulación por Nivel",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Black),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, PClinkBorder)
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            TierDetailRow("🥉 Bronce", "Inicial ($0)", "Cada $100 = 1.0 punto", Color(0xFFFF7043))
                            HorizontalDivider(color = PClinkBorder)
                            TierDetailRow("🥈 Plata", "5 compras o $250.000 spent", "Cada $100 = 1.1 puntos (Multiplicador 1.1x)", Color(0xFFB0BEC5))
                            HorizontalDivider(color = PClinkBorder)
                            TierDetailRow("🥇 Oro", "10 compras o $500.000 spent", "Cada $100 = 1.2 puntos (Multiplicador 1.2x)", Color(0xFFFFB300))
                        }
                    }
                }

                item {
                    Text(
                        "Preguntas Frecuentes de Canje",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Black),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, PClinkBorder)
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.HelpOutline, null, tint = PClinkCyan, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    "¿Ya usaste tu cupón? ¿Cómo conseguís otro?",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                            Text(
                                "El PClink Club es un sistema acumulativo sin límites. Si ya usaste tu cupón, para conseguir otro solo necesitás acumular los puntos de nuevo.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(Modifier.height(6.dp))

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(PClinkCyan.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                                    .border(1.dp, PClinkCyan.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                                    .padding(12.dp)
                            ) {
                                Column {
                                    Text(
                                        "🎯 Ventaja de tu nivel actual ($computedTier):",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = PClinkCyan
                                    )
                                    Spacer(Modifier.height(4.dp))
                                    val advantageText = when (computedTier) {
                                        "Oro"   -> "Con multiplicador 1.2x, acumulás puntos más rápido. ¡Cada $100 vale 1.2 pts!"
                                        "Plata" -> "Con multiplicador 1.1x, acumulás puntos más rápido que Bronce. ¡Cada $100 vale 1.1 pts!"
                                        else    -> "Subí a Plata u Oro comprando más para acumular hasta un 20% más rápido."
                                    }
                                    Text(
                                        advantageText,
                                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Redemption Voucher Dialog
    if (showRedeemDialog && selectedVoucherCode != null) {
        AlertDialog(
            onDismissRequest = { showRedeemDialog = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        clipboardManager.setText(AnnotatedString(selectedVoucherCode!!))
                        Toast.makeText(context, "Código copiado", Toast.LENGTH_SHORT).show()
                        showRedeemDialog = false
                    }
                ) {
                    Text("Copiar Código", fontWeight = FontWeight.Bold, color = PClinkCyan)
                }
            },
            dismissButton = {
                TextButton(onClick = { showRedeemDialog = false }) {
                    Text("Cerrar", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Outlined.EmojiEvents,
                        null,
                        tint = Color(0xFFFFB300),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("¡Canje Exitoso!", fontWeight = FontWeight.Black)
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "Canjeaste tu cupón de ${lastRedeemedValue}% de descuento. Usalo en el carrito:",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(16.dp))
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, PClinkBorder)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                selectedVoucherCode!!,
                                style = MaterialTheme.typography.bodyLarge.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp
                                ),
                                color = PClinkCyan
                            )
                            Icon(
                                Icons.Outlined.ContentCopy,
                                null,
                                tint = PClinkCyan,
                                modifier = Modifier
                                    .size(18.dp)
                                    .clickable {
                                        clipboardManager.setText(AnnotatedString(selectedVoucherCode!!))
                                        Toast.makeText(context, "Código copiado", Toast.LENGTH_SHORT).show()
                                    }
                            )
                        }
                    }
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
private fun TierDetailRow(
    title: String,
    requirement: String,
    rule: String,
    color: Color
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                title,
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Black),
                color = color
            )
            Text(
                requirement,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            rule,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun Int.toLocaleString(): String {
    return String.format("%,d", this).replace(',', '.')
}
