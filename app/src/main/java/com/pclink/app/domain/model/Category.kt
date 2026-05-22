package com.pclink.app.domain.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Cable
import androidx.compose.material.icons.outlined.Headphones
import androidx.compose.material.icons.outlined.Keyboard
import androidx.compose.material.icons.outlined.Laptop
import androidx.compose.material.icons.outlined.Memory
import androidx.compose.material.icons.outlined.Mouse
import androidx.compose.material.icons.outlined.Power
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Router
import androidx.compose.material.icons.outlined.SdStorage
import androidx.compose.material.icons.outlined.SettingsInputComponent
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.InvertColors
import androidx.compose.material.icons.outlined.Monitor
import androidx.compose.material.icons.outlined.DeveloperBoard
import androidx.compose.material.icons.outlined.Dns
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.ui.graphics.vector.ImageVector

enum class CategoryId(
    val displayName: String,
    val icon: ImageVector
) {
    GPU("Placas de Video", Icons.Outlined.DeveloperBoard),
    CPU("Microprocesadores", Icons.Outlined.Memory),
    MOTHERBOARD("Motherboards", Icons.Outlined.SettingsInputComponent),
    RAM("Memorias RAM", Icons.Outlined.Dns),
    CASE("Gabinetes", Icons.Outlined.SdStorage),
    PSU("Fuentes de Poder", Icons.Outlined.Power),
    MONITOR("Monitores", Icons.Outlined.Monitor),
    MOUSE("Mouse", Icons.Outlined.Mouse),
    KEYBOARD("Teclados", Icons.Outlined.Keyboard),
    HEADPHONES("Auriculares", Icons.Outlined.Headphones),
    PRINTER("Impresoras", Icons.Outlined.Print),
    CABLES("Cables y Adaptadores", Icons.Outlined.Cable),
    STORAGE("Almacenamiento", Icons.Outlined.SdStorage),
    COOLING("Refrigeración", Icons.Outlined.AcUnit),
    NOTEBOOK("Notebooks", Icons.Outlined.Laptop),
    GAMING("Accesorios Gaming", Icons.Outlined.SportsEsports),
    NETWORK("Redes / Routers", Icons.Outlined.Router),
    INK_TONER("Cartuchos y Tóners", Icons.Outlined.InvertColors),
    OFFERS("Ofertas", Icons.Outlined.Bolt);

    companion object {
        fun shopCategories(): List<CategoryId> = entries.filter { it != OFFERS }
    }
}
