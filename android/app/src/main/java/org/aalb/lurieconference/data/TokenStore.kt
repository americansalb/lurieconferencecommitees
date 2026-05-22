package org.aalb.lurieconference.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenStore(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "lurie_session",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().run {
            if (value == null) remove(KEY_TOKEN) else putString(KEY_TOKEN, value)
            apply()
        }

    var userJson: String?
        get() = prefs.getString(KEY_USER, null)
        set(value) = prefs.edit().run {
            if (value == null) remove(KEY_USER) else putString(KEY_USER, value)
            apply()
        }

    var fcmToken: String?
        get() = prefs.getString(KEY_FCM, null)
        set(value) = prefs.edit().run {
            if (value == null) remove(KEY_FCM) else putString(KEY_FCM, value)
            apply()
        }

    companion object {
        private const val KEY_TOKEN = "bearer"
        private const val KEY_USER = "user"
        private const val KEY_FCM = "fcm"
    }
}
