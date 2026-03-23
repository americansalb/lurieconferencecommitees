import SwiftUI

@main
struct LurieCommitteeHubApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var notificationManager = NotificationManager()
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(notificationManager)
                .onAppear {
                    appDelegate.notificationManager = notificationManager
                }
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    var notificationManager: NotificationManager?

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        notificationManager?.setDeviceToken(deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        notificationManager?.handleRegistrationError(error)
    }
}
