package org.aalb.lurieconference.push

import android.content.Context
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.aalb.lurieconference.App
import org.aalb.lurieconference.api.DeviceRegister
import java.util.Locale
import java.util.TimeZone

object PushRegistrar {
    fun registerCurrentToken(context: Context) {
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token ->
                val app = context.applicationContext as App
                app.auth.tokenStore.fcmToken = token
                if (app.auth.tokenStore.token == null) return@addOnSuccessListener
                CoroutineScope(Dispatchers.IO).launch {
                    runCatching {
                        val info = context.packageManager.getPackageInfo(context.packageName, 0)
                        app.auth.api.registerDevice(
                            DeviceRegister(
                                pushToken = token,
                                deviceName = android.os.Build.MODEL ?: "Android",
                                appVersion = info.versionName ?: "1.0",
                                locale = Locale.getDefault().toLanguageTag(),
                                timezone = TimeZone.getDefault().id,
                            )
                        )
                    }
                }
            }
    }
}
