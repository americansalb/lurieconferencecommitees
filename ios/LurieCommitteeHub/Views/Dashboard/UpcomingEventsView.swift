import SwiftUI

struct UpcomingEventsView: View {
    let events: [(Event, Committee)]

    private var eventsByDate: [(String, [(Event, Committee)])] {
        var grouped: [String: [(Event, Committee)]] = [:]
        var order: [String] = []
        for (event, committee) in events.prefix(20) {
            let key = event.startDate.formatted(.dateTime.weekday(.wide).month(.long).day())
            if grouped[key] == nil { order.append(key) }
            grouped[key, default: []].append((event, committee))
        }
        return order.map { ($0, grouped[$0]!) }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label("Upcoming Events", systemImage: "calendar")
                    .font(.subheadline).bold()
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            Divider()

            if events.isEmpty {
                VStack(spacing: 6) {
                    Image(systemName: "calendar")
                        .font(.title2)
                        .foregroundStyle(.quaternary)
                    Text("No upcoming events")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity, minHeight: 80)
            } else {
                VStack(spacing: 0) {
                    ForEach(eventsByDate.prefix(5), id: \.0) { dateLabel, dayEvents in
                        VStack(spacing: 0) {
                            HStack {
                                Text(dateLabel.uppercased())
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(.tertiary)
                                    .tracking(0.5)
                                Spacer()
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(Color(UIColor.secondarySystemGroupedBackground))

                            ForEach(dayEvents, id: \.0.id) { event, committee in
                                EventRow(event: event, committee: committee)
                                Divider().padding(.leading, 76)
                            }
                        }
                    }
                }
            }
        }
        .background(.background)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}

struct EventRow: View {
    let event: Event
    let committee: Committee

    private var colors: CommitteeColors {
        CommitteeColors.forSlug(committee.slug)
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 2) {
                Text(event.startDate.formatted(.dateTime.hour(.defaultDigits(amPM: .abbreviated)).minute()))
                    .font(.system(size: 13, weight: .bold))
                Text(event.endDate.formatted(.dateTime.hour(.defaultDigits(amPM: .abbreviated)).minute()))
                    .font(.system(size: 10))
                    .foregroundStyle(.tertiary)
            }
            .frame(width: 56)

            RoundedRectangle(cornerRadius: 2)
                .fill(colors.accent)
                .frame(width: 3, height: 32)

            VStack(alignment: .leading, spacing: 3) {
                Text(event.title)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(1)

                Text(committee.name)
                    .font(.system(size: 10, weight: .medium))
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(Color(UIColor.secondarySystemFill))
                    .cornerRadius(4)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if let url = event.meetingUrl, !url.isEmpty {
                Link(destination: URL(string: url) ?? URL(string: "https://example.com")!) {
                    Text("Join")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Color(hex: "#3b82f6"))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color(hex: "#3b82f6").opacity(0.08))
                        .cornerRadius(8)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
    }
}
