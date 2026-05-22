# Lurie Conference — iOS app

SwiftUI app for the 2026 Lurie Children's & AALB Conference Committee Hub.
Primary purpose: receive push notifications for committee events, task
deadlines, discussion replies, and admin broadcasts, with granular per-channel
preferences.

## What you need on your Mac

- macOS Sonoma (14) or newer
- Xcode 15.3+ (16 recommended)
- An Apple Developer account (the user already has one)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`

## First-time setup

```sh
cd ios
xcodegen generate
open LurieConference.xcodeproj
```

In Xcode:

1. Select the `LurieConference` target → **Signing & Capabilities**.
2. Set **Team** to your Apple Developer team.
3. Confirm **Push Notifications** and **Background Modes → Remote notifications**
   capabilities are enabled (the entitlement and Info.plist already declare them,
   but Xcode needs to register them with your team's provisioning profile).
4. Update **Bundle Identifier** if you want something other than
   `org.aalb.lurieconference`. If you change it, also update `APNS_BUNDLE_ID`
   on the backend.

To inject your team ID without committing it, set the env var before running:

```sh
LURIE_TEAM_ID=ABC123XYZ xcodegen generate
```

## Backend env vars

The backend dispatches APNs through the auth-key flow. On Render (or wherever
the Next.js app runs), set:

- `APNS_KEY_ID` — Key ID from the .p8 file (10 chars).
- `APNS_TEAM_ID` — Your Apple Developer Team ID.
- `APNS_BUNDLE_ID` — Must match the Xcode bundle identifier.
- `APNS_AUTH_KEY` — Full contents of the `.p8` file. `\n` escape sequences are
  fine; the server normalizes them.
- `APNS_ENV` — `production` (default) or `sandbox` for development builds.

To generate the auth key: <https://developer.apple.com/account/resources/authkeys/list>.
Create a key with **Apple Push Notifications service (APNs)** enabled. Download
the `.p8` once (Apple won't let you download it again).

## Running on a device

A real device is required to test push (the simulator can't receive APNs). Plug
in an iPhone, select it as the run target in Xcode, and press ⌘R. The app will
prompt for notification permission on launch.

## API base URL

`Info.plist` has a `LurieAPIBaseURL` key, default
`https://conference.aalb.org`. Override per-build by editing it or by creating a
debug scheme that points at a staging URL.

## What the app does today

- Sign in with the same credentials as the web app (email + password)
- Stores the bearer token in Keychain (90-day session by default)
- Registers the device for APNs and posts the token to `/api/devices`
- **Feed** tab: upcoming events, your tasks, recent discussion replies across
  your committees
- **Committees** tab: list of committees you belong to
- **Alerts** tab: full notification preferences (channel toggles, lead times,
  scope, quiet hours, muted days) with a "send test notification" button
- **Profile** tab: account info, push status, sign out

## What's next

- Deep-link payloads from notifications into the right detail screen (router
  stub is in `Services/PushManager.swift`).
- Detail views for tasks, events, and discussion threads.
- Offline cache.

## Submitting to TestFlight / App Store

1. In Xcode, **Product → Archive** with the destination set to "Any iOS Device".
2. Upload to App Store Connect from the Organizer window.
3. Confirm App Store Connect has the bundle identifier registered.
4. Add internal testers in TestFlight.
