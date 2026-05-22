package com.pclink.app



import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

import androidx.activity.ComponentActivity

import androidx.activity.compose.setContent

import androidx.activity.enableEdgeToEdge

import androidx.compose.runtime.mutableStateOf

import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.getValue
import com.pclink.app.ui.PClinkAppRoot
import com.pclink.app.ui.theme.PClinkTheme

import dagger.hilt.android.AndroidEntryPoint



@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @javax.inject.Inject
    lateinit var settingsRepository: com.pclink.app.data.repository.SettingsRepository



    /**

     * Holds notification / deep-link extras for Compose to consume once the

     * NavHost is ready. Cleared after handling.

     */

    val pendingDeepLink = mutableStateOf<Bundle?>(null)





    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        // Si concede, Firebase enviará notificaciones
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {

        installSplashScreen()

        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        pendingDeepLink.value = intent?.extras

        askNotificationPermission()

        setContent {
            val darkMode by settingsRepository.isDarkMode.collectAsStateWithLifecycle(initialValue = false)
            PClinkTheme(darkTheme = darkMode) {
                PClinkAppRoot(pendingDeepLink = pendingDeepLink)
            }
        }

    }



    override fun onNewIntent(intent: Intent) {

        super.onNewIntent(intent)

        setIntent(intent)

        pendingDeepLink.value = intent.extras

    }

}

