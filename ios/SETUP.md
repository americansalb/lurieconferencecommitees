# Committee Hub iOS App - Setup

## Prerequisites
- Xcode 15+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (install via `brew install xcodegen`)
- Apple Developer account with push notification capability

## Quick Start

1. Generate the Xcode project:
   ```bash
   cd ios
   xcodegen generate
   ```

2. Open the project:
   ```bash
   open LurieCommitteeHub.xcodeproj
   ```

3. In Xcode:
   - Select your development team under Signing & Capabilities
   - Add the "Push Notifications" capability if not already present
   - Update the bundle identifier if needed

4. Build and run on a simulator or device

## Push Notifications

To enable push notifications:

1. In your Apple Developer account, create an APNs key
2. Configure your server with the APNs key for sending notifications
3. The app automatically registers for push notifications on login
4. Device tokens are stored via the `/api/devices` endpoint

## Architecture

- **SwiftUI** - Declarative UI framework
- **URLSession** - Networking with cookie-based auth (shares NextAuth session)
- **Actor-based API service** - Thread-safe network layer
- **Tab-based navigation** - Dashboard, Calendar, Discussions, Profile

## API

The app connects to the same backend as the web app. Auth uses NextAuth's
credentials flow with cookie-based sessions managed by URLSession.

No backend modifications were needed for basic functionality — the iOS app
authenticates through the same CSRF + credentials flow as the web browser.
