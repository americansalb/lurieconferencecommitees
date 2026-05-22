package org.aalb.lurieconference.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.aalb.lurieconference.api.ApiClient
import org.aalb.lurieconference.api.CurrentUser

class AuthRepository(val tokenStore: TokenStore) {
    val api = ApiClient(tokenStore)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    private val _user = MutableStateFlow<CurrentUser?>(initialUser())
    val user: StateFlow<CurrentUser?> = _user.asStateFlow()

    val isAuthenticated: Boolean get() = tokenStore.token != null

    private fun initialUser(): CurrentUser? {
        val raw = tokenStore.userJson ?: return null
        return runCatching { json.decodeFromString<CurrentUser>(raw) }.getOrNull()
    }

    suspend fun signIn(email: String, password: String) {
        val response = api.login(email, password)
        tokenStore.token = response.token
        tokenStore.userJson = json.encodeToString(response.user)
        _user.value = response.user
    }

    suspend fun refreshMe() {
        if (tokenStore.token == null) return
        runCatching {
            val u = api.me()
            tokenStore.userJson = json.encodeToString(u)
            _user.value = u
        }
    }

    suspend fun signOut() {
        api.logout()
        tokenStore.token = null
        tokenStore.userJson = null
        _user.value = null
    }
}
