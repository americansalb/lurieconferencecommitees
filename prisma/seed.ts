import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const committees = [
  {
    name: "Logistics and Venue",
    slug: "logistics-venue",
    description:
      "Handles all physical aspects of the conference experience, from coordinating venue setup and seating arrangements to managing equipment rentals and technical needs. Plans catering arrangements with attention to special dietary requirements, ensures accessibility standards, coordinates signage, and oversees accommodations, transportation, and parking logistics.",
    color: "#2563EB",
    icon: "map-pin",
  },
  {
    name: "Technology & Virtual Experience",
    slug: "technology-virtual",
    description:
      "Ensures a seamless digital experience for all virtual participants and technical aspects of the conference. Manages the virtual event platform, coordinates session recordings, provides real-time troubleshooting, and delivers tech support for speakers and attendees. Manages virtual attendee breaks, facilitates questions, and coordinates breakout rooms.",
    color: "#059669",
    icon: "monitor",
  },
  {
    name: "Marketing and Communications",
    slug: "marketing-communications",
    description:
      "Develops and implements the comprehensive marketing strategy that attracts attendees and builds excitement. Manages social media, website content, email campaigns, and outreach. Ensures consistent branding of Lurie Children's and AALB across all materials, coordinates with sponsors, and monitors registration numbers.",
    color: "#F97316",
    icon: "megaphone",
  },
  {
    name: "Sponsorship, Exhibitor, & Fundraising",
    slug: "sponsorship-fundraising",
    description:
      "Secures the financial foundation and partnerships that make the conference possible. Develops sponsor and exhibitor prospectus, manages sponsors through monetary and in-kind donations, ensures sponsor recognition, provides marketing opportunities, and handles tax-deductible donation letters.",
    color: "#9333EA",
    icon: "handshake",
  },
  {
    name: "Volunteer, Staffing, and Participant Experience",
    slug: "volunteer-participant",
    description:
      "Builds and manages the volunteer workforce while championing an inclusive and welcoming environment. Recruits, trains, and schedules volunteers, ensures accessibility accommodations for both in-person and virtual attendees, provides navigation assistance, and coordinates language services quality control.",
    color: "#0D9488",
    icon: "users",
  },
  {
    name: "Executive Planning Committee",
    slug: "executive-planning",
    description:
      "Provides strategic leadership and oversight for the entire conference. Coordinates across all committees, sets timelines and milestones, manages the overall budget, resolves cross-committee issues, and ensures alignment with Lurie Children's mission and AALB goals.",
    color: "#DC2626",
    icon: "users",
  },
];

async function main() {
  console.log("Seeding committees...");

  for (const committee of committees) {
    await prisma.committee.upsert({
      where: { slug: committee.slug },
      update: committee,
      create: committee,
    });
  }
  console.log(`Seeded ${committees.length} committees.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
