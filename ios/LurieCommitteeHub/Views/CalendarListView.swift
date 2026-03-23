import SwiftUI

struct CalendarListView: View {
    @State private var committees: [Committee] = []
    @State private var loading = true

    private var allEvents: [(Event, Committee)] {
        committees.flatMap { c in
            c.events.map { ($0, c) }
        }.sorted { $0.0.startDate < $1.0.startDate }
    }

    private var upcomingEvents: [(Event, Committee)] {
        allEvents.filter { $0.0.startDate >= Calendar.current.startOfDay(for: Date()) }
    }

    private var pastEvents: [(Event, Committee)] {
        allEvents.filter { $0.0.startDate < Calendar.current.startOfDay(for: Date()) }.reversed()
    }

    var body: some View {
        NavigationStack {
            List {
                if loading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .listRowSeparator(.hidden)
                } else if allEvents.isEmpty {
                    ContentUnavailableView("No Events", systemImage: "calendar", description: Text("Events will appear here when created"))
                        .listRowSeparator(.hidden)
                } else {
                    if !upcomingEvents.isEmpty {
                        Section("Upcoming") {
                            ForEach(upcomingEvents, id: \.0.id) { event, committee in
                                CalendarEventRow(event: event, committee: committee)
                            }
                        }
                    }

                    if !pastEvents.isEmpty {
                        Section("Past") {
                            ForEach(pastEvents.prefix(10), id: \.0.id) { event, committee in
                                CalendarEventRow(event: event, committee: committee)
                                    .opacity(0.6)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Calendar")
            .refreshable { await load() }
            .task { await load() }
        }
    }

    private func load() async {
        committees = (try? await APIService.shared.fetchCommittees()) ?? []
        loading = false
    }
}

struct CalendarEventRow: View {
    let event: Event
    let committee: Committee

    private var colors: CommitteeColors {
        CommitteeColors.forSlug(committee.slug)
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 1) {
                Text(event.startDate.formatted(.dateTime.month(.abbreviated)))
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(colors.accent)
                    .textCase(.uppercase)
                Text(event.startDate.formatted(.dateTime.day()))
                    .font(.title3).bold()
            }
            .frame(width: 44, height: 44)
            .background(colors.accent.opacity(0.08))
            .cornerRadius(8)

            VStack(alignment: .leading, spacing: 3) {
                Text(event.title)
                    .font(.subheadline).bold()
                HStack(spacing: 4) {
                    Text(event.startDate.formatted(.dateTime.hour().minute()))
                    Text("-")
                    Text(event.endDate.formatted(.dateTime.hour().minute()))
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                Text(committee.name)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            if let url = event.meetingUrl, !url.isEmpty, let linkUrl = URL(string: url) {
                Link(destination: linkUrl) {
                    Image(systemName: "video.fill")
                        .font(.caption)
                        .padding(8)
                        .background(colors.accent.opacity(0.1))
                        .foregroundStyle(colors.accent)
                        .cornerRadius(8)
                }
            }
        }
    }
}
