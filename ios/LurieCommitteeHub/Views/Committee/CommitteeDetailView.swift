import SwiftUI

struct CommitteeDetailView: View {
    @EnvironmentObject var authManager: AuthManager
    @State var committee: Committee
    let onRefresh: () async -> Void
    @State private var activeTab: CommitteeTab = .overview

    enum CommitteeTab: String, CaseIterable {
        case overview = "Overview"
        case members = "Members"
        case calendar = "Calendar"
        case discussion = "Discussion"
        case tasks = "Tasks"
        case files = "Files"

        var icon: String {
            switch self {
            case .overview: return "square.grid.2x2"
            case .members: return "person.3"
            case .calendar: return "calendar"
            case .discussion: return "bubble.left.and.bubble.right"
            case .tasks: return "chart.bar"
            case .files: return "doc"
            }
        }
    }

    private var colors: CommitteeColors {
        CommitteeColors.forSlug(committee.slug)
    }

    private var isMember: Bool {
        committee.members.contains { $0.user.id == authManager.currentUser?.id }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Tab bar
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(CommitteeTab.allCases, id: \.self) { tab in
                        Button {
                            withAnimation(.easeInOut(duration: 0.15)) { activeTab = tab }
                        } label: {
                            VStack(spacing: 6) {
                                HStack(spacing: 4) {
                                    Image(systemName: tab.icon)
                                        .font(.system(size: 11))
                                    Text(tab.rawValue)
                                        .font(.system(size: 12, weight: .semibold))
                                }
                                .foregroundStyle(activeTab == tab ? colors.accent : .secondary)
                                .padding(.horizontal, 12)

                                Rectangle()
                                    .fill(activeTab == tab ? colors.accent : .clear)
                                    .frame(height: 2)
                            }
                        }
                    }
                }
            }
            .background(.background)
            .overlay(alignment: .bottom) { Divider() }

            // Tab content
            ScrollView {
                switch activeTab {
                case .overview:
                    OverviewTab(committee: committee, colors: colors, isMember: isMember, onJoin: handleJoin, onLeave: handleLeave)
                case .members:
                    MembersTab(members: committee.members, accentColor: colors.accent)
                case .calendar:
                    CommitteeCalendarTab(events: committee.events, accentColor: colors.accent, committeeId: committee.id, onRefresh: refresh)
                case .discussion:
                    CommitteeDiscussionsTab(discussions: committee.discussions, committeeId: committee.id, accentColor: colors.accent, onRefresh: refresh)
                case .tasks:
                    CommitteeTasksTab(committeeId: committee.id, members: committee.members, colors: colors, isMember: isMember)
                case .files:
                    CommitteeFilesTab(committeeId: committee.id, accentColor: colors.accent)
                }
            }
        }
        .navigationTitle(committee.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !isMember {
                ToolbarItem(placement: .primaryAction) {
                    Button("Join") { Task { await handleJoin() } }
                        .font(.subheadline).bold()
                        .foregroundStyle(colors.accent)
                }
            }
        }
    }

    private func handleJoin() async {
        try? await APIService.shared.joinCommittee(committeeId: committee.id)
        await refresh()
    }

    private func handleLeave() async {
        try? await APIService.shared.leaveCommittee(committeeId: committee.id)
        await refresh()
    }

    private func refresh() async {
        await onRefresh()
        if let updated = try? await APIService.shared.fetchCommittees().first(where: { $0.id == committee.id }) {
            committee = updated
        }
    }
}

// MARK: - Overview Tab

struct OverviewTab: View {
    let committee: Committee
    let colors: CommitteeColors
    let isMember: Bool
    let onJoin: () async -> Void
    let onLeave: () async -> Void

