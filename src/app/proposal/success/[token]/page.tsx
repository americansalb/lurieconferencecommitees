import Link from "next/link";
import { notFound } from "next/navigation";
import { Mic, Clock, Calendar } from "lucide-react";
import { prisma } from "@/lib/db";
import SuccessHero from "./SuccessHero";

export const dynamic = "force-dynamic";

const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const GOLD = "#C9A14B";
const INK = "#0B1F25";
const MUTED = "#5A6E76";

export default async function ProposalSuccessPage({ params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({ where: { token: params.token } });
  if (!presenter) notFound();

  // Snapshot key matches the one ProposalFunnel writes before navigating.
  const fallback = {
    name: presenter.name || "",
    email: presenter.email || "",
    phone: presenter.phone || "",
    affiliation: presenter.affiliation || "",
    jobTitle: presenter.jobTitle || "",
    pronouns: presenter.pronouns || "",
    bio: presenter.bio || "",
    websiteUrl: presenter.websiteUrl || "",
    linkedinUrl: presenter.linkedinUrl || "",
    talkTitle: presenter.talkTitle || "",
    talkAbstract: presenter.talkAbstract || "",
    learningObjectives: presenter.learningObjectives || "",
    sessionFormat: presenter.sessionFormat || "",
    sessionLength: presenter.sessionLength || "",
    sessionTrack: presenter.sessionTrack || "",
    preferredDay: presenter.preferredDay || "",
    coPresenters: presenter.coPresenters || "",
    presenterMessage: presenter.presenterMessage || "",
    headshotDataUrl: "",
    headshotName: "",
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: TEAL_DEEP }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 10%, rgba(201,161,75,0.20) 0%, transparent 70%)`,
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.24em] uppercase mb-5 border"
            style={{
              color: "#F4E9CD",
              borderColor: "rgba(201,161,75,0.45)",
              background: "rgba(201,161,75,0.08)",
            }}
          >
            Proposal received
          </div>
          <h1 className="font-serif-display text-white text-[40px] sm:text-[52px] leading-[1.02] tracking-tight font-bold">
            Thank you, {presenter.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-white/75 text-sm sm:text-base max-w-lg mx-auto">
            We have your speaker card. A confirmation is on its way to{" "}
            <strong className="text-white">{presenter.email}</strong>. Our program team replies within two weeks.
          </p>
        </div>

        {/* The same SpeakerCard, restored from sessionStorage if present. */}
        <SuccessHero fallback={fallback} />

        <div className="mt-10 max-w-md mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Cell label="Status" value="Under review" icon={Mic} />
          <Cell label="Reply by" value="Two weeks" icon={Clock} />
          <Cell label="Conference" value="Aug 15 + 16" icon={Calendar} />
        </div>

        <p className="mt-10 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
          Need to update your submission? Reply to the confirmation email or write{" "}
          <a href="mailto:contact@aalb.org" className="font-semibold" style={{ color: GOLD }}>contact@aalb.org</a>.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/55 hover:text-white">
            Back to the conference
          </Link>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label, value, icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      <div className="text-[9px] font-bold tracking-[0.24em] uppercase mb-1" style={{ color: GOLD }}>
        {label}
      </div>
      <div className="text-[13px] font-bold inline-flex items-center gap-1.5 text-white">
        <Icon className="w-3.5 h-3.5" />
        {value}
      </div>
    </div>
  );
}
