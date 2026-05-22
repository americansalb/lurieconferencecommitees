package org.aalb.lurieconference

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import org.aalb.lurieconference.data.AuthRepository
import org.aalb.lurieconference.data.TokenStore

class App : Application() {
    lateinit var auth: AuthRepository

    override fun onCreate() {
        super.onCreate()
        instance = this
        auth = AuthRepository(TokenStore(this))
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = getString(R.string.notification_channel_default_name)
            val description = getString(R.string.notification_channel_default_description)
            val channel = NotificationChannel(
                getString(R.string.notification_channel_default),
                name,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                this.description = description
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        lateinit var instance: App
            private set
    }
}
