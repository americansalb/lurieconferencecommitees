"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Users, Send, Pause, Play, Loader2, Mail, Check,
  RefreshCw, Zap, FileText, UserPlus, Rocket, Eye, SlidersHorizontal,
  ChevronDown, ChevronRight, Video, Shuffle, GraduationCap, MapPin,
} from "lucide-react";
import { STUDENT_ROSTER_CSV, STUDENT_ROSTER_COUNT, STUDENT_ROSTER_ALUMNI, STUDENT_ROSTER_STUDENT, STUDENT_ROSTER_FORMER } from "@/lib/student-roster";
import { NBCMI_ROSTER_CSV, NBCMI_ROSTER_COUNT } from "@/lib/nbcmi-roster";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { ATTENDEE_TEMPLATES, type AttendeeTemplate } from "@/lib/attendees";
import EmailPreviewModal from "@/components/attendees/EmailPreviewModal";
import QueueSettingsModal from "@/components/email/QueueSettingsModal";
import AttendeesView, { type Attendee } from "./AttendeesView";
import LogisticsView from "./LogisticsView";
import AttendeeDrawer from "./AttendeeDrawer";
import BroadcastComposer from "./BroadcastComposer";
import EventSettingsModal from "./EventSettingsModal";

type PreviewState = { title: string; meta?: string; html: string | null };

type QueueEntry = {
  id: string;
  to: string;
  subject: string;
  scheduledFor: string | null;
  recipientType: string;
  recipientId: string | null;
  attempts: number;
};

type QueueStatus = {
  counts: Record<string, number>;
  nextScheduledFor: string | null;
  sentLast24h: number;
  policy: {
    maxPerHour: number;
    maxPerDay: number;
    minGapSeconds: number;
    maxGapSeconds: number;
    sendStartHour: number;
    sendEndHour: number;
    sendTimezone: string;
  };
  paused: boolean;
  pending: QueueEntry[];
};

type InviteSubTab = "quick" | "bulk";

