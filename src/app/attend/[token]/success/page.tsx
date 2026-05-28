import Link from "next/link";
import { Check, Calendar, Mail } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: { token: string } }) {
  const attendee = await prisma.attendee.findUnique({
    where: { inviteToken: params.token },
  });

  const TEAL = "#0E5566";
  const BLUE = "#0066B3";

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, #f7f3ea 0%, #ffffff 60%, #f0f6f7 100%)` }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-1.5" style={{ background: `linear-gradient(to right, ${TEAL} 0%, ${TEAL} 50%, ${BLUE} 50%, ${BLUE} 100%)` }} />
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: TEAL + "15" }}>
            <Check className="w-8 h-8" style={{ color: TEAL }} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            You&rsquo;re in{attendee?.firstName ? `, ${attendee.firstName}` : ""}.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your spot at the 2026 Lurie Children&rsquo;s &amp; AALB Conference is confirmed.
            A receipt and confirmation are on their way to your inbox.
          </p>

          <div className="rounded-xl p-4 mb-5 text-left" style={{ background: TEAL + "08" }}>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: TEAL }}>
              The big days
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Calendar className="w-4 h-4" style={{ color: TEAL }} />
              August 15 &amp; 16, 2026
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago
            </div>
          </div>

          <Link
            href={`/attend/${params.token}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: TEAL }}
          >
            <Mail className="w-3.5 h-3.5" /> View my registration
          </Link>
        </div>
      </div>
    </div>
  );
}
