import SwiftUI

struct GlobalDiscussionsView: View {
    @State private var committees: [Committee] = []
    @State private var loading = true

    private var allDiscussions: [(Discussion, Committee)] {
        committees.flatMap { c in
            c.discussions.map { ($0, c) }
        }.sorted { lhs, rhs in
            lhs.0.createdAt > rhs.0.createdAt
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if loading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .listRowSeparator(.hidden)
                } else if allDiscussions.isEmpty {
                    ContentUnavailableView("No Discussions", systemImage: "bubble.left.and.bubble.right", description: Text("Discussions from all committees appear here"))
                        .listRowSeparator(.hidden)
                } else {
                    ForEach(allDiscussions, id: \.0.id) { disc, committee in
                        Button {
                            selectedDiscussion = disc
                        } label: {
                            HStack(spacing: 10) {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack(spacing: 6) {
                                        if disc.isPinned {
                                            Image(systemName: "pin.fill")
                                                .font(.system(size: 9))
                                                .foregroundStyle(.orange)
                                        }
                                        Text(disc.title)
                                            .font(.subheadline).bold()
                                            .lineLimit(1)
                                    }
                                    HStack(spacing: 4) {
                                        Text(disc.author.name)
                                        Text("·")
                                        Text(committee.name)
                                        if let count = disc._count?.posts, count > 0 {
                                            Text("· \(count) replies")
                                        }
                                    }
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                }
                                Spacer()
                            }
                        }
                        .foregroundStyle(.primary)
                    }
                }
            }
            .navigationTitle("Discussions")
            .refreshable { await load() }
            .task { await load() }
            .sheet(item: $selectedDiscussion) { disc in
                DiscussionDetailSheet(
                    discussionId: disc.id,
                    title: disc.title,
                    accentColor: .blue
                )
            }
        }
    }

    @State private var selectedDiscussion: Discussion?

    private func load() async {
        committees = (try? await APIService.shared.fetchCommittees()) ?? []
        loading = false
    }
}
