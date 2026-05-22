package org.aalb.lurieconference.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.aalb.lurieconference.App
import org.aalb.lurieconference.api.EventItem
import org.aalb.lurieconference.api.Feed
import org.aalb.lurieconference.api.PostItem
import org.aalb.lurieconference.api.TaskItem
import java.text.DateFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun FeedScreen(app: App, modifier: Modifier = Modifier) {
    var feed by remember { mutableStateOf<Feed?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) {
        try { feed = app.auth.api.feed() }
        catch (e: Throwable) { error = e.message }
        finally { loading = false }
    }

    Column(modifier.padding(16.dp)) {
        Text("Feed", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(12.dp))
        when {
            loading -> CircularProgressIndicator()
            error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
            feed != null -> FeedList(feed!!)
        }
    }
}

@Composable
private fun FeedList(feed: Feed) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        if (feed.events.isNotEmpty()) {
            item { SectionHeader("Upcoming events") }
            items(feed.events) { EventRow(it) }
        }
        if (feed.tasks.isNotEmpty()) {
            item { SectionHeader("Tasks") }
            items(feed.tasks) { TaskRow(it) }
        }
        if (feed.recentPosts.isNotEmpty()) {
            item { SectionHeader("Recent discussion") }
            items(feed.recentPosts) { PostRow(it) }
        }
        if (feed.events.isEmpty() && feed.tasks.isEmpty() && feed.recentPosts.isEmpty()) {
            item { Text("Nothing here yet.") }
        }
    }
}

@Composable
private fun SectionHeader(text: String) {
    Column(Modifier.padding(top = 12.dp, bottom = 4.dp)) {
        Text(text.uppercase(), style = MaterialTheme.typography.labelMedium,
             color = MaterialTheme.colorScheme.onSurfaceVariant)
        HorizontalDivider()
    }
}

@Composable
private fun EventRow(ev: EventItem) {
    Column {
        Text(ev.title, style = MaterialTheme.typography.titleMedium)
        Text("${formatIso(ev.startTime)} · ${ev.committee.name}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun TaskRow(t: TaskItem) {
    Column {
        Text(t.title, style = MaterialTheme.typography.titleMedium)
        val a = t.assignee?.name?.let { " · $it" } ?: ""
        Text("Due ${formatIso(t.endDate)}$a",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun PostRow(p: PostItem) {
    Column {
        Text(p.discussion.title, style = MaterialTheme.typography.titleSmall)
        Text(p.body, style = MaterialTheme.typography.bodyMedium, maxLines = 2)
        Text("${p.author.name} · ${formatIso(p.createdAt)}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun formatIso(iso: String): String = runCatching {
    val instant = Instant.parse(iso)
    val local = instant.atZone(ZoneId.systemDefault())
    DateTimeFormatter.ofPattern("MMM d, h:mm a").format(local)
}.getOrDefault(iso)
