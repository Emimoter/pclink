package com.pclink.app.fcm

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.pclink.app.BuildConfig

class PClinkFCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "FCM token: $token")
        }
        saveToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val data = message.data
        val title = data["title"] ?: message.notification?.title ?: "PClink"
        val body = data["body"] ?: message.notification?.body ?: ""
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Push recibido: $title - $body")
        }
    }

    private fun saveToken(token: String) {
        val uid = try {
            com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: "anonymous"
        } catch (_: Exception) { "anonymous" }
        FirebaseFirestore.getInstance().collection("fcm_tokens").document("${uid}_android").set(
            mapOf(
                "token" to token,
                "userId" to uid,
                "platform" to "android",
                "updatedAt" to System.currentTimeMillis()
            )
        )
    }

    companion object {
        private const val TAG = "PClinkFCM"
    }
}
