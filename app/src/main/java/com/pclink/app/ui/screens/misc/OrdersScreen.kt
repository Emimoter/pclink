package com.pclink.app.ui.screens.misc

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.pclink.app.domain.model.Order
import com.pclink.app.domain.model.OrderStatus
import com.pclink.app.ui.components.SimpleTopBar
import com.pclink.app.ui.screens.profile.ProfileViewModel
import com.pclink.app.ui.theme.PClinkBorder
import com.pclink.app.ui.theme.PClinkCyan
import com.pclink.app.ui.theme.SuccessGreen
import com.pclink.app.ui.theme.WarningAmber
import com.pclink.app.ui.util.Format
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun OrdersScreen(
    onBack: () -> Unit,
    contentPadding: PaddingValues = PaddingValues(),
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val orders by viewModel.orders.collectAsState()
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        SimpleTopBar(title = "Mis Pedidos", onBackClick = onBack)
        if (orders.isEmpty()) {
            Empty()
        } else {
            LazyColumn(
                contentPadding = PaddingValues(
                    start = 16.dp, end = 16.dp, top = 8.dp,
                    bottom = 24.dp + contentPadding.calculateBottomPadding()
                ),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(orders, key = { it.id }) { order ->
                    OrderRow(order)
                }
            }
        }
    }
}

@Composable
private fun OrderRow(order: Order) {
    val date = SimpleDateFormat("dd MMM yyyy", Locale("es", "AR")).format(Date(order.date))
    val statusColor = when (order.status) {
        OrderStatus.DELIVERED -> SuccessGreen
        OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT -> PClinkCyan
        OrderStatus.PENDING, OrderStatus.PREPARING -> WarningAmber
        OrderStatus.CANCELLED -> MaterialTheme.colorScheme.error
        OrderStatus.PAID -> PClinkCyan
    }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, PClinkBorder)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(color = PClinkCyan.copy(alpha = 0.14f), shape = RoundedCornerShape(10.dp)) {
                    Icon(
                        Icons.Outlined.Inventory2,
                        null,
                        tint = PClinkCyan,
                        modifier = Modifier
                            .padding(8.dp)
                            .size(20.dp)
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        order.number,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold)
                    )
                    Text(
                        "$date · ${order.items.sumOf { it.quantity }} productos",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Surface(
                    color = statusColor.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        order.status.label,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                        color = statusColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
            Row {
                Text(
                    "Total",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    Format.price(order.total),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black)
                )
            }
            if (order.tracking != null) {
                Text(
                    "Tracking: ${order.tracking}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            OrderTrackingTimeline(order)
        }
    }
}

@Composable
private fun OrderTrackingTimeline(order: Order) {
    val paidTime = order.statusHistory["PAID"] ?: order.date
    val inTransitTime = order.statusHistory["IN_TRANSIT"] ?: order.statusHistory["SHIPPED"]
    val deliveredTime = order.statusHistory["DELIVERED"]

    val isPaid = true
    val isInTransit = order.status == OrderStatus.IN_TRANSIT || order.status == OrderStatus.SHIPPED || order.status == OrderStatus.DELIVERED
    val isDelivered = order.status == OrderStatus.DELIVERED

    val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("es", "AR"))

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 16.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(
            text = "Seguimiento del Pedido",
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Hito 1: Pagado
        TimelineStep(
            title = "Pagado",
            subtitle = sdf.format(Date(paidTime)),
            isCompleted = isPaid,
            isLast = false
        )

        // Hito 2: En reparto
        TimelineStep(
            title = "En reparto",
            subtitle = inTransitTime?.let { sdf.format(Date(it)) } ?: if (isInTransit) "En tránsito" else "Pendiente",
            isCompleted = isInTransit,
            isLast = false
        )

        // Hito 3: Recibido
        TimelineStep(
            title = "Recibido",
            subtitle = deliveredTime?.let { sdf.format(Date(it)) } ?: if (isDelivered) "Recibido" else "Pendiente",
            isCompleted = isDelivered,
            isLast = true
        )
    }
}

@Composable
private fun TimelineStep(
    title: String,
    subtitle: String,
    isCompleted: Boolean,
    isLast: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(24.dp)
        ) {
            // Círculo
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(
                        color = if (isCompleted) PClinkCyan else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                        shape = CircleShape
                    )
            )
            // Línea
            if (!isLast) {
                Spacer(
                    modifier = Modifier
                        .width(2.dp)
                        .height(28.dp)
                        .background(
                            color = if (isCompleted) PClinkCyan.copy(alpha = 0.5f) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.15f)
                        )
                )
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.padding(bottom = if (isLast) 0.dp else 12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                color = if (isCompleted) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = if (isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
            )
        }
    }
}

@Composable
private fun Empty() {
    Column(
        Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            color = PClinkCyan.copy(alpha = 0.12f),
            shape = CircleShape,
            modifier = Modifier.size(110.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Receipt, null, tint = PClinkCyan, modifier = Modifier.size(50.dp))
            }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            "Aún no realizaste ningún pedido",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(6.dp))
        Text(
            "Cuando hagas una compra, vas a ver el detalle acá.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}
