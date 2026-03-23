import Foundation

// MARK: - User

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let role: String
    var timezone: String?
}

// MARK: - Committee

struct Committee: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let description: String
    let color: String
    let icon: String
    let members: [CommitteeMember]
    let discussions: [Discussion]
    let events: [Event]
    let _count: CommitteeCounts
}

struct CommitteeCounts: Codable {
    let members: Int
    let discussions: Int
    let events: Int
}

struct CommitteeMember: Codable, Identifiable {
    let id: String
    let user: MemberUser
    let role: String
}

struct MemberUser: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
}

// MARK: - Event

struct Event: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let startTime: String
    let endTime: String
    let recurring: Bool
    var duration: Int?
    var timezone: String?
    var meetingUrl: String?
    // Added when flattened from committees
    var committeeName: String?
    var committeeSlug: String?

    var startDate: Date {
        ISO8601DateFormatter().date(from: startTime) ?? Date()
    }
    var endDate: Date {
        ISO8601DateFormatter().date(from: endTime) ?? Date()
    }
}

// MARK: - Discussion

struct Discussion: Codable, Identifiable {
    let id: String
    let title: String
    let isPinned: Bool
    let author: DiscussionAuthor
    let createdAt: String
    var posts: [Post]?
    var _count: PostCount?
    var committeeId: String?
}

struct DiscussionAuthor: Codable, Identifiable {
    let id: String
    let name: String
}

struct PostCount: Codable {
    let posts: Int
}

struct Post: Codable, Identifiable {
    let id: String
    let body: String
    let author: DiscussionAuthor
    let createdAt: String
    var updatedAt: String?
}

struct DiscussionDetail: Codable {
    let id: String
    let title: String
    let isPinned: Bool
    let author: DiscussionAuthor
    let createdAt: String
    let posts: [Post]
}

// MARK: - Task

struct TaskItem: Codable, Identifiable {
    let id: String
    let title: String
    var description: String
    var status: String
    var priority: String
    var progress: Int
    let startDate: String
    let endDate: String
    var color: String?
    var url: String?
    var assignee: TaskAssignee?
    var sortOrder: Int
    var committee: TaskCommittee?

    var start: Date {
        ISO8601DateFormatter().date(from: startDate) ?? Date()
    }
    var end: Date {
        ISO8601DateFormatter().date(from: endDate) ?? Date()
    }
}

struct TaskAssignee: Codable, Identifiable {
    let id: String
    let name: String
}

struct TaskCommittee: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String
    var color: String?
}

// MARK: - File

struct CommitteeFile: Codable, Identifiable {
    let id: String
    let title: String
    let url: String
    let type: String
    let addedBy: FileAuthor
    let createdAt: String
}

struct FileAuthor: Codable, Identifiable {
    let id: String
    let name: String
}

// MARK: - Committee Colors

struct CommitteeColors {
    let accent: Color
    let bg: Color
    let light: Color
    let accentHex: String

    static func forSlug(_ slug: String) -> CommitteeColors {
        switch slug {
        case "logistics-venue":
            return CommitteeColors(accent: .blue, bg: Color(hex: "#1e3a5f"), light: Color(hex: "#eff6ff"), accentHex: "#3b82f6")
        case "technology-virtual":
            return CommitteeColors(accent: .cyan, bg: Color(hex: "#164e63"), light: Color(hex: "#ecfeff"), accentHex: "#06b6d4")
        case "marketing-communications":
            return CommitteeColors(accent: .orange, bg: Color(hex: "#78350f"), light: Color(hex: "#fffbeb"), accentHex: "#f59e0b")
        case "sponsorship-fundraising":
            return CommitteeColors(accent: .purple, bg: Color(hex: "#3b0764"), light: Color(hex: "#f5f3ff"), accentHex: "#8b5cf6")
        case "volunteer-participant":
            return CommitteeColors(accent: .green, bg: Color(hex: "#064e3b"), light: Color(hex: "#ecfdf5"), accentHex: "#10b981")
        case "executive-planning":
            return CommitteeColors(accent: .red, bg: Color(hex: "#7f1d1d"), light: Color(hex: "#fef2f2"), accentHex: "#DC2626")
        default:
            return CommitteeColors(accent: .blue, bg: Color(hex: "#1e3a5f"), light: Color(hex: "#eff6ff"), accentHex: "#3b82f6")
        }
    }
}

// MARK: - CSRF

struct CSRFResponse: Codable {
    let csrfToken: String
}

// MARK: - Color Extension

import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
