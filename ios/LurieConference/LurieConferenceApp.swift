import SwiftUI

@main
struct LurieConferenceApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var auth = AuthStore.shared
    @StateObject private var push = PushManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(push)
        }
    }
}
