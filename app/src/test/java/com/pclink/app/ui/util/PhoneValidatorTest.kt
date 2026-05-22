package com.pclink.app.ui.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneValidatorTest {

    @Test
    fun isValidArgentinePhone_withValidFormats_returnsTrue() {
        // Formatos básicos (10 dígitos)
        assertTrue(PhoneValidator.isValidArgentinePhone("1134567890")) // Buenos Aires fijos/móviles sin prefijos
        assertTrue(PhoneValidator.isValidArgentinePhone("3514567890")) // Córdoba sin prefijos
        assertTrue(PhoneValidator.isValidArgentinePhone("2614567890")) // Mendoza sin prefijos
        assertTrue(PhoneValidator.isValidArgentinePhone("2944567890")) // Bariloche sin prefijos

        // Con prefijo interurbano '0'
        assertTrue(PhoneValidator.isValidArgentinePhone("01134567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("03514567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("02944567890"))

        // Con código de país '54' o '+54'
        assertTrue(PhoneValidator.isValidArgentinePhone("541134567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("+541134567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("+54 11 3456 7890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("00541134567890"))

        // Con prefijo internacional de celulares '9'
        assertTrue(PhoneValidator.isValidArgentinePhone("+54 9 11 3456 7890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("5493514567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("91134567890"))

        // Con prefijo local de celulares '15'
        assertTrue(PhoneValidator.isValidArgentinePhone("111534567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("351154567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("294415567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("0111534567890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("0351 15 456 7890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("+54 11 15 3456 7890"))

        // Con prefijos redundantes/combinados (+54 + 9 + 15)
        assertTrue(PhoneValidator.isValidArgentinePhone("+54 9 11 15 3456 7890"))
        assertTrue(PhoneValidator.isValidArgentinePhone("54 9 351 15 456 7890"))
    }

    @Test
    fun isValidArgentinePhone_withInvalidFormats_returnsFalse() {
        // Nulos y vacíos
        assertFalse(PhoneValidator.isValidArgentinePhone(null))
        assertFalse(PhoneValidator.isValidArgentinePhone(""))
        assertFalse(PhoneValidator.isValidArgentinePhone("   "))

        // Números demasiado cortos o largos
        assertFalse(PhoneValidator.isValidArgentinePhone("123"))
        assertFalse(PhoneValidator.isValidArgentinePhone("11123456")) // 8 dígitos (solo número local, falta característica)
        assertFalse(PhoneValidator.isValidArgentinePhone("11123456789012345")) // Más de 15 dígitos

        // Características inválidas (no comienzan con 1, 2 o 3 en Argentina)
        assertFalse(PhoneValidator.isValidArgentinePhone("4113456789"))
        assertFalse(PhoneValidator.isValidArgentinePhone("5113456789"))
        assertFalse(PhoneValidator.isValidArgentinePhone("8113456789"))

        // Caracteres no numéricos sin números
        assertFalse(PhoneValidator.isValidArgentinePhone("abcdefghij"))
        assertFalse(PhoneValidator.isValidArgentinePhone("++--  --"))
    }

    @Test
    fun getDisplayPhone_stripsCountryCodeCorrectly() {
        assertEquals("11 3456 7890", PhoneValidator.getDisplayPhone("+54 11 3456 7890"))
        assertEquals("9 11 3456 7890", PhoneValidator.getDisplayPhone("+54 9 11 3456 7890"))
        assertEquals("351 456 7890", PhoneValidator.getDisplayPhone("0054 351 456 7890"))
        assertEquals("261 456 7890", PhoneValidator.getDisplayPhone("54 261 456 7890"))
        assertEquals("1134567890", PhoneValidator.getDisplayPhone("1134567890"))
        assertEquals("", PhoneValidator.getDisplayPhone(null))
        assertEquals("", PhoneValidator.getDisplayPhone(""))
    }

    @Test
    fun formatToArgentineDb_prependsCountryCodeCorrectly() {
        assertEquals("+54 11 3456 7890", PhoneValidator.formatToArgentineDb("11 3456 7890"))
        assertEquals("+54 9 11 3456 7890", PhoneValidator.formatToArgentineDb("+54 9 11 3456 7890"))
        assertEquals("+54 351 456 7890", PhoneValidator.formatToArgentineDb("54 351 456 7890"))
        assertEquals("+54 261 456 7890", PhoneValidator.formatToArgentineDb("0054 261 456 7890"))
        assertEquals("", PhoneValidator.formatToArgentineDb(""))
    }
}
