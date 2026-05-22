import Foundation

enum APIError: Error, LocalizedError {
    case http(Int, String?)
    case decoding
    case network(String)

    var errorDescription: String? {
        switch self {
        case .http(let code, let msg): return msg ?? "Server returned \(code)"
        case .decoding: return "Couldn't read the server response"
        case .network(let m): return m
        }
    }
}

@MainActor
final class APIClient {
    static let shared = APIClient()

    var baseURL: URL {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "LurieAPIBaseURL") as? String)
            ?? "https://conference.aalb.org"
        return URL(string: raw) ?? URL(string: "https://conference.aalb.org")!
    }

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .useDefaultKeys
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .useDefaultKeys
        return e
    }()

    func login(email: String, password: String) async throws -> LoginResponse {
        try await request("/api/auth/mobile/login", method: "POST",
                          body: ["email": email, "password": password], authenticated: false)
    }

    func me() async throws -> CurrentUser {
        try await request("/api/auth/mobile/me")
    }

    func logout() async {
        _ = try? await rawRequest("/api/auth/mobile/logout", method: "POST")
    }

    func feed() async throws -> Feed {
        try await request("/api/mobile/feed")
    }

    func committees() async throws -> [CommitteeMembership] {
        try await request("/api/mobile/committees")
    }

    func devices() async throws -> [DeviceItem] {
        try await request("/api/devices")
    }

    func registerDevice(pushToken: String, deviceName: String, appVersion: String) async throws {
        struct Body: Codable {
            let platform = "ios"
            let pushToken: String
            let deviceName: String
            let appVersion: String
            let locale: String
            let timezone: String
        }
        let body = Body(
            pushToken: pushToken,
            deviceName: deviceName,
            appVersion: appVersion,
            locale: Locale.current.identifier,
            timezone: TimeZone.current.identifier
        )
        _ = try await rawRequest("/api/devices", method: "POST", body: body)
    }

    func deleteDevice(_ id: String) async throws {
        _ = try await rawRequest("/api/devices/\(id)", method: "DELETE")
    }

    func getPreferences() async throws -> NotificationSettings {
        let resp: PreferencesResponse = try await request("/api/notification-preferences")
        return resp.settings
    }

    func putPreferences(_ settings: NotificationSettings) async throws -> NotificationSettings {
        let resp: PreferencesResponse = try await request(
            "/api/notification-preferences", method: "PUT", body: settings
        )
        return resp.settings
    }

    func sendTestPush() async throws {
        _ = try await rawRequest("/api/notifications/test", method: "POST")
    }

    // MARK: - Internals

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws -> T {
        let data = try await rawRequest(path, method: method, body: body, authenticated: authenticated)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding
        }
    }

    private func rawRequest(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws -> Data {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if authenticated, let token = AuthStore.shared.token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body = body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try encoder.encode(AnyEncodable(body))
        }
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.network("No HTTP response")
            }
            if http.statusCode == 401 {
                await AuthStore.shared.signOutLocally()
            }
            if !(200..<300).contains(http.statusCode) {
                let message = try? JSONDecoder().decode([String: String].self, from: data)["error"]
                throw APIError.http(http.statusCode, message)
            }
            return data
        } catch let e as APIError {
            throw e
        } catch {
            throw APIError.network(error.localizedDescription)
        }
    }
}

private struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ value: Encodable) { self.value = value }
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}
