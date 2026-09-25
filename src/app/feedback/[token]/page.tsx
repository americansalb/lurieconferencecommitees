import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPresenterReport, displayTalkTitle, type QuestionStats } from "@/lib/feedback";
import ResponseTable from "./ResponseTable";

// A presenter's feedback page, behind its own share token.
//
// Written to be read, not scanned like a dashboard. In order:
//   1. One sentence saying how it went, beside the average.
//   2. How the ratings fell, as one chart.
//   3. In the room against online, when the form asked and both groups are
//      big enough that no single answer can be picked out.
//   4. Comments the team picked to feature. Never chosen automatically.
//   5. Every response, filterable, including the critical ones.
//
// Their own numbers only. No conference average and no ranking, by decision;
// comparisons live on the admin page.
//
// A comment hidden by the team is simply absent, everywhere on this page: the
// response it belonged to still counts and still shows its ratings, and
// nothing marks the place it would have been.

export const dynamic = "force-dynamic";

// One hue, three steps: the top of the scale, one below, everything else.
// Ordered light to dark so the tones read as "more" without a legend, and the
// counts are printed so nothing depends on telling the steps apart.
const TOP = "#0E5566";
const NEXT = "#5AA3B3";
const REST = "#CBD5E1";

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

function pct(part: number, whole: number): string {
  return `${whole ? Math.round((part / whole) * 100) : 0}%`;
}

function tone(value: number, scale: number): string {
  return value >= scale ? TOP : value >= scale - 1 ? NEXT : REST;
}

function people(n: number): string {
  return `${n} ${n === 1 ? "person" : "people"}`;
}

