import Foundation
import UIKit
import UserNotifications

@MainActor
final class PushManager: ObservableObject {
    static let shared = PushManager()

    @Published var lastToken: String?
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published var lastError: String?
    @Published var registered: Bool = false

    private init() {
        Task { await refreshStatus() }
    }

    func refreshStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }

    func requestAndRegister() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            await refreshStatus()
            if granted {
                UIApplication.shared.registerForRemoteNotifications()
            }
        } catch {
            lastError = error.localizedDescription
        }
    }

    func handleAPNsToken(_ token: String) {
        lastToken = token
        Task { @MainActor in
            guard AuthStore.shared.token != nil else { return }
            let name = UIDevice.current.name
            let version = (Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String) ?? "1.0"
            do {
                try await APIClient.shared.registerDevice(
                    pushToken: token,
                    deviceName: name,
                    appVersion: version
                )
                registered = true
            } catch {
                lastError = error.localizedDescription
            }
        }
    }
}

@MainActor
final class NotificationRouter {
    static let shared = NotificationRouter()
    func handle(userInfo: [AnyHashable: Any]) {
        // Hook for deep linking from a tapped push. The payload includes
        // a "kind" key (event | task | discussion_post | task_assigned | broadcast).
        // For now this is a no-op; wire to NavigationStack once we have detail screens.
    }
}