    var body: some View {
        VStack(spacing: 16) {
            // Description
            VStack(alignment: .leading, spacing: 8) {
                Text("About")
                    .font(.subheadline).bold()
                Text(committee.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(.background)
            .cornerRadius(14)

            // Quick stats
            HStack(spacing: 12) {
                StatCard(title: "Members", value: "\(committee._count.members)", icon: "person.3", color: colors.accent)
                StatCard(title: "Events", value: "\(committee._count.events)", icon: "calendar", color: .orange)
                StatCard(title: "Discussions", value: "\(committee._count.discussions)", icon: "bubble.left", color: .purple)
            }

            // Members preview
            VStack(alignment: .leading, spacing: 10) {
                Text("Members")
                    .font(.subheadline).bold()

                ForEach(committee.members.prefix(5)) { member in
                    HStack(spacing: 10) {
                        AvatarView(name: member.user.name, size: 32, color: colors.accent)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(member.user.name)
                                .font(.subheadline).bold()
                            Text(member.role.capitalized)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                }

                if committee.members.count > 5 {
                    Text("+ \(committee.members.count - 5) more")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(14)
            .background(.background)
            .cornerRadius(14)

            // Join/Leave
            if isMember {
                Button(role: .destructive) {
                    Task { await onLeave() }
                } label: {
                    Text("Leave Committee")
                        .font(.subheadline).bold()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.bordered)
            } else {
                Button {
                    Task { await onJoin() }
                } label: {
                    Text("Join Committee")
                        .font(.subheadline).bold()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(colors.accent)
                        .foregroundStyle(.white)
                        .cornerRadius(10)
                }
            }
        }
        .padding(16)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(color)
            Text(value)
                .font(.title3).bold()
            Text(title)
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(.background)
        .cornerRadius(12)
    }
}

// MARK: - Members Tab

struct MembersTab: View {
    let members: [CommitteeMember]
    let accentColor: Color

    var body: some View {
        VStack(spacing: 0) {
            ForEach(members) { member in
                HStack(spacing: 12) {
                    AvatarView(name: member.user.name, size: 40, color: accentColor)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(member.user.name)
                            .font(.subheadline).bold()
                        Text(member.user.email)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(member.role.capitalized)
                        .font(.caption2).bold()
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(accentColor.opacity(0.1))
                        .foregroundStyle(accentColor)
                        .cornerRadius(6)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)

                if member.id != members.last?.id {
                    Divider().padding(.leading, 68)
                }
            }
        }
        .background(.background)
        .cornerRadius(14)
        .padding(16)
    }
}

// MARK: - Calendar Tab

struct CommitteeCalendarTab: View {
    let events: [Event]
    let accentColor: Color
    let committeeId: String
    let onRefresh: () async -> Void
    @State private var showEventForm = false
    @State private var eventTitle = ""
    @State private var eventDate = Date()
    @State private var eventDuration = 60
    @State private var eventMeetingUrl = ""

    private var sortedEvents: [Event] {
        events.sorted { $0.startDate < $1.startDate }
    }

    var body: some View {
        VStack(spacing: 12) {
            Button {
                showEventForm.toggle()
            } label: {
                Label("New Event", systemImage: "plus")
                    .font(.subheadline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(accentColor)
            .padding(.horizontal, 16)
            .padding(.top, 16)

            if events.isEmpty {
                ContentUnavailableView("No Events", systemImage: "calendar", description: Text("Create an event to get started"))
                    .padding(.top, 20)
            } else {
                ForEach(sortedEvents) { event in
                    HStack(spacing: 12) {
                        VStack(spacing: 2) {
                            Text(event.startDate.formatted(.dateTime.month(.abbreviated)))
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(accentColor)
                                .textCase(.uppercase)
                            Text(event.startDate.formatted(.dateTime.day()))
                                .font(.title2).bold()
                        }
                        .frame(width: 50, height: 50)
                        .background(accentColor.opacity(0.08))
                        .cornerRadius(10)

                        VStack(alignment: .leading, spacing: 3) {
                            Text(event.title)
                                .font(.subheadline).bold()
                            Text("\(event.startDate.formatted(.dateTime.hour().minute())) - \(event.endDate.formatted(.dateTime.hour().minute()))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        if let url = event.meetingUrl, !url.isEmpty {
                            Link(destination: URL(string: url)!) {
                                Image(systemName: "video")
                                    .font(.caption)
                                    .padding(8)
                                    .background(accentColor.opacity(0.1))
                                    .foregroundStyle(accentColor)
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                }
            }

            Spacer(minLength: 20)
        }
        .sheet(isPresented: $showEventForm) {
            NavigationStack {
                Form {
                    TextField("Event title", text: $eventTitle)
                    DatePicker("Date & Time", selection: $eventDate)
                    Stepper("Duration: \(eventDuration) min", value: $eventDuration, in: 15...480, step: 15)
                    TextField("Meeting URL (optional)", text: $eventMeetingUrl)
                        .textContentType(.URL)
                        .autocapitalization(.none)
                }
                .navigationTitle("New Event")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { showEventForm = false }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Create") { createEvent() }
                            .disabled(eventTitle.isEmpty)
                    }
                }
            }
            .presentationDetents([.medium])
        }
    }

    private func createEvent() {
        let endDate = Calendar.current.date(byAdding: .minute, value: eventDuration, to: eventDate)!
        var params: [String: Any] = [
            "committeeId": committeeId,
            "title": eventTitle,
            "startTime": ISO8601DateFormatter().string(from: eventDate),
            "endTime": ISO8601DateFormatter().string(from: endDate),
            "duration": eventDuration,
        ]
        if !eventMeetingUrl.isEmpty { params["meetingUrl"] = eventMeetingUrl }
        Task {
            try? await APIService.shared.createEvent(params: params)
            eventTitle = ""
            eventMeetingUrl = ""
            showEventForm = false
            await onRefresh()
        }
    }
}

// MARK: - Discussions Tab

struct CommitteeDiscussionsTab: View {
    let discussions: [Discussion]
    let committeeId: String
    let accentColor: Color
    let onRefresh: () async -> Void
    @State private var newTitle = ""
    @State private var selectedDiscussion: Discussion?

    var body: some View {
        VStack(spacing: 12) {
            // New discussion
            HStack {
                TextField("Start a discussion...", text: $newTitle)
                    .textFieldStyle(.roundedBorder)
                    .font(.subheadline)
                Button {
                    guard !newTitle.isEmpty else { return }
                    Task {
                        try? await APIService.shared.createDiscussion(title: newTitle, committeeId: committeeId)
                        newTitle = ""
                        await onRefresh()
                    }
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundStyle(accentColor)
                }
                .disabled(newTitle.isEmpty)
            }
            .padding(16)

            if discussions.isEmpty {
                ContentUnavailableView("No Discussions", systemImage: "bubble.left.and.bubble.right", description: Text("Start a discussion above"))
                    .padding(.top, 20)
            } else {
                ForEach(discussions) { disc in
                    Button { selectedDiscussion = disc } label: {
                        HStack(spacing: 10) {
                            if disc.isPinned {
                                Image(systemName: "pin.fill")
                                    .font(.caption2)
                                    .foregroundStyle(.orange)
                            }
                            VStack(alignment: .leading, spacing: 3) {
                                Text(disc.title)
                                    .font(.subheadline).bold()
                                    .foregroundStyle(.primary)
                                    .lineLimit(1)
                                HStack(spacing: 4) {
                                    Text(disc.author.name)
                                    if let count = disc._count?.posts {
                                        Text("· \(count) replies")
                                    }
                                }
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.quaternary)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                    }
                    Divider().padding(.leading, 16)
                }
            }
        }
        .sheet(item: $selectedDiscussion) { disc in
            DiscussionDetailSheet(discussionId: disc.id, title: disc.title, accentColor: accentColor)
        }
    }
}

extension Discussion: Hashable {
    static func == (lhs: Discussion, rhs: Discussion) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

// MARK: - Discussion Detail Sheet

struct DiscussionDetailSheet: View {
    let discussionId: String
    let title: String
    let accentColor: Color
    @State private var posts: [Post] = []
    @State private var replyText = ""
    @State private var loading = true
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if loading {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(posts) { post in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(post.author.name)
                                            .font(.caption).bold()
                                        Spacer()
                                        Text(formatDate(post.createdAt))
                                            .font(.caption2)
                                            .foregroundStyle(.tertiary)
                                    }
                                    Text(post.body)
                                        .font(.subheadline)
                                }
                                .padding(14)
                                Divider()
                            }
                        }
                    }

                    Divider()
                    HStack {
                        TextField("Reply...", text: $replyText)
                            .textFieldStyle(.roundedBorder)
                        Button {
                            guard !replyText.isEmpty else { return }
                            Task {
                                try? await APIService.shared.replyToDiscussion(id: discussionId, body: replyText)
                                replyText = ""
                                await loadPosts()
                            }
                        } label: {
                            Image(systemName: "paperplane.fill")
                                .foregroundStyle(accentColor)
                        }
                        .disabled(replyText.isEmpty)
                    }
                    .padding(12)
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .task { await loadPosts() }
        }
    }

    private func loadPosts() async {
        if let detail = try? await APIService.shared.fetchDiscussion(id: discussionId) {
            posts = detail.posts
        }
        loading = false
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) else { return "" }
        let relative = RelativeDateTimeFormatter()
        relative.unitsStyle = .short
        return relative.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Tasks Tab

struct CommitteeTasksTab: View {
    let committeeId: String
    let members: [CommitteeMember]
    let colors: CommitteeColors
    let isMember: Bool
    @State private var tasks: [TaskItem] = []
    @State private var loading = true
    @State private var showNewTask = false
    @State private var newTitle = ""
    @State private var newStart = Date()
    @State private var newEnd = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
    @State private var newPriority = "medium"

    var body: some View {
        VStack(spacing: 12) {
            if isMember {
                Button { showNewTask.toggle() } label: {
                    Label("New Task", systemImage: "plus")
                        .font(.subheadline).bold()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                }
                .buttonStyle(.bordered)
                .tint(colors.accent)
                .padding(.horizontal, 16)
                .padding(.top, 16)
            }

            if loading {
                ProgressView().padding(.top, 40)
            } else if tasks.isEmpty {
                ContentUnavailableView("No Tasks", systemImage: "chart.bar", description: Text("Create a task to get started"))
                    .padding(.top, 20)
            } else {
                ForEach(tasks) { task in
                    TaskRowView(task: task, accentColor: colors.accent) {
                        await loadTasks()
                    }
                }
                .padding(.horizontal, 16)
            }

            Spacer(minLength: 20)
        }
        .task { await loadTasks() }
        .sheet(isPresented: $showNewTask) {
            NavigationStack {
                Form {
                    TextField("Task title", text: $newTitle)
                    DatePicker("Start", selection: $newStart, displayedComponents: .date)
                    DatePicker("End", selection: $newEnd, displayedComponents: .date)
                    Picker("Priority", selection: $newPriority) {
                        Text("Low").tag("low")
                        Text("Medium").tag("medium")
                        Text("High").tag("high")
                    }
                }
                .navigationTitle("New Task")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showNewTask = false } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Create") {
                            Task {
                                let params: [String: Any] = [
                                    "committeeId": committeeId,
                                    "title": newTitle,
                                    "startDate": ISO8601DateFormatter().string(from: newStart),
                                    "endDate": ISO8601DateFormatter().string(from: newEnd),
                                    "priority": newPriority,
                                ]
                                _ = try? await APIService.shared.createTask(params)
                                newTitle = ""
                                showNewTask = false
                                await loadTasks()
                            }
                        }
                        .disabled(newTitle.isEmpty)
                    }
                }
            }
            .presentationDetents([.medium])
        }
    }

    private func loadTasks() async {
        tasks = (try? await APIService.shared.fetchTasks(committeeId: committeeId)) ?? []
        loading = false
    }
}

struct TaskRowView: View {
    let task: TaskItem
    let accentColor: Color
    let onUpdate: () async -> Void

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

    private var priorityIcon: String {
        switch task.priority {
        case "high": return "arrow.up"
        case "low": return "arrow.down"
        default: return "arrow.right"
        }
    }

    var body: some View {
        HStack(spacing: 10) {
            Button {
                let next = cycleStatus(task.status)
                Task {
                    _ = try? await APIService.shared.updateTask(id: task.id, params: ["status": next])
                    await onUpdate()
                }
            } label: {
                Image(systemName: statusIcon)
                    .font(.system(size: 18))
                    .foregroundStyle(statusColor)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(task.title)
                    .font(.subheadline).bold()
                    .strikethrough(task.status == "done")
                HStack(spacing: 6) {
                    Image(systemName: priorityIcon)
                        .font(.system(size: 8))
                    Text("\(task.start.formatted(.dateTime.month(.abbreviated).day())) - \(task.end.formatted(.dateTime.month(.abbreviated).day()))")
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
            }

            Spacer()

            if task.progress > 0 {
                Text("\(task.progress)%")
                    .font(.caption2).bold()
                    .foregroundStyle(accentColor)
            }

            if let assignee = task.assignee {
                AvatarView(name: assignee.name, size: 24, color: accentColor)
            }
        }
        .padding(12)
        .background(.background)
        .cornerRadius(10)
    }

    private func cycleStatus(_ current: String) -> String {
        switch current {
        case "todo": return "in-progress"
        case "in-progress": return "review"
        case "review": return "done"
        default: return "todo"
        }
    }
}

// MARK: - Files Tab

struct CommitteeFilesTab: View {
    let committeeId: String
    let accentColor: Color
    @State private var files: [CommitteeFile] = []
    @State private var loading = true
    @State private var showAddFile = false
    @State private var newTitle = ""
    @State private var newUrl = ""

    var body: some View {
        VStack(spacing: 12) {
            Button { showAddFile.toggle() } label: {
                Label("Add File", systemImage: "plus")
                    .font(.subheadline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(accentColor)
            .padding(.horizontal, 16)
            .padding(.top, 16)

            if loading {
                ProgressView().padding(.top, 40)
            } else if files.isEmpty {
                ContentUnavailableView("No Files", systemImage: "doc", description: Text("Add Google Docs, Sheets, and more"))
                    .padding(.top, 20)
            } else {
                ForEach(files) { file in
                    Link(destination: URL(string: file.url) ?? URL(string: "https://example.com")!) {
                        HStack(spacing: 12) {
                            Image(systemName: fileIcon(for: file.type))
                                .font(.title3)
                                .foregroundStyle(fileColor(for: file.type))
                                .frame(width: 36)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(file.title)
                                    .font(.subheadline).bold()
                                    .foregroundStyle(.primary)
                                    .lineLimit(1)
                                Text("Added by \(file.addedBy.name)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                    }
                    Divider().padding(.leading, 64)
                }
            }

            Spacer(minLength: 20)
        }
        .task { await loadFiles() }
        .sheet(isPresented: $showAddFile) {
            NavigationStack {
                Form {
                    TextField("File name", text: $newTitle)
                    TextField("URL (Google Docs, Sheets, etc.)", text: $newUrl)
                        .textContentType(.URL)
                        .autocapitalization(.none)
                }
                .navigationTitle("Add File")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showAddFile = false } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Add") {
                            Task {
                                try? await APIService.shared.addFile(committeeId: committeeId, title: newTitle, url: newUrl)
                                newTitle = ""
                                newUrl = ""
                                showAddFile = false
                                await loadFiles()
                            }
                        }
                        .disabled(newTitle.isEmpty || newUrl.isEmpty)
                    }
                }
            }
            .presentationDetents([.medium])
        }
    }

    private func loadFiles() async {
        files = (try? await APIService.shared.fetchFiles(committeeId: committeeId)) ?? []
        loading = false
    }

    private func fileIcon(for type: String) -> String {
        switch type {
        case "google-doc": return "doc.text"
        case "google-sheet": return "tablecells"
        case "google-slides": return "rectangle.split.3x1"
        case "google-form": return "list.clipboard"
        case "google-drive": return "folder"
        case "notion": return "doc.richtext"
        case "figma": return "paintbrush.pointed"
        default: return "link"
        }
    }

    private func fileColor(for type: String) -> Color {
        switch type {
        case "google-doc": return Color(hex: "#4285F4")
        case "google-sheet": return Color(hex: "#0F9D58")
        case "google-slides": return Color(hex: "#F4B400")
        case "google-form": return Color(hex: "#7627BB")
        case "google-drive": return Color(hex: "#4285F4")
        case "figma": return Color(hex: "#F24E1E")
        default: return .gray
        }
    }
}
