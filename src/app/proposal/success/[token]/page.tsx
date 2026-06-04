import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Mic, Clock } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const GOLD = "#C9A14B";
const INK = "#0B1F25";
const MUTED = "#5A6E76";

export default async function ProposalSuccessPage({ params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({ where: { token: params.token } });
  if (!presenter) notFound();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}
    >
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl overflow-hidden text-center" style={{ boxShadow: "0 32px 80px -32px rgba(0,0,0,0.45)" }}>
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${TEAL} 0%, ${GOLD} 100%)` }} />
          <div className="p-8 sm:p-10">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
              style={{ background: TEAL + "15", color: TEAL }}
            >
              <Check className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: INK }}>
              Got it, {presenter.name.split(" ")[0]}.
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: MUTED }}>
              We have your proposal{presenter.talkTitle ? <> for <em style={{ color: INK }}>{presenter.talkTitle}</em></> : ""}. A confirmation is on its way to <strong style={{ color: INK }}>{presenter.email}</strong>.
            </p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <Cell label="Status" value="Under review" icon={Mic} />
              <Cell label="Response window" value="Within two weeks" icon={Clock} />
            </div>

            <p className="mt-8 text-[12px] leading-relaxed" style={{ color: MUTED }}>
              Need to update your submission? Reply to the confirmation email or write{" "}
              <a href="mailto:contact@aalb.org" className="font-semibold" style={{ color: TEAL }}>contact@aalb.org</a>.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-semibold text-white/70 hover:text-white">
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
    <div className="rounded-lg p-3" style={{ background: "#F6F1E6" }}>
      <div className="text-[9px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: TEAL }}>
        {label}
      </div>
      <div className="text-sm font-bold inline-flex items-center gap-1.5" style={{ color: INK }}>
        <Icon className="w-3.5 h-3.5" />
        {value}
      </div>
    </div>
  );
}
