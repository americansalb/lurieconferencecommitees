"use client";

import { useMemo, useState } from "react";
import type { PresenterResponse as ResponseRow } from "@/lib/feedback";

// Every response, as a table the presenter can narrow and reorder.
//
// The page above already leads with the best comments; this is where the rest
// lives, including the critical ones. "Lowest first" is there on purpose: a
// presenter who wants to improve should not have to scroll past 120 tens to
// find the two people it did not work for.
//
// Hidden comments never reach this component. No submission times either: a
// time can point to who wrote a comment ("the one who left early").

function fmt(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

type Filter = "all" | "comments";

/** Rows shown before "Show all". A hundred and forty rows is a long scroll on a phone. */
const FIRST = 25;
type Sort = "order" | "high" | "low";

export default function ResponseTable({
  rows, singleQuestion, labelComments,
}: {
  rows: ResponseRow[];
  singleQuestion: boolean;
  labelComments: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("order");
  const [expanded, setExpanded] = useState(false);
  const withComments = rows.filter((r) => r.comments.length > 0).length;

  const shown = useMemo(() => {
    const out = filter === "comments" ? rows.filter((r) => r.comments.length > 0) : rows.slice();
    if (sort !== "order") {
      // Unrated responses sink to the bottom either way.
      const key = (r: ResponseRow) => r.score ?? (sort === "high" ? -Infinity : Infinity);
      out.sort((a, b) => (sort === "high" ? key(b) - key(a) : key(a) - key(b)) || a.n - b.n);
    }
    return out;
  }, [rows, filter, sort]);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex gap-1 rounded-xl border border-slate-200 p-1 bg-white">
          <button type="button" className={chip(filter === "all")} onClick={() => setFilter("all")}>
            All {rows.length}
          </button>
          {withComments > 0 && (
            <button type="button" className={chip(filter === "comments")} onClick={() => setFilter("comments")}>
              With a comment {withComments}
            </button>
          )}
        </div>
        <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] text-slate-500">
          Order
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12.5px] text-slate-700"
          >
            <option value="order">As received</option>
            <option value="high">Highest rated first</option>
            <option value="low">Lowest rated first</option>
          </select>
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
        {singleQuestion && (
          <div className="px-4 sm:px-5 py-2 border-b border-slate-200 flex gap-4 text-[11px] font-semibold text-slate-400">
            <span className="w-7 shrink-0">#</span>
            <span className="w-14 shrink-0">Rating</span>
            <span>Comment</span>
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {(expanded ? shown : shown.slice(0, FIRST)).map((r) => (
            <div key={r.n} className={`px-4 sm:px-5 ${singleQuestion ? "py-2.5" : "py-3.5"} flex gap-4 items-start`}>
              <span className="w-7 shrink-0 pt-px text-[12px] text-slate-400 tabular-nums">{r.n}</span>
              {singleQuestion && (
                <span className="w-14 shrink-0 text-[13.5px] tabular-nums">
                  {r.ratings[0] ? (
                    <><span className="font-semibold text-slate-900">{fmt(r.ratings[0].value)}</span><span className="text-slate-400">/{r.ratings[0].of}</span></>
                  ) : (
                    <span className="text-slate-300">&ndash;</span>
                  )}
                </span>
              )}
              <div className="flex-1 min-w-0">
                {!singleQuestion && (r.ratings.length > 0 ? (
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {r.ratings.map((x) => (
                      <span key={x.question} className="text-[12.5px] text-slate-500">
                        {x.question}{" "}
                        <span className="font-semibold text-slate-900 tabular-nums">{fmt(x.value)}</span>
                        <span className="text-slate-400">/{x.of}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12.5px] text-slate-400">No ratings given.</div>
                ))}
                {r.comments.length > 0 && (
                  <div className={`${singleQuestion ? "" : "mt-1.5 "}space-y-1.5`}>
                    {r.comments.map((c) => (
                      <p key={c.question} className="text-[14px] leading-relaxed text-slate-700">
                        {labelComments && (
                          <span className="block text-[11px] font-semibold text-slate-400">{c.question}</span>
                        )}
                        {c.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {shown.length > FIRST && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full px-5 py-3 border-t border-slate-200 text-[13px] font-semibold text-[#0E5566] hover:bg-slate-50"
          >
            {expanded ? "Show fewer" : `Show all ${shown.length} responses`}
          </button>
        )}
      </div>
    </div>
  );
}
