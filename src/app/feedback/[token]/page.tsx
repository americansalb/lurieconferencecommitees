import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { assemblePresenterFeedback, type QuestionStats } from "@/lib/feedback";

// A presenter's feedback page, behind its own share token.
//
// Deliberately self-contained: their numbers and their comments, nothing about
// any other session. No conference average and no ranking, by decision: each
// page stands alone, and comparisons live only in the admin view.
//
// Server-rendered so the token never feeds a client API; the page either
// exists for you or it does not.

export const dynamic = "force-dynamic";

const TEAL = "#0E5566";
const BLUE = "#0066B3";

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

function Bar({ value, count, total }: { value: number; count: number; total: number }) {
  // Width is the share of all answers, so four bars of 25% each look like
  // quarters, not four full bars. Zero stays zero; a stub would read as one.
  const width = count === 0 || !total ? 0 : Math.max(4, Math.round((count / total) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-right text-[12px] font-bold text-slate-500">{value}</span>
      <div className="flex-1 h-5 rounded bg-slate-100 overflow-hidden">
        <div className="h-full rounded" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${TEAL}, ${BLUE})` }} />
      </div>
      <span className="w-16 text-[12px] text-slate-500">{count} ({total ? Math.round((count / total) * 100) : 0}%)</span>
    </div>
  );
}

function Question({ q }: { q: QuestionStats }) {
  // Show every point on the scale, including the empty ones: a 5-bar chart
  // with the 1s and 2s visibly at zero says more than a chart that hides them.
  const lo = Math.min(1, q.min);
  const hi = Math.max(5, q.max);
  const full: { value: number; count: number }[] = [];
  for (let v = hi; v >= lo; v -= 1) {
    full.push({ value: v, count: q.distribution.find((d) => d.value === v)?.count || 0 });
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-[15px] font-bold text-slate-900">{q.question}</h3>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-500">
        <span><strong className="text-slate-800 text-[17px]">{fmt(q.mean)}</strong> average</span>
        <span>median {fmt(q.median)}</span>
        {q.sd !== null && <span>spread (SD) {fmt(q.sd)}</span>}
        <span>{q.n} answer{q.n === 1 ? "" : "s"}</span>
        <span>{Math.round(q.topBox * 100)}% rated 4 or 5</span>
      </div>
      <div className="mt-4 space-y-1.5">
        {full.map((d) => <Bar key={d.value} value={d.value} count={d.count} total={q.n} />)}
      </div>
      {q.ci95 && (
        <p className="mt-3 text-[12px] text-slate-400">
          With {q.n} answers, the true average most likely sits between {fmt(Math.max(1, q.ci95.low))} and {fmt(Math.min(5, q.ci95.high))} (95% confidence).
        </p>
      )}
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
    select: { id: true, ratings: true, comments: true, hiddenKeys: true },
  });
  const view = assemblePresenterFeedback(rows);
  const first = presenter.name.split(" ")[0] || presenter.name;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-2" style={{ background: `linear-gradient(90deg, ${TEAL}, ${BLUE})` }} />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: TEAL }}>
          2026 Lurie Children&rsquo;s &amp; AALB Conference
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
          Your attendee feedback
        </h1>
        <p className="text-[15px] text-slate-600 mt-2 leading-relaxed">
          Thank you for presenting, {first}. This page holds what attendees said about
          {presenter.talkTitle ? <> your session, <strong>{presenter.talkTitle}</strong></> : " your session"}:
          every rating and every comment, exactly as they were written. It is private to this link.
        </p>
        <p className="text-[13px] text-slate-500 mt-2">
          {view.responseCount} response{view.responseCount === 1 ? "" : "s"}.
          {view.responseCount > 0 && (
            <>
              {" "}
              <a href={`/api/feedback/${params.token}`} className="font-semibold underline" style={{ color: BLUE }}>
                Download the raw responses (CSV)
              </a>
            </>
          )}
        </p>

        {view.responseCount === 0 ? (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Feedback is still being collected. Check back soon.
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {view.questions.map((q) => <Question key={q.question} q={q} />)}
            </div>

            {view.comments.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-slate-900">In their words</h2>
                <p className="text-[13px] text-slate-500 mt-1">Unedited, in the order they came in.</p>
                {view.comments.map((c) => (
                  <div key={c.question} className="mt-5">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">{c.question}</h3>
                    <div className="mt-2 space-y-2">
                      {c.entries.map((text, i) => (
                        <blockquote key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3 text-[14px] leading-relaxed text-slate-700">
                          {text}
                        </blockquote>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <p className="mt-12 text-[12px] text-slate-400">
          Questions about this page? Write to contact@aalb.org.
        </p>
      </main>
    </div>
  );
}
