import SwiftUI
import UserNotifications

struct ProfileView: View {
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var push: PushManager

    var body: some View {
        NavigationStack {
            Form {
                Section("Signed in as") {
                    if let u = auth.user {
                        LabeledContent("Name", value: u.name)
                        LabeledContent("Email", value: u.email)
                        LabeledContent("Role", value: u.role.capitalized)
                        LabeledContent("Timezone", value: u.timezone)
                    } else {
                        Text("Loading...")
                    }
                }
                Section("Push status") {
                    LabeledContent("Permission", value: pushAuthLabel(push.authorizationStatus))
                    LabeledContent("APNs token", value: push.lastToken == nil ? "—" : String(push.lastToken!.prefix(12)) + "…")
                    if let err = push.lastError {
                        Text(err).font(.footnote).foregroundStyle(.red)
                    }
                }
                Section {
                    Button(role: .destructive) {
                        Task { await auth.signOut() }
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

private func pushAuthLabel(_ s: UNAuthorizationStatus) -> String {
    switch s {
    case .authorized: return "Allowed"
    case .denied: return "Denied"
    case .ephemeral: return "Ephemeral"
    case .provisional: return "Provisional"
    case .notDetermined: return "Not asked"
    @unknown default: return "Unknown"
    }
}
