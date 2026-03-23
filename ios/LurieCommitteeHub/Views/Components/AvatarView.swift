import SwiftUI

struct AvatarView: View {
    let name: String
    let size: CGFloat
    let color: Color

    private var initials: String {
        name.split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.12))
                .overlay(
                    Circle().stroke(color.opacity(0.2), lineWidth: 1)
                )
            Text(initials)
                .font(.system(size: size * 0.35, weight: .bold))
                .foregroundStyle(color)
        }
        .frame(width: size, height: size)
    }
}
