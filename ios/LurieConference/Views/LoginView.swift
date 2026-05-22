import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthStore
    @State private var email: String = ""
    @State private var password: String = ""

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            VStack(alignment: .leading, spacing: 8) {
                Text("LURIE CHILDREN'S · AALB")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2)
                    .foregroundStyle(.tint)
                Text("Conference 2026")
                    .font(.system(size: 32, weight: .heavy))
                Text("Committee Hub")
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 16) {
                LabeledField(title: "Email") {
                    TextField("you@example.com", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                }
                LabeledField(title: "Password") {
                    SecureField("Your password", text: $password)
                }
                if let err = auth.errorMessage {
                    Text(err)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                Button {
                    Task { await auth.signIn(email: email, password: password) }
                } label: {
                    HStack {
                        if auth.loading { ProgressView().tint(.white) }
                        Text(auth.loading ? "Signing in..." : "Sign in")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(auth.loading || email.isEmpty || password.isEmpty)
            }

            Spacer()
            Text("Forgot password? Use the web app to reset.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding(24)
    }
}

private struct LabeledField<Content: View>: View {
    let title: String
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.2)
                .foregroundStyle(.secondary)
            content()
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(.separator), lineWidth: 1))
        }
    }
}
