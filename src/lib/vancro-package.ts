import { scaleFor } from "./feedback";
import { slideChunks } from "./presenter-slides";
import { uploadCsv } from "./rid-ceu";
import { compileRidCeusWithEvaluations, sessionNumber, type RidSession, type SessionEvaluation } from "./rid-ceu-report";
import type { ZipEntry } from "./zip-stream";

// Everything Vancro asked for, as one folder, numbered in the order of their
// email so each item can be ticked off:
//
//   0. Overview.csv                      the 13 sessions on one page
//   1. RID CEU Upload Form.csv           their template, filled in
//   2. Evaluation Results/Session NN …   every evaluation, with who wrote it
//   3. Session Materials/Session NN …    the slides, where they may be shared
//
// Slides go only for sessions marked to send on the RID CEUs page, which by
// default means every presenter opted in to continuing education use. A
// withheld session gets a short note and its description in place of slides,
// so Vancro sees it was not overlooked.

const BOM = "﻿";

function csv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // A byte-order mark so Excel reads accents (González, Mulé) correctly.
  return BOM + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Safe in a file name on Windows and Mac. */
function fileSafe(s: string): string {
  return s
    .replace(/[‘’]/g, "'").replace(/[“”]/g, "")
    .replace(/\s*:\s*/g, " - ")
    .replace(/[\\/*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140)
    .trim();
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function sessionLabel(s: RidSession): string {
  const [m, d] = s.date.split("/").map(Number);
  return `Session ${String(sessionNumber(s.key)).padStart(2, "0")} (${MONTH[m - 1]} ${d}) - ${s.title}`;
}

function presenterNames(s: RidSession): string {
  return s.presenters.map((p) => p.name).join(", ") || s.who.split("·")[0].trim();
}

function averageOf(e: SessionEvaluation | undefined): string {
  const q = e?.ratingQuestions[0];
  if (!e || !q) return "";
  const vals = e.rows.map((r) => Number(r.answers[q])).filter((v) => Number.isFinite(v));
  if (!vals.length) return "";
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return `${mean.toFixed(1)} of ${scaleFor(q, Math.max(...vals))}`;
}

function extensionFor(fileName: string | null, mime: string | null): string {
  const fromName = (fileName || "").match(/\.([a-z0-9]{2,5})$/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (/presentationml/.test(mime || "")) return "pptx";
  if (/powerpoint/.test(mime || "")) return "ppt";
  if (/^video\/mp4/.test(mime || "")) return "mp4";
  return "bin";
}

function description(s: RidSession): string {
  const abstracts = s.presenters.map((p) => (p.abstract || "").trim()).filter(Boolean);
  return [
    s.title,
    `Presented by ${presenterNames(s)}`,
    `${s.date}, ${s.time} (${s.minutes} minutes)`,
    "",
    ...(abstracts.length ? abstracts : ["No written description on file."]),
  ].join("\r\n");
}

function materialsStatus(s: RidSession): string {
  if (s.release === "withhold") return "Slides not released by the presenter; description attached";
  const files = s.presenters.filter((p) => p.slide?.sizeBytes);
  const links = s.presenters.filter((p) => !p.slide?.sizeBytes && p.slide?.linkUrl);
  if (files.length) return links.length ? "Slides and a link to slides attached" : "Slides attached";
  if (links.length) return "Link to slides attached";
  return "No slides on file; description attached";
}

/** The files of the package, in order. Slides are read only as they are zipped. */
export async function vancroPackage(): Promise<ZipEntry[]> {
  const report = await compileRidCeusWithEvaluations();
  const evalOf = new Map(report.evaluations.map((e) => [e.sessionKey, e]));
  const entries: ZipEntry[] = [];

  entries.push({
    name: "0. Overview.csv",
    data: csv([
      ["Session", "Date", "Time", "Title", "Presenters", "Workshop ID", "CEUs", "RID participants", "Evaluations", "Average rating", "Session materials"],
      ...report.sessions.map((s) => [
        sessionNumber(s.key), s.date, s.time, s.title, presenterNames(s), s.workshopId, s.ceus,
        s.people, evalOf.get(s.key)?.rows.length || 0, averageOf(evalOf.get(s.key)), materialsStatus(s),
      ]),
    ]),
  });

  // Their template, word for word, with no byte-order mark: it may be loaded
  // straight into RID's system, which expects exactly the header they sent.
  entries.push({ name: "1. RID CEU Upload Form.csv", data: uploadCsv(report.rows) });

  for (const s of report.sessions) {
    const e = evalOf.get(s.key);
    if (!e || !e.rows.length) continue;
    entries.push({
      name: `2. Evaluation Results/${fileSafe(sessionLabel(s))}.csv`,
      data: csv([
        ["Name", "Attended", ...e.questions],
        ...e.rows.map((r) => [r.name, r.attended, ...e.questions.map((q) => r.answers[q] ?? "")]),
      ]),
    });
  }

  for (const s of report.sessions) {
    const base = `3. Session Materials/${fileSafe(sessionLabel(s))}`;
    if (s.release === "withhold") {
      entries.push({
        name: `${base} - slides not released.txt`,
        data: `The presenter did not authorize release of the slides for this session.\r\n\r\n${description(s)}\r\n`,
      });
      continue;
    }
    let any = false;
    for (const p of s.presenters) {
      const slide = p.slide;
      if (!slide) continue;
      any = true;
      if (slide.sizeBytes) {
        const size = slide.sizeBytes;
        entries.push({
          name: `${base} - ${fileSafe(p.name)}.${extensionFor(slide.fileName, slide.mime)}`,
          data: () => slideChunks(p.id, size),
        });
      } else if (slide.linkUrl) {
        entries.push({
          name: `${base} - ${fileSafe(p.name)} - link to slides.txt`,
          data: `Slides for "${s.title}", presented by ${p.name}:\r\n${slide.linkUrl}\r\n`,
        });
      }
    }
    if (!any) entries.push({ name: `${base} - no slides on file.txt`, data: `${description(s)}\r\n` });
  }

  return entries;
}
