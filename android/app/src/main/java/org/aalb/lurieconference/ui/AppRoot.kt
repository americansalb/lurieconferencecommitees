package org.aalb.lurieconference.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import org.aalb.lurieconference.App
import org.aalb.lurieconference.ui.screens.CommitteesScreen
import org.aalb.lurieconference.ui.screens.FeedScreen
import org.aalb.lurieconference.ui.screens.LoginScreen
import org.aalb.lurieconference.ui.screens.NotificationSettingsScreen
import org.aalb.lurieconference.ui.screens.ProfileScreen
import org.aalb.lurieconference.ui.theme.LurieTheme

@Composable
fun AppRoot() {
    val ctx = LocalContext.current
    val app = ctx.applicationContext as App
    val user by app.auth.user.collectAsState()
    LurieTheme {
        if (user == null && app.auth.tokenStore.token == null) {
            LoginScreen(repo = app.auth)
        } else {
            MainScaffold(app)
        }
    }
}

private enum class Tab(val label: String, val icon: @Composable () -> Unit) {
    Feed("Feed", { Icon(Icons.Default.Home, null) }),
    Committees("Committees", { Icon(Icons.Default.Group, null) }),
    Alerts("Alerts", { Icon(Icons.Default.Notifications, null) }),
    Profile("Profile", { Icon(Icons.Default.Person, null) }),
}

@Composable
private fun MainScaffold(app: App) {
    var tab by remember { mutableStateOf(Tab.Feed) }
    Scaffold(
        bottomBar = {
            NavigationBar {
                Tab.values().forEach { t ->
                    NavigationBarItem(
                        selected = tab == t,
                        onClick = { tab = t },
                        icon = { t.icon() },
                        label = { Text(t.label) }
                    )
                }
            }
        }
    ) { padding ->
        when (tab) {
            Tab.Feed -> FeedScreen(app, Modifier.fillMaxSize().padding(padding))
            Tab.Committees -> CommitteesScreen(app, Modifier.fillMaxSize().padding(padding))
            Tab.Alerts -> NotificationSettingsScreen(app, Modifier.fillMaxSize().padding(padding))
            Tab.Profile -> ProfileScreen(app, Modifier.fillMaxSize().padding(padding))
        }
    }
}
