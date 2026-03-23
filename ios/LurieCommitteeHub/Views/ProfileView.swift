import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var notificationManager: NotificationManager
    @State private var showLogoutConfirm = false

    var body: some View {
        NavigationStack {
            List {
                // User info
                Section {
                    HStack(spacing: 14) {
                        AvatarView(
                            name: authManager.currentUser?.name ?? "?",
                            size: 56,
                            color: Color(hex: "#3b82f6")
                        )
                        VStack(alignment: .leading, spacing: 3) {
                            Text(authManager.currentUser?.name ?? "")
                                .font(.headline)
                            Text(authManager.currentUser?.email ?? "")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let role = authManager.currentUser?.role {
                                Text(role.capitalized)
                                    .font(.caption2).bold()
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundStyle(.blue)
                                    .cornerRadius(4)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                // App info
                Section("App") {
                    HStack {
                        Label("Version", systemImage: "info.circle")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Label("Notifications", systemImage: "bell")
                        Spacer()
                        Text(notificationManager.permissionGranted ? "Enabled" : "Disabled")
                            .foregroundStyle(notificationManager.permissionGranted ? .green : .secondary)
                    }

                    if !notificationManager.permissionGranted {
                        Button {
                            notificationManager.requestPermission()
                        } label: {
                            Label("Enable Notifications", systemImage: "bell.badge")
                        }
                    }
                }

                // Conference info
                Section("Conference 2026") {
                    HStack {
                        Label("Date", systemImage: "calendar")
                        Spacer()
                        Text("August 15-16, 2026")
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        Label("Location", systemImage: "mappin")
                        Spacer()
                        Text("Lurie Children's")
                            .foregroundStyle(.secondary)
                    }
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        showLogoutConfirm = true
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Profile")
            .confirmationDialog("Sign out?", isPresented: $showLogoutConfirm, titleVisibility: .visible) {
                Button("Sign Out", role: .destructive) {
                    Task { await authManager.logout() }
                }
            }
        }
    }
}
