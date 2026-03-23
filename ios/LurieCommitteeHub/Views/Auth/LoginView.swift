import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var isLoggingIn = false
    @State private var showError = false

    var body: some View {
        ZStack {
            Color(hex: "#0f172a").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer().frame(height: 60)

                    // Logo
                    VStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(Color(hex: "#3b82f6").opacity(0.15))
                                .frame(width: 80, height: 80)
                            Image(systemName: "building.2")
                                .font(.system(size: 36))
                                .foregroundStyle(Color(hex: "#3b82f6"))
                        }

                        Text("CONFERENCE 2026")
                            .font(.caption)
                            .fontWeight(.heavy)
                            .tracking(2)
                            .foregroundStyle(Color(hex: "#3b82f6"))

                        Text("Committee Hub")
                            .font(.title).bold()
                            .foregroundStyle(.white)

                        Text("Aug 15-16 · Lurie Children's")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }

                    // Form
                    VStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Email")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(.gray)
                            TextField("", text: $email)
                                .textFieldStyle(.plain)
                                .keyboardType(.emailAddress)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                                .padding(12)
                                .background(Color.white.opacity(0.08))
                                .cornerRadius(10)
                                .foregroundStyle(.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                                )
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Password")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(.gray)
                            SecureField("", text: $password)
                                .textFieldStyle(.plain)
                                .textContentType(.password)
                                .padding(12)
                                .background(Color.white.opacity(0.08))
                                .cornerRadius(10)
                                .foregroundStyle(.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                                )
                        }

                        if showError {
                            Text("Invalid email or password")
                                .font(.caption)
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Button(action: login) {
                            HStack {
                                if isLoggingIn {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Sign In")
                                        .fontWeight(.bold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "#3b82f6"))
                            .foregroundStyle(.white)
                            .cornerRadius(10)
                        }
                        .disabled(email.isEmpty || password.isEmpty || isLoggingIn)
                        .opacity(email.isEmpty || password.isEmpty ? 0.5 : 1)
                    }
                    .padding(.horizontal, 32)
                }
            }
        }
    }

    private func login() {
        isLoggingIn = true
        showError = false
        Task {
            let success = await authManager.login(email: email, password: password)
            isLoggingIn = false
            if !success {
                showError = true
            }
        }
    }
}
