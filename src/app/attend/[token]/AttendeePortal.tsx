import Link from "next/link";
import { Check, Calendar, MapPin, Monitor, Video, CalendarPlus, ListChecks, Mail } from "lucide-react";

const TEAL = "#0E4456";
const TEAL_DEEP = "#0C3B4B";
const BLUE = "#2A8FCC";
const GOLD = "#C9A14B";
const INK = "#0B1F25";
const MUTED = "#5A6E76";

// The returning home for a paid attendee: ticket, join link (virtual) or venue
// (in-person), add-to-calendar, agenda, and how to reach us. Presentational so
// it can be rendered server-side or screenshotted with mock data.
export default function AttendeePortal({
  token, firstName, email, attendanceMode, finalPriceCents, joinUrl, agendaUrl,
}: {
  token: string;
  firstName: string;
  email: string;
  attendanceMode: string | null;
  finalPriceCents: number | null;
  joinUrl: string | null;
  agendaUrl: string;
}) {
  const isVirtual = attendanceMode === "virtual";
  const price = finalPriceCents != null ? `$${(finalPriceCents / 100).toFixed(2)}` : null;

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-2.5 mb-6 opacity-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/aalb-icon.png" alt="AALB" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          <span className="w-px h-4 bg-white/30" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/lurie-icon.png" alt="Lurie Children's" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 32px 80px -32px rgba(0,0,0,0.45)" }}>
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${TEAL} 0%, ${BLUE} 50%, ${GOLD} 100%)` }} />
          <div className="p-7 sm:p-9">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#16a34a18", color: "#16a34a" }}>
                <Check className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "#16a34a" }}>You&rsquo;re attending</div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: INK }}>You&rsquo;re going, {firstName}.</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed mt-2" style={{ color: MUTED }}>
              This is your portal for the 2026 Lurie Children&rsquo;s &amp; AALB Conference. Bookmark it, everything you need is here.
            </p>

            {/* Ticket */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Cell label="Dates" value="Aug 15 & 16, 2026" icon={Calendar} />
              <Cell label="Attendance" value={isVirtual ? "Virtual" : "In-person"} icon={isVirtual ? Monitor : MapPin} />
              {price && <Cell label="Paid" value={price} icon={Check} />}
            </div>

            {/* Join link or venue */}
            {isVirtual ? (
              <Section title="Joining live" icon={Video}>
                {joinUrl ? (
                  <>
                    <p className="text-sm" style={{ color: MUTED }}>Use this link to join both days. It&rsquo;s the same link each day.</p>
                    <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white" style={{ background: TEAL }}>
                      <Video className="w-4 h-4" /> Join the conference
                    </a>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: MUTED }}>Your live join link will appear here, and be emailed to <strong style={{ color: INK }}>{email}</strong>, a few days before the event.</p>
                )}
              </Section>
            ) : (
              <Section title="The venue" icon={MapPin}>
                <p className="text-sm" style={{ color: INK }}><strong>Ann &amp; Robert H. Lurie Children&rsquo;s Hospital of Chicago</strong></p>
                <p className="text-sm" style={{ color: MUTED }}>225 E Chicago Ave, Chicago, IL 60611. A short walk from the CTA Red Line, parking garages within two blocks.</p>
              </Section>
            )}

            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a href={`/attend/${token}/event.ics`} className="flex items-center gap-3 rounded-xl border p-3.5 hover:bg-slate-50 transition-colors" style={{ borderColor: "#e6ebee" }}>
                <CalendarPlus className="w-5 h-5" style={{ color: TEAL }} />
                <div><div className="text-sm font-bold" style={{ color: INK }}>Add to calendar</div><div className="text-xs" style={{ color: MUTED }}>Both days, .ics</div></div>
              </a>
              <Link href={agendaUrl} className="flex items-center gap-3 rounded-xl border p-3.5 hover:bg-slate-50 transition-colors" style={{ borderColor: "#e6ebee" }}>
                <ListChecks className="w-5 h-5" style={{ color: TEAL }} />
                <div><div className="text-sm font-bold" style={{ color: INK }}>See the agenda</div><div className="text-xs" style={{ color: MUTED }}>Sessions &amp; speakers</div></div>
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t flex items-center gap-2 text-xs" style={{ borderColor: "#eef1f4", color: MUTED }}>
              <Mail className="w-3.5 h-3.5" />
              Need to change anything? Email <a className="font-semibold" style={{ color: TEAL }} href="mailto:contact@aalb.org">contact@aalb.org</a>. Refundable through July 15.
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-xs font-semibold text-white/70 hover:text-white">← Back to the conference site</Link>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "#F6F1E6" }}>
      <div className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: TEAL }}>{label}</div>
      <div className="text-sm font-bold inline-flex items-center gap-1.5" style={{ color: INK }}><Icon className="w-3.5 h-3.5" />{value}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl p-4" style={{ background: "#f7fafb", border: "1px solid #e6ebee" }}>
      <div className="text-[11px] font-bold tracking-wide uppercase mb-1.5 inline-flex items-center gap-1.5" style={{ color: TEAL }}><Icon className="w-3.5 h-3.5" /> {title}</div>
      {children}
    </div>
  );
}
