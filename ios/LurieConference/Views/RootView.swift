import SwiftUI

struct RootView: View {
    @EnvironmentObject var auth: AuthStore

    var body: some View {
        Group {
            if auth.isAuthenticated {
                MainTabsView()
                    .task {
                        await auth.refreshMe()
                        await PushManager.shared.requestAndRegister()
                    }
            } else {
                LoginView()
            }
        }
    }
}

struct MainTabsView: View {
    var body: some View {
        TabView {
            FeedView()
                .tabItem { Label("Feed", systemImage: "bell.badge") }
            CommitteesView()
                .tabItem { Label("Committees", systemImage: "person.3") }
            NotificationSettingsView()
                .tabItem { Label("Alerts", systemImage: "bell.badge.fill") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
    }
}
