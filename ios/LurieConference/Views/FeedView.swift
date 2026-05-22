import SwiftUI

struct FeedView: View {
    @State private var feed: Feed?
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView().padding()
                } else if let error = error {
                    ContentUnavailableView("Couldn't load feed",
                                           systemImage: "exclamationmark.triangle",
                                           description: Text(error))
                } else if let feed = feed {
                    List {
                        if !feed.events.isEmpty {
                            Section("Upcoming events") {
                                ForEach(feed.events) { ev in EventRow(event: ev) }
                            }
                        }
                        if !feed.tasks.isEmpty {
                            Section("Tasks") {
                                ForEach(feed.tasks) { t in TaskRow(task: t) }
                            }
                        }
                        if !feed.recentPosts.isEmpty {
                            Section("Recent discussion") {
                                ForEach(feed.recentPosts) { p in PostRow(post: p) }
                            }
                        }
                        if feed.events.isEmpty && feed.tasks.isEmpty && feed.recentPosts.isEmpty {
                            ContentUnavailableView("Nothing here yet",
                                                   systemImage: "tray",
                                                   description: Text("Your feed will fill in as committees plan events and post updates."))
                        }
                    }
                    .listStyle(.insetGrouped)
                    .refreshable { await load() }
                }
            }
            .navigationTitle("Feed")
            .task { await load() }
        }
    }

    func load() async {
        loading = true
        error = nil
        do {
            feed = try await APIClient.shared.feed()
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
        loading = false
    }
}

private struct EventRow: View {
    let event: EventItem
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(event.title).font(.headline)
            HStack(spacing: 6) {
                Image(systemName: "calendar")
                Text(formatted(event.startTime))
                Text("·").foregroundStyle(.tertiary)
                Text(event.committee.name).foregroundStyle(.secondary)
            }
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

private struct TaskRow: View {
    let task: TaskItem
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(task.title).font(.headline)
            HStack(spacing: 6) {
                Image(systemName: "clock")
                Text("Due \(formatted(task.endDate))")
                if let a = task.assignee {
                    Text("·").foregroundStyle(.tertiary)
                    Text(a.name).foregroundStyle(.secondary)
                }
            }
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

private struct PostRow: View {
    let post: PostItem
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(post.discussion.title).font(.subheadline).fontWeight(.semibold)
            Text(post.body).font(.body).lineLimit(2)
            HStack(spacing: 6) {
                Text(post.author.name)
                Text("·").foregroundStyle(.tertiary)
                Text(formatted(post.createdAt))
            }
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

private func formatted(_ iso: String) -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let date = f.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) ?? Date()
    let df = DateFormatter()
    df.dateStyle = .medium
    df.timeStyle = .short
    return df.string(from: date)
}
