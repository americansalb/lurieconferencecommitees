import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { assemblePresenterFeedback, questionOrderOf, type QuestionStats } from "@/lib/feedback";

// A presenter's feedback page, behind its own share token.
//
// Four layers, read top to bottom: the headline (one overall number, the
// response count, the share rating 4 or 5), each question as a chart, what
// people wrote, and then every response as it came in. Someone who wants the
// gist stops after the first screen; someone who wants the raw data has all
// of it without downloading anything.
//
// Their own numbers only. No conference average and no ranking, by decision;
// comparisons live on the admin page.
//
// A comment hidden by the team is simply absent, everywhere on this page: the
// response it belonged to still counts and still shows its ratings, and
// nothing marks the place it would have been. A response left with nothing
// visible reads as one that gave no ratings, which is what it now is.

export const dynamic = "force-dynamic";

const TEAL = "#0E5566";
const BLUE = "#0066B3";

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

function when(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(d);
}

/** The top of a question's scale: 5 unless the answers show otherwise. */
function scaleOf(q: QuestionStats): number {
  return q.max > 5 ? 10 : 5;
}

function Dots({ value, of }: { value: number; of: number }) {
  if (of > 5) {
    return <span className="text-[13px] font-bold text-slate-800">{fmt(value, 1)}<span className="text-slate-400 font-medium">/{of}</span></span>;
  }
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: i < full ? `linear-gradient(135deg, ${TEAL}, ${BLUE})` : "#E2E8F0" }}
        />
      ))}
      <span className="ml-1.5 text-[13px] font-bold text-slate-800 tabular-nums">{value}</span>
    </span>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 text-[32px] leading-none font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="mt-1.5 text-[12.5px] text-slate-500">{sub}</div>}
    </div>
  );
}

