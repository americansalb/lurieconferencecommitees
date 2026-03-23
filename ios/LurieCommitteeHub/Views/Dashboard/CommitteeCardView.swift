import SwiftUI

struct CommitteeCardView: View {
    let committee: Committee
    let isMember: Bool

    private var colors: CommitteeColors {
        CommitteeColors.forSlug(committee.slug)
    }

    private var icon: String {
        switch committee.icon {
        case "map-pin": return "mappin.circle"
        case "monitor": return "desktopcomputer"
        case "megaphone": return "megaphone"
        case "handshake": return "handshake"
        default: return "person.3"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(colors.accent.opacity(0.12))
                        .frame(width: 36, height: 36)
                    Image(systemName: icon)
                        .font(.system(size: 16))
                        .foregroundStyle(colors.accent)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(committee.name)
                            .font(.system(size: 13, weight: .bold))
                            .lineLimit(2)
                            .foregroundStyle(.primary)

                        if isMember {
                            Text("Joined")
                                .font(.system(size: 9, weight: .bold))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.1))
                                .foregroundStyle(.green)
                                .cornerRadius(8)
                        }
                    }

                    Text(committee.description)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }

            HStack(spacing: 12) {
                Label("\(committee._count.members)", systemImage: "person.2")
                Label("\(committee._count.events)", systemImage: "calendar")
                Label("\(committee._count.discussions)", systemImage: "bubble.left")
            }
            .font(.system(size: 10))
            .foregroundStyle(.tertiary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}
