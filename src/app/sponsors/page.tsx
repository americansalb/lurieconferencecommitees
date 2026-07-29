"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Award, Trash2, RefreshCw, Search, Filter, ExternalLink, Mail, Building2, Copy, Plus,
  Clock, Pause, Play, X, SlidersHorizontal, Loader2, BadgeCheck, Send, FileText, Combine, Eye, Shuffle, Users, Ticket,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import { SPONSOR_STATUS_LABELS, TIERS } from "@/lib/sponsors";
import { PROSPECT_TARGETS_TSV, FOOD_PROSPECT_TARGETS_TSV } from "@/lib/prospect-targets";
import InviteSponsorComposer from "./InviteSponsorComposer";
import QueueSettingsModal from "@/components/email/QueueSettingsModal";
import { fmtElapsed, medianLabel } from "@/lib/engagement";

type Sponsor = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  tier: string;
  amountCents: number;
  donateFoodInstead: boolean;
  message: string | null;
  registreeName: string | null;
  registreeEmail: string | null;
  dietary: string | null;
  accessibility: string | null;
  wantsLogo: boolean;
  exhibitorDetailsAt: string | null;
  logo: { mime: string } | null;
  status: string;
  paid: boolean;
  paidAt: string | null;
  logistics: Record<string, string> | null;
  applicationToken: string;
  ticketsIncluded: number | null;
  createdAt: string;
  invitedAt: string | null;
  lastSentAt: string | null;
  clickedAt: string | null;
};

// The board: every sponsor lives in exactly one of these buckets. "Confirmed"
// holds accepted in-kind (food/ASL) sponsors, who are locked in but bring no
// dollars, so they sit apart from paid revenue. See bucketOf for the routing.
const PIPELINE_TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: "paid", label: "Paid", statuses: ["paid", "confirmed"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed"] },
  { key: "awaiting_payment", label: "Awaiting payment", statuses: ["awaiting_payment"] },
  { key: "in_discussion", label: "In discussion", statuses: ["in_conversation", "submitted"] },
  { key: "invited", label: "Invited", statuses: ["invited"] },
  { key: "pending_invite", label: "Pending invite", statuses: ["prospect", "queued"] },
];

// Human labels for the in-kind logistics fields the sponsor fills in on their
// portal, so the dashboard can show their answers compactly.
const LOGISTICS_LABELS: Record<string, string> = {
  attend: "Attending", attendeeName: "Ticket for", attendeeEmail: "Ticket email",
  attendee2Name: "2nd ticket for", attendee2Email: "2nd ticket email",
  provide: "Providing", day: "Day", meal: "Meal", fulfillment: "Fulfillment",
  window: "Window", dayOfContact: "Day-of contact", allergens: "Allergens",
  setup: "Setup", coverage: "Coverage", interpreters: "Interpreters",
  mode: "Mode", equipment: "Equipment", materials: "Materials",
  brochure: "Brochure", brochureNotes: "Brochure notes",
  spotlightContact: "Spotlight contact", spotlightNotes: "Spotlight mention",
};