function QuestionCard({ q }: { q: QuestionStats }) {
  const of = scaleOf(q);
  const rows: { value: number; count: number }[] = [];
  for (let v = of; v >= 1; v -= 1) {
    rows.push({ value: v, count: q.distribution.find((d) => d.value === v)?.count || 0 });
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-[15px] font-bold text-slate-900 leading-snug">{q.question}</h3>
      <div className="mt-3 flex items-end gap-3 flex-wrap">
        <div className="text-[40px] leading-none font-bold tabular-nums" style={{ color: TEAL }}>{fmt(q.mean)}</div>
        <div className="pb-1 text-[13px] text-slate-500">
          average out of {of}
          {of === 5 && <> &middot; <strong className="text-slate-700">{Math.round(q.topBox * 100)}%</strong> rated 4 or 5</>}
        </div>
      </div>
      <div className="mt-5 space-y-1.5">
        {rows.map((d) => {
          const pct = q.n ? d.count / q.n : 0;
          return (
            <div key={d.value} className="flex items-center gap-3">
              <span className="w-5 text-right text-[12px] font-bold text-slate-500 tabular-nums">{d.value}</span>
              <div className="flex-1 h-6 rounded-md bg-slate-100 overflow-hidden">
                {d.count > 0 && (
                  <div className="h-full rounded-md"
                       style={{ width: `${Math.max(3, Math.round(pct * 100))}%`, background: `linear-gradient(90deg, ${TEAL}, ${BLUE})` }} />
                )}
              </div>
              <span className="w-20 text-[12px] text-slate-500 tabular-nums">
                {d.count} <span className="text-slate-400">({Math.round(pct * 100)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-slate-500">
        <span>{q.n} answer{q.n === 1 ? "" : "s"}</span>
        <span>median {fmt(q.median)}</span>
        {q.sd !== null && <span>spread {fmt(q.sd)}</span>}
        {q.ci95 && (
          <span>likely range {fmt(Math.max(1, q.ci95.low))} to {fmt(Math.min(of, q.ci95.high))}</span>
        )}
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
    select: { id: true, ratings: true, comments: true, hiddenKeys: true, submittedAt: true, questionOrder: true },
  });
  const view = assemblePresenterFeedback(rows);
  const first = presenter.name.split(" ")[0] || presenter.name;

  // The headline: every 1-to-5 answer pooled, so a question answered by more
  // people weighs more, which is what an overall rating should mean.
  const fivePoint = new Set(view.questions.filter((q) => scaleOf(q) === 5).map((q) => q.question));
  const pooled: number[] = [];
  for (const r of rows) {
    for (const [q, v] of Object.entries((r.ratings || {}) as Record<string, unknown>)) {
      const n = typeof v === "number" ? v : Number(v);
      if (fivePoint.has(q) && Number.isFinite(n)) pooled.push(n);
    }
  }
  const overall = pooled.length ? pooled.reduce((a, b) => a + b, 0) / pooled.length : null;
  const topBox = pooled.length ? pooled.filter((v) => v >= 4).length / pooled.length : null;
  const commentCount = view.comments.reduce((a, c) => a + c.entries.length, 0);

  // Every response, in order, with hidden comments already gone. Questions run
  // in the order the form asked them, same as the charts above.
  const formOrder = questionOrderOf(rows);
  const rank = (q: string) => { const i = formOrder.indexOf(q); return i < 0 ? formOrder.length : i; };
  const questionOrder = view.questions.map((q) => q.question);
  const scaleByQuestion = new Map(view.questions.map((q) => [q.question, scaleOf(q)]));
  const responses = rows.map((r, i) => {
    const ratings = (r.ratings || {}) as Record<string, unknown>;
    const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
    const comments = Object.entries((r.comments || {}) as Record<string, unknown>)
      .filter(([q, t]) => !hidden[q] && typeof t === "string" && t.trim())
      .map(([q, t]) => ({ question: q, text: (t as string).trim() }))
      .sort((a, b) => rank(a.question) - rank(b.question));
    return {
      n: i + 1,
      at: r.submittedAt,
      ratings: questionOrder
        .filter((q) => ratings[q] != null && Number.isFinite(Number(ratings[q])))
        .map((q) => ({ question: q, value: Number(ratings[q]), of: scaleByQuestion.get(q) || 5 })),
      comments,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #0B4A5C 45%, ${BLUE} 100%)` }}>
        <div className="max-w-4xl mx-auto px-5 pt-10 pb-20">
          <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/70">
            2026 Lurie Children&rsquo;s &amp; AALB Conference
          </div>
          <h1 className="text-[34px] sm:text-[40px] font-bold text-white tracking-tight mt-2 leading-tight">
            Your attendee feedback
          </h1>
          {presenter.talkTitle && (
            <p className="text-[17px] text-white/90 mt-2 font-medium">{presenter.talkTitle}</p>
          )}
          <p className="text-[14px] text-white/70 mt-3 max-w-2xl leading-relaxed">
            Thank you for presenting, {first}. Here is everything attendees told us about your session:
            every rating and every comment. This page is private to your link.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 -mt-12 pb-16">
        {view.responseCount === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-500">
            Feedback is still being collected. Check back soon.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Tile
                label="Overall rating"
                value={overall !== null ? fmt(overall) : "–"}
                sub={overall !== null ? "average out of 5, across every question" : undefined}
              />
              <Tile
                label="Responses"
                value={String(view.responseCount)}
                sub={`${commentCount} written comment${commentCount === 1 ? "" : "s"}`}
              />
              <Tile
                label="Rated 4 or 5"
                value={topBox !== null ? `${Math.round(topBox * 100)}%` : "–"}
                sub="of all ratings you received"
              />
            </div>

            <nav className="sticky top-0 z-10 mt-6 -mx-5 px-5 py-2.5 bg-slate-50/90 backdrop-blur border-b border-slate-200/70">
              <div className="flex items-center gap-1.5 flex-wrap text-[13px] font-semibold">
                <a href="#ratings" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900">Ratings</a>
                {commentCount > 0 && (
                  <a href="#comments" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900">Comments</a>
                )}
                <a href="#responses" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900">Every response</a>
                <a href={`/api/feedback/${params.token}`}
                   className="ml-auto px-3 py-1.5 rounded-lg text-white"
                   style={{ background: `linear-gradient(90deg, ${TEAL}, ${BLUE})` }}>
                  Download spreadsheet (CSV)
                </a>
              </div>
            </nav>

            <section id="ratings" className="scroll-mt-16 mt-8">
              <h2 className="text-[22px] font-bold text-slate-900">How attendees rated it</h2>
              <p className="text-[13px] text-slate-500 mt-1">Each question on its own, with how the answers spread across the scale.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {view.questions.map((q) => <QuestionCard key={q.question} q={q} />)}
              </div>
            </section>

            {commentCount > 0 && (
              <section id="comments" className="scroll-mt-16 mt-12">
                <h2 className="text-[22px] font-bold text-slate-900">What they wrote</h2>
                <p className="text-[13px] text-slate-500 mt-1">In their words, unedited, grouped by question.</p>
                {view.comments.map((c) => (
                  <div key={c.question} className="mt-6">
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">{c.question}</h3>
                    <div className="mt-2.5 space-y-2.5">
                      {c.entries.map((text, i) => (
                        <blockquote key={i}
                                    className="bg-white rounded-xl border border-slate-200 pl-5 pr-4 py-3.5 text-[14.5px] leading-relaxed text-slate-700 relative overflow-hidden">
                          <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `linear-gradient(180deg, ${TEAL}, ${BLUE})` }} />
                          {text}
                        </blockquote>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section id="responses" className="scroll-mt-16 mt-12">
              <h2 className="text-[22px] font-bold text-slate-900">Every response</h2>
              <p className="text-[13px] text-slate-500 mt-1">
                The raw data, one attendee at a time, in the order they came in. Names are never collected.
              </p>
              <div className="mt-4 space-y-3">
                {responses.map((r) => (
                  <div key={r.n} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[12px] font-bold text-slate-700">Response {r.n}</span>
                      <span className="text-[11.5px] text-slate-400">{when(r.at)}</span>
                    </div>
                    <div className="px-5 py-4">
                      {r.ratings.length > 0 ? (
                        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                          {r.ratings.map((x) => (
                            <div key={x.question} className="flex items-center justify-between gap-3">
                              <span className="text-[12.5px] text-slate-600 leading-snug">{x.question}</span>
                              <Dots value={x.value} of={x.of} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[12.5px] text-slate-400">No ratings given.</div>
                      )}
                      {r.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {r.comments.map((c) => (
                            <div key={c.question}>
                              <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">{c.question}</div>
                              <p className="mt-1 text-[14px] leading-relaxed text-slate-700">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12 rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <h2 className="text-[14px] font-bold text-slate-900">About these numbers</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-[12.5px] leading-relaxed text-slate-600">
                <div><dt className="font-semibold text-slate-800">Average and median</dt>
                  <dd>The average adds every rating and divides; the median is the middle rating. When they sit close together, the room broadly agreed.</dd></div>
                <div><dt className="font-semibold text-slate-800">Spread</dt>
                  <dd>How far ratings usually sit from the average. Under 1 means people mostly agreed; above 1 means opinions were more mixed.</dd></div>
                <div><dt className="font-semibold text-slate-800">Likely range</dt>
                  <dd>With a limited number of answers, the true average could be a little higher or lower. This is where it most likely sits, with 95% confidence. Fewer answers give a wider range.</dd></div>
                <div><dt className="font-semibold text-slate-800">Rated 4 or 5</dt>
                  <dd>The share of ratings at the top of the scale. Often the clearest single signal of how a session landed.</dd></div>
              </dl>
            </section>
          </>
        )}

        <p className="mt-10 text-center text-[12px] text-slate-400">
          Questions about this page? Write to contact@aalb.org.
        </p>
      </main>
    </div>
  );
}
