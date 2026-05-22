package org.aalb.lurieconference.push

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.aalb.lurieconference.App
import org.aalb.lurieconference.MainActivity
import org.aalb.lurieconference.R
import java.util.Locale
import java.util.TimeZone
import org.aalb.lurieconference.api.DeviceRegister

class LurieFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        val app = applicationContext as App
        app.auth.tokenStore.fcmToken = token
        if (app.auth.tokenStore.token == null) return
        CoroutineScope(Dispatchers.IO).launch {
            runCatching {
                app.auth.api.registerDevice(
                    DeviceRegister(
                        pushToken = token,
                        deviceName = android.os.Build.MODEL ?: "Android",
                        appVersion = packageManager.getPackageInfo(packageName, 0).versionName ?: "1.0",
                        locale = Locale.getDefault().toLanguageTag(),
                        timezone = TimeZone.getDefault().id,
                    )
                )
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: getString(R.string.app_name)
        val body = message.notification?.body ?: message.data["body"] ?: ""
        showNotification(title, body, message.data)
    }

    private fun showNotification(title: String, body: String, data: Map<String, String>) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            data.forEach { (k, v) -> putExtra(k, v) }
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val channelId = getString(R.string.notification_channel_default)
        val notif = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(System.currentTimeMillis().toInt(), notif)
    }
}
