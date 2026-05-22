package org.aalb.lurieconference.api

import kotlinx.serialization.Serializable

@Serializable
data class CurrentUser(
    val id: String,
    val email: String,
    val name: String,
    val role: String,
    val timezone: String,
)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class LoginResponse(val token: String, val expiresAt: String, val user: CurrentUser)

@Serializable
data class Committee(val id: String, val name: String, val slug: String, val color: String? = null)

@Serializable
data class CommitteeMembership(val role: String, val committee: Committee)

@Serializable
data class EventItem(
    val id: String,
    val title: String,
    val description: String? = null,
    val startTime: String,
    val endTime: String,
    val timezone: String? = null,
    val meetingUrl: String? = null,
    val committee: Committee,
)

@Serializable
data class Assignee(val id: String, val name: String)

@Serializable
data class TaskItem(
    val id: String,
    val title: String,
    val description: String? = null,
    val status: String,
    val priority: String,
    val progress: Int,
    val startDate: String,
    val endDate: String,
    val assignee: Assignee? = null,
    val committee: Committee,
)

@Serializable
data class DiscussionRef(val id: String, val title: String, val committee: Committee)

@Serializable
data class PostItem(
    val id: String,
    val body: String,
    val createdAt: String,
    val author: Assignee,
    val discussion: DiscussionRef,
)

@Serializable
data class Feed(val events: List<EventItem>, val tasks: List<TaskItem>, val recentPosts: List<PostItem>)

@Serializable
data class DeviceItem(
    val id: String,
    val platform: String,
    val deviceName: String? = null,
    val appVersion: String? = null,
    val lastSeenAt: String,
)

@Serializable
data class DeviceRegister(
    val platform: String = "android",
    val pushToken: String,
    val deviceName: String,
    val appVersion: String,
    val locale: String,
    val timezone: String,
)

@Serializable
data class CommitteeOverride(
    val enabled: Boolean? = null,
    val leadTimesMinutes: List<Int>? = null,
)

@Serializable
data class EventChannel(
    val enabled: Boolean = true,
    val leadTimesMinutes: List<Int> = listOf(15, 60, 1440),
    val committeeOverrides: Map<String, CommitteeOverride> = emptyMap(),
)

@Serializable
data class TaskChannel(
    val enabled: Boolean = true,
    val leadTimesMinutes: List<Int> = listOf(60, 1440),
    val onAssigned: Boolean = true,
    val onStatusChange: Boolean = false,
    val onlyMyTasks: Boolean = true,
)

@Serializable
data class DiscussionChannel(
    val enabled: Boolean = true,
    val scope: String = "subscribed",
    val committeeOverrides: Map<String, String> = emptyMap(),
)

@Serializable
data class BroadcastChannel(val enabled: Boolean = true)

@Serializable
data class QuietHours(
    val enabled: Boolean = false,
    val startHour: Int = 22,
    val endHour: Int = 7,
)

@Serializable
data class NotificationSettings(
    val events: EventChannel = EventChannel(),
    val tasks: TaskChannel = TaskChannel(),
    val discussions: DiscussionChannel = DiscussionChannel(),
    val broadcast: BroadcastChannel = BroadcastChannel(),
    val quietHours: QuietHours = QuietHours(),
    val mutedDays: List<String> = emptyList(),
)

@Serializable
data class PreferencesResponse(val settings: NotificationSettings)
