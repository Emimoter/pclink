package com.pclink.app.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    companion object {
        val DARK_MODE_KEY = booleanPreferencesKey("dark_mode")
        val PUSH_ENABLED_KEY = booleanPreferencesKey("push_enabled")
        val SAVED_COUPONS_KEY = stringSetPreferencesKey("saved_coupons")
    }

    val isDarkMode: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[DARK_MODE_KEY] ?: false
    }

    val isPushEnabled: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[PUSH_ENABLED_KEY] ?: true
    }

    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[DARK_MODE_KEY] = enabled
        }
    }

    suspend fun setPushEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PUSH_ENABLED_KEY] = enabled
        }
    }

    val savedCoupons: Flow<Set<String>> = dataStore.data.map { preferences ->
        preferences[SAVED_COUPONS_KEY] ?: emptySet()
    }

    suspend fun addSavedCoupon(couponCode: String) {
        dataStore.edit { preferences ->
            val current = preferences[SAVED_COUPONS_KEY] ?: emptySet()
            preferences[SAVED_COUPONS_KEY] = current + couponCode
        }
    }
}
