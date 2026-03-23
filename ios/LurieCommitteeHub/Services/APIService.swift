import Foundation

actor APIService {
    static let shared = APIService()

    #if DEBUG
    private let baseURL = "https://lurieconferencecommitees.onrender.com"
    #else
    private let baseURL = "https://lurieconferencecommitees.onrender.com"
    #endif

    private let session: URLSession
    private let decoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        config.httpCookieStorage = HTTPCookieStorage.shared
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
    }

    // MARK: - Auth

    func getCSRFToken() async throws -> String {
        let url = URL(string: "\(baseURL)/api/auth/csrf")!
        let (data, _) = try await session.data(from: url)
        let response = try decoder.decode(CSRFResponse.self, from: data)
        return response.csrfToken
    }

    func login(email: String, password: String) async throws -> Bool {
        let csrfToken = try await getCSRFToken()

        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/callback/credentials")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = "email=\(email.urlEncoded)&password=\(password.urlEncoded)&csrfToken=\(csrfToken.urlEncoded)&json=true"
        request.httpBody = body.data(using: .utf8)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else { return false }

        // NextAuth redirects on success — check for session cookie
        if httpResponse.statusCode == 200 || httpResponse.statusCode == 302 {
            // Verify we have a valid session
            let user = try? await getCurrentUser()
            return user != nil
        }

        // Check for error in JSON response
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let errorUrl = json["url"] as? String,
           errorUrl.contains("error") {
            return false
        }

        return false
    }

    func logout() async throws {
        let csrfToken = try await getCSRFToken()

        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/signout")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = "csrfToken=\(csrfToken.urlEncoded)&json=true".data(using: .utf8)

        _ = try await session.data(for: request)

        // Clear cookies
        if let cookies = HTTPCookieStorage.shared.cookies(for: URL(string: baseURL)!) {
            for cookie in cookies {
                HTTPCookieStorage.shared.deleteCookie(cookie)
            }
        }
    }

    func getCurrentUser() async throws -> User? {
        let url = URL(string: "\(baseURL)/api/user")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return nil }
        return try decoder.decode(User.self, from: data)
    }

    // MARK: - Session Check

    func checkSession() async -> Bool {
        let url = URL(string: "\(baseURL)/api/auth/session")!
        guard let (data, response) = try? await session.data(from: url),
              let http = response as? HTTPURLResponse, http.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              json["user"] != nil else {
            return false
        }
        return true
    }

    // MARK: - Committees

    func fetchCommittees() async throws -> [Committee] {
        let url = URL(string: "\(baseURL)/api/committees")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
        return try decoder.decode([Committee].self, from: data)
    }

    func joinCommittee(committeeId: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/committees/join")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["committeeId": committeeId])
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
    }

    func leaveCommittee(committeeId: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/committees/join")!)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["committeeId": committeeId])
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
    }

    // MARK: - Tasks

    func fetchAllTasks() async throws -> [TaskItem] {
        let url = URL(string: "\(baseURL)/api/tasks")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
        return try decoder.decode([TaskItem].self, from: data)
    }

    func fetchTasks(committeeId: String) async throws -> [TaskItem] {
        let url = URL(string: "\(baseURL)/api/tasks?committeeId=\(committeeId)")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
        return try decoder.decode([TaskItem].self, from: data)
    }

    func createTask(_ params: [String: Any]) async throws -> TaskItem {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/tasks")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: params)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...201).contains(http.statusCode) else {
            throw APIError.serverError
        }
        return try decoder.decode(TaskItem.self, from: data)
    }

    func updateTask(id: String, params: [String: Any]) async throws -> TaskItem {
        var allParams = params
        allParams["taskId"] = id
        var request = URLRequest(url: URL(string: "\(baseURL)/api/tasks")!)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: allParams)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
        return try decoder.decode(TaskItem.self, from: data)
    }

    func deleteTask(id: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/tasks")!)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["taskId": id])
        _ = try await session.data(for: request)
    }

    // MARK: - Discussions

    func fetchDiscussion(id: String) async throws -> DiscussionDetail {
        let url = URL(string: "\(baseURL)/api/discussions/\(id)")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
        return try decoder.decode(DiscussionDetail.self, from: data)
    }

    func createDiscussion(title: String, committeeId: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/discussions")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["title": title, "committeeId": committeeId])
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...201).contains(http.statusCode) else {
            throw APIError.serverError
        }
    }

    func replyToDiscussion(id: String, body: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/discussions/\(id)/posts")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["body": body])
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...201).contains(http.statusCode) else {
            throw APIError.serverError
        }
    }

    // MARK: - Events

    func createEvent(params: [String: Any]) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/events")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: params)
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...201).contains(http.statusCode) else {
            throw APIError.serverError
        }
    }

    // MARK: - Files

    func fetchFiles(committeeId: String) async throws -> [CommitteeFile] {
        let url = URL(string: "\(baseURL)/api/files?committeeId=\(committeeId)")!
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.serverError
        }
        return try decoder.decode([CommitteeFile].self, from: data)
    }

    func addFile(committeeId: String, title: String, url: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/files")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "committeeId": committeeId, "title": title, "url": url
        ])
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...201).contains(http.statusCode) else {
            throw APIError.serverError
        }
    }

    func deleteFile(id: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/files")!)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["id": id])
        _ = try await session.data(for: request)
    }

    // MARK: - Devices (Push Notifications)

    func registerDevice(token: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/devices")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "token": token, "platform": "ios"
        ])
        _ = try await session.data(for: request)
    }

    func unregisterDevice(token: String) async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/devices")!)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["token": token])
        _ = try await session.data(for: request)
    }
}

// MARK: - Error

enum APIError: LocalizedError {
    case serverError
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .serverError: return "Something went wrong. Please try again."
        case .unauthorized: return "Please sign in to continue."
        }
    }
}

// MARK: - String Extension

extension String {
    var urlEncoded: String {
        addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? self
    }
}
