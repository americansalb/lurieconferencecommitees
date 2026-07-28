// The full two-day schedule, transcribed from the official 2026 program
// (public/program.pdf). Rendered inline in the Program section so visitors
// see the whole schedule right on the page; keep this file and the PDF in
// sync when the program changes.

export type SessionKind =
  | "session"
  | "panel"
  | "keynote"
  | "registration"
  | "networking"
  | "lunch"
  | "break";

export type ProgramSession = {
  time: string;
  end: string;
  title: string;
  who?: string;
  kind: SessionKind;
  // CEU minutes for this session, equal to its scheduled length. Only
  // educational sessions earn credit: meals, breaks, sign-in, networking and
  // the hospital tour carry none, so the field is simply absent for them.
  ceuMinutes?: number;
};

export type ProgramDay = {
  label: string;
  date: string;
  hours: string;
  // What we advertise for the day, rounded DOWN from the scheduled total so
  // an overrun or a shortened session can never make the promise false.
  ceuLabel: string;
  sessions: ProgramSession[];
};

export const PROGRAM_NOTE = "All times CDT · Lurie Children’s, Chicago + Virtual";

// What we advertise across the site: 12.5 hours, rounded DOWN from the 12h55m
// actually scheduled. The 25-minute cushion absorbs a session that starts late
// or runs short without turning the promise into an overstatement.
export const CEU_TOTAL_LABEL = "12.5 hours";
export const CEU_PENDING_NOTE =
  "CEU hours shown are per session and are pending accreditation by NBCMI and CCHI. CEUs are earned by attending live.";

export const PROGRAM_DAYS: ProgramDay[] = [
  {
    label: "Day 1",
    date: "Saturday, August 15",
    hours: "9:00 AM – 6:30 PM",
    ceuLabel: "About 6.5 CEU hours",
    sessions: [
      { time: "8:30 AM", end: "9:00 AM", title: "Optional Hospital Tour (TBC)", who: "RSVP details will be sent to registrants", kind: "session" },
      { time: "9:00 AM", end: "9:30 AM", title: "Coffee & Sign-In", kind: "registration" },
      { time: "9:30 AM", end: "9:40 AM", title: "Opening Address & Introductions", who: "Master of Ceremonies", kind: "session" },
      { time: "9:45 AM", end: "10:45 AM", title: "The Origins of Language Access in Their Own Words", who: "Wilma Alvarado-Little & Linda G. Coronado", kind: "panel", ceuMinutes: 60 },
      { time: "10:50 AM", end: "12:00 PM", title: "Promoting Health Equity Through Language Access: A Case Study from Harborview Medical Center", who: "Yuliya Speroff, CoreCHI-P™ · Harborview Medical Center, Seattle", kind: "session", ceuMinutes: 70 },
      { time: "12:05 PM", end: "1:05 PM", title: "Why Hospitals Still Get Language Access Wrong: The Uncomfortable Truth", who: "Danilo Formolo, MBA, CHI™ · Affinity Language Systems", kind: "session", ceuMinutes: 60 },
      { time: "1:05 PM", end: "1:25 PM", title: "Networking", kind: "networking" },
      { time: "1:25 PM", end: "2:15 PM", title: "Lunch", kind: "lunch" },
      { time: "2:15 PM", end: "3:30 PM", title: "The Standards That Protect Patients: A Joint Commission View on Language Access", who: "Elizabeth Even · Senior Director, Field Operations, The Joint Commission", kind: "keynote", ceuMinutes: 75 },
      { time: "3:35 PM", end: "4:35 PM", title: "Empowering Communication: Lessons from Language Access Past, Present, and Future", who: "Wilma Alvarado-Little · New York State Department of Health", kind: "session", ceuMinutes: 60 },
      { time: "4:40 PM", end: "5:10 PM", title: "Beyond Accuracy: The Invisible Skills in Healthcare Interpreting", who: "Mercedes Martin, CHI™ & Hugo Juarez, CHI™ · Ann & Robert H. Lurie Children’s Hospital of Chicago", kind: "session", ceuMinutes: 30 },
      { time: "5:15 PM", end: "5:25 PM", title: "Break", kind: "break" },
      { time: "5:30 PM", end: "6:30 PM", title: "Speak Up: Using Front-Line Experience to Shape Federal Policy", who: "Marisa Rueda Will, CHI™-Spanish · Tica Interpreter Training & Translations", kind: "session", ceuMinutes: 60 },
    ],
  },
  {
    label: "Day 2",
    date: "Sunday, August 16",
    hours: "8:30 AM – 4:35 PM",
    ceuLabel: "About 6 CEU hours",
    sessions: [
      { time: "8:00 AM", end: "8:30 AM", title: "Optional Hospital Tour (TBC)", who: "RSVP details will be sent to registrants", kind: "session" },
      { time: "8:30 AM", end: "9:00 AM", title: "Coffee & Check-In", kind: "registration" },
      { time: "9:00 AM", end: "10:00 AM", title: "Advancing Language Access Through Interprofessional Collaboration: The Language Access & Care Committee", who: "Yuri Takabatake, MD · Ann & Robert H. Lurie Children’s Hospital of Chicago", kind: "session", ceuMinutes: 60 },
      { time: "10:05 AM", end: "11:05 AM", title: "The Persistent Gap Between Policy, Practice, and Professional Medical Interpreting", who: "Patricia A. Alonzo, EdD · Equiti Health", kind: "session", ceuMinutes: 60 },
      { time: "11:05 AM", end: "11:55 AM", title: "Lunch", kind: "lunch" },
      { time: "11:55 AM", end: "12:55 PM", title: "Elevating the Role of Healthcare Interpreters: Contributing to Positive Health Outcomes", who: "Tatiana González-Cestari, PhD, CHI™-Spanish & Sarah Stockler-Rex, MA, CHI™-Spanish", kind: "session", ceuMinutes: 60 },
      { time: "1:00 PM", end: "1:50 PM", title: "The Mindful Interpreter: Building Resilience, Deep Listening, and Trauma Stewardship in Medical Interpreting", who: "Daniel Gutiérrez Mena · Rush University Medical Center", kind: "session", ceuMinutes: 50 },
      { time: "1:50 PM", end: "2:05 PM", title: "Break", kind: "break" },
      { time: "2:05 PM", end: "3:15 PM", title: "Revising the National Code of Ethics for Interpreters in Health Care: What’s New?", who: "Jane Crandall Kontrimas, CoreCHI™, MS · National Council on Interpreting in Health Care", kind: "session", ceuMinutes: 70 },
      { time: "3:20 PM", end: "4:20 PM", title: "Lessons from the Department of Justice’s Language Access Enforcement", who: "Michael Mulé · Civil Rights Attorney, formerly U.S. Department of Justice, Civil Rights Division", kind: "session", ceuMinutes: 60 },
      { time: "4:20 PM", end: "4:35 PM", title: "Closing Remarks", kind: "session" },
    ],
  },
];

// The scheduled CEU total, straight from the sessions above. Advertised
// figures (ceuLabel, CEU_TOTAL_LABEL) are deliberately rounded down from
// these, so this is the number to check after editing the program.
export function scheduledCeuMinutes(day: ProgramDay): number {
  return day.sessions.reduce((sum, s) => sum + (s.ceuMinutes || 0), 0);
}
export function totalScheduledCeuMinutes(): number {
  return PROGRAM_DAYS.reduce((sum, d) => sum + scheduledCeuMinutes(d), 0);
}

// "1 hr", "1 hr 15 min", "30 min" — how a CEU amount reads on a session row.
export function formatCeu(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}
