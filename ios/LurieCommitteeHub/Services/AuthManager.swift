import Foundation
import SwiftUI

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var currentUser: User?

    func checkSession() async {
        isLoading = true
        let valid = await APIService.shared.checkSession()
        if valid {
            currentUser = try? await APIService.shared.getCurrentUser()
        }
        isAuthenticated = valid && currentUser != nil
        isLoading = false
    }

    func login(email: String, password: String) async -> Bool {
        do {
            let success = try await APIService.shared.login(email: email, password: password)
            if success {
                currentUser = try? await APIService.shared.getCurrentUser()
                isAuthenticated = true
            }
            return success
        } catch {
            return false
        }
    }

    func logout() async {
        try? await APIService.shared.logout()
        currentUser = nil
        isAuthenticated = false
    }
}