export default function AttendeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"attendees" | "logistics" | "invite">("attendees");
  const [inviteSubTab, setInviteSubTab] = useState<InviteSubTab>("quick");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  // Counts for the hand-curated Chicago direct-invitation list. Fetched rather
  // than imported so the ~30 hand-written letters don't ship in the bundle.
  const [chicagoStats, setChicagoStats] = useState<{ curated: number; loadable: number; missingEmail: number; held: number; heldInPipeline: number; inPipeline: number; contacted: number; pending: number; paid: number } | null>(null);
  const [loading, setLoading] = useState(true);
  // Attendees view: detail drawer + broadcast composer + portal-link sends.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [composerIds, setComposerIds] = useState<string[] | null>(null);
  const [portalNote, setPortalNote] = useState<string | null>(null);
  const [showEventSettings, setShowEventSettings] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void;
  } | null>(null);
  const [reinvite, setReinvite] = useState<{ sending: boolean; note: string | null }>({ sending: false, note: null });
  const [nudge, setNudge] = useState<{ sending: boolean; note: string | null }>({ sending: false, note: null });
  // One-click AALB student roster load (draft only, nothing sent).
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterNote, setRosterNote] = useState<string | null>(null);

  // Shared composer state
  const [inviteMessage, setInviteMessage] = useState("");
  const [discountPercent, setDiscountPercent] = useState(25);
  // No default: the admin must explicitly pick a template so the wrong email
  // never goes out by accident. Any of the four (standard / alumni / student /
  // former-student) is allowed for manual sends; the roster load carries its
  // own per-row template.
  const [template, setTemplate] = useState<AttendeeTemplate | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showQueueList, setShowQueueList] = useState(false);
  const [sendingEntryId, setSendingEntryId] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  // Quick invite form
  const [single, setSingle] = useState({ firstName: "", lastName: "", email: "", affiliation: "" });
  const [quickSending, setQuickSending] = useState(false);
  const [quickResult, setQuickResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Bulk invite
  const [csv, setCsv] = useState("");
  const [bulkMode, setBulkMode] = useState<"csv" | "emails">("csv");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: { email: string; reason: string }[]; parseErrors: string[] } | null>(null);
  const [emailsResult, setEmailsResult] = useState<{ sent: number; failed: number; results: { email: string; sent: boolean; error?: string }[]; invalid: string[]; skippedOverCap: number; error?: string } | null>(null);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [a, q, c] = await Promise.all([
        fetch("/api/attendees").then((r) => (r.ok ? r.json() : { attendees: [] })),
        // Queue status is admin-gated server-side; non-admins just get null and the panel stays hidden.
        // This fetch also nudges the server to send any now-due queued invites.
        fetch("/api/admin/email-queue").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/attendees/load-chicago").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setAttendees(a.attendees || []);
      setQueueStatus(q);
      setChicagoStats(c);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // While invites are still queued, refresh quietly every 30s. Each refresh's
  // queue fetch also drains any now-due sends server-side, so the batch goes
  // out on its own while this page is open even if the background cron isn't.
  const pendingCount = queueStatus?.counts?.pending || 0;
  useEffect(() => {
    if (status !== "authenticated" || pendingCount <= 0) return;
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [status, pendingCount, load]);

  async function sendQuick() {
    if (!template) {
      setQuickResult({ ok: false, message: "Choose an email template first: Standard or AALB alumni." });
      return;
    }
    if (!single.firstName.trim() || !single.lastName.trim() || !single.email.trim()) {
      setQuickResult({ ok: false, message: "Fill in first name, last name, and email." });
      return;
    }
    setQuickSending(true);
    setQuickResult(null);
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        single,
        inviteMessage: inviteMessage.trim() || undefined,
        discountPercent,
        template,
      }),
    });
    const json = await res.json();
    setQuickSending(false);
    if (res.ok && json.sent) {
      setQuickResult({ ok: true, message: `Sent to ${single.email}.` });
      setSingle({ firstName: "", lastName: "", email: "", affiliation: "" });
      load();
    } else {
      setQuickResult({ ok: false, message: json.error || "Could not send invite." });
      if (json.attendeeId) load();
    }
  }

  async function sendBulk() {
    if (!csv.trim()) return;
    if (!template) {
      setBulkResult({ created: 0, skipped: [], parseErrors: ["Choose an email template first: Standard or AALB alumni."] });
      return;
    }
    setBulkSending(true);
    setBulkResult(null);
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, inviteMessage, discountPercent, template }),
    });
    const json = await res.json();
    setBulkSending(false);
    setBulkResult(json);
    if (json.created > 0) {
      setCsv("");
      load();
    }
  }

  // One click: load the full baked-in AALB student roster into the pipeline as
  // "queued" (on the list, NOT emailed) with the 25% discount, each person with
  // their own template. Nothing sends. Re-clicking only adds people not already
  // on the list. Jumps to the Attendees tab afterward so they're visible.
  async function loadStudents() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: STUDENT_ROSTER_CSV, draftOnly: true, discountPercent: 25 }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRosterNote(
          json.created > 0
            ? `Loaded ${json.created} AALB student${json.created === 1 ? "" : "s"} into the list${json.skipped ? `, ${json.skipped} already there` : ""}. Nothing has been emailed — they're all queued. Open the Attendees tab to see them.`
            : `Everyone's already on the list${json.skipped ? ` (${json.skipped} skipped)` : ""}. Nothing new to add.`
        );
        await load();
        if (json.created > 0) setTab("attendees");
      } else {
        setRosterNote(json.error || "Could not load the roster.");
      }
    } catch {
      setRosterNote("Network error while loading the roster.");
    } finally {
      setRosterLoading(false);
      setTimeout(() => setRosterNote(null), 12000);
    }
  }

  // One click: load the 2024 conference roster (501 people — 120 paid, 66
  // started a checkout, 315 left info) into the pipeline. New people are
  // created as queued; anyone already on the list is re-tagged for the
  // "returning" reunion letter. Nothing sends until the queue step.
  async function load2024Roster() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees/load-2024", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load", discountPercent: 25 }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRosterNote(`2024 roster loaded: ${json.created || 0} added, ${json.retagged || 0} re-tagged for the reunion letter, ${json.leftAlone || 0} left alone (paid, declined, or unsubscribed). Nothing has been emailed — use "Queue reunion letters" when ready.`);
        await load();
      } else {
        setRosterNote(json.error || "Could not load the 2024 roster.");
      }
    } catch {
      setRosterNote("Network error while loading the 2024 roster.");
    } finally {
      setRosterLoading(false);
      setTimeout(() => setRosterNote(null), 15000);
    }
  }

  async function queue2024Reunion() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees/load-2024", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "queue" }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const waiting = json.alreadyQueued || 0;
        setRosterNote(json.queued > 0
          ? `${json.queued} reunion letter${json.queued === 1 ? "" : "s"} added to the paced queue${waiting ? `, and ${waiting} ${waiting === 1 ? "was" : "were"} already waiting there` : ""}. They'll drip out at the queue's rate — watch them on the Email queue page.`
          : waiting
            ? `Nothing new to add: all ${waiting} reunion letter${waiting === 1 ? " is" : "s are"} already waiting in the queue. Nobody was turned away.`
            : "Nothing to queue — everyone tagged returning has already been written to, paid, declined, or opted out.");
        await load();
      } else {
        setRosterNote(json.error || "Could not queue the reunion letters.");
      }
    } catch {
      setRosterNote("Network error while queueing the reunion letters.");
    } finally {
      setRosterLoading(false);
      setTimeout(() => setRosterNote(null), 15000);
    }
  }

  // The hand-curated Chicago list: named leaders whose own work is language
  // access, each carrying a paragraph written from something specific about
  // their organization. Rows without a published address, and rows we've
  // deliberately held back, are skipped by the loader rather than guessed at.
  async function loadChicagoList() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees/load-chicago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load", discountPercent: 25 }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRosterNote(`Chicago list loaded: ${json.created || 0} added, ${json.retagged || 0} re-tagged for their personal letter, ${json.leftAlone || 0} left alone (already written to, paid, declined, or unsubscribed). They're in the list below now with their letter already attached — loading never emails anyone. Next step: "Queue Chicago letters".`);
        await load();
      } else {
        setRosterNote(json.error || "Could not load the Chicago list.");
      }
    } catch {
      setRosterNote("Network error while loading the Chicago list.");
    } finally {
      setRosterLoading(false);
      setTimeout(() => setRosterNote(null), 15000);
    }
  }

  async function queueChicagoList() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees/load-chicago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "queue" }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        // "Already waiting in the queue" is the good outcome and has to read
        // like one. Saying it alongside "not eligible" made a no-op look like a
        // rejection, and sent someone hunting for letters that were fine.
        const waiting = json.alreadyQueued || 0;
        const written = json.writtenTo || 0;
        // Someone held after they were already loaded is a decision the queue
        // has to carry out, not a silent skip. Say it plainly, and say that
        // nobody was deleted, so a shrinking count never looks like data loss.
        const held = json.heldInPipeline || 0;
        const pulled = json.heldBack || 0;
        const heldNote = held
          ? ` ${held} ${held === 1 ? "person is" : "people are"} held back by name in the list file${pulled ? `, and ${pulled} letter${pulled === 1 ? "" : "s"} already waiting for them ${pulled === 1 ? "was" : "were"} withdrawn` : ""} — nobody was deleted, they're still on their own page.`
          : "";
        setRosterNote((json.queued > 0
          ? `${json.queued} Chicago letter${json.queued === 1 ? "" : "s"} added to the paced queue${waiting ? `, and ${waiting} ${waiting === 1 ? "was" : "were"} already waiting there` : ""}. They'll drip out at the queue's rate — watch them on the Email queue page.`
          : waiting
            ? `Nothing new to add: all ${waiting} Chicago letter${waiting === 1 ? " is" : "s are"} already waiting in the queue and will send on schedule. Nobody was turned away.`
            : written
              ? `Nothing left to queue — all ${written} ${written === 1 ? "person has" : "people have"} already been written to.`
              : "Nothing to queue. Load the Chicago list first.") + heldNote);
        await load();
      } else {
        setRosterNote(json.error || "Could not queue the Chicago letters.");
      }
    } catch {
      setRosterNote("Network error while queueing the Chicago letters.");
    } finally {
      setRosterLoading(false);
      setTimeout(() => setRosterNote(null), 15000);
    }
  }

  async function queueNbcmi() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees/queue-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: ["cmi"] }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRosterNote(json.queued > 0
          ? `${json.queued} NBCMI invite${json.queued === 1 ? "" : "s"} added to the paced queue${json.skipped ? ` (${json.skipped} already queued)` : ""}. They'll drip out at the queue's rate.`
          : `Nothing new to queue${json.skipped ? ` — ${json.skipped} already queued` : ""}.`);
        await load();
      } else {
        setRosterNote(json.error || "Could not queue the NBCMI invites.");
      }
    } catch {
      setRosterNote("Network error while queueing the NBCMI invites.");
    } finally {
      setRosterLoading(false);
      setTimeout(() => setRosterNote(null), 15000);
    }
  }

  function confirmQueueNbcmi() {
    const staged = attendees.filter((a) => a.inviteTemplate === "cmi" && a.status === "queued").length;
    setConfirmDialog({
      title: `Queue ${staged.toLocaleString()} NBCMI invite${staged === 1 ? "" : "s"}?`,
      message: "Everyone loaded from the NBCMI registry who hasn't been emailed gets the certified-interpreter note through the paced queue, each with 25% off and the shared CertifiedNBCMI code. At the current queue rate this drips out over several days.",
      confirmLabel: "Queue the invites",
      onConfirm: () => { setConfirmDialog(null); void queueNbcmi(); },
    });
  }

  function confirmLoad2024() {
    setConfirmDialog({
      title: "Load the 2024 conference roster (501 people)?",
      message: "Everyone who filled out the 2024 form joins the list: 120 paid attendees, 66 who started a checkout, 315 who left their info. New people are added as queued; anyone already on the list is re-tagged to get the personalized reunion letter instead. Paid, declined, and unsubscribed people are left alone. Nothing sends yet.",
      confirmLabel: "Load the roster",
      onConfirm: () => { setConfirmDialog(null); void load2024Roster(); },
    });
  }

  function confirmLoadChicago() {
    const n = chicagoStats?.loadable ?? 0;
    const gaps: string[] = [];
    if (chicagoStats?.missingEmail) gaps.push(`${chicagoStats.missingEmail} researched with no published address`);
    if (chicagoStats?.held) gaps.push(`${chicagoStats.held} held back on purpose`);
    setConfirmDialog({
      title: `Load the Chicago direct-invitation list (${n} people)?`,
      message: `Named leaders at Chicago-area organizations whose work is language access — hospitals, health centers, the courts, public health, universities, interpreter bodies. Each is added as queued with 25% off and their own hand-written opening paragraph about their organization.${gaps.length ? ` Skipped: ${gaps.join(", ")}.` : ""} Anyone already written to is left exactly as they are. Nothing sends yet.`,
      confirmLabel: "Load the list",
      onConfirm: () => { setConfirmDialog(null); void loadChicagoList(); },
    });
  }

  function confirmQueueChicago() {
    const staged = attendees.filter((a) => a.inviteTemplate === "chicago" && !a.lastSentAt && !a.paid).length;
    setConfirmDialog({
      title: `Queue ${staged.toLocaleString()} Chicago letter${staged === 1 ? "" : "s"}?`,
      message: "Each person gets a letter that opens with the paragraph written about their own organization before the conference introduces itself. Nobody who has already been emailed, paid, declined, or unsubscribed is included, and no one is double-queued. At the current queue rate this drips out over several days.",
      confirmLabel: "Queue the letters",
      onConfirm: () => { setConfirmDialog(null); void queueChicagoList(); },
    });
  }

  function confirmQueue2024() {
    setConfirmDialog({
      title: "Queue the 2024 reunion letters?",
      message: "Every returning-tagged person who hasn't paid, declined, or unsubscribed gets their personalized reunion letter dripped out through the paced email queue — including people already emailed once with a different invite. No one is double-queued.",
      confirmLabel: "Queue them",
      onConfirm: () => { setConfirmDialog(null); void queue2024Reunion(); },
    });
  }

  // Shared confirm gate for the roster load, used by both the header shortcut
  // and the full card on the Invite tab.
  function confirmLoadStudents() {
    setConfirmDialog({
      title: `Load ${STUDENT_ROSTER_COUNT.toLocaleString()} AALB students?`,
      message: "Everyone is added to the Attendees list as queued (not emailed) with the 25% discount and their own gold invitation. Nothing sends until you send it. Anyone already on the list is skipped.",
      confirmLabel: "Load them",
      onConfirm: () => { setConfirmDialog(null); void loadStudents(); },
    });
  }

  async function loadNbcmi() {
    setRosterLoading(true);
    setRosterNote(null);
    try {
      const res = await fetch("/api/attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: NBCMI_ROSTER_CSV, draftOnly: true, discountPercent: 25 }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRosterNote(
          json.created > 0
            ? `Loaded ${json.created} certified interpreter${json.created === 1 ? "" : "s"} from the NBCMI registry${json.skipped ? `, ${json.skipped} already there` : ""}. Nothing has been emailed — they're all queued with the "NBCMI CMI" template.`
            : `Everyone's already on the list${json.skipped ? ` (${json.skipped} skipped)` : ""}. Nothing new to add.`
        );
        await load();
        if (json.created > 0) setTab("attendees");
      } else {
        setRosterNote(json.error || "Could not load the NBCMI registry.");
      }
    } catch {
      setRosterNote("Network error while loading the NBCMI registry.");
    }
    setRosterLoading(false);
  }

  function confirmLoadNbcmi() {
    setConfirmDialog({
      title: `Load ${NBCMI_ROSTER_COUNT.toLocaleString()} NBCMI-certified interpreters?`,
      message: "Everyone on the NBCMI public registry export joins the list as queued with the NBCMI CMI template and 25% off. Nothing is emailed until you queue the invites. Anyone already on the list is skipped.",
      confirmLabel: "Load the registry",
      onConfirm: () => { setConfirmDialog(null); void loadNbcmi(); },
    });
  }

  // Emails-only delivery test: paste addresses separated by commas/spaces/lines,
  // no names. Sends each one right away so seed inboxes get it immediately.
  async function sendDeliveryTest() {
    if (!csv.trim()) return;
    if (!template) {
      setEmailsResult({ sent: 0, failed: 0, results: [], invalid: [], skippedOverCap: 0, error: "Choose a template first: Standard or AALB alumni." });
      return;
    }
    setBulkSending(true);
    setEmailsResult(null);
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: csv, inviteMessage, discountPercent, template }),
    });
    const json = await res.json();
    setBulkSending(false);
    setEmailsResult(json);
    if (json.sent > 0) {
      setCsv("");
      load();
    }
  }

  const templateLabel = (t: string | null) =>
    ATTENDEE_TEMPLATES.find((x) => x.id === t)?.label
      ? `${ATTENDEE_TEMPLATES.find((x) => x.id === t)!.label} template`
      : "No template selected";

  async function sendQueueEntry(id: string) {
    setSendingEntryId(id);
    try {
      await fetch("/api/admin/email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      await load();
    } finally {
      setSendingEntryId(null);
    }
  }

  async function openPreview() {
    if (!template) return;
    setPreview({ title: "Email preview", meta: templateLabel(template), html: null });
    try {
      const res = await fetch("/api/attendees/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, discountPercent, inviteMessage, firstName: single.firstName || undefined }),
      });
      const j = await res.json();
      setPreview({ title: j.subject || "Email preview", meta: `${templateLabel(template)} · sample preview`, html: j.html || "<p style='padding:24px;font-family:sans-serif'>Could not render.</p>" });
    } catch {
      setPreview({ title: "Email preview", meta: templateLabel(template), html: "<p style='padding:24px;font-family:sans-serif'>Network error.</p>" });
    }
  }

  async function viewEmail(a: Attendee) {
    setPreview({ title: `Email to ${a.firstName} ${a.lastName}`, html: null });
    try {
      const res = await fetch(`/api/attendees/${a.id}/email`);
      const j = await res.json();
      const when = j.source !== "sent"
        ? "Regenerated preview · not sent yet"
        : j.status === "sent"
          ? `Sent${j.sentAt ? " " + new Date(j.sentAt).toLocaleString() : ""}`
          : `Queued${j.scheduledFor ? " for " + new Date(j.scheduledFor).toLocaleString() : ""}`;
      setPreview({ title: j.subject || `Email to ${a.email}`, meta: `${when} · to ${j.to}`, html: j.html });
    } catch {
      setPreview({ title: "Email", meta: a.email, html: "<p style='padding:24px;font-family:sans-serif'>Could not load.</p>" });
    }
  }

  async function togglePause() {
    if (!queueStatus) return;
    await fetch("/api/admin/email-queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !queueStatus.paused }),
    });
    load();
  }

  // Re-render the pending queued invites with the latest template. The queue
  // freezes each email's HTML at enqueue time, so anything queued before a
  // template change keeps the old design until this is run.
  async function refreshQueue() {
    setShuffling(true);
    setRefreshNote(null);
    try {
      const res = await fetch("/api/attendees/refresh-queue", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      setRefreshNote(res.ok
        ? `Refreshed ${j.refreshed || 0} queued invite${j.refreshed === 1 ? "" : "s"} to the latest template.`
        : (j.error || "Could not refresh the queue."));
      await load();
    } finally {
      setShuffling(false);
      setTimeout(() => setRefreshNote(null), 8000);
    }
  }

  // Randomize the order of queued attendee invites without changing the
  // schedule: same send times, different recipients in each slot.
  async function shuffleQueue() {
    setShuffling(true);
    try {
      await fetch("/api/admin/email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shuffle", recipientType: "attendee" }),
      });
      await load();
    } finally {
      setShuffling(false);
    }
  }

  async function sendPortalLink(ids: string[]) {
    if (!ids.length) return;
    const res = await fetch("/api/attendees/portal-link", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then((r) => r.json()).catch(() => ({ sent: 0 }));
    setPortalNote(`Portal link sent to ${res.sent || 0}${res.failed ? `, ${res.failed} failed` : ""}.`);
    setTimeout(() => setPortalNote(null), 4000);
    load(true);
  }

  // Schedule invites for the selected not-yet-emailed people into the paced
  // queue. Confirmed first, since it's a real commitment — but it can NEVER
  // blast: the server drips them out slowly, and you can pause.
  function queueInvites(ids: string[]) {
    if (!ids.length) return;
    // Quote the real policy, not a number typed in once. This dialog used to
    // promise "about 19/hour, in the 9 AM–7 PM window" while the queue was
    // actually running at 10/hour until 5 — so mail looked overdue when it
    // was on time.
    const pace = queueStatus
      ? `about ${queueStatus.policy.maxPerHour}/hour, between ${queueStatus.policy.sendStartHour}:00 and ${queueStatus.policy.sendEndHour}:00 ${(queueStatus.policy.sendTimezone || "").replace("America/", "").replace("_", " ")} on weekdays`
      : "slowly, during business hours";
    setConfirmDialog({
      title: "Queue these invites?",
      message: `This schedules invites for the not-yet-emailed people in your selection into the paced queue. They go out one at a time (${pace}), never all at once, and you can pause anytime. Nothing sends immediately — to send one right away, use "Send now" next to it on the Email queue page.`,
      confirmLabel: "Queue invites",
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch("/api/attendees/queue-invites", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }).then((r) => r.json()).catch(() => ({}));
        setPortalNote(res.ok
          ? `Queued ${(res.queued || 0).toLocaleString()} invite${res.queued === 1 ? "" : "s"} — find them on the Email queue page${res.skipped ? ` · ${res.skipped} already queued or written to` : ""}.`
          : (res.error || "Could not queue invites."));
        setTimeout(() => setPortalNote(null), 6000);
        load(true);
      },
    });
  }

  // Send the invite to the selected not-yet-emailed people right now, skipping
  // the queue entirely. The queue is still there for a whole cold roster; this
  // is for a handful you've picked off the list and want gone today.
  async function sendInvitesNow(ids: string[]) {
    if (!ids.length) return;
    setPortalNote("Sending…");
    const res = await fetch("/api/attendees/send-invites", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then((r) => r.json()).catch(() => ({}));
    setPortalNote(res.ok
      ? `Sent ${(res.sent || 0).toLocaleString()} invite${res.sent === 1 ? "" : "s"} now${res.failed ? ` · ${res.failed} failed` : ""}${res.skipped ? ` · ${res.skipped} skipped (already emailed, paid or opted out)` : ""}${res.overCap ? ` · ${res.overCap} over the 100-per-click limit, select them again` : ""}.`
      : (res.error || "Could not send the invites."));
    setTimeout(() => setPortalNote(null), 9000);
    load(true);
  }

  async function reinviteNonResponders(templates?: string[]) {
    setReinvite({ sending: true, note: null });
    try {
      const res = await fetch("/api/attendees/resend-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templates && templates.length ? { templates } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setReinvite({
          sending: false,
          note: `Re-queued ${json.queued || 0} invite${json.queued === 1 ? "" : "s"}. They'll send paced; the Email queue page can move them to the front.`,
        });
      } else {
        setReinvite({ sending: false, note: json.error || "Could not re-queue invites." });
      }
      await load();
    } catch {
      setReinvite({ sending: false, note: "Network error while re-queuing." });
    }
    setTimeout(() => setReinvite((r) => ({ ...r, note: null })), 9000);
  }

  // No ids -> every never-reminded person in the started-not-paid bucket,
  // paced through the queue. With ids (the list's bulk bar) -> the selection
  // is sent IMMEDIATELY (up to 100 per click), already-reminded included;
  // the server still skips paid/declined/unsubscribed/test people.
  async function nudgeUnpaid(ids?: string[]) {
    setNudge({ sending: true, note: null });
    try {
      const res = await fetch("/api/attendees/nudge-unpaid", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids && ids.length ? { ids } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNudge({ sending: false, note: json.error || "Could not send the reminders." });
      } else if (typeof json.sent === "number") {
        setNudge({
          sending: false,
          note: `Sent ${json.sent} reminder${json.sent === 1 ? "" : "s"} now${json.failed ? ` · ${json.failed} failed` : ""}${json.skipped ? ` · ${json.skipped} skipped (not in the started-not-paid group)` : ""}.`,
        });
      } else {
        setNudge({
          sending: false,
          note: `Queued ${json.queued || 0} reminder${json.queued === 1 ? "" : "s"} to send paced. Use the Email queue page to move them to the front or push one out now.`,
        });
      }
      await load();
    } catch {
      setNudge({ sending: false, note: "Network error while sending." });
    }
    setTimeout(() => setNudge((n) => ({ ...n, note: null })), 9000);
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const previewDiscounted = ((21000 * (100 - discountPercent) / 100) / 100).toFixed(2);
  // People we've already emailed who still haven't registered: the audience a
  // bulk re-invite would target. Computed from the loaded list so the button can
  // show a live count without an extra round trip.
  const reinvitable = attendees.filter(
    (a) => !a.paid && (a.status === "invited" || a.status === "viewed" || a.status === "rsvp_pending")
  ).length;
  // Students and former students specifically: the segment the career-first
  // letter rework targets.
  const studentReinvitable = attendees.filter(
    (a) => !a.paid && (a.status === "invited" || a.status === "viewed" || a.status === "rsvp_pending")
      && (a.inviteTemplate === "student" || a.inviteTemplate === "former-student")
  ).length;
  // Started signing up (the Registering chip), never paid, and never
  // reminded: the bulk nudge's audience, so re-running it after new people
  // abandon checkout only touches the new people. Already-reminded people
  // can still be nudged again by selecting them in the list. The server
  // re-filters, so this is just the live count for the button.
  const nudgeable = attendees.filter(
    (a) => !a.paid && (a.status === "registered" || a.status === "rsvp_pending" || a.status === "confirmed")
      && (a.nudgeCount || 0) === 0
  ).length;

  // Chicago people who are loaded but have neither been queued nor written to
  // — the ones the "Queue Chicago letters" button would actually act on.
  const chicagoNotQueued = chicagoStats
    ? Math.max(0, chicagoStats.inPipeline - (chicagoStats.pending || 0) - chicagoStats.contacted)
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Attendees</h1>
                <p className="text-xs text-slate-500">Invite people and track them through to paid attendees</p>
              </div>
              {isAdmin && (
                <>
                  <button onClick={confirmLoadNbcmi} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#0E5566" }} title={`Add all ${NBCMI_ROSTER_COUNT.toLocaleString()} NBCMI-certified interpreters to the list as queued (nothing emailed)`}>
                    {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
                    Load NBCMI registry
                  </button>
                  <button onClick={confirmLoadStudents} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#9A7B2E" }} title={`Add all ${STUDENT_ROSTER_COUNT.toLocaleString()} AALB students to the list as queued (nothing emailed)`}>
                    {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />} Load students
                  </button>
                </>
              )}
              {isAdmin && (
                <button onClick={confirmLoad2024} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#0E5566" }} title="Load the 501-person 2024 conference roster (120 paid, 66 attempted, 315 leads) — nothing emailed">
                  {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />} Load 2024 roster
                </button>
              )}
              {isAdmin && !!chicagoStats?.loadable && (
                <button onClick={confirmLoadChicago} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#9F1239" }} title={`Load ${chicagoStats.loadable} named Chicago leaders, each with a hand-written paragraph about their own organization — nothing emailed`}>
                  {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />} Load Chicago list
                </button>
              )}
              {isAdmin && (
                <>
                  <button onClick={confirmQueueNbcmi} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#4338CA" }} title="Drip the certified-interpreter note to everyone staged from the NBCMI registry via the paced queue">
                    {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Queue NBCMI invites
                  </button>
                  <button onClick={confirmQueue2024} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#0066B3" }} title="Drip the personalized reunion letter to every returning-tagged person via the paced queue">
                    {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Queue reunion letters
                  </button>
                </>
              )}
              {isAdmin && attendees.some((a) => a.inviteTemplate === "chicago" && !a.lastSentAt && !a.paid) && (
                <button onClick={confirmQueueChicago} disabled={rosterLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm" style={{ background: "#9F1239" }} title="Drip each Chicago leader's personal letter through the paced queue">
                  {rosterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Queue Chicago letters
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowEventSettings(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5" title="Set the attendee portal join link and agenda">
                  <Video className="w-3.5 h-3.5" /> Portal
                </button>
              )}
              <button onClick={() => load()} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {portalNote && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">{portalNote}</div>
            )}

            {rosterNote && (
              <div className="mb-4 rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "#E6D9B8", background: "#FBF8F1", color: "#7A5E1E" }}>{rosterNote}</div>
            )}

            {/* Where the Chicago list actually stands. Loading and queueing are
                two different things and the toolbar has two similar-looking
                buttons for them, so without this the list appears to vanish
                into the roster and the letters appear to go nowhere. Naming
                each stage, with live counts, is what makes the two clicks make
                sense. */}
            {isAdmin && !!chicagoStats?.inPipeline && (
              <div className="mb-4 rounded-xl border px-4 py-3" style={{ borderColor: "#F3C6D0", background: "#FFF6F8" }}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: "#881337" }}>
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-bold">Chicago list</span>
                  <span className="text-[13px]">
                    <strong>{chicagoStats.inPipeline}</strong> loaded ·{" "}
                    <strong>{chicagoStats.pending || 0}</strong> waiting in the queue ·{" "}
                    <strong>{chicagoStats.contacted}</strong> written to
                    {chicagoNotQueued > 0 && <> · <strong>{chicagoNotQueued}</strong> not queued yet</>}
                  </span>
                  <a href="/queue" className="ml-auto text-xs font-bold underline shrink-0">Open the queue</a>
                </div>
                <div className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "#A8455F" }}>
                  Loading stages people and attaches each person&rsquo;s letter; it never emails anyone. Queueing schedules those letters, and the queue drips them out
                  {queueStatus ? ` about ${queueStatus.policy.maxPerHour}/hour between ${queueStatus.policy.sendStartHour}:00 and ${queueStatus.policy.sendEndHour}:00 ${(queueStatus.policy.sendTimezone || "").replace("America/", "")}` : " on a slow drip during business hours"}, so nothing goes out the instant you click. To send one immediately, use <strong>Send now</strong> next to it in the queue.
                </div>
              </div>
            )}

            {queueStatus && (queueStatus.counts.pending > 0 || queueStatus.paused) && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${queueStatus.paused ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">
                        {queueStatus.paused ? "Bulk sending paused" : "Bulk queue active"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {queueStatus.counts.pending || 0} queued · {queueStatus.counts.sent || 0} sent · {queueStatus.sentLast24h} in last 24h
                        {queueStatus.nextScheduledFor && !queueStatus.paused && (
                          <> · next at {new Date(queueStatus.nextScheduledFor).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowQueue(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      title="Queue settings: rate, window, and partial sends"
                    >
                      <SlidersHorizontal className="w-3 h-3" /> Adjust
                    </button>
                    {(queueStatus.counts.pending || 0) > 0 && (
                      <button
                        onClick={refreshQueue}
                        disabled={shuffling}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                        title="Re-render the queued invites with the latest email template. Use after changing the email design."
                      >
                        {shuffling ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh template
                      </button>
                    )}
                    {(queueStatus.counts.pending || 0) > 1 && (
                      <button
                        onClick={shuffleQueue}
                        disabled={shuffling}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                        title="Randomize the order of the queued invites. Same schedule, new order."
                      >
                        {shuffling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shuffle className="w-3 h-3" />} Shuffle
                      </button>
                    )}
                    <button
                      onClick={togglePause}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
                        queueStatus.paused
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {queueStatus.paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400">
                  Pacing: max {queueStatus.policy.maxPerHour}/hr, {queueStatus.policy.maxPerDay}/day ·
                  {" "}{queueStatus.policy.minGapSeconds}–{queueStatus.policy.maxGapSeconds}s between sends ·
                  {" "}{queueStatus.policy.sendStartHour}:00–{queueStatus.policy.sendEndHour}:00 {queueStatus.policy.sendTimezone}.
                  {" "}Quick invites send immediately and skip these limits.
                </div>
                {refreshNote && (
                  <div className="mt-2 text-xs font-semibold text-teal-700">{refreshNote}</div>
                )}

                {(queueStatus.pending?.length || 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setShowQueueList((v) => !v)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
                    >
                      {showQueueList ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {showQueueList ? "Hide" : "Show"} the {queueStatus.pending.length} queued invite{queueStatus.pending.length === 1 ? "" : "s"}
                    </button>
                    {showQueueList && (
                      <ul className="mt-2 divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                        {queueStatus.pending.map((entry) => {
                          const att = attendees.find((a) => a.id === entry.recipientId);
                          const name = att ? `${att.firstName} ${att.lastName}` : entry.to;
                          return (
                            <li key={entry.id} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50">
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-800 truncate">
                                  {name}
                                  {entry.recipientType !== "attendee" && (
                                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{entry.recipientType}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {entry.to} · {entry.scheduledFor ? `scheduled ${new Date(entry.scheduledFor).toLocaleString()}` : "unscheduled"}
                                </div>
                              </div>
                              {att && (
                                <button
                                  onClick={() => viewEmail(att)}
                                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                  title="View this email"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => sendQueueEntry(entry.id)}
                                disabled={sendingEntryId === entry.id}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 disabled:opacity-50 shrink-0"
                                title="Send this invite immediately"
                              >
                                {sendingEntryId === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />} Send now
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Top tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
              <TabBtn active={tab === "attendees"} onClick={() => setTab("attendees")} label="Attendees" />
              <TabBtn active={tab === "logistics"} onClick={() => setTab("logistics")} label="Accommodations" />
              <TabBtn active={tab === "invite"} onClick={() => setTab("invite")} label="Invite" />
            </div>

            {tab === "logistics" && <LogisticsView />}

            {tab === "invite" && (
              <div>
                {isAdmin && (
                  <div className="rounded-xl p-4 shadow-sm mb-4 border" style={{ background: "linear-gradient(180deg,#FBF8F1,#ffffff)", borderColor: "#E6D9B8" }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" style={{ color: "#9A7B2E" }} /> Load AALB students
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl">
                          One click adds all <strong>{STUDENT_ROSTER_COUNT.toLocaleString()}</strong> AALB students and alumni to the
                          list as <strong>queued</strong> — on the list, but <strong>nothing is emailed</strong>. Everyone gets the
                          25% courtesy and their own gold invitation:{" "}
                          <strong>{STUDENT_ROSTER_ALUMNI.toLocaleString()}</strong> alumni,{" "}
                          <strong>{STUDENT_ROSTER_STUDENT}</strong> current students, and{" "}
                          <strong>{STUDENT_ROSTER_FORMER.toLocaleString()}</strong> former students. Already-added people are skipped,
                          so it&rsquo;s safe to click again. They&rsquo;re sorted newest session first.
                        </p>
                      </div>
                      <button
                        onClick={confirmLoadStudents}
                        disabled={rosterLoading}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                        style={{ background: "#9A7B2E" }}
                      >
                        {rosterLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                        {rosterLoading ? "Loading…" : "Load students"}
                      </button>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 text-teal-700" /> Re-invite non-responders
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-lg">
                          Re-sends the invite to the <strong>{reinvitable}</strong> {reinvitable === 1 ? "person" : "people"} we&rsquo;ve
                          already emailed who haven&rsquo;t registered yet, each with their own template and discount. Anyone who paid
                          or signed up is skipped, and no BCC is attached. Paced through the queue to protect the domain.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmDialog({
                            title: `Re-invite ${reinvitable} ${reinvitable === 1 ? "person" : "people"}?`,
                            message: "Everyone we invited who hasn't registered will be re-queued and sent paced over the next while. Anyone who already paid or signed up is skipped, and no BCC is attached.",
                            confirmLabel: "Re-queue invites",
                            onConfirm: () => { setConfirmDialog(null); void reinviteNonResponders(); },
                          })}
                          disabled={reinvite.sending || reinvitable === 0}
                          className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                          style={{ background: "#0E5566" }}
                        >
                          {reinvite.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          {reinvitable === 0 ? "No one to re-invite" : "Re-invite them"}
                        </button>
                        <button
                          onClick={() => setConfirmDialog({
                            title: `Re-send to ${studentReinvitable} student${studentReinvitable === 1 ? "" : "s"}?`,
                            message: "Only students and former students get this one, each with the reworked career-first letter and the new subject lines. Alumni and the 2024 reunion batch are left alone. Paced through the queue.",
                            confirmLabel: "Send the new letter",
                            onConfirm: () => { setConfirmDialog(null); void reinviteNonResponders(["student", "former-student"]); },
                          })}
                          disabled={reinvite.sending || studentReinvitable === 0}
                          className="px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 border"
                          style={{ color: "#0E5566", borderColor: "#0E5566", background: "white" }}
                        >
                          {reinvite.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                          Students only — new letter
                        </button>
                      </div>
                    </div>
                    {reinvite.note && <div className="mt-2 text-xs font-semibold text-teal-700">{reinvite.note}</div>}
                  </div>
                )}

                {isAdmin && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
                          <Send className="w-4 h-4 text-amber-600" /> Nudge the almost-registered
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-lg">
                          A short plain note to the <strong>{nudgeable}</strong> {nudgeable === 1 ? "person" : "people"} who started
                          signing up (the Registering chip), never paid, and <strong>haven&rsquo;t had a reminder yet</strong> — so
                          running this again later only reaches new people. Each row shows its reminder chip once sent. To re-remind
                          someone deliberately, select them in the list and use &ldquo;Send reminder.&rdquo; Paced through the queue.
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDialog({
                          title: `Send 1st reminders to ${nudgeable} ${nudgeable === 1 ? "person" : "people"}?`,
                          message: "Everyone who started registering, hasn't paid, and has never been reminded gets the finish-your-registration note, personalized with their ticket and price, sent paced through the queue. Their reminder count goes up (shown on the row), and any still-pending queued emails for them are superseded so nobody gets two letters.",
                          confirmLabel: "Queue 1st reminders",
                          onConfirm: () => { setConfirmDialog(null); void nudgeUnpaid(); },
                        })}
                        disabled={nudge.sending || nudgeable === 0}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                        style={{ background: "#B45309" }}
                      >
                        {nudge.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {nudgeable === 0 ? "No one new to nudge" : "Send 1st reminders"}
                      </button>
                    </div>
                    {nudge.note && <div className="mt-2 text-xs font-semibold text-amber-700">{nudge.note}</div>}
                  </div>
                )}

                {/* Sub-tabs */}
                <div className="flex gap-2 mb-4">
                  <SubTabBtn
                    active={inviteSubTab === "quick"}
                    onClick={() => setInviteSubTab("quick")}
                    icon={Zap}
                    label="Quick invite"
                    hint="Send one now"
                  />
                  <SubTabBtn
                    active={inviteSubTab === "bulk"}
                    onClick={() => setInviteSubTab("bulk")}
                    icon={FileText}
                    label="Bulk invite"
                    hint="Paste a list, paced over time"
                  />
                </div>

                {/* Shared settings card (used by both modes) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Invite settings</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Discount %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10))))}
                        className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                    </label>
                    <div className="sm:col-span-2 text-xs text-slate-500 self-end pb-2">
                      Applied to <strong>in-person standard</strong> ($210). At {discountPercent}% off they&rsquo;ll pay
                      {" "}<strong>${previewDiscounted}</strong>. Virtual ($105) unchanged.
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Personal message (optional, shown in email and funnel)
                    </span>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={2}
                      placeholder="Loved your work on X. Would mean a lot to have you join us."
                      className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    />
                  </label>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Email template <span className="text-rose-500">*</span>
                      </span>
                      {!template && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Choose one</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {ATTENDEE_TEMPLATES.map((t) => {
                        const on = template === t.id;
                        return (
                          <button
                            key={t.id} type="button" onClick={() => setTemplate(t.id)}
                            className={"px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors " + (on ? "bg-[#0E5566] text-white border-[#0E5566]" : !template ? "bg-white text-slate-700 border-amber-300 ring-1 ring-amber-200 hover:bg-amber-50" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                      <button
                        type="button" onClick={openPreview} disabled={!template}
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#0E5566] bg-[#0E5566]/[0.06] border border-[#0E5566]/15 hover:bg-[#0E5566]/[0.1] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview email
                      </button>
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: template ? "#94a3b8" : "#b45309" }}>
                      {template
                        ? ATTENDEE_TEMPLATES.find((t) => t.id === template)?.description
                        : "Pick a template so the right email goes out: Standard for general invitees, AALB alumni for the community."}
                    </p>
                  </div>
                </div>

                {inviteSubTab === "quick" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className="w-4 h-4 text-teal-700" />
                      <h2 className="text-base font-extrabold text-slate-900">Invite one person</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-5">
                      Email goes out the moment you hit send. No queue, no waiting.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">First name *</span>
                        <input
                          value={single.firstName}
                          onChange={(e) => setSingle({ ...single, firstName: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Last name *</span>
                        <input
                          value={single.lastName}
                          onChange={(e) => setSingle({ ...single, lastName: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Email *</span>
                        <input
                          value={single.email}
                          onChange={(e) => setSingle({ ...single, email: e.target.value })}
                          placeholder="name@example.com"
                          type="email"
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Organization (optional)</span>
                        <input
                          value={single.affiliation}
                          onChange={(e) => setSingle({ ...single, affiliation: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={sendQuick}
                        disabled={quickSending || !template}
                        title={!template ? "Choose an email template first" : undefined}
                        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        style={{ background: "#0E5566" }}
                      >
                        {quickSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {quickSending ? "Sending…" : "Send invite now"}
                      </button>
                    </div>

                    {quickResult && (
                      <div className="mt-4 rounded-lg border p-3 text-sm inline-flex items-start gap-2"
                        style={{
                          background: quickResult.ok ? "#ecfdf5" : "#fef2f2",
                          borderColor: quickResult.ok ? "#a7f3d0" : "#fecaca",
                          color: quickResult.ok ? "#065f46" : "#991b1b",
                        }}>
                        {quickResult.ok ? <Check className="w-4 h-4 mt-0.5" /> : <Mail className="w-4 h-4 mt-0.5" />}
                        {quickResult.message}
                      </div>
                    )}
                  </div>
                )}

                {inviteSubTab === "bulk" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <h2 className="text-base font-extrabold text-slate-900">Bulk invite</h2>
                    </div>

                    {/* Mode toggle: full CSV list vs a quick emails-only delivery test */}
                    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs mb-3">
                      {([["csv", "Full list (CSV)"], ["emails", "Emails only (delivery test)"]] as const).map(([v, label], i) => (
                        <button
                          key={v}
                          onClick={() => { setBulkMode(v); setBulkResult(null); setEmailsResult(null); }}
                          className={`px-3 py-2 font-semibold transition-colors ${bulkMode === v ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"} ${i > 0 ? "border-l border-slate-200" : ""}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {bulkMode === "csv" ? (
                      <p className="text-xs text-slate-500 mb-4">
                        Format: <code className="px-1.5 py-0.5 rounded bg-slate-100">FirstName,LastName,Email,Affiliation,Notes</code>.
                        Last two columns optional. Header row auto-detected. Each invite is paced randomly during business hours
                        to protect domain reputation.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mb-4">
                        Paste email addresses only, separated by commas, spaces, or new lines. Names are filled in from the
                        address. Each one sends <strong>immediately</strong> (no pacing), so use this for seed/test inboxes, not a
                        real campaign. Up to 25 per click. Re-sending to the same address just resends it.
                      </p>
                    )}

                    <label className="block mb-4">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{bulkMode === "csv" ? "Invitee list" : "Email addresses"}</span>
                      <textarea
                        value={csv}
                        onChange={(e) => setCsv(e.target.value)}
                        rows={bulkMode === "csv" ? 8 : 5}
                        placeholder={bulkMode === "csv"
                          ? `Jane,Doe,jane@example.com,Example Org,met at conf 2025\nJohn,Smith,john@school.edu`
                          : `test-a8557d@test.mailgenius.com, you@inbox.com\nanother@example.com`}
                        className="mt-1 w-full px-3 py-2.5 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                    </label>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={bulkMode === "csv" ? sendBulk : sendDeliveryTest}
                        disabled={bulkSending || !csv.trim() || !template}
                        title={!template ? "Choose an email template first" : undefined}
                        className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        style={{ background: "#0E5566" }}
                      >
                        {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {bulkMode === "csv" ? "Queue invites" : "Send delivery test"}
                      </button>
                    </div>

                    {bulkMode === "csv" && bulkResult && (
                      <div className="mt-5 rounded-lg border p-4 text-sm" style={{ background: bulkResult.created > 0 ? "#ecfdf5" : "#fff7ed", borderColor: bulkResult.created > 0 ? "#a7f3d0" : "#fed7aa" }}>
                        <div className="font-bold mb-1" style={{ color: bulkResult.created > 0 ? "#065f46" : "#9a3412" }}>
                          {bulkResult.created > 0 ? `Queued ${bulkResult.created} invite${bulkResult.created === 1 ? "" : "s"}` : "Nothing queued"}
                        </div>
                        {bulkResult.skipped.length > 0 && (
                          <div className="text-xs text-slate-600 mt-1">
                            Skipped: {bulkResult.skipped.map((s) => `${s.email} (${s.reason})`).join(", ")}
                          </div>
                        )}
                        {bulkResult.parseErrors.length > 0 && (
                          <ul className="text-xs text-rose-700 mt-1 list-disc pl-4">
                            {bulkResult.parseErrors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                      </div>
                    )}

                    {bulkMode === "emails" && emailsResult && (
                      <div className="mt-5 rounded-lg border p-4 text-sm" style={{ background: emailsResult.sent > 0 ? "#ecfdf5" : "#fff7ed", borderColor: emailsResult.sent > 0 ? "#a7f3d0" : "#fed7aa" }}>
                        {emailsResult.error ? (
                          <div className="font-bold text-rose-700">{emailsResult.error}</div>
                        ) : (
                          <>
                            <div className="font-bold mb-1" style={{ color: emailsResult.sent > 0 ? "#065f46" : "#9a3412" }}>
                              Sent {emailsResult.sent}{emailsResult.failed ? `, ${emailsResult.failed} failed` : ""}
                            </div>
                            {emailsResult.results.some((r) => !r.sent) && (
                              <ul className="text-xs text-rose-700 mt-1 list-disc pl-4">
                                {emailsResult.results.filter((r) => !r.sent).map((r, i) => <li key={i}>{r.email}: {r.error || "failed"}</li>)}
                              </ul>
                            )}
                            {emailsResult.invalid.length > 0 && (
                              <div className="text-xs text-slate-600 mt-1">Not valid: {emailsResult.invalid.join(", ")}</div>
                            )}
                            {emailsResult.skippedOverCap > 0 && (
                              <div className="text-xs text-slate-600 mt-1">{emailsResult.skippedOverCap} more were over the 25-per-send cap; send again to do the rest.</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "attendees" && (
              <AttendeesView
                attendees={attendees}
                onOpenDetail={(id) => setDetailId(id)}
                onCompose={(ids) => setComposerIds(ids)}
                onSendPortal={sendPortalLink}
                onQueueInvites={queueInvites}
                onSendInvitesNow={(ids) => setConfirmDialog({
                  title: "Send these invites right now?",
                  message: "The not-yet-emailed people in your selection get their invitation immediately — no queue, no waiting, up to 100 per click. Anyone already emailed, paid, or unsubscribed is skipped. If any of them are sitting in the paced queue, that pending copy is dropped so nobody gets the letter twice.",
                  confirmLabel: "Send now",
                  onConfirm: () => { setConfirmDialog(null); void sendInvitesNow(ids); },
                })}
                onNudge={(ids) => setConfirmDialog({
                  title: `Send the reminder to this selection right now?`,
                  message: "The selected started-not-paid people get the finish-your-registration note immediately — no queue, up to 100 per click. Their reminder count goes up and shows on the row. Anyone selected who is paid, declined, or unsubscribed is skipped.",
                  confirmLabel: "Send now",
                  onConfirm: () => { setConfirmDialog(null); void nudgeUnpaid(ids); },
                })}
              />
            )}
          </div>
        </div>
        <MobileNav />
      </div>

      {preview && (
        <EmailPreviewModal
          title={preview.title}
          meta={preview.meta}
          html={preview.html}
          loading={preview.html === null}
          onClose={() => setPreview(null)}
        />
      )}

      {showQueue && <QueueSettingsModal onClose={() => setShowQueue(false)} onChanged={load} />}
      {showEventSettings && <EventSettingsModal onClose={() => setShowEventSettings(false)} />}

      {detailId && (
        <AttendeeDrawer
          attendeeId={detailId}
          isAdmin={isAdmin}
          onClose={() => setDetailId(null)}
          onChanged={() => load(true)}
          onCompose={(ids) => { setDetailId(null); setComposerIds(ids); }}
        />
      )}

      {composerIds && (
        <BroadcastComposer
          recipientIds={composerIds}
          recipientLabel={composerIds.length === 1 ? "1 person" : `${composerIds.length} people`}
          onClose={() => setComposerIds(null)}
          onSent={(sent, failed) => {
            setComposerIds(null);
            setPortalNote(`Email sent to ${sent}${failed ? `, ${failed} failed` : ""}.`);
            setTimeout(() => setPortalNote(null), 4000);
            load(true);
          }}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5" style={{ background: danger ? "#e11d48" : "#0E5566" }} />
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-colors"
              style={{ background: danger ? "#e11d48" : "#0E5566" }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function SubTabBtn({
  active, onClick, icon: Icon, label, hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-initial text-left px-4 py-3 rounded-xl border-2 transition-all ${
        active ? "shadow-sm" : "hover:bg-white"
      }`}
      style={{
        borderColor: active ? "#0E5566" : "#e2e8f0",
        background: active ? "#0E556608" : "#ffffff",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${active ? "text-teal-700" : "text-slate-400"}`} />
        <div>
          <div className={`text-sm font-bold ${active ? "text-slate-900" : "text-slate-600"}`}>{label}</div>
          <div className="text-[11px] text-slate-400">{hint}</div>
        </div>
      </div>
    </button>
  );
}
