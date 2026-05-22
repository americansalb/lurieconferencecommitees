# Lurie Conference — Android app

Kotlin + Jetpack Compose app that mirrors the iOS client. Same backend, same
notification preference model. Push delivered through Firebase Cloud Messaging.

## What you need

- Android Studio Koala (2024.1) or newer
- JDK 17 (Android Studio bundles one)
- Firebase project with an Android app registered at
  `org.aalb.lurieconference` (or whatever bundle ID you prefer)

## First-time setup

1. **Firebase**: create a project at <https://console.firebase.google.com>,
   add an Android app with the package name above, and **download
   `google-services.json`**. Drop it in `android/app/google-services.json`
   (the file is gitignored).
2. **Service account for the backend**: in the Firebase console go to
   *Project settings → Service accounts → Generate new private key*. The
   JSON download contains `project_id`, `client_email`, and `private_key`.
   Set them on the backend as `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`,
   `FCM_PRIVATE_KEY`.
3. **Open the project**: in Android Studio, choose *Open*, point at this
   `android/` folder, wait for Gradle sync.
4. **Run** on a device or emulator with Google Play Services.

To point at a non-prod backend, set the Gradle property when invoking the
build (or in `~/.gradle/gradle.properties`):

```
LURIE_API_BASE_URL=https://staging.example.com
```

Default is `https://conference.aalb.org`.

## What's inside

- `App.kt` — application class; creates the FCM notification channel.
- `MainActivity.kt` — requests POST_NOTIFICATIONS, then asks `PushRegistrar`
  to ship the current FCM token to `/api/devices`.
- `data/TokenStore.kt` — encrypted prefs for the bearer token and cached user.
- `api/ApiClient.kt` — OkHttp + kotlinx.serialization client (login, feed,
  committees, devices, notification preferences, test push, logout).
- `push/LurieFirebaseMessagingService.kt` — handles token rotation and
  incoming RemoteMessages; posts a system notification using the default
  channel.
- `ui/screens/...` — Compose screens: Login, Feed, Committees, Notification
  Settings, Profile.

## Releasing

1. Generate a signing keystore (`keytool -genkey ...`) and add it to your
   `local.properties` (not gitignored if you want signing in CI).
2. *Build → Generate Signed Bundle / APK* and upload the `.aab` to Play
   Console.
3. The first internal release needs the Firebase project linked under the
   Play Console *App integrity* page (optional but recommended for App
   Signing by Google Play).

## Permissions

- `INTERNET` — talk to the backend.
- `POST_NOTIFICATIONS` — show push on Android 13+.

Background polling, foreground services, and exact-alarm permissions are not
required: scheduled reminders live on the backend, and FCM does the
push delivery.
