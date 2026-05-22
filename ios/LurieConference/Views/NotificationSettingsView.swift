import SwiftUI

private let leadOptions: [(String, Int)] = [
    ("5 min", 5), ("15 min", 15), ("30 min", 30),
    ("1 hr", 60), ("2 hr", 120), ("1 day", 1440),
    ("2 days", 2880), ("1 week", 10080)
]

private let dayKeys: [(String, String)] = [
    ("sun", "Sun"), ("mon", "Mon"), ("tue", "Tue"),
    ("wed", "Wed"), ("thu", "Thu"), ("fri", "Fri"), ("sat", "Sat")
]

private let scopeOptions: [(String, String)] = [
    ("all", "All posts in my committees"),
    ("subscribed", "Threads I'm in or follow"),
    ("mentions", "Only when I'm @mentioned"),
    ("none", "Off")
]

struct NotificationSettingsView: View {
    @State private var settings: NotificationSettings = .default
    @State private var devices: [DeviceItem] = []
    @State private var loading = true
    @State private var saving = false
    @State private var savedAt: Date?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Devices") {
                    if devices.isEmpty {
                        Text("No devices registered yet. Granting notification permission will register this device.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(devices) { d in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(d.deviceName ?? d.platform.uppercased())
                                    Text("Last seen \(d.lastSeenAt.prefix(10))")
                                        .font(.caption2).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Button(role: .destructive) {
                                    Task {
                                        try? await APIClient.shared.deleteDevice(d.id)
                                        await load()
                                    }
                                } label: {
                                    Image(systemName: "trash")
                                }
                                .buttonStyle(.borderless)
                            }
                        }
                    }
                    Button {
                        Task {
                            await PushManager.shared.requestAndRegister()
                            try? await Task.sleep(nanoseconds: 800_000_000)
                            await load()
                        }
                    } label: {
                        Label("Enable / refresh push", systemImage: "bell.badge")
                    }
                    Button {
                        Task {
                            try? await APIClient.shared.sendTestPush()
                        }
                    } label: {
                        Label("Send test notification", systemImage: "paperplane")
                    }
                    .disabled(devices.isEmpty)
                }

                Section("Committee events") {
                    Toggle("Notify me about upcoming events", isOn: $settings.events.enabled)
                    if settings.events.enabled {
                        leadTimePicker(selected: $settings.events.leadTimesMinutes)
                    }
                }

                Section("Task deadlines") {
                    Toggle("Notify me about task deadlines", isOn: $settings.tasks.enabled)
                    if settings.tasks.enabled {
                        leadTimePicker(selected: $settings.tasks.leadTimesMinutes)
                        Toggle("Only tasks assigned to me", isOn: $settings.tasks.onlyMyTasks)
                        Toggle("When a task is assigned to me", isOn: $settings.tasks.onAssigned)
                        Toggle("When status changes", isOn: $settings.tasks.onStatusChange)
                    }
                }

                Section("Discussions") {
                    Toggle("Notify me about discussion posts", isOn: $settings.discussions.enabled)
                    if settings.discussions.enabled {
                        Picker("Scope", selection: $settings.discussions.scope) {
                            ForEach(scopeOptions, id: \.0) { Text($0.1).tag($0.0) }
                        }
                    }
                }

                Section("Admin broadcasts") {
                    Toggle("Receive admin broadcasts", isOn: $settings.broadcast.enabled)
                    Text("Broadcasts bypass quiet hours and muted days.")
                        .font(.caption).foregroundStyle(.secondary)
                }

                Section("Quiet hours") {
                    Toggle("Enable quiet hours", isOn: $settings.quietHours.enabled)
                    if settings.quietHours.enabled {
                        Stepper("From \(settings.quietHours.startHour):00",
                                value: $settings.quietHours.startHour, in: 0...23)
                        Stepper("Until \(settings.quietHours.endHour):00",
                                value: $settings.quietHours.endHour, in: 0...23)
                    }
                    DayPicker(selected: $settings.mutedDays)
                }

                if let error = error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Alerts")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(saving ? "Saving..." : "Save") {
                        Task { await save() }
                    }
                    .disabled(saving)
                }
            }
            .task { await load() }
            .refreshable { await load() }
            .overlay(alignment: .top) {
                if let at = savedAt, Date().timeIntervalSince(at) < 2 {
                    Text("Saved")
                        .font(.footnote).fontWeight(.semibold)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(.green.opacity(0.18), in: Capsule())
                        .padding(.top, 6)
                }
            }
        }
    }

    func load() async {
        loading = true
        error = nil
        do {
            async let s = APIClient.shared.getPreferences()
            async let d = APIClient.shared.devices()
            settings = try await s
            devices = try await d
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
        loading = false
    }

    func save() async {
        saving = true
        error = nil
        do {
            settings = try await APIClient.shared.putPreferences(settings)
            savedAt = Date()
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
        saving = false
    }
}

private func leadTimePicker(selected: Binding<[Int]>) -> some View {
    VStack(alignment: .leading, spacing: 8) {
        Text("Remind me")
            .font(.caption).fontWeight(.semibold)
            .foregroundStyle(.secondary)
        FlexibleChipGrid(items: leadOptions, isSelected: { selected.wrappedValue.contains($0.1) }) { opt in
            var next = selected.wrappedValue
            if next.contains(opt.1) { next.removeAll { $0 == opt.1 } }
            else { next.append(opt.1); next.sort() }
            selected.wrappedValue = next
        }
    }
    .padding(.vertical, 4)
}

private struct DayPicker: View {
    @Binding var selected: [String]
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Mute on").font(.caption).fontWeight(.semibold).foregroundStyle(.secondary)
            FlexibleChipGrid(items: dayKeys, isSelected: { selected.contains($0.0) }) { d in
                if selected.contains(d.0) { selected.removeAll { $0 == d.0 } }
                else { selected.append(d.0) }
            }
        }
        .padding(.vertical, 4)
    }
}

private struct FlexibleChipGrid<T>: View {
    let items: [T]
    let isSelected: (T) -> Bool
    let onTap: (T) -> Void

    var body: some View {
        let columns = [GridItem(.adaptive(minimum: 80), spacing: 8, alignment: .leading)]
        LazyVGrid(columns: columns, alignment: .leading, spacing: 8) {
            ForEach(items.indices, id: \.self) { i in
                chip(items[i])
            }
        }
    }

    @ViewBuilder private func chip(_ item: T) -> some View {
        let label = (item as? (String, Int)).map { $0.0 } ?? (item as? (String, String))?.1 ?? ""
        let on = isSelected(item)
        Button {
            onTap(item)
        } label: {
            Text(label)
                .font(.caption).fontWeight(.semibold)
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(on ? Color.accentColor.opacity(0.18) : Color(.secondarySystemBackground),
                            in: Capsule())
                .foregroundStyle(on ? Color.accentColor : Color.primary)
        }
        .buttonStyle(.plain)
    }
}
