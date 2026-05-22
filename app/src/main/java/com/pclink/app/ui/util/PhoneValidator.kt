package com.pclink.app.ui.util

object PhoneValidator {
    /**
     * Valida si un número de teléfono pertenece a un formato válido de Argentina.
     */
    fun isValidArgentinePhone(phone: String?): Boolean {
        if (phone.isNullOrBlank()) return false
        
        // 1. Nos quedamos solo con los dígitos
        val digits = phone.filter { it.isDigit() }
        
        // 2. Quitamos el código de país si está presente (54, 0054)
        var national = when {
            digits.startsWith("0054") -> digits.substring(4)
            digits.startsWith("54") -> digits.substring(2)
            else -> digits
        }
        
        // 3. Quitamos el prefijo '9' de celular internacional si está presente.
        if (national.startsWith("9") && (national.length == 11 || national.length == 13)) {
            national = national.substring(1)
        }
        
        // 4. Quitamos el prefijo de acceso interurbano '0' si está presente (ej: 011, 0351, 02944)
        if (national.startsWith("0")) {
            national = national.substring(1)
        }
        
        // 5. Quitamos el prefijo local de celular '15' si está presente.
        if (national.length == 12) {
            national = when {
                national.startsWith("1115") -> {
                    national.substring(0, 2) + national.substring(4)
                }
                national.length >= 5 && national.substring(3, 5) == "15" -> {
                    national.substring(0, 3) + national.substring(5)
                }
                national.length >= 6 && national.substring(4, 6) == "15" -> {
                    national.substring(0, 4) + national.substring(6)
                }
                else -> national
            }
        }
        
        // 6. Validación final:
        if (national.length != 10) return false
        
        val firstChar = national[0]
        return firstChar == '1' || firstChar == '2' || firstChar == '3'
    }

    /**
     * Devuelve el número de teléfono limpio de códigos de país para ser editado
     * por el usuario, ya que el prefijo "+54" se mostrará visualmente delante del campo.
     */
    fun getDisplayPhone(phone: String?): String {
        if (phone.isNullOrBlank()) return ""
        val trimmed = phone.trim()
        val digits = trimmed.filter { it.isDigit() }
        
        return when {
            trimmed.startsWith("+54") -> trimmed.substring(3).trim()
            trimmed.startsWith("0054") -> trimmed.substring(4).trim()
            trimmed.startsWith("54") && digits.startsWith("54") && digits.length >= 10 -> {
                trimmed.substring(2).trim()
            }
            else -> trimmed
        }
    }

    /**
     * Formatea el número de teléfono asegurando que comience con "+54" al ser guardado en la base de datos.
     */
    fun formatToArgentineDb(phone: String): String {
        val trimmed = phone.trim()
        if (trimmed.isBlank()) return ""
        
        // Quitamos cualquier prefijo de país existente para no duplicar
        val withoutCountry = getDisplayPhone(trimmed)
        return "+54 $withoutCountry"
    }
}
