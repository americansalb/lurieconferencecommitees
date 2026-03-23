import SwiftUI

struct TaskTimelineView: View {
    let userId: String

    @State private var tasks: [TaskItem] = []
    @State private var loading = true
    @State private var filter: TaskFilter = .all
    @State private var weekOffset = 0

    enum TaskFilter: String, CaseIterable {
        case all = "All Tasks"
        case mine = "My Tasks"
    }

    private var filteredTasks: [TaskItem] {
        let base = filter == .mine ? tasks.filter { $0.assignee?.id == userId } : tasks
        return base.sorted { $0.start < $1.start }
    }

    private var timelineStart: Date {
        Calendar.current.date(byAdding: .day, value: -14 + weekOffset * 7, to: startOfToday) ?? startOfToday
    }

    private var timelineEnd: Date {
        Calendar.current.date(byAdding: .day, value: 56, to: timelineStart) ?? startOfToday
    }

    private var startOfToday: Date {
        Calendar.current.startOfDay(for: Date())
    }

    private var weeks: [(start: Date, label: String)] {
        (0..<8).map { i in
            let start = Calendar.current.date(byAdding: .day, value: i * 7, to: timelineStart)!
            let label = start.formatted(.dateTime.month(.abbreviated).day())
            return (start, label)
        }
    }

    private var visibleTasks: [TaskItem] {
        filteredTasks.filter { task in
            task.end >= timelineStart && task.start <= timelineEnd
        }
    }

    private var statusCounts: [String: Int] {
        var counts: [String: Int] = [:]
        filteredTasks.forEach { counts[$0.status, default: 0] += 1 }
        return counts
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 10) {
                HStack {
                    Label("Task Timeline", systemImage: "chart.bar.xaxis")
                        .font(.subheadline).bold()

                    Spacer()

                    // Status pills
                    HStack(spacing: 4) {
                        StatusPill(label: "To Do", count: statusCounts["todo"] ?? 0, color: .gray)
                        StatusPill(label: "Active", count: statusCounts["in-progress"] ?? 0, color: .blue)
                        StatusPill(label: "Done", count: statusCounts["done"] ?? 0, color: .green)
                    }
                }

                HStack {
                    Picker("Filter", selection: $filter) {
                        ForEach(TaskFilter.allCases, id: \.self) { f in
                            Text(f.rawValue).tag(f)
                        }
                    }
                    .pickerStyle(.segmented)
                    .frame(maxWidth: 220)

                    Spacer()

                    HStack(spacing: 2) {
                        Button { weekOffset -= 2 } label: {
                            Image(systemName: "chevron.left")
                                .font(.caption).bold()
                                .frame(width: 28, height: 28)
                        }
                        Button("Today") { weekOffset = 0 }
                            .font(.caption2).bold()
                        Button { weekOffset += 2 } label: {
                            Image(systemName: "chevron.right")
                                .font(.caption).bold()
                                .frame(width: 28, height: 28)
                        }
                    }
                    .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            Divider()

            if loading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 80)
            } else if filteredTasks.isEmpty {
                VStack(spacing: 6) {
                    Image(systemName: "chart.bar.xaxis")
                        .font(.title2)
                        .foregroundStyle(.quaternary)
                    Text(filter == .mine ? "No tasks assigned to you" : "No tasks yet")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity, minHeight: 80)
            } else {
                // Timeline content
                ScrollView(.horizontal, showsIndicators: false) {
                    VStack(spacing: 0) {
                        // Week headers
                        HStack(spacing: 0) {
                            ForEach(weeks, id: \.label) { week in
                                Text(week.label)
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(.tertiary)
                                    .textCase(.uppercase)
                                    .frame(width: 80)
                            }
                        }
                        .padding(.vertical, 6)
                        .padding(.leading, 4)

                        Divider()

                        // Task bars
                        ForEach(visibleTasks) { task in
                            TaskBarRow(task: task, timelineStart: timelineStart, totalDays: 56)
                        }

                        if visibleTasks.isEmpty && !filteredTasks.isEmpty {
                            Text("No tasks in this date range")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                                .frame(maxWidth: .infinity, minHeight: 40)
                        }
                    }
                    .frame(minWidth: 640)
                }
            }
        }
        .background(.background)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
        .task {
            do {
                tasks = try await APIService.shared.fetchAllTasks()
            } catch { /* silent */ }
            loading = false
        }
    }
}

struct TaskBarRow: View {
    let task: TaskItem
    let timelineStart: Date
    let totalDays: Int

    private var barColor: Color {
        if let hex = task.color {
            return Color(hex: hex)
        }
        if let slug = task.committee?.slug {
            return CommitteeColors.forSlug(slug).accent
        }
        return .blue
    }

    private var statusIcon: String {
        switch task.status {
        case "done": return "checkmark.circle.fill"
        case "in-progress": return "clock.fill"
        case "review": return "exclamationmark.circle.fill"
        default: return "circle"
        }
    }

    private var statusColor: Color {
        switch task.status {
        case "done": return .green
        case "in-progress": return .blue
        case "review": return .orange
        default: return .gray
        }
    }

    private func barGeometry(totalWidth: CGFloat) -> (offset: CGFloat, width: CGFloat) {
        let dayWidth = totalWidth / CGFloat(totalDays)
        let clampStart = max(task.start, timelineStart)
        let clampEnd = min(task.end, Calendar.current.date(byAdding: .day, value: totalDays, to: timelineStart)!)
        let leftDays = Calendar.current.dateComponents([.day], from: timelineStart, to: clampStart).day ?? 0
        let widthDays = max((Calendar.current.dateComponents([.day], from: clampStart, to: clampEnd).day ?? 0) + 1, 1)
        return (CGFloat(leftDays) * dayWidth, CGFloat(widthDays) * dayWidth)
    }

    var body: some View {
        GeometryReader { geo in
            let geom = barGeometry(totalWidth: geo.size.width)

            // Bar
            HStack(spacing: 4) {
                Image(systemName: statusIcon)
                    .font(.system(size: 8))
                    .foregroundStyle(statusColor)
                Text(task.title)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(barColor)
                    .lineLimit(1)
            }
            .padding(.horizontal, 6)
            .frame(width: max(geom.width - 2, 20), height: 22)
            .background(barColor.opacity(0.12))
            .overlay(
                RoundedRectangle(cornerRadius: 5)
                    .stroke(barColor.opacity(0.25), lineWidth: 1)
            )
            .cornerRadius(5)
            .offset(x: geom.offset)
            .frame(maxHeight: .infinity, alignment: .center)
        }
        .frame(height: 34)
    }
}

struct StatusPill: View {
    let label: String
    let count: Int
    let color: Color

    var body: some View {
        if count > 0 {
            HStack(spacing: 3) {
                Circle().fill(color).frame(width: 5, height: 5)
                Text("\(count)")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(color)
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(color.opacity(0.1))
            .cornerRadius(8)
        }
    }
}
