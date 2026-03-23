import Foundation
import UserNotifications
import UIKit

class NotificationManager: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    @Published var deviceToken: String?
    @Published var permissionGranted = false

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func requestPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            DispatchQueue.main.async {
                self.permissionGranted = granted
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }

    func setDeviceToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        DispatchQueue.main.async {
            self.deviceToken = tokenString
        }
        // Register with backend
        Task {
            try? await APIService.shared.registerDevice(token: tokenString)
        }
    }

    func handleRegistrationError(_ error: Error) {
        print("Push notification registration failed: \(error.localizedDescription)")
    }

    // Handle foreground notifications
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        // Handle deep linking based on notification payload
        if let type = userInfo["type"] as? String {
            NotificationCenter.default.post(
                name: .didReceivePushNotification,
                object: nil,
                userInfo: ["type": type, "data": userInfo]
            )
        }
        completionHandler()
    }
}

extension Notification.Name {
    static let didReceivePushNotification = Notification.Name("didReceivePushNotification")
}
