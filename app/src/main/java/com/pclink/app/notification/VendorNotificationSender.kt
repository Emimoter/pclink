package com.pclink.app.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.pclink.app.MainActivity
import com.pclink.app.R
import com.pclink.app.navigation.DeepLink
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VendorNotificationSender @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val channelId = "pclink_vendor"

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            channelId,
            "PClink · Avisos para clientes",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply { description = "Promos enviadas desde el panel de vendedores" }
        mgr.createNotificationChannel(channel)
    }

    private fun baseIntent(): Intent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }

    fun showFlashSale(body: String) {
        ensureChannel()
        val intent = baseIntent().apply {
            putExtra(DeepLink.EXTRA_KIND, DeepLink.KIND_OFFERS)
            putExtra(DeepLink.EXTRA_NOTIFICATION_BODY, body)
        }
        val pending = PendingIntent.getActivity(
            context,
            REQUEST_FLASH,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle("Flash Sale activa")
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pending)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID_FLASH, notification)
    }

    fun showNewArrival(productId: String, productName: String, teaser: String) {
        ensureChannel()
        val intent = baseIntent().apply {
            putExtra(DeepLink.EXTRA_KIND, DeepLink.KIND_PRODUCT)
            putExtra(DeepLink.EXTRA_PRODUCT_ID, productId)
            putExtra(DeepLink.EXTRA_NOTIFICATION_BODY, teaser)
        }
        val pending = PendingIntent.getActivity(
            context,
            REQUEST_PRODUCT + productId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle("Nuevos ingresos")
            .setContentText(teaser.ifBlank { "$productName ya está en PClink" })
            .setStyle(NotificationCompat.BigTextStyle().bigText(teaser.ifBlank { "$productName ya está en PClink" }))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pending)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID_NEW + productId.hashCode() and 0xFFFF, notification)
    }

    companion object {
        private const val REQUEST_FLASH = 8811
        private const val REQUEST_PRODUCT = 8820
        private const val NOTIFICATION_ID_FLASH = 57001
        private const val NOTIFICATION_ID_NEW = 57100
    }
}
