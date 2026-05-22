import Foundation
import Combine

@MainActor
final class AuthStore: ObservableObject {
    static let shared = AuthStore()

    @Published private(set) var token: String?
    @Published private(set) var user: CurrentUser?
    @Published private(set) var loading: Bool = false
    @Published var errorMessage: String?

    private init() {
        self.token = KeychainStore.get(account: "token")
        if let raw = KeychainStore.get(account: "user"),
           let data = raw.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(CurrentUser.self, from: data) {
            self.user = decoded
        }
    }

    var isAuthenticated: Bool { token != nil }

    func signIn(email: String, password: String) async {
        loading = true
        errorMessage = nil
        defer { loading = false }
        do {
            let resp = try await APIClient.shared.login(email: email, password: password)
            persist(token: resp.token, user: resp.user)
            await PushManager.shared.requestAndRegister()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func refreshMe() async {
        guard token != nil else { return }
        do {
            let u = try await APIClient.shared.me()
            user = u
            if let data = try? JSONEncoder().encode(u), let s = String(data: data, encoding: .utf8) {
                KeychainStore.set(s, account: "user")
            }
        } catch {
            // 401 will have cleared us already
        }
    }

    func signOut() async {
        await APIClient.shared.logout()
        await signOutLocally()
    }

    func signOutLocally() async {
        token = nil
        user = nil
        KeychainStore.delete(account: "token")
        KeychainStore.delete(account: "user")
    }

    private func persist(token: String, user: CurrentUser) {
        self.token = token
        self.user = user
        KeychainStore.set(token, account: "token")
        if let data = try? JSONEncoder().encode(user), let s = String(data: data, encoding: .utf8) {
            KeychainStore.set(s, account: "user")
        }
    }
}
