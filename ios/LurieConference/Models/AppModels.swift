import Foundation

struct CurrentUser: Codable, Equatable {
    let id: String
    let email: String
    let name: String
    let role: String
    let timezone: String
}

struct LoginResponse: Codable {
    let token: String
    let expiresAt: String
    let user: CurrentUser
}

struct Committee: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let slug: String
    let color: String?
}

struct CommitteeMembership: Codable, Identifiable {
    var id: String { committee.id }
    let role: String
    let committee: Committee
}

struct EventItem: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String?
    let startTime: String
    let endTime: String
    let timezone: String?
    let meetingUrl: String?
    let committee: Committee
}

struct AssigneeRef: Codable, Hashable {
    let id: String
    let name: String
}

struct TaskItem: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String?
    let status: String
    let priority: String
    let progress: Int
    let startDate: String
    let endDate: String
    let assignee: AssigneeRef?
    let committee: Committee
}

struct DiscussionRef: Codable, Hashable {
    let id: String
    let title: String
    let committee: Committee
}

struct PostItem: Codable, Identifiable, Hashable {
    let id: String
    let body: String
    let createdAt: String
    let author: AssigneeRef
    let discussion: DiscussionRef
}

struct Feed: Codable {
    let events: [EventItem]
    let tasks: [TaskItem]
    let recentPosts: [PostItem]
}

struct DeviceItem: Codable, Identifiable, Hashable {
    let id: String
    let platform: String
    let deviceName: String?
    let appVersion: String?
    let lastSeenAt: String
}

struct NotificationSettings: Codable, Equatable {
    var events: EventChannel
    var tasks: TaskChannel
    var discussions: DiscussionChannel
    var broadcast: BroadcastChannel
    var quietHours: QuietHours
    var mutedDays: [String]

    struct EventChannel: Codable, Equatable {
        var enabled: Bool
        var leadTimesMinutes: [Int]
        var committeeOverrides: [String: CommitteeOverride]
    }
    struct CommitteeOverride: Codable, Equatable {
        var enabled: Bool?
        var leadTimesMinutes: [Int]?
    }
    struct TaskChannel: Codable, Equatable {
        var enabled: Bool
        var leadTimesMinutes: [Int]
        var onAssigned: Bool
        var onStatusChange: Bool
        var onlyMyTasks: Bool
    }
    struct DiscussionChannel: Codable, Equatable {
        var enabled: Bool
        var scope: String
        var committeeOverrides: [String: String]
    }
    struct BroadcastChannel: Codable, Equatable {
        var enabled: Bool
    }
    struct QuietHours: Codable, Equatable {
        var enabled: Bool
        var startHour: Int
        var endHour: Int
    }

    static let `default` = NotificationSettings(
        events: .init(enabled: true, leadTimesMinutes: [15, 60, 1440], committeeOverrides: [:]),
        tasks: .init(enabled: true, leadTimesMinutes: [60, 1440], onAssigned: true, onStatusChange: false, onlyMyTasks: true),
        discussions: .init(enabled: true, scope: "subscribed", committeeOverrides: [:]),
        broadcast: .init(enabled: true),
        quietHours: .init(enabled: false, startHour: 22, endHour: 7),
        mutedDays: []
    )
}

struct PreferencesResponse: Codable {
    let settings: NotificationSettings
}