function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function SponsorsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending_invite");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [foodFilter, setFoodFilter] = useState<string>("all");
  const [clickedOnly, setClickedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queue, setQueue] = useState<{ nextScheduledFor: string | null; paused: boolean; sentLast24h: number } | null>(null);
  const [flushing, setFlushing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void;
  } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [requestingLogoId, setRequestingLogoId] = useState<string | null>(null);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [sendingLetterId, setSendingLetterId] = useState<string | null>(null);
  const [sendingTeamId, setSendingTeamId] = useState<string | null>(null);
  const [ticketsSavingId, setTicketsSavingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [mergeFor, setMergeFor] = useState<Sponsor | null>(null);
  const [mergeOtherId, setMergeOtherId] = useState("");
  const [mergeName, setMergeName] = useState("");
  const [merging, setMerging] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);
  // Auto-send: drip the pending invites out one at a time at random intervals.
  const [autoSend, setAutoSend] = useState(false);
  const [autoNextAt, setAutoNextAt] = useState<number | null>(null);
  const [, setNowTick] = useState(0);
  const autoOnRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sponsorsRef = useRef<Sponsor[]>([]);

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "developer";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsors");
      if (res.ok) {
        const data = await res.json();
        setSponsors(data.sponsors || []);
      }
      const q = await fetch("/api/admin/email-queue");
      if (q.ok) setQueue(await q.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Take everything back off the background queue: cancels the pending sends and
  // flips those sponsors back to "prospect" so the per-row Send invite buttons
  // return and you can send them one or two at a time again.
  async function unqueueAll() {
    if (!confirm("Take all queued invites off the background queue? Nothing already sent is affected. You'll send the rest manually, one at a time.")) return;
    setFlushing(true);
    try {
      const res = await fetch("/api/sponsors/unqueue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const j = await res.json().catch(() => ({}));
      setActionNote(res.ok ? `${j.unqueued || 0} invite${j.unqueued === 1 ? "" : "s"} taken off the queue. Send them individually below.` : `Could not unqueue. ${j.error || ""}`);
    } finally {
      setFlushing(false);
      load();
      setTimeout(() => setActionNote(null), 10000);
    }
  }

  // Randomize the order of the queued sponsor invites without changing the
  // schedule: same send times, different recipients in each slot.
  async function shuffleQueue() {
    setFlushing(true);
    try {
      const res = await fetch("/api/admin/email-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "shuffle", recipientType: "sponsor" }) });
      const j = await res.json().catch(() => ({}));
      setActionNote(res.ok ? `Queue shuffled (${j.shuffled || 0} invite${j.shuffled === 1 ? "" : "s"} reordered). Same schedule, new order.` : `Could not shuffle. ${j.error || ""}`);
    } finally {
      setFlushing(false);
      load();
      setTimeout(() => setActionNote(null), 10000);
    }
  }

  async function togglePause() {
    if (!queue) return;
    await fetch("/api/admin/email-queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paused: !queue.paused }) });
    load();
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // Whether this partner's deal includes conference tickets.
  //
  // Exhibitors normally get a table plus one ticket. A donated ("free") table
  // is the exception: they get the table, and every person they bring buys a
  // ticket. That's a one-click classification, since it's the only case that
  // comes up regularly. Every other level's allowance comes from its tier, so
  // those keep the rarely-needed numeric override.
  async function saveIncludedTickets(sp: Sponsor, value: number | null, note: string) {
    setTicketsSavingId(sp.id);
    try {
      await fetch(`/api/sponsors/${sp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketsIncluded: value }),
      });
      setActionNote(`${sp.companyName}: ${note}`);
      await load();
    } catch {
      setActionNote("Network error saving the ticket allowance.");
    } finally {
      setTicketsSavingId(null);
      setTimeout(() => setActionNote(null), 6000);
    }
  }

  // Exhibitors: flip between a free table (nobody gets a ticket) and the
  // standard table-plus-ticket.
  function toggleFreeTable(sp: Sponsor, tierDefault: number) {
    const isFree = sp.ticketsIncluded === 0;
    if (isFree) {
      saveIncludedTickets(sp, null, `standard table, ${tierDefault} ticket${tierDefault === 1 ? "" : "s"} included.`);
    } else {
      saveIncludedTickets(sp, 0, "free table. Everyone they bring buys their own ticket.");
    }
  }

  // Any other level, for the occasional deal that differs from its tier.
  function promptIncludedTickets(sp: Sponsor, tierDefault: number) {
    const answer = window.prompt(
      `How many conference tickets are included for ${sp.companyName}?\n\n` +
      `Their level includes ${tierDefault}. Enter 0 if every attendee pays. Leave blank to use the level default.`,
      String(sp.ticketsIncluded ?? tierDefault)
    );
    if (answer === null) return;
    const trimmed = answer.trim();
    if (trimmed === "") {
      saveIncludedTickets(sp, null, `back to the level default (${tierDefault}).`);
      return;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value < 0) {
      setActionNote("Included tickets must be 0 or more.");
      setTimeout(() => setActionNote(null), 6000);
      return;
    }
    saveIncludedTickets(sp, value, `${value} included ticket${value === 1 ? "" : "s"}.`);
  }

  async function applyStatus(id: string, newStatus: string) {
    await fetch(`/api/sponsors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  function updateStatus(id: string, newStatus: string) {
    // Moving to "Awaiting payment" emails the applicant their acceptance +
    // pay link. Confirm in-app first so an inline misclick doesn't email someone.
    if (newStatus === "awaiting_payment") {
      const s = sponsors.find((x) => x.id === id);
      const owes = s && !s.paid && !s.donateFoodInstead && s.amountCents > 0;
      if (owes) {
        setConfirmDialog({
          title: "Accept and email this applicant?",
          message: `${s!.companyName} will receive an email confirming their acceptance with a link to complete payment. It sends right away.`,
          confirmLabel: "Accept & send email",
          onConfirm: () => { setConfirmDialog(null); void applyStatus(id, newStatus); },
        });
        return;
      }
    }
    void applyStatus(id, newStatus);
  }

  function remove(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setConfirmDialog({
      title: "Delete this application?",
      message: `${s?.companyName || "This application"} will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
        load();
      },
    });
  }

  async function copyStatusLink(token: string) {
    const url = `${window.location.origin}/sponsor/status/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }

  // Verify a payment with Stripe and, if it went through, mark paid + email.
  // Recovers a payment the webhook never delivered.
  async function confirmPayment(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setConfirmingId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/confirm-payment`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s?.companyName || "Sponsor";
      if (j.paidOnStripe === false) {
        setActionNote(`${who}: Stripe shows this checkout has not been paid, so nothing changed.`);
      } else if (res.ok && j.ok) {
        setActionNote(
          j.emailed
            ? `${who}: confirmed and the confirmation email was sent.`
            : `${who}: marked paid, but the email failed (${j.error || "see logs"}).`
        );
      } else {
        setActionNote(`${who}: could not confirm. ${j.error || "Unknown error."}`);
      }
      await load();
    } finally {
      setConfirmingId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  // Email the sponsor asking for a higher-resolution logo, with an upload link.
  async function requestLogo(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setRequestingLogoId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/request-logo`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s?.companyName || "Sponsor";
      setActionNote(
        res.ok && j.ok
          ? `${who}: emailed a request for a high-resolution logo with an upload link.`
          : `${who}: could not send the logo request. ${j.error || ""}`
      );
    } finally {
      setRequestingLogoId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  // Per-org send: fire the invitation to one prospect now and mark them invited.
  // Returns whether it actually sent (the auto-drip uses this to stop on error).
  async function sendInvite(id: string): Promise<boolean> {
    const s = sponsors.find((x) => x.id === id);
    setSendingInviteId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/send-invite`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s?.companyName || "Sponsor";
      const ok = res.ok && j.ok;
      setActionNote(ok ? `${who}: added to the Email Queue. It sends from there, paced with everything else.` : `${who}: could not queue. ${j.error || "Unknown error."}`);
      await load();
      return ok;
    } catch {
      setActionNote("Network error sending the invite.");
      return false;
    } finally {
      setSendingInviteId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  // Per-org "Send + 20% offer": the same letter as the standard invite, but
  // with the 20% VIP courtesy discount that auto-applies at checkout. For the
  // handful of prospects you want to give the deal. Admin only.
  // Per-org "Ask who's coming": queues the letter with their shareable team
  // link, so the people attending under their included tickets land in the
  // Attendees list instead of turning up unregistered on the day.
  async function sendTeamInvite(id: string) {
    const s2 = sponsors.find((x) => x.id === id);
    setSendingTeamId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/send-team-invite`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s2?.companyName || "Sponsor";
      setActionNote(
        res.ok && j.ok
          ? `${who}: attendee-list request queued. It sends from the Email Queue.`
          : `${who}: could not queue. ${j.error || "Unknown error."}`
      );
      await load();
    } catch {
      setActionNote("Network error queueing the attendee-list request.");
    } finally {
      setSendingTeamId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  async function sendLetter(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setSendingLetterId(id);
    setActionNote(null);
    try {
      const res = await fetch(`/api/sponsors/${id}/send-letter`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      const who = s?.companyName || "Sponsor";
      setActionNote(res.ok && j.ok ? `${who}: queued with the 20% offer. It sends from the Email Queue.` : `${who}: could not queue. ${j.error || "Unknown error."}`);
      await load();
    } catch {
      setActionNote("Network error sending the letter.");
    } finally {
      setSendingLetterId(null);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  // Per-org "Accept" for an in-kind (food/ASL) sponsor who has pledged: sends
  // the branded welcome letter that asks for their logo, website, and logistics,
  // and moves them into the confirmed sponsors. Confirmed first, since it emails.
  function acceptInKind(id: string) {
    const s = sponsors.find((x) => x.id === id);
    setConfirmDialog({
      title: "Accept and welcome this sponsor?",
      message: `${s?.companyName || "This sponsor"} will receive the welcome letter asking for their logo, a link to their website, and the logistics, and will move to your confirmed sponsors. It sends right away.`,
      confirmLabel: "Accept & send letter",
      onConfirm: async () => {
        setConfirmDialog(null);
        setAcceptingId(id);
        setActionNote(null);
        try {
          const res = await fetch(`/api/sponsors/${id}/accept`, { method: "POST" });
          const j = await res.json().catch(() => ({}));
          const who = s?.companyName || "Sponsor";
          setActionNote(res.ok && j.ok ? `${who}: accepted, welcome letter sent.` : `${who}: could not accept. ${j.error || "Unknown error."}`);
          await load();
        } catch {
          setActionNote("Network error sending the acceptance letter.");
        } finally {
          setAcceptingId(null);
          setTimeout(() => setActionNote(null), 8000);
        }
      },
    });
  }

  // One click: load the curated prospect list into Pending invite. No emails.
  async function loadTargets() {
    setLoadingTargets(true);
    setActionNote(null);
    try {
      const res = await fetch("/api/sponsors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: PROSPECT_TARGETS_TSV, draftOnly: true }),
      });
      const j = await res.json().catch(() => ({}));
      setActionNote(
        res.ok
          ? `${j.created ?? 0} added to Pending invite${j.skipped?.length ? `, ${j.skipped.length} already there` : ""}.`
          : `Could not load. ${j.error || ""}`
      );
      await load();
    } finally {
      setLoadingTargets(false);
      setTimeout(() => setActionNote(null), 8000);
    }
  }

  // One click: load the vegan/vegetarian food-sponsor restaurants (tier "food",
  // so they get the plant-based food letter). Only rows with a verified email
  // are loadable; the rest wait in prospect-targets.ts until their email is set.
  async function loadFoodTargets() {
    setLoadingTargets(true);
    setActionNote(null);
    try {
      const res = await fetch("/api/sponsors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: FOOD_PROSPECT_TARGETS_TSV, tier: "food", draftOnly: true }),
      });
      const j = await res.json().catch(() => ({}));
      setActionNote(
        res.ok
          ? (j.created ?? 0) === 0
            ? "No food prospects with a verified email yet. Add emails in prospect-targets.ts (see docs/food-sponsor-prospects.md)."
            : `${j.created} food prospect${j.created === 1 ? "" : "s"} added to Pending invite${j.skipped?.length ? `, ${j.skipped.length} already there` : ""}.`
          : `Could not load. ${j.error || ""}`
      );
      await load();
    } finally {
      setLoadingTargets(false);
      setTimeout(() => setActionNote(null), 9000);
    }
  }

  // Consolidate two co-applicant profiles into one (merge emails to CC, combine
  // the company name, hide the folded-in record).
  function openMerge(s: Sponsor) {
    setMergeFor(s);
    setMergeOtherId("");
    setMergeName("");
  }
  async function doMerge() {
    if (!mergeFor || !mergeOtherId) return;
    setMerging(true);
    try {
      const res = await fetch(`/api/sponsors/${mergeFor.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherId: mergeOtherId, companyName: mergeName.trim() || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      setActionNote(
        res.ok
          ? `Merged. This profile now CCs ${j.mergedEmails?.length ?? 0} co-applicant email${(j.mergedEmails?.length ?? 0) === 1 ? "" : "s"} on every interaction.`
          : `Could not merge. ${j.error || ""}`
      );
      setMergeFor(null);
      setMergeOtherId("");
      setMergeName("");
      await load();
    } finally {
      setMerging(false);
      setTimeout(() => setActionNote(null), 9000);
    }
  }

  // Hand the pending invites to the server queue so the Render cron sends them
  // in the background, paced, with no page kept open.
  async function queuePending() {
    setLoadingTargets(true);
    setActionNote(null);
    try {
      const res = await fetch("/api/sponsors/queue-pending", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      setActionNote(
        res.ok
          ? (j.queued
              ? `${j.queued} invite${j.queued === 1 ? "" : "s"} scheduled to send in the background. You can safely close this page.`
              : "No pending invites to schedule.")
          : `Could not schedule. ${j.error || ""}`
      );
      await load();
    } finally {
      setLoadingTargets(false);
      setTimeout(() => setActionNote(null), 10000);
    }
  }

  // Keep a ref to the latest sponsors so the drip loop always sees fresh data.
  useEffect(() => { sponsorsRef.current = sponsors; }, [sponsors]);
  // Tick once a second so the countdown re-renders while auto-send is on.
  useEffect(() => {
    if (!autoSend) return;
    const id = setInterval(() => setNowTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [autoSend]);
  useEffect(() => () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); }, []);

  function pendingInvites() {
    return sponsorsRef.current.filter((s) => s.status === "prospect");
  }
  function scheduleAuto() {
    // Truly random gap, 61 to 499 seconds, so nothing goes out on a fixed beat.
    const delayMs = Math.floor(61000 + Math.random() * (499000 - 61000));
    setAutoNextAt(Date.now() + delayMs);
    autoTimerRef.current = setTimeout(async () => {
      if (!autoOnRef.current) return;
      const next = pendingInvites()[0];
      if (!next) { stopAuto("Auto-send finished, no pending invites left."); return; }
      const ok = await sendInvite(next.id);
      if (!ok) { stopAuto("Auto-send stopped, that invite did not send."); return; }
      if (autoOnRef.current) scheduleAuto();
    }, delayMs);
  }
  function startAuto() {
    if (pendingInvites().length === 0) {
      setActionNote("No pending invites to send.");
      setTimeout(() => setActionNote(null), 5000);
      return;
    }
    autoOnRef.current = true;
    setAutoSend(true);
    scheduleAuto();
  }
  function stopAuto(note?: string) {
    autoOnRef.current = false;
    setAutoSend(false);
    setAutoNextAt(null);
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    if (note) { setActionNote(note); setTimeout(() => setActionNote(null), 6000); }
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  // Stats and buckets run over "countable" sponsors only: drop the MailGenius
  // deliverability-test record so it never inflates the numbers. (Merged records
  // are already excluded server-side via mergedIntoId.)
  const isTestSponsor = (s: Sponsor) => /mailgenius/i.test(s.contactEmail || "");
  // A sponsor is closed/paid the moment money is received. paid is set on real
  // payment and on a manual move to "paid", and is never unset, so it is the
  // single source of truth, even if the status field later drifts. Every place
  // that means "paid" uses this, so the card and the tab can never disagree.
  const isClosed = (s: Sponsor) => s.paid === true;
  // "Won" = fully locked in. A paid sponsor, or a confirmed in-kind (food/ASL)
  // sponsor who brings no dollars but is done. Both live under the "Paid" tab
  // (which already lists the "confirmed" status), so this is what routes them
  // there and what the Paid count reflects, keeping the card and tab in sync.
  const isWon = (s: Sponsor) => isClosed(s) || s.status === "confirmed";
  const isInKind = (s: Sponsor) => s.tier === "food" || s.tier === "asl" || s.tier === "captioning";
  // A live lead: an org actually in conversation or owing payment. Cold
  // prospects, queued, and merely-invited orgs are NOT engaged. This is exactly
  // the "In discussion" + "Awaiting payment" tabs, so the Engaged card and those
  // tabs always reconcile.
  const ENGAGED_STATUSES = ["submitted", "in_conversation", "awaiting_payment"];
  const isEngaged = (s: Sponsor) => !isClosed(s) && ENGAGED_STATUSES.includes(s.status);
  // Of the engaged, the ones carrying real dollars: in-kind (food/ASL) and
  // donate-instead sponsors contribute no pipeline value.
  const hasDealDollars = (s: Sponsor) =>
    isEngaged(s) && !s.donateFoodInstead && s.tier !== "food" && s.tier !== "asl";
  const countable = sponsors.filter((s) => !isTestSponsor(s));

  // The single bucket a sponsor belongs to, used by BOTH the tab counts and the
  // list filter so they always agree: paid sponsors live only under "Paid",
  // everyone else falls into their status's tab.
  const bucketOf = (s: Sponsor): string | null => {
    // Accepted in-kind (food/ASL) sponsors are confirmed but bring no dollars:
    // they get their own "Confirmed" tab, apart from paid revenue.
    if (isInKind(s) && s.status === "confirmed") return "confirmed";
    if (isWon(s)) return "paid";
    const tab = PIPELINE_TABS.find((t) => t.key !== "paid" && t.key !== "confirmed" && t.statuses.includes(s.status));
    return tab ? tab.key : null;
  };

  const filtered = countable.filter((s) => {
    // The Clicked view is an engagement report, not a pipeline stage: it gathers
    // every org that clicked, regardless of which bucket they're in now.
    if (clickedOnly) {
      if (!s.clickedAt) return false;
    } else if (bucketOf(s) !== filter) {
      return false;
    }
    if (tierFilter !== "all" && s.tier !== tierFilter) return false;
    if (foodFilter === "food" && s.tier !== "food") return false;
    if (foodFilter === "asl" && s.tier !== "asl") return false;
    if (foodFilter === "other" && (s.tier === "food" || s.tier === "asl")) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![s.companyName, s.contactName, s.contactEmail, s.website].some((v) => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  // Sort the clicked report by who clicked most recently.
  if (clickedOnly) {
    filtered.sort((a, b) => new Date(b.clickedAt || 0).getTime() - new Date(a.clickedAt || 0).getTime());
  }

  // Engagement: "delivered" is when the invite was sent (we have no SMTP delivery
  // receipt), "clicked" is when they loaded their link. Time-to-click uses the
  // first send time we have for each org.
  const deliveredOf = (s: Sponsor) => s.invitedAt || s.lastSentAt;
  const everSent = countable.filter((s) => deliveredOf(s));
  const clickedSponsors = countable.filter((s) => s.clickedAt);
  const clickLatencies = clickedSponsors
    .map((s) => {
      const d = deliveredOf(s);
      return d && s.clickedAt ? new Date(s.clickedAt).getTime() - new Date(d).getTime() : NaN;
    })
    .filter((ms) => Number.isFinite(ms) && ms >= 0);
  const clickRate = everSent.length ? Math.round((clickedSponsors.length / everSent.length) * 100) : 0;

  // The "Paid" card mirrors the "Paid" tab exactly (paid sponsors; accepted
  // in-kind sponsors are counted under "Confirmed" instead).
  const paidCount = countable.filter((s) => bucketOf(s) === "paid").length;
  const engagedCount = countable.filter(isEngaged).length;
  // Revenue actually collected, and the realistic dollar value of live deals
  // (not cold outreach). Both ignore the test record and in-kind sponsors.
  const totalDollars = countable.filter(isClosed).reduce((sum, s) => sum + s.amountCents, 0) / 100;
  const pipelineDollars = countable.filter(hasDealDollars).reduce((sum, s) => sum + s.amountCents, 0) / 100;
  const queuedCount = countable.filter((s) => s.status === "queued").length;
  // Paid but the confirmation email hasn't gone out yet: the ones to chase.
  const confirmationPending = countable.filter((s) => s.status === "paid").length;
  const secsLeft = autoSend && autoNextAt ? Math.max(0, Math.round((autoNextAt - Date.now()) / 1000)) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-slate-900">Sponsors &amp; Exhibitors</h1>
                <p className="text-xs text-slate-500">Outreach, pipeline, and confirmed sponsorships</p>
              </div>
              <a
                href="/sponsor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
                title="Open the public sponsor page"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Public page
              </a>
              <button
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] hover:from-[#0A3F4D] hover:to-[#004F8C] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Invite sponsors
              </button>
              <button onClick={load} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {showInvite && (
              <InviteSponsorComposer
                onClose={() => setShowInvite(false)}
                onSent={() => { setShowInvite(false); load(); }}
              />
            )}

            {showQueue && <QueueSettingsModal onClose={() => setShowQueue(false)} onChanged={load} />}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
              <Stat label="Prospects" value={countable.length.toLocaleString("en-US")} />
              <Stat label="Engaged" value={engagedCount.toString()} accent="#0284c7" />
              <Stat label="Paid" value={paidCount.toString()} accent="#059669" />
              <Stat label="Paid $" value={`$${totalDollars.toLocaleString("en-US")}`} accent="#0E5566" />
              <Stat label="Pipeline $" value={`$${pipelineDollars.toLocaleString("en-US")}`} accent="#0066B3" />
              <button onClick={() => setClickedOnly(true)} className="text-left" title="See every org that clicked, with delivered-vs-clicked timing">
                <Stat label="Clicked" value={clickedSponsors.length.toString()} accent="#7C3AED" />
              </button>
            </div>

            {confirmationPending > 0 && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-800 font-semibold">
                  {confirmationPending} paid {confirmationPending === 1 ? "sponsor hasn’t" : "sponsors haven’t"} been sent a confirmation yet.
                </span>
                <button onClick={() => setFilter("paid")} className="ml-auto text-xs font-bold text-amber-700 underline hover:text-amber-900">Show them</button>
              </div>
            )}

            {(queuedCount > 0 || queue?.paused) && (
              <div className="mb-5 rounded-xl border border-[#0066B3]/20 bg-[#0066B3]/[0.04] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0E5566]">
                  <Clock className="w-4 h-4" /> {queuedCount} invite{queuedCount === 1 ? "" : "s"} queued
                </span>
                {queue?.paused ? (
                  <span className="text-sm font-medium text-amber-700">Sending paused</span>
                ) : queue?.nextScheduledFor ? (
                  <span className="text-sm text-slate-500">next ~{new Date(queue.nextScheduledFor).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                ) : null}
                {typeof queue?.sentLast24h === "number" && queue.sentLast24h > 0 && (
                  <span className="text-sm text-slate-400">· {queue.sentLast24h} sent in 24h</span>
                )}
                <span className="text-[11px] text-slate-400 hidden sm:inline">Paced on the shared schedule with attendee invites.</span>
                {isAdmin && (
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowQueue(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50" title="Queue settings: rate, window, and partial sends">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                    </button>
                    <button onClick={togglePause} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">
                      {queue?.paused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                    </button>
                    <button onClick={shuffleQueue} disabled={flushing} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50" title="Randomize the order of the queued invites. Same schedule, new order.">
                      <Shuffle className="w-3.5 h-3.5" /> Shuffle
                    </button>
                    <button onClick={unqueueAll} disabled={flushing} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-50" title="Cancel the background queue and send these manually, one or two at a time.">
                      {flushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Take off queue
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {PIPELINE_TABS.map((t) => {
                const count = countable.filter((s) => bucketOf(s) === t.key).length;
                const active = filter === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold border transition-colors ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                  >
                    {t.label}
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
              {filter === "pending_invite" && isAdmin && (
                <button
                  onClick={loadTargets}
                  disabled={loadingTargets}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] disabled:opacity-50"
                  title="Add the curated prospect list to Pending invite. No emails are sent."
                >
                  {loadingTargets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Load suggested targets
                </button>
              )}
              {filter === "pending_invite" && isAdmin && (
                <button
                  onClick={loadFoodTargets}
                  disabled={loadingTargets}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-green-600 disabled:opacity-50"
                  title="Add the vegan/vegetarian food-sponsor restaurants (with verified emails) to Pending invite. No emails are sent."
                >
                  {loadingTargets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Load food prospects
                </button>
              )}
            </div>

            {filter === "pending_invite" && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => (autoSend ? stopAuto() : startAuto())}
                  role="switch"
                  aria-checked={autoSend}
                  title="Drip the pending invites out automatically, one at a time, at random intervals"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${autoSend ? "bg-teal-600" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${autoSend ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800">
                    Auto-send invites
                    <span className="font-medium text-slate-500">
                      {autoSend ? (secsLeft != null ? ` · ON, next in ${fmtCountdown(secsLeft)}` : " · sending…") : " · off"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sends the next pending invite every 61 to 499 seconds, at random, so they never go out in a burst. This drip only runs while the page is open. To send with the page closed, schedule them in the background instead.
                  </div>
                </div>
                <button
                  onClick={queuePending}
                  disabled={loadingTargets}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0E5566] to-[#0066B3] disabled:opacity-50 shrink-0"
                  title="Schedule every pending invite to send in the background, paced by the server. No page needed."
                >
                  {loadingTargets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />} Send in background
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company, contact, email…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500"
                  >
                    <option value="all">All tiers</option>
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={foodFilter}
                    onChange={(e) => setFoodFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500"
                    title="Filter in-kind sponsors (food / ASL) apart from everyone else"
                  >
                    <option value="all">All categories</option>
                    <option value="food">Food sponsors</option>
                    <option value="asl">ASL sponsors</option>
                    <option value="other">Everyone else</option>
                  </select>
                  <button
                    onClick={() => setClickedOnly((v) => !v)}
                    title="Show only sponsors who clicked the email link"
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold border rounded-lg px-3 py-2 transition-colors ${clickedOnly ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Clicked
                  </button>
                </div>
              </div>

              {clickedOnly && (
                <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/40 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">
                    <Eye className="w-3.5 h-3.5" /> Engagement
                  </div>
                  <EngStat label="Delivered" value={everSent.length.toString()} />
                  <EngStat label="Clicked" value={clickedSponsors.length.toString()} accent="#7C3AED" />
                  <EngStat label="Click rate" value={`${clickRate}%`} accent="#7C3AED" />
                  <EngStat label="Median time to click" value={medianLabel(clickLatencies)} />
                  <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                    Delivered = when the invite was sent. Time to click is measured from that.
                  </span>
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  {filter === "pending_invite"
                    ? <>No pending invites yet.{isAdmin && <> <button onClick={loadTargets} disabled={loadingTargets} className="font-bold text-teal-700 underline hover:text-teal-900 disabled:opacity-50">Load suggested targets</button> to add a starter list.</>}</>
                    : countable.length === 0
                      ? <>No sponsors yet. Share <code className="px-1.5 py-0.5 bg-slate-100 rounded">/sponsor</code> to start collecting them.</>
                      : "No matches."}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const tier = TIERS.find((t) => t.id === s.tier);
                    const sl = SPONSOR_STATUS_LABELS[s.status] || SPONSOR_STATUS_LABELS.submitted;
                    // "Confirm payment" verifies an awaiting payment with Stripe;
                    // "Send confirmation" (re)sends the receipt to a paid sponsor.
                    const isConfirmAction = !s.paid && s.status === "awaiting_payment";
                    const showPayAction = isAdmin && s.amountCents > 0 && (s.status === "awaiting_payment" || s.paid || s.status === "paid");
                    return (
                      <li key={s.id} className="p-4 group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: (tier?.accent || "#94a3b8") + "20" }}>
                            <Building2 className="w-4 h-4" style={{ color: tier?.accent || "#475569" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{s.companyName}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {s.contactName} &middot; <a className="hover:text-slate-700" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
                              {s.contactPhone && <> &middot; {s.contactPhone}</>}
                            </div>
                            {clickedOnly && s.clickedAt && (
                              <div className="mt-1 text-[11px] text-violet-700 truncate">
                                {(s.invitedAt || s.lastSentAt)
                                  ? <>Delivered {new Date(s.invitedAt || s.lastSentAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })} &middot; clicked {fmtElapsed(s.invitedAt || s.lastSentAt, s.clickedAt)} later &middot; {new Date(s.clickedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>
                                  : <>Clicked {new Date(s.clickedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <div className="text-xs font-bold text-slate-900">
                              {tier?.name || (s.tier === "undecided" ? "Tier not yet chosen" : s.tier)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {s.tier === "undecided"
                                ? "Invitee will pick a level"
                                : s.donateFoodInstead
                                  ? "Food in kind"
                                  : (tier?.amountLabel || `$${(s.amountCents / 100).toFixed(0)}`)}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${sl.color}`}>{sl.label}</span>
                          {s.clickedAt && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700 shrink-0 hidden sm:inline" title={`Clicked the email link · ${new Date(s.clickedAt).toLocaleString()}`}>Clicked</span>
                          )}
                          {isAdmin && (s.status === "prospect" || s.status === "invited") && (
                            <button
                              onClick={() => sendInvite(s.id)}
                              disabled={sendingInviteId === s.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title={s.status === "prospect" ? "Add this org's invitation to the Email Queue (it sends from there, paced)" : "Queue another send of the invitation"}
                            >
                              {sendingInviteId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              {s.status === "prospect" ? "Queue invite" : "Re-queue"}
                            </button>
                          )}
                          {isAdmin && (s.status === "prospect" || s.status === "invited") && s.tier !== "food" && s.tier !== "asl" && s.tier !== "captioning" && !TIERS.find((t) => t.id === s.tier)?.inviteOnly && (
                            <button
                              onClick={() => sendLetter(s.id)}
                              disabled={sendingLetterId === s.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title="Queue the same letter with the 20% VIP courtesy discount, applied automatically at checkout. It sends from the Email Queue. For hand-picked prospects."
                            >
                              {sendingLetterId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                              Queue + 20% off
                            </button>
                          )}
                          {isAdmin && (s.tier === "food" || s.tier === "asl" || s.tier === "captioning") && (s.status === "in_conversation" || s.status === "submitted") && (
                            <button
                              onClick={() => acceptInKind(s.id)}
                              disabled={acceptingId === s.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title="Accept this in-kind sponsor and send the welcome letter asking for their logo, website, and logistics"
                            >
                              {acceptingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />}
                              Accept
                            </button>
                          )}
                          {isAdmin && (s.paid || s.status === "confirmed") && (
                            <button
                              onClick={() => sendTeamInvite(s.id)}
                              disabled={sendingTeamId === s.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title="Email them for the names attending on their included tickets, with a shareable link for the rest of their team. Queues in the Email Queue."
                            >
                              {sendingTeamId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                              Ask who&rsquo;s coming
                            </button>
                          )}
                          {isAdmin && (s.paid || s.status === "confirmed") && (() => {
                            const tierDefault = tier?.ticketsIncluded ?? 0;
                            const included = s.ticketsIncluded ?? tierDefault;
                            const isExhibitor = s.tier === "exhibitor";
                            const isFreeTable = isExhibitor && s.ticketsIncluded === 0;
                            return (
                              <button
                                onClick={() => isExhibitor ? toggleFreeTable(s, tierDefault) : promptIncludedTickets(s, tierDefault)}
                                disabled={ticketsSavingId === s.id}
                                className={`text-[10px] font-bold px-2 py-1 rounded-full border inline-flex items-center gap-1 shrink-0 disabled:opacity-50 ${
                                  isFreeTable
                                    ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                                title={isExhibitor
                                  ? (isFreeTable
                                      ? "Free table: everyone they bring buys their own ticket. Click for the standard table plus ticket."
                                      : `Standard table, ${tierDefault} ticket${tierDefault === 1 ? "" : "s"} included. Click to mark it a free table where every attendee pays.`)
                                  : `${included} conference ticket${included === 1 ? "" : "s"} included at this level. Click to set a different number for this organization.`}
                              >
                                {ticketsSavingId === s.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Ticket className="w-3 h-3" />}
                                {isFreeTable
                                  ? "Free table \u00b7 no tickets"
                                  : `${included} ticket${included === 1 ? "" : "s"}`}
                              </button>
                            );
                          })()}
                          {showPayAction && (
                            <button
                              onClick={() => confirmPayment(s.id)}
                              disabled={confirmingId === s.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title={isConfirmAction ? "Check Stripe for this payment; if it went through, mark paid and email them" : "Send the payment confirmation email to this sponsor"}
                            >
                              {confirmingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : isConfirmAction ? <BadgeCheck className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                              {isConfirmAction ? "Confirm payment" : "Send confirmation"}
                            </button>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyStatusLink(s.applicationToken)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                              title="Copy status link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`mailto:${s.contactEmail}`}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-teal-700"
                              title="Email contact"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            {isAdmin && (
                              <button
                                onClick={() => openMerge(s)}
                                className="p-1.5 rounded hover:bg-indigo-50 text-slate-300 hover:text-indigo-600"
                                title="Merge another sponsor into this one (co-applicants who applied together)"
                              >
                                <Combine className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => remove(s.id)}
                                className="p-1.5 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500"
                                title="Delete (admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {s.message && (
                          <div className="mt-2 ml-12 text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border-l-2 border-slate-200">
                            {s.message}
                          </div>
                        )}
                        {s.tier === "exhibitor" && (s.registreeName || s.wantsLogo || s.exhibitorDetailsAt) && (
                          <div className="mt-2 ml-12 rounded-lg border border-[#0066B3]/15 bg-[#0066B3]/[0.03] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-[#0066B3] mb-1">Exhibitor details</div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-600">
                              {s.registreeName && <span><span className="text-slate-400">Rep:</span> {s.registreeName}{s.registreeEmail ? ` · ${s.registreeEmail}` : ""}</span>}
                              {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0066B3] hover:underline">{s.website}</a>}
                              {s.dietary && <span><span className="text-slate-400">Dietary:</span> {s.dietary}</span>}
                              {s.accessibility && <span><span className="text-slate-400">Access:</span> {s.accessibility}</span>}
                            </div>
                          </div>
                        )}
                        {/* Logo strip: every engaged sponsor gets website logo
                            recognition, so surface the logo state — and the
                            "Request logo" email button — whether or not they
                            ticked "show my logo" during signup. Prospects who
                            haven't responded yet are left out (it'd be noise). */}
                        {(s.paid || ["submitted", "awaiting_payment", "in_conversation", "paid", "confirmed"].includes(s.status)) && (
                          <div className="mt-2 ml-12 flex items-center gap-3 flex-wrap">
                            {s.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`/api/sponsors/${s.id}/logo`} alt={`${s.companyName} logo`} className="h-10 w-auto max-w-[140px] object-contain bg-white rounded border border-slate-200 p-1" />
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-600">
                                No logo on file{s.wantsLogo ? " (they asked to be shown)" : ""} — can&rsquo;t feature them on the website yet
                              </span>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => requestLogo(s.id)}
                                disabled={requestingLogoId === s.id}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#0066B3]/20 bg-white text-[#0066B3] hover:bg-[#0066B3]/[0.06] inline-flex items-center gap-1 disabled:opacity-50"
                                title="Email them asking for their logo, with a one-click upload link to their portal"
                              >
                                {requestingLogoId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                {s.logo ? "Request better logo" : "Request logo by email"}
                              </button>
                            )}
                          </div>
                        )}
                        {(isInKind(s) || s.tier.startsWith("welcome-kit")) && s.logistics && Object.keys(s.logistics).length > 0 && (
                          <div className="mt-2 ml-12 rounded-lg border border-emerald-600/15 bg-emerald-50/40 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-1">
                              {s.tier === "asl" ? "Interpretation details" : s.tier === "captioning" ? "Captioning details" : s.tier.startsWith("welcome-kit") ? "Welcome kit details" : "Food details"}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-600">
                              {Object.entries(s.logistics).map(([k, v]) => (
                                <span key={k}><span className="text-slate-400">{LOGISTICS_LABELS[k] || k}:</span> {v}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {isAdmin && (
                          <div className="mt-2 ml-12 flex items-center gap-1 text-[11px] flex-wrap">
                            {Object.entries(SPONSOR_STATUS_LABELS).map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() => updateStatus(s.id, k)}
                                disabled={s.status === k}
                                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                                  s.status === k
                                    ? `border ${v.color}`
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {mergeFor && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4" onClick={() => setMergeFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-slate-900">
              <Combine className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold">Merge into {mergeFor.companyName}</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Pick the co-applicant to fold in. Its email is kept and CC&rsquo;d on every interaction, both contacts can open the same portal link, paid amounts keep the larger of the two, and the folded-in record is hidden from the pipeline.
            </p>
            <label className="block mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">Sponsor to merge in</label>
            <select
              value={mergeOtherId}
              onChange={(e) => {
                const oid = e.target.value;
                setMergeOtherId(oid);
                const o = sponsors.find((x) => x.id === oid);
                setMergeName(o ? `${mergeFor.companyName} & ${o.companyName}` : "");
              }}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">Select a sponsor…</option>
              {sponsors.filter((x) => x.id !== mergeFor.id).map((x) => (
                <option key={x.id} value={x.id}>{x.companyName} · {x.contactEmail}</option>
              ))}
            </select>
            <label className="block mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">Consolidated company name</label>
            <input
              value={mergeName}
              onChange={(e) => setMergeName(e.target.value)}
              placeholder="Company A & Company B"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setMergeFor(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel</button>
              <button
                onClick={doMerge}
                disabled={!mergeOtherId || merging}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Combine className="w-4 h-4" />} Merge profiles
              </button>
            </div>
          </div>
        </div>
      )}
      {actionNote && (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-xl bg-slate-900 text-white text-sm font-semibold px-4 py-3 shadow-2xl">
          {actionNote}
        </div>
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
  );
}

// Compact inline stat for the engagement band (label over value, no card).
function EngStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="leading-tight">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{label}</div>
      <div className="text-lg font-extrabold" style={{ color: accent || "#0f172a" }}>{value}</div>
    </div>
  );
}
