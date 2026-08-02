import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FileDown } from "lucide-react";
import { teamUrl } from "@/lib/sponsor-team";
import TeamManager from "./TeamManager";

export const dynamic = "force-dynamic";

// The sponsor's own team page. Reached from the "who is coming?" email and
// freely shareable with colleagues: the token here only ever exposes this
// list, never the payment portal.
export default async function ExhibitorTeamPage({ params }: { params: { token: string } }) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { teamToken: params.token },
    select: { companyName: true, mergedIntoId: true },
  });
  if (!sponsor || sponsor.mergedIntoId) notFound();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-7">
          <div className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: "#C99A2E" }}>
            2026 AALB &amp; Lurie Children&rsquo;s Conference
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Who is coming from {sponsor.companyName}?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            August 15 and 16, 2026 &middot; Lurie Children&rsquo;s, Chicago and live online
          </p>
        </div>

        <TeamManager token={params.token} shareUrl={teamUrl(params.token)} />

        {/* Generated on click, so the team list printed inside it matches the
            one they have just finished editing above. */}
        <a
          href={`/exhibitor/${params.token}/guide.pdf`}
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3.5 bg-white border-[1.5px] transition-colors hover:brightness-[0.98]"
          style={{ borderColor: "#E0C67A" }}
        >
          <FileDown className="w-5 h-5 shrink-0" style={{ color: "#A8842A" }} />
          <div>
            <div className="text-[13.5px] font-bold text-slate-900">Your exhibitor guide</div>
            <div className="text-[11.5px] text-slate-500">
              PDF for {sponsor.companyName}: load-in times, parking, shipping, and a pre-addressed
              label to tape to your boxes.
            </div>
          </div>
        </a>

        <p className="text-center text-[11.5px] text-slate-400 mt-6">
          Questions? Reply to the email that brought you here, or write to{" "}
          <a href="mailto:contact@aalb.org" className="underline">contact@aalb.org</a>.
        </p>
      </div>
    </div>
  );
}
