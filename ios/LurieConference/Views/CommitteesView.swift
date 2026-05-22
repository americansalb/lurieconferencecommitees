import SwiftUI

struct CommitteesView: View {
    @State private var memberships: [CommitteeMembership] = []
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView().padding()
                } else if let error = error {
                    ContentUnavailableView("Couldn't load committees",
                                           systemImage: "exclamationmark.triangle",
                                           description: Text(error))
                } else if memberships.isEmpty {
                    ContentUnavailableView("Not on any committees yet",
                                           systemImage: "person.3",
                                           description: Text("Ask an admin to add you, or sign in on the web to join."))
                } else {
                    List(memberships) { m in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(m.committee.name).font(.headline)
                            Text(m.role.capitalized).font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    .refreshable { await load() }
                }
            }
            .navigationTitle("Committees")
            .task { await load() }
        }
    }

    func load() async {
        loading = true
        error = nil
        do {
            memberships = try await APIClient.shared.committees()
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
        loading = false
    }
}
