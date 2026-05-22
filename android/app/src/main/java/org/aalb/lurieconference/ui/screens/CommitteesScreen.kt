package org.aalb.lurieconference.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.aalb.lurieconference.App
import org.aalb.lurieconference.api.CommitteeMembership

@Composable
fun CommitteesScreen(app: App, modifier: Modifier = Modifier) {
    var memberships by remember { mutableStateOf<List<CommitteeMembership>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) {
        try { memberships = app.auth.api.committees() }
        catch (e: Throwable) { error = e.message }
        finally { loading = false }
    }
    Column(modifier.padding(16.dp)) {
        Text("Committees", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(12.dp))
        when {
            loading -> CircularProgressIndicator()
            error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
            memberships.isEmpty() -> Text("Not on any committees yet.")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(memberships) { m ->
                    Column {
                        Text(m.committee.name, style = MaterialTheme.typography.titleMedium)
                        Text(m.role.replaceFirstChar { it.uppercase() },
                             style = MaterialTheme.typography.bodySmall,
                             color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}
