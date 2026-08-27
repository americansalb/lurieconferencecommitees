"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, Search, UserCheck, Download, Send, Check, Mail,
  Clock, XCircle, RefreshCw, AlertCircle, CircleHelp, Trash2, Megaphone, Inbox,
  Presentation, ExternalLink, StickyNote, Ticket, BookOpen, Upload, Banknote } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { STATUS_LABELS } from "@/lib/presenters";
import { parseResponse } from "@/lib/api";
import { InviteComposer, type InviteEditable } from "@/components/presenters/InviteComposer";
import ProposalCallComposer from "@/components/presenters/ProposalCallComposer";
import { SLIDE_ACCEPT, MAX_SLIDE_LABEL } from "@/lib/slide-types";
import { fileSize } from "@/components/presenters/SlideUpload";

interface PresenterRow {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  jobTitle: string | null;
  role: string | null;
  talkTitle: string | null;
  sessionFormat: string | null;
  sessionLength: string | null;
  sessionTrack: string | null;
  preferredDay: string | null;
  honorariumAmount: number | null;
  travelReimbursement: number | null;
  status: string;
  invitedAt: string;
  confirmedAt: string | null;
  lastSentAt: string | null;
  headshotMime: string | null;
  slidesRequestedAt: string | null;
  // Set once we've registered them as a complimentary attendee and sent
  // them their portal link.
  attendeeInvitedAt: string | null;
  // When we asked them where to send the honorarium cheque.
  honorariumAskedAt: string | null;
  slidesRemindCount: number;
  slideNotes: string | null;
  slide: {
    fileName: string | null; sizeBytes: number | null; linkUrl: string | null;
    // An email when we uploaded it for them, null when they sent it themselves.
    uploadedBy: string | null;
    updatedAt: string | null; createdAt: string;
  } | null;
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PresentersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<PresenterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [showProposalCall, setShowProposalCall] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<InviteEditable | null>(null);
  const [slidesBusy, setSlidesBusy] = useState<"initial" | "remind" | null>(null);
  const [seatBusy, setSeatBusy] = useState<"initial" | "all" | null>(null);
  const [seatNote, setSeatNote] = useState<string | null>(null);
  const [slidesNote, setSlidesNote] = useState<string | null>(null);
  const [honorariumBusy, setHonorariumBusy] = useState<"initial" | "all" | null>(null);
  const [honorariumNote, setHonorariumNote] = useState<string | null>(null);
  const [honorariumOne, setHonorariumOne] = useState<string | null>(null);
  const [showHonorariumList, setShowHonorariumList] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || role === "developer";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/presenters");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  // Open the confirm composer pre-filled from an applicant's full submission
  // (the list payload omits the abstract and objectives, so fetch the record).
  const startAccept = useCallback(async (id: string) => {
    const res = await fetch(`/api/presenters/${id}`);
    if (!res.ok) return;
    const p = await res.json();
    setAcceptTarget({
      id: p.id,
      name: p.name || "",
      email: p.email || "",
      affiliation: p.affiliation ?? null,
      role: p.role ?? null,
      sessionFormat: p.sessionFormat ?? null,
      sessionLength: p.sessionLength ?? null,
      qaLength: p.qaLength ?? null,
      sessionTrack: p.sessionTrack ?? null,
      preferredDay: p.preferredDay ?? null,
      talkTitle: p.talkTitle ?? null,
      talkAbstract: p.talkAbstract ?? null,
      learningObjectives: p.learningObjectives ?? null,
      honorariumAmount: p.honorariumAmount ?? null,
      travelReimbursement: p.travelReimbursement ?? null,
    });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    load();
  }, [session, status, router, load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.talkTitle || "").toLowerCase().includes(q) ||
        (r.affiliation || "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => ({
    all: rows.length,
    proposed: rows.filter((r) => r.status === "proposed").length,
    invited: rows.filter((r) => r.status === "invited").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    tentative: rows.filter((r) => r.status === "tentative").length,
    changes_requested: rows.filter((r) => r.status === "changes_requested").length,
    declined: rows.filter((r) => r.status === "declined").length,
  }), [rows]);

  // Slide-deck collection across the confirmed roster: who has delivered,
  // who has been asked and hasn't, and who we haven't asked at all.
  const slides = useMemo(() => {
    const confirmed = rows.filter((r) => r.status === "confirmed");
    return {
      confirmed: confirmed.length,
      received: confirmed.filter((r) => r.slide).length,
      notAsked: confirmed.filter((r) => !r.slidesRequestedAt).length,
      askedPending: confirmed.filter((r) => r.slidesRequestedAt && !r.slide).length,
      // Presenters attend free; this is who has not yet been told so and
      // given their attendee page.
      seatNotSent: confirmed.filter((r) => !r.attendeeInvitedAt).length,
      // Paying them afterwards. Somebody with no amount on file is not a
      // recipient: we would be writing to them about an honorarium we have
      // not agreed. Counted separately so the gap is visible rather than
      // silently dropped.
      owed: confirmed.filter((r) => (r.honorariumAmount || 0) > 0 || (r.travelReimbursement || 0) > 0),
      owedNotAsked: confirmed.filter(
        (r) => ((r.honorariumAmount || 0) > 0 || (r.travelReimbursement || 0) > 0) && !r.honorariumAskedAt
      ).length,
      noAmount: confirmed.filter((r) => !(r.honorariumAmount || 0) && !(r.travelReimbursement || 0)).length,
    };
  }, [rows]);

  // Confirm presenters as attendees: creates their attendee record with the
  // details their proposal already gave us, and mails them the portal link.
  async function confirmSeats(mode: "initial" | "all") {
    setSeatBusy(mode);
    setSeatNote(null);
    try {
      const res = await fetch("/api/presenters/confirm-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json().catch(() => ({}));
      setSeatNote(res.ok
        ? `Confirmed ${json.sent || 0} presenter${json.sent === 1 ? "" : "s"} as attendees${json.failed ? ` · ${json.failed} failed` : ""}${json.skipped ? ` · ${json.skipped} skipped` : ""}.`
        : (json.error || "Could not send."));
      await load();
    } catch {
      setSeatNote("Network error.");
    } finally {
      setSeatBusy(null);
      setTimeout(() => setSeatNote(null), 9000);
    }
  }

  // One presenter, on purpose. This is the normal way to use this: send to
  // yourself first, then work down the list watching each one go.
  async function requestHonorariumFor(id: string, name: string) {
    setHonorariumOne(id);
    setHonorariumNote(null);
    try {
      const res = await fetch("/api/presenters/request-honorarium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "all", ids: [id] }),
      });
      const json = await res.json().catch(() => ({}));
      setHonorariumNote(res.ok && json.sent
        ? `Sent to ${name} at ${(json.recipients || [])[0] || "their address"}.`
        : (json.error || (json.failures || [])[0]?.error || `Could not send to ${name}.`));
      await load();
    } catch {
      setHonorariumNote("Network error while sending.");
    } finally {
      setHonorariumOne(null);
      setTimeout(() => setHonorariumNote(null), 12000);
    }
  }

  // A copy to yourself, with a real presenter's figures, marking nobody as
  // asked. What the presenters will get, before any of them get it.
  async function testHonorarium() {
    setHonorariumBusy("initial");
    setHonorariumNote(null);
    try {
      const res = await fetch("/api/presenters/request-honorarium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "all", test: true }),
      });
      const json = await res.json().catch(() => ({}));
      setHonorariumNote(res.ok && json.sent
        ? `Test copy sent to ${(json.recipients || [])[0]}. Nobody was marked as asked.`
        : (json.error || (json.failures || [])[0]?.error || "Could not send the test."));
    } catch {
      setHonorariumNote("Network error while sending.");
    } finally {
      setHonorariumBusy(null);
      setTimeout(() => setHonorariumNote(null), 12000);
    }
  }

  // Thank you, and where should the cheque go. Sent after the conference, so
  // it is the first thing presenters hear from us afterwards.
  async function requestHonorarium(mode: "initial" | "all") {
    setHonorariumBusy(mode);
    setHonorariumNote(null);
    try {
      const res = await fetch("/api/presenters/request-honorarium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json().catch(() => ({}));
      const skipped = json.skippedNoAmount
        ? ` · ${json.skippedNoAmount} skipped with no amount on file`
        : "";
      setHonorariumNote(res.ok
        ? (json.sent || 0) === 0
          ? `Nobody to write to${skipped || ": everyone with an amount on file has already been asked"}.`
          : `Asked ${json.sent} presenter${json.sent === 1 ? "" : "s"}${json.failed ? ` · ${json.failed} failed: ${(json.failures || []).map((f: { email: string }) => f.email).join(", ")}` : ""}${skipped}.`
        : (json.error || "Could not send."));
      await load();
    } catch {
      setHonorariumNote("Network error while sending.");
    } finally {
      setHonorariumBusy(null);
      setTimeout(() => setHonorariumNote(null), 12000);
    }
  }

  async function requestSlides(mode: "initial" | "remind") {
    setSlidesBusy(mode);
    setSlidesNote(null);
    try {
      const res = await fetch("/api/presenters/request-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json().catch(() => ({}));
      setSlidesNote(res.ok
        ? `${mode === "remind" ? "Reminded" : "Asked"} ${json.sent || 0} presenter${json.sent === 1 ? "" : "s"}${json.failed ? ` · ${json.failed} failed` : ""}.`
        : (json.error || "Could not send."));
      await load();
    } catch {
      setSlidesNote("Network error while sending.");
    } finally {
      setSlidesBusy(null);
      setTimeout(() => setSlidesNote(null), 8000);
    }
  }

  function exportCsv() {
    const headers = ["Name", "Email", "Affiliation", "Role", "Talk title", "Length", "Track", "Day", "Honorarium", "Travel", "Status", "Invited", "Confirmed"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push([
        r.name, r.email, r.affiliation || "", r.role || "", r.talkTitle || "",
        r.sessionLength || "", r.sessionTrack || "", r.preferredDay || "",
        r.honorariumAmount ? `$${r.honorariumAmount}` : "",
        r.travelReimbursement ? `up to $${r.travelReimbursement}` : "",
        r.status, r.invitedAt, r.confirmedAt || "",
      ].map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presenters-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0E5566]">
                  <Mic className="w-3.5 h-3.5" /> Presenters
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                  Presenter confirmations
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Track invitations and confirmations for the 2026 Lurie Children&rsquo;s and AALB Conference.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/presenters/program-book"
                  title="Build the printable speaker book: every presenter with their slot, session title, description, learning objectives and bio. Edit it all before it prints."
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-left text-[#0E5566] bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">Speaker Book</span>
                    <span className="block text-[11px] font-medium text-slate-500">Configure, then export a PDF</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowProposalCall(true)}
                  title="Open call, emails a link inviting someone to submit their own proposal. They apply, you review."
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-left text-[#0E5566] bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">Call for Proposals</span>
                    <span className="block text-[11px] font-medium text-slate-500">Open call, they apply to speak</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  title="You've selected this speaker, send them their session details and a private portal link to confirm participation, request changes, or decline."
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-left text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">Confirm a Presenter</span>
                    <span className="block text-[11px] font-medium text-white/70">You pick them; they confirm participation</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
              <Stat label="Total" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
              <Stat label="Applicants" value={counts.proposed} icon={<Inbox className="w-4 h-4 text-violet-500" />} active={filter === "proposed"} onClick={() => setFilter("proposed")} />
              <Stat label="Awaiting" value={counts.invited} icon={<Clock className="w-4 h-4 text-amber-500" />} active={filter === "invited"} onClick={() => setFilter("invited")} />
              <Stat label="Confirmed" value={counts.confirmed} icon={<Check className="w-4 h-4 text-emerald-500" />} active={filter === "confirmed"} onClick={() => setFilter("confirmed")} />
              <Stat label="Tentative" value={counts.tentative} icon={<CircleHelp className="w-4 h-4 text-sky-500" />} active={filter === "tentative"} onClick={() => setFilter("tentative")} />
              <Stat label="Changes" value={counts.changes_requested} icon={<AlertCircle className="w-4 h-4 text-amber-600" />} active={filter === "changes_requested"} onClick={() => setFilter("changes_requested")} />
              <Stat label="Declined" value={counts.declined} icon={<XCircle className="w-4 h-4 text-rose-500" />} active={filter === "declined"} onClick={() => setFilter("declined")} />
            </div>

            {isAdmin && slides.confirmed > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <Presentation className="w-4 h-4 text-[#0E5566]" /> Presentation decks
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {slides.received}/{slides.confirmed} in
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Confirmed presenters upload their deck (PowerPoint, Keynote, PDF or a video up to {MAX_SLIDE_LABEL}, or a Google
                      Slides link) right in their portal, due <strong>Saturday, August 8</strong>, so there&rsquo;s time
                      to review formatting. Files over {MAX_SLIDE_LABEL} come in by email to contact@aalb.org. If someone
                      is not going to manage the form, use the upload arrow on their row and put the deck on file
                      for them; rows say which decks came in that way. Each row below shows who has delivered;
                      sends log to the presenter&rsquo;s history.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => requestSlides("initial")}
                      disabled={slidesBusy !== null || slides.notAsked === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50 bg-gradient-to-r from-[#0E5566] to-[#0066B3]"
                      title="Email every confirmed presenter who hasn't been asked yet"
                    >
                      {slidesBusy === "initial" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {slides.notAsked === 0 ? "Everyone asked" : `Ask for presentations (${slides.notAsked})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestSlides("remind")}
                      disabled={slidesBusy !== null || slides.askedPending === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-50 text-[#0E5566] border-[#0E5566] bg-white"
                      title="Nudge everyone who was asked and hasn't sent a deck yet"
                    >
                      {slidesBusy === "remind" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      {slides.askedPending === 0 ? "No one to remind" : `Send reminder (${slides.askedPending})`}
                    </button>
                  </div>
                </div>
                {slidesNote && <div className="mt-2 text-xs font-semibold text-teal-700">{slidesNote}</div>}
              </div>
            )}

            {isAdmin && slides.confirmed > 0 && (
              <div className="rounded-2xl p-4 shadow-sm mb-4 border" style={{ background: "linear-gradient(180deg,#FBF8F1,#ffffff)", borderColor: "#E6D9B8" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <Ticket className="w-4 h-4" style={{ color: "#9A7B2E" }} /> Presenter seats
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {slides.confirmed - slides.seatNotSent}/{slides.confirmed} confirmed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Presenters attend free, both days. This registers each confirmed presenter as an
                      attendee at no charge and emails them their attendee page, carrying over the dietary,
                      accessibility, parking and phone answers from their proposal so they only have to check
                      them. They then appear in Attendees and in the Accommodations view like everyone else.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => confirmSeats("initial")}
                      disabled={seatBusy !== null || slides.seatNotSent === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50 bg-gradient-to-r from-[#0E5566] to-[#0066B3]"
                      title="Register every confirmed presenter as a complimentary attendee and email them their page"
                    >
                      {seatBusy === "initial" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {slides.seatNotSent === 0 ? "All confirmed" : `Confirm seats (${slides.seatNotSent})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmSeats("all")}
                      disabled={seatBusy !== null}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-50 text-[#0E5566] border-[#0E5566] bg-white"
                      title="Send again to every confirmed presenter, including those already sent"
                    >
                      {seatBusy === "all" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Re-send to all
                    </button>
                  </div>
                </div>
                {seatNote && <div className="mt-2 text-xs font-semibold text-teal-700">{seatNote}</div>}
              </div>
            )}

            {/* Paying them, after the fact. Sits below the seats panel because
                that is the order the work happens in: invite, collect decks,
                seat them, and then settle up once the conference is over. */}
            {isAdmin && slides.owed.length > 0 && (
              <div className="rounded-2xl p-4 shadow-sm mb-4 border" style={{ background: "linear-gradient(180deg,#F5F3FF,#ffffff)", borderColor: "#DDD6FE" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <Banknote className="w-4 h-4" style={{ color: "#7C3AED" }} /> Honorarium payment
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {slides.owed.length - slides.owedNotAsked}/{slides.owed.length} asked
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Thanks them for the weekend, tells them the attendee feedback is coming, and asks
                      where to post the cheque. They can reply with a mailing address, or send an invoice
                      to <strong className="text-slate-700">invoice@aalb.org</strong> if they would rather
                      bill us. Each email names that presenter&rsquo;s own honorarium, and travel
                      reimbursement where they have one.
                      {slides.noAmount > 0 && (
                        <>
                          {" "}
                          <strong className="text-amber-700">
                            {slides.noAmount} confirmed presenter{slides.noAmount === 1 ? " has" : "s have"} no
                            amount on file and {slides.noAmount === 1 ? "is" : "are"} left out
                          </strong>
                          , since we would be writing to them about money we have not agreed. Add an amount on
                          their page to include them.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={testHonorarium}
                      disabled={honorariumBusy !== null || honorariumOne !== null}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50"
                      style={{ background: "linear-gradient(90deg,#7C3AED,#6D28D9)" }}
                      title="Send yourself one copy, with a real presenter's figures. Marks nobody as asked."
                    >
                      {honorariumBusy === "initial" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send me a test copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHonorariumList((v) => !v)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border text-[#6D28D9] border-[#DDD6FE] bg-white"
                    >
                      <Banknote className="w-4 h-4" />
                      {showHonorariumList ? "Hide the list" : `Send one at a time (${slides.owed.length})`}
                    </button>
                  </div>
                </div>
                {honorariumNote && <div className="mt-2 text-xs font-semibold text-[#6D28D9]">{honorariumNote}</div>}

                {showHonorariumList && (
                  <div className="mt-3 rounded-xl border border-[#DDD6FE] bg-white overflow-hidden">
                    {slides.owed.map((r) => (
                      <div key={r.id} className="px-3 py-2.5 flex items-center gap-3 border-b border-slate-100 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-slate-900 truncate">{r.name}</div>
                          <div className="text-[11.5px] text-slate-500 truncate">
                            {r.email}
                            {r.honorariumAmount ? ` · $${r.honorariumAmount.toLocaleString("en-US")} honorarium` : ""}
                            {r.travelReimbursement ? ` · up to $${r.travelReimbursement.toLocaleString("en-US")} travel` : ""}
                          </div>
                        </div>
                        {r.honorariumAskedAt && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                            Asked {shortDate(r.honorariumAskedAt)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => requestHonorariumFor(r.id, r.name)}
                          disabled={honorariumOne !== null || honorariumBusy !== null}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border disabled:opacity-40 text-[#6D28D9] border-[#DDD6FE] bg-white hover:bg-[#F5F3FF]"
                          title={r.honorariumAskedAt ? `Send to ${r.name} again` : `Send to ${r.name}`}
                        >
                          {honorariumOne === r.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          {honorariumOne === r.id ? "Sending" : r.honorariumAskedAt ? "Send again" : "Send"}
                        </button>
                      </div>
                    ))}
                    {/* Still available, but it asks first: going one at a time
                        is the point of this list. */}
                    <div className="px-3 py-2.5 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[11.5px] text-slate-500">
                        Done checking? You can send to everyone not yet asked in one go.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (slides.owedNotAsked === 0) return;
                          if (confirm(`Email all ${slides.owedNotAsked} presenters who have not been asked yet? This sends immediately and cannot be taken back.`)) {
                            void requestHonorarium("initial");
                          }
                        }}
                        disabled={honorariumBusy !== null || honorariumOne !== null || slides.owedNotAsked === 0}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border disabled:opacity-40 text-slate-600 border-slate-200 bg-white hover:bg-white"
                      >
                        {honorariumBusy === "initial" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {slides.owedNotAsked === 0 ? "Everyone asked" : `Send to the remaining ${slides.owedNotAsked}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, talk title"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0066B3]/20 focus:border-[#0066B3] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={load}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-slate-400">
                  No presenters {filter === "all" ? "yet" : `with status "${filter}"`}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <PresenterRowItem key={r.id} row={r} isAdmin={isAdmin} onChanged={load} onAccept={startAccept} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>

      {showInvite && (
        <InviteComposer
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); load(); }}
        />
      )}

      {showProposalCall && (
        <ProposalCallComposer
          onClose={() => setShowProposalCall(false)}
          onSent={() => setShowProposalCall(false)}
        />
      )}

      {acceptTarget && (
        <InviteComposer
          existing={acceptTarget}
          acceptMode
          onClose={() => setAcceptTarget(null)}
          onCreated={() => { setAcceptTarget(null); load(); }}
        />
      )}
    </div>
  );
}

function Stat({
  label, value, icon, active, onClick,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left p-4 rounded-2xl border transition-all " +
        (active
          ? "bg-white border-[#0066B3] ring-1 ring-[#0066B3]/20 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300")
      }
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">{label}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </button>
  );
}

function PresenterRowItem({
  row, isAdmin, onChanged, onAccept,
}: {
  row: PresenterRow;
  isAdmin: boolean;
  onChanged: () => void;
  onAccept: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const status = STATUS_LABELS[row.status] || STATUS_LABELS.invited;

  async function resend() {
    if (!isAdmin) return;
    setBusy(true);
    await fetch(`/api/presenters/${row.id}/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    onChanged();
  }

  async function remove() {
    if (!isAdmin) return;
    setBusy(true);
    await fetch(`/api/presenters/${row.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    onChanged();
  }

  const subtitle = [
    row.role || row.sessionFormat,
    row.sessionLength,
    row.preferredDay,
  ].filter(Boolean).join(" | ");

  return (
    <div className="px-5 py-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 font-semibold text-sm shrink-0">
          {row.headshotMime ? (
            <img src={`/api/presenters/headshot/${row.id}`} alt="" className="w-full h-full object-cover" />
          ) : (
            row.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/presenters/${row.id}`} className="text-sm font-semibold text-slate-900 hover:text-[#0066B3] truncate block">
            {row.name}
          </Link>
          <div className="text-xs text-slate-500 truncate">
            {row.talkTitle || row.email}
            {subtitle && <span className="text-slate-300"> | {subtitle}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Deck state, only meaningful once someone is confirmed: green when
            it's in (click to download; PDFs open in the tab, links open the
            deck), amber while we're waiting on an ask. */}
        {row.status === "confirmed" && row.slide && (
          <a
            href={`/api/presenters/${row.id}/slides`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            title={`${row.slide.fileName
              ? `${row.slide.fileName}${row.slide.sizeBytes ? ` · ${fileSize(row.slide.sizeBytes)}` : ""} — click to download`
              : `${row.slide.linkUrl} — click to open`}${
              row.slide.uploadedBy ? `\nUploaded for them by ${row.slide.uploadedBy}` : "\nSent by the presenter"}`}
          >
            {row.slide.fileName ? <Download className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
            Slides in{row.slide.uploadedBy ? " (we uploaded)" : ""} · {shortDate(row.slide.updatedAt || row.slide.createdAt)}
          </a>
        )}
        {/* Load a deck for someone who is not going to work the portal form.
            Right here on the row, because the point is to do it in one go for
            the handful of people it applies to, not to open each one. */}
        {isAdmin && row.status === "confirmed" && (
          <RowSlideUpload id={row.id} name={row.name} hasSlide={!!row.slide} onDone={onChanged} />
        )}
        {row.status === "confirmed" && row.slideNotes && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-violet-50 text-violet-700 border-violet-200"
            title={`Session notes from the presenter: ${row.slideNotes}`}
          >
            <StickyNote className="w-3 h-3" /> Note
          </span>
        )}
        {row.status === "confirmed" && !row.slide && row.slidesRequestedAt && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200"
            title={`Asked ${shortDate(row.slidesRequestedAt)}${row.slidesRemindCount ? `, reminded ${row.slidesRemindCount}×` : ""} — no deck yet`}
          >
            <Presentation className="w-3 h-3" />
            Slides asked {shortDate(row.slidesRequestedAt)}{row.slidesRemindCount ? ` · ${row.slidesRemindCount}×` : ""}
          </span>
        )}
        <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border " + status.color}>
          {status.label}
        </span>
        {row.status === "proposed" ? (
          isAdmin && (
            <button
              type="button"
              onClick={() => onAccept(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C]"
              title="Accept this applicant and email them a portal link to confirm participation"
            >
              <UserCheck className="w-3 h-3" /> Accept
            </button>
          )
        ) : row.status !== "confirmed" ? (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0066B3] hover:bg-[#0066B3]/5 disabled:opacity-40"
            title="Resend invitation"
          >
            <Send className="w-3 h-3" /> {busy ? "Sending" : "Resend"}
          </button>
        ) : null}
        {isAdmin && (
          confirming ? (
            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
              <span className="text-[11px] font-medium text-rose-700">Delete?</span>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40"
              >
                {busy ? "Deleting" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:bg-slate-100"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Delete invitation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}
        <Link href={`/presenters/${row.id}`} className="text-xs font-semibold text-[#0066B3] hover:underline">
          View
        </Link>
      </div>
    </div>
  );
}


/**
 * The upload button on a presenter row.
 *
 * Deliberately tiny: pick a file, it saves, the row refreshes. Anything more
 * involved (links, replacing, removing) lives on the presenter's own page,
 * which is one click away.
 */
function RowSlideUpload({ id, name, hasSlide, onDone }: {
  id: string;
  name: string;
  hasSlide: boolean;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | null | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      // Raw body, name in a header: see SlideUpload for why this is not
      // multipart.
      const res = await fetch(`/api/presenters/${id}/slides`, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-File-Name": encodeURIComponent(file.name),
          "X-File-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "That did not save.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not save.");
      setTimeout(() => setError(null), 6000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={SLIDE_ACCEPT}
        className="hidden"
        onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        title={error || `Upload a presentation for ${name.split(" ")[0]}${hasSlide ? ", replacing what is on file" : ""}`}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold disabled:opacity-40 ${
          error ? "text-rose-700 bg-rose-50" : "text-slate-500 hover:text-[#0066B3] hover:bg-[#0066B3]/5"
        }`}
      >
        <Upload className="w-3.5 h-3.5" />
        {busy ? "Uploading" : error ? "Failed" : hasSlide ? "" : "Upload"}
      </button>
    </>
  );
}

function csvEscape(s: string) {
  if (s == null) return "";
  const needs = /[",\n]/.test(s);
  const safe = s.replace(/"/g, '""');
  return needs ? `"${safe}"` : safe;
}