function Legend({ scale }: { scale: number }) {
  const items = [
    { color: TOP, label: String(scale) },
    { color: NEXT, label: String(scale - 1) },
    { color: REST, label: `${scale - 2} or lower` },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Every rating on the scale as a column, counts on the caps. */
function Distribution({ values, scale }: { values: number[]; scale: number }) {
  const counts = Array.from({ length: scale }, (_, i) => values.filter((v) => Math.round(v) === i + 1).length);
  const max = Math.max(1, ...counts);
  return (
    <div role="img" aria-label={counts.map((c, i) => `${c} rated ${i + 1}`).join(", ")}>
      <div className="flex items-end gap-2 sm:gap-3 h-44 border-b border-slate-200">
        {counts.map((c, i) => {
          const v = i + 1;
          return (
            <div key={v} className="flex-1 flex flex-col items-center justify-end h-full"
                 title={`${c} rated it ${v} (${pct(c, values.length)})`}>
              {c > 0 && <span className="text-[12px] text-slate-600 tabular-nums mb-1">{c}</span>}
              <div className="w-full max-w-[24px] rounded-t"
                   style={{ height: c ? `${Math.max(2, (c / max) * 100)}%` : 0, background: tone(v, scale) }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-1.5">
        {counts.map((_, i) => (
          <div key={i} className="flex-1 text-center text-[11.5px] text-slate-400 tabular-nums">{i + 1}</div>
        ))}
      </div>
    </div>
  );
}

/** One row's share at the top, one below, and the rest, as a single bar. */
function SplitBar({ values, scale }: { values: number[]; scale: number }) {
  const top = values.filter((v) => v >= scale).length;
  const next = values.filter((v) => v >= scale - 1 && v < scale).length;
  const rest = values.length - top - next;
  const parts = [
    { n: top, color: TOP, label: `${top} rated ${scale}` },
    { n: next, color: NEXT, label: `${next} rated ${scale - 1}` },
    { n: rest, color: REST, label: `${rest} rated ${scale - 2} or lower` },
  ].filter((p) => p.n > 0);
  return (
    <div className="flex h-3 w-full gap-[2px]">
      {parts.map((p, i) => (
        <div key={i} title={p.label}
             className={`h-full ${i === 0 ? "rounded-l" : ""} ${i === parts.length - 1 ? "rounded-r" : ""}`}
             style={{ width: `${(p.n / values.length) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

function QuestionRow({ q }: { q: QuestionStats & { values: number[] } }) {
  return (
    <div className="py-4 grid gap-2 sm:grid-cols-[1fr_220px] sm:items-center sm:gap-6">
      <div>
        <div className="text-[14px] text-slate-800">{q.question}</div>
        <div className="text-[12px] text-slate-500 mt-0.5">
          {people(q.n)} answered &middot; {pct(q.topBox * q.n, q.n)} rated it {q.scale - 1} or {q.scale}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 text-right text-[15px] font-semibold text-slate-900 tabular-nums">
          {fmt(q.mean, 1)}<span className="text-[12px] font-normal text-slate-400">/{q.scale}</span>
        </span>
        <div className="flex-1"><SplitBar values={q.values} scale={q.scale} /></div>
      </div>
    </div>
  );
}

export default async function FeedbackPage({ params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { feedbackToken: params.token },
    select: { id: true, name: true, talkTitle: true },
  });
  if (!presenter) notFound();

  const rows = await prisma.feedbackResponse.findMany({
    where: { presenterId: presenter.id },
    orderBy: [{ submittedAt: "asc" }, { importedAt: "asc" }],
    select: {
      id: true, ratings: true, comments: true, hiddenKeys: true, featuredKeys: true,
      submittedAt: true, questionOrder: true, segment: true,
    },
  });
  const report = buildPresenterReport(rows);
  const { scale, pooled, overall, questions, responses, commented, highlights, groups } = report;
  const first = presenter.name.split(" ")[0] || presenter.name;
  const singleQuestion = questions.length === 1;
  const perfect = pooled.filter((v) => v >= scale).length;
  const topTwo = pooled.filter((v) => v >= scale - 1).length;

  // The headline, in words. "113 of them gave it a perfect 10" when that is
  // most people; the share in the top two points when it is not, so the
  // sentence stays true without turning into a verdict.
  const n = report.responseCount;
  const lead = !pooled.length
    ? `${n} ${n === 1 ? "attendee" : "attendees"} left written feedback on your session.`
    : singleQuestion && perfect / pooled.length >= 0.5
    ? `${n} ${n === 1 ? "attendee" : "attendees"} rated your session, and ${perfect} of them gave it a perfect ${scale}.`
    : singleQuestion
    ? `${n} ${n === 1 ? "attendee" : "attendees"} rated your session, and ${pct(topTwo, pooled.length)} of them gave it a ${scale - 1} or ${scale}.`
    : `${n} ${n === 1 ? "attendee" : "attendees"} gave feedback on your session, and ${pct(topTwo, pooled.length)} of their ratings were ${scale - 1} or ${scale}.`;

  const H2 = "text-[19px] font-semibold text-slate-900 tracking-tight";

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <header className="pt-10 sm:pt-14 pb-8 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4 text-[12.5px] text-slate-500">
            <span>2026 Lurie Children&rsquo;s &amp; AALB Conference &middot; Attendee feedback</span>
            {n > 0 && (
              <a href={`/api/feedback/${params.token}`} className="shrink-0 font-semibold text-[#0E5566] hover:underline">
                Download CSV
              </a>
            )}
          </div>
          <h1 className="mt-4 text-[28px] sm:text-[34px] leading-[1.15] font-semibold tracking-tight text-slate-900">
            {displayTalkTitle(presenter.talkTitle) || "Your session"}
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">{presenter.name}</p>
        </header>

        {n === 0 ? (
          <p className="py-16 text-center text-slate-500">Feedback is still being collected. Check back soon.</p>
        ) : (
          <main className="pb-16">
            <section className="py-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10 sm:items-center">
              {overall !== null && (
                <div>
                  <div className="text-[64px] leading-none font-semibold tracking-tight text-slate-900">
                    {fmt(overall, 1)}<span className="text-[24px] font-normal text-slate-400 ml-1">/{scale}</span>
                  </div>
                  <div className="mt-2 text-[12.5px] text-slate-500">average rating</div>
                </div>
              )}
              <div>
                <p className="text-[19px] sm:text-[21px] leading-snug text-slate-900">
                  Thank you, {first}. {lead}
                </p>
                <p className="mt-3 text-[14px] text-slate-500 leading-relaxed">
                  {commented > 0
                    ? `${people(commented)} also wrote a comment. `
                    : ""}
                  Everything here comes from the attendee feedback form, and this page is private to your link.
                </p>
              </div>
            </section>

            {pooled.length > 0 && (
              <section className="py-8 border-t border-slate-200">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h2 className={H2}>How the ratings fell</h2>
                  <Legend scale={scale} />
                </div>
                <p className="mt-1 text-[13px] text-slate-500">
                  {singleQuestion
                    ? <>Answers to &ldquo;{questions[0].question}&rdquo; Each column is how many people gave that score.</>
                    : `Every answer on the 1-to-${scale} questions, pooled. Each column is how many answers gave that score.`}
                </p>
                <div className="mt-6"><Distribution values={pooled} scale={scale} /></div>
              </section>
            )}

            {groups.length >= 2 && (
              <section className="py-8 border-t border-slate-200">
                <h2 className={H2}>In the room and online</h2>
                <p className="mt-1 text-[13px] text-slate-500">The same ratings, split by how people attended.</p>
                <div className="mt-5 space-y-5">
                  {groups.map((g) => {
                    const gTop = g.values.filter((v) => v >= scale).length;
                    return (
                      <div key={g.name}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[14px] font-semibold text-slate-800">{g.name}</span>
                          <span className="text-[13px] text-slate-500">
                            <span className="font-semibold text-slate-900 tabular-nums">{fmt(g.mean, 1)}</span>/{scale} average
                            {" "}&middot; {gTop} of {g.values.length} gave a {scale}
                          </span>
                        </div>
                        <div className="mt-2"><SplitBar values={g.values} scale={scale} /></div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {!singleQuestion && questions.length > 0 && (
              <section className="py-8 border-t border-slate-200">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h2 className={H2}>Question by question</h2>
                  <Legend scale={scale} />
                </div>
                <div className="mt-2 divide-y divide-slate-100">
                  {questions.map((q) => <QuestionRow key={q.question} q={q} />)}
                </div>
              </section>
            )}

            {highlights.length > 0 && (
              <section className="py-8 border-t border-slate-200">
                <h2 className={H2}>What stood out</h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  A few of the comments attendees left. Every comment is in the table below.
                </p>
                <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  {highlights.map((h, i) => (
                    <figure key={i} className="border-l-2 pl-5" style={{ borderColor: TOP }}>
                      <blockquote className="text-[16.5px] leading-relaxed text-slate-800">
                        &ldquo;{h.text}&rdquo;
                      </blockquote>
                      {h.score !== null && (
                        <figcaption className="mt-2.5 text-[12.5px] text-slate-500">
                          Rated {fmt(h.score, 1)}/{scale}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section className="py-8 border-t border-slate-200">
              <h2 className={H2}>Every response</h2>
              <p className="mt-1 mb-4 text-[13px] text-slate-500">
                Numbered in the order they came in. Names and email addresses are never shared here.
              </p>
              <ResponseTable
                rows={responses}
                singleQuestion={singleQuestion}
                labelComments={report.commentQuestions > 1}
              />
            </section>
          </main>
        )}

        <footer className="py-10 border-t border-slate-200 text-center text-[12.5px] text-slate-400">
          Questions about this page? Write to contact@aalb.org.
        </footer>
      </div>
    </div>
  );
}
