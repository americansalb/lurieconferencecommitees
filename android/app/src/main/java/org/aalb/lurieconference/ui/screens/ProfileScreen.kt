package org.aalb.lurieconference.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.aalb.lurieconference.App

@Composable
fun ProfileScreen(app: App, modifier: Modifier = Modifier) {
    val user by app.auth.user.collectAsState()
    val scope = rememberCoroutineScope()
    Column(modifier.padding(16.dp)) {
        Text("Profile", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(12.dp))
        user?.let { u ->
            Text("Name: ${u.name}")
            Text("Email: ${u.email}")
            Text("Role: ${u.role.replaceFirstChar { it.uppercase() }}")
            Text("Timezone: ${u.timezone}")
        }
        Spacer(Modifier.height(24.dp))
        Button(onClick = { scope.launch { app.auth.signOut() } }) {
            Text("Sign out")
        }
    }
}
