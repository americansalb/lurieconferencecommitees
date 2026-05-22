package org.aalb.lurieconference.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.aalb.lurieconference.data.AuthRepository
import org.aalb.lurieconference.api.ApiException

@Composable
fun LoginScreen(repo: AuthRepository) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("LURIE CHILDREN'S · AALB",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary)
        Text("Conference 2026", style = MaterialTheme.typography.displaySmall)
        Text("Committee Hub", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(Modifier.height(24.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(16.dp))
        Button(
            enabled = !loading && email.isNotBlank() && password.isNotBlank(),
            onClick = {
                loading = true
                error = null
                scope.launch {
                    try {
                        repo.signIn(email.trim(), password)
                    } catch (e: ApiException) {
                        error = "Invalid email or password"
                    } catch (e: Throwable) {
                        error = e.message ?: "Sign-in failed"
                    } finally {
                        loading = false
                    }
                }
            }
        ) {
            if (loading) {
                CircularProgressIndicator(strokeWidth = 2.dp,
                    modifier = Modifier.height(18.dp))
            } else {
                Text("Sign in")
            }
        }
    }
}
