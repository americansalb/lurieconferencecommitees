package org.aalb.lurieconference.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.aalb.lurieconference.App
import org.aalb.lurieconference.api.DeviceItem
import org.aalb.lurieconference.api.NotificationSettings
import org.aalb.lurieconference.push.PushRegistrar
import androidx.compose.ui.platform.LocalContext

private val LEAD_OPTIONS = listOf(
    "5 min" to 5,
    "15 min" to 15,
    "30 min" to 30,
    "1 hr" to 60,
    "2 hr" to 120,
    "1 day" to 1440,
    "2 days" to 2880,
    "1 week" to 10080,
)

private val DAYS = listOf(
    "sun" to "Sun",
    "mon" to "Mon",
    "tue" to "Tue",
    "wed" to "Wed",
    "thu" to "Thu",
    "fri" to "Fri",
    "sat" to "Sat",
)

private val SCOPES = listOf(
    "all" to "All posts in my committees",
    "subscribed" to "Threads I'm in or follow",
    "mentions" to "Only when I'm @mentioned",
    "none" to "Off",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsScreen(app: App, modifier: Modifier = Modifier) {
    var settings by remember { mutableStateOf(NotificationSettings()) }
    var devices by remember { mutableStateOf<List<DeviceItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var saved by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    suspend fun reload() {
        try {
            settings = app.auth.api.getPreferences()
            devices = app.auth.api.devices()
        } catch (e: Throwable) {
            error = e.message
        } finally {
            loading = false
        }
    }

    LaunchedEffect(Unit) { reload() }

    Column(modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Alerts", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.weight(1f))
            Button(enabled = !saving, onClick = {
                saving = true
                scope.launch {
                    runCatching { settings = app.auth.api.putPreferences(settings) }
                        .onFailure { error = it.message }
                    saving = false
                    saved = true
                }
            }) {
                Text(if (saving) "Saving..." else "Save")
            }
        }
        if (saved) Text("Saved", color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.labelSmall)
        Spacer(Modifier.height(12.dp))

        if (loading) { CircularProgressIndicator(); return@Column }

        Section("Devices") {
            if (devices.isEmpty()) {
                Text("No devices registered. Allow notifications to register this device.",
                    style = MaterialTheme.typography.bodySmall)
            } else {
                devices.forEach { d ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(d.deviceName ?: d.platform.uppercase())
                            Text("Last seen ${d.lastSeenAt.take(10)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        TextButton(onClick = {
                            scope.launch {
                                runCatching { app.auth.api.deleteDevice(d.id) }
                                reload()
                            }
                        }) { Text("Remove") }
                    }
                }
            }
            TextButton(onClick = { PushRegistrar.registerCurrentToken(context) }) {
                Text("Enable / refresh push")
            }
            TextButton(
                enabled = devices.isNotEmpty(),
                onClick = { scope.launch { runCatching { app.auth.api.sendTestPush() } } }
            ) { Text("Send test notification") }
        }

        Section("Committee events") {
            ToggleRow("Notify me about upcoming events",
                settings.events.enabled
            ) { settings = settings.copy(events = settings.events.copy(enabled = it)) }
            if (settings.events.enabled) {
                ChipFlow(LEAD_OPTIONS, settings.events.leadTimesMinutes) { v ->
                    val cur = settings.events.leadTimesMinutes.toMutableList()
                    if (v in cur) cur.remove(v) else { cur.add(v); cur.sort() }
                    settings = settings.copy(events = settings.events.copy(leadTimesMinutes = cur))
                }
            }
        }

        Section("Task deadlines") {
            ToggleRow("Notify me about task deadlines", settings.tasks.enabled) {
                settings = settings.copy(tasks = settings.tasks.copy(enabled = it))
            }
            if (settings.tasks.enabled) {
                ChipFlow(LEAD_OPTIONS, settings.tasks.leadTimesMinutes) { v ->
                    val cur = settings.tasks.leadTimesMinutes.toMutableList()
                    if (v in cur) cur.remove(v) else { cur.add(v); cur.sort() }
                    settings = settings.copy(tasks = settings.tasks.copy(leadTimesMinutes = cur))
                }
                ToggleRow("Only tasks assigned to me", settings.tasks.onlyMyTasks) {
                    settings = settings.copy(tasks = settings.tasks.copy(onlyMyTasks = it))
                }
                ToggleRow("When a task is assigned to me", settings.tasks.onAssigned) {
                    settings = settings.copy(tasks = settings.tasks.copy(onAssigned = it))
                }
                ToggleRow("When status changes", settings.tasks.onStatusChange) {
                    settings = settings.copy(tasks = settings.tasks.copy(onStatusChange = it))
                }
            }
        }

        Section("Discussions") {
            ToggleRow("Notify me about discussion posts", settings.discussions.enabled) {
                settings = settings.copy(discussions = settings.discussions.copy(enabled = it))
            }
            if (settings.discussions.enabled) {
                SCOPES.forEach { (key, label) ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = settings.discussions.scope == key,
                            onClick = {
                                settings = settings.copy(
                                    discussions = settings.discussions.copy(scope = key)
                                )
                            }
                        )
                        Text(label)
                    }
                }
            }
        }

        Section("Admin broadcasts") {
            ToggleRow("Receive admin broadcasts", settings.broadcast.enabled) {
                settings = settings.copy(broadcast = settings.broadcast.copy(enabled = it))
            }
        }

        Section("Quiet hours") {
            ToggleRow("Enable quiet hours", settings.quietHours.enabled) {
                settings = settings.copy(quietHours = settings.quietHours.copy(enabled = it))
            }
            if (settings.quietHours.enabled) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("From ${settings.quietHours.startHour}:00", Modifier.weight(1f))
                    OutlinedButton(onClick = {
                        settings = settings.copy(
                            quietHours = settings.quietHours.copy(
                                startHour = (settings.quietHours.startHour + 1) % 24
                            )
                        )
                    }) { Text("+1") }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Until ${settings.quietHours.endHour}:00", Modifier.weight(1f))
                    OutlinedButton(onClick = {
                        settings = settings.copy(
                            quietHours = settings.quietHours.copy(
                                endHour = (settings.quietHours.endHour + 1) % 24
                            )
                        )
                    }) { Text("+1") }
                }
            }
            ChipFlow(DAYS, settings.mutedDays) { key ->
                val cur = settings.mutedDays.toMutableList()
                if (key in cur) cur.remove(key) else cur.add(key)
                settings = settings.copy(mutedDays = cur)
            }
        }

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier = Modifier.padding(vertical = 8.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            content()
        }
    }
}

@Composable
private fun ToggleRow(label: String, value: Boolean, onChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f))
        Switch(checked = value, onCheckedChange = onChange)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun <V> ChipFlow(
    items: List<Pair<String, V>>,
    selected: List<V>,
    onToggle: (V) -> Unit,
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        items.forEach { (label, value) ->
            FilterChip(
                selected = value in selected,
                onClick = { onToggle(value) },
                label = { Text(label) }
            )
        }
    }
}
