import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var committees: [Committee] = []
    @State private var loading = true
    @State private var committeeFilter: CommitteeFilter = .all
    @State private var selectedCommittee: Committee?

    enum CommitteeFilter: String, CaseIterable {
        case all = "All Committees"
        case mine = "My Committees"
    }

    private var currentUserId: String {
        authManager.currentUser?.id ?? ""
    }

    private var displayCommittees: [Committee] {
        switch committeeFilter {
        case .all: return committees
        case .mine: return committees.filter { c in
            c.members.contains { $0.user.id == currentUserId }
        }
        }
    }

    private var totalMembers: Int {
        Set(committees.flatMap { $0.members.map(\.user.id) }).count
    }

    private var allUpcomingEvents: [(Event, Committee)] {
        committees.flatMap { c in
            c.events.compactMap { e -> (Event, Committee)? in
                guard e.startDate >= Date() else { return nil }
                return (e, c)
            }
        }.sorted { $0.0.startDate < $1.0.startDate }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Welcome
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome back, \(authManager.currentUser?.name.components(separatedBy: " ").first ?? "")")
                            .font(.title2).bold()
                        Text("\(committees.count) committees · \(totalMembers) members · \(allUpcomingEvents.count) upcoming events")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)

                    // Filter
                    Picker("Filter", selection: $committeeFilter) {
                        ForEach(CommitteeFilter.allCases, id: \.self) { f in
                            Text(f.rawValue).tag(f)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    // Committee Cards
                    if loading {
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 100)
                    } else if displayCommittees.isEmpty {
                        ContentUnavailableView(
                            committeeFilter == .mine ? "No Committees Joined" : "No Committees",
                            systemImage: "person.3",
                            description: Text(committeeFilter == .mine ? "Join a committee to get started" : "No committees have been created yet")
                        )
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(displayCommittees) { committee in
                                CommitteeCardView(
                                    committee: committee,
                                    isMember: committee.members.contains { $0.user.id == currentUserId }
                                )
                                .onTapGesture {
                                    selectedCommittee = committee
                                }
                            }
                        }
                        .padding(.horizontal)
                    }

                    // Task Timeline
                    TaskTimelineView(userId: currentUserId)
                        .padding(.horizontal)

                    // Upcoming Events
                    UpcomingEventsView(events: allUpcomingEvents)
                        .padding(.horizontal)

                    Spacer(minLength: 40)
                }
                .padding(.top)
            }
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    VStack(spacing: 0) {
                        Text("CONFERENCE 2026")
                            .font(.system(size: 9, weight: .heavy))
                            .tracking(1.5)
                            .foregroundStyle(Color(hex: "#3b82f6"))
                        Text("Committee Hub")
                            .font(.headline).bold()
                    }
                }
            }
            .refreshable {
                await loadCommittees()
            }
            .task {
                await loadCommittees()
            }
            .navigationDestination(item: $selectedCommittee) { committee in
                CommitteeDetailView(committee: committee, onRefresh: {
                    await loadCommittees()
                })
            }
        }
    }

    private func loadCommittees() async {
        do {
            committees = try await APIService.shared.fetchCommittees()
        } catch { /* silent */ }
        loading = false
    }
}

extension Committee: Hashable {
    static func == (lhs: Committee, rhs: Committee) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
