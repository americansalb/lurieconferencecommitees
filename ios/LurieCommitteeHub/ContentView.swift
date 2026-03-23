import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var notificationManager: NotificationManager

    var body: some View {
        Group {
            if authManager.isLoading {
                LaunchScreenView()
            } else if authManager.isAuthenticated {
                MainTabView()
                    .onAppear {
                        notificationManager.requestPermission()
                    }
            } else {
                LoginView()
            }
        }
        .task {
            await authManager.checkSession()
        }
    }
}

struct LaunchScreenView: View {
    var body: some View {
        ZStack {
            Color(hex: "#0f172a").ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "building.2")
                    .font(.system(size: 48))
                    .foregroundStyle(.white)
                Text("Committee Hub")
                    .font(.title2).bold()
                    .foregroundStyle(.white)
                ProgressView()
                    .tint(.white)
            }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2")
                }

            CalendarListView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }

            GlobalDiscussionsView()
                .tabItem {
                    Label("Discussions", systemImage: "bubble.left.and.bubble.right")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
        }
        .tint(Color(hex: "#3b82f6"))
    }
}
