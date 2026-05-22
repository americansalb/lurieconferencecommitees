package org.aalb.lurieconference.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.aalb.lurieconference.BuildConfig
import org.aalb.lurieconference.data.TokenStore
import java.util.concurrent.TimeUnit

class ApiException(val status: Int, message: String) : RuntimeException(message)

class ApiClient(private val tokenStore: TokenStore) {
    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/')

    suspend fun login(email: String, password: String): LoginResponse =
        post("/api/auth/mobile/login", LoginRequest(email, password), authenticated = false)

    suspend fun me(): CurrentUser = get("/api/auth/mobile/me")

    suspend fun logout() {
        runCatching { post<Unit, Map<String, String>>("/api/auth/mobile/logout", emptyMap()) }
    }

    suspend fun feed(): Feed = get("/api/mobile/feed")
    suspend fun committees(): List<CommitteeMembership> = get("/api/mobile/committees")
    suspend fun devices(): List<DeviceItem> = get("/api/devices")
    suspend fun registerDevice(body: DeviceRegister) {
        post<DeviceItem, DeviceRegister>("/api/devices", body)
    }
    suspend fun deleteDevice(id: String) {
        delete("/api/devices/$id")
    }
    suspend fun getPreferences(): NotificationSettings =
        get<PreferencesResponse>("/api/notification-preferences").settings
    suspend fun putPreferences(settings: NotificationSettings): NotificationSettings =
        put<PreferencesResponse, NotificationSettings>("/api/notification-preferences", settings).settings
    suspend fun sendTestPush() {
        post<Map<String, Any?>, Map<String, String>>("/api/notifications/test", emptyMap())
    }

    // MARK: - HTTP plumbing

    private suspend inline fun <reified T> get(path: String): T =
        execute(buildRequest(path, "GET", null, true))

    private suspend inline fun <reified T, reified B> post(
        path: String, body: B, authenticated: Boolean = true,
    ): T = execute(buildRequest(path, "POST", body?.let { json.encodeToString(it) }, authenticated))

    private suspend inline fun <reified T, reified B> put(path: String, body: B): T =
        execute(buildRequest(path, "PUT", json.encodeToString(body), true))

    private suspend fun delete(path: String) {
        execute<Unit>(buildRequest(path, "DELETE", null, true))
    }

    private fun buildRequest(path: String, method: String, jsonBody: String?, authenticated: Boolean): Request {
        val builder = Request.Builder()
            .url(baseUrl + path)
            .header("Accept", "application/json")
        if (authenticated) {
            tokenStore.token?.let { builder.header("Authorization", "Bearer $it") }
        }
        val body = jsonBody?.toRequestBody("application/json".toMediaType())
        when (method) {
            "GET" -> builder.get()
            "DELETE" -> builder.delete(body)
            else -> builder.method(method, body ?: ByteArray(0).toRequestBody())
        }
        return builder.build()
    }

    private suspend inline fun <reified T> execute(request: Request): T = withContext(Dispatchers.IO) {
        http.newCall(request).execute().use { response ->
            val raw = response.body?.string().orEmpty()
            if (response.code == 401) {
                tokenStore.token = null
                tokenStore.userJson = null
            }
            if (!response.isSuccessful) {
                val msg = runCatching { json.parseToJsonElement(raw) }.getOrNull()
                    ?.let { runCatching { it.toString() }.getOrNull() }
                throw ApiException(response.code, msg ?: "HTTP ${response.code}")
            }
            if (T::class == Unit::class || raw.isBlank()) {
                @Suppress("UNCHECKED_CAST")
                Unit as T
            } else {
                json.decodeFromString(raw)
            }
        }
    }
}
