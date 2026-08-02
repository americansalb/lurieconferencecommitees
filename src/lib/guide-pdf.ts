import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

// Personalized conference guides.
//
// Each attendee and exhibitor gets the same guide everyone else gets, with a
// page added at the front that is theirs: their name, what they are registered
// for, what we already hold about their dietary and access needs, and a QR to
// their own portal. The point is not decoration. It is that the answers we are
// about to cook and seat from are printed where they cannot be missed, so
// someone can correct them before they travel rather than at the desk.
//
// Built with pdf-lib and the PDF standard fonts on purpose: this runs on the
// production server, which has no browser and no font files, so an
// HTML-to-PDF pipeline would work in development and fail in production.
//
// Everything here is laid out against a cursor that can run out of page. The
// content is user-supplied (a dietary note can be a paragraph, a team can be
// ten people), so blocks measure themselves and start a new page rather than
// printing over the footer.

// Sampled from the guides themselves so the added page is indistinguishable
// from the pages after it.
const TEAL = rgb(0x0e / 255, 0x4a / 255, 0x57 / 255);
const GOLD = rgb(0xc0 / 255, 0x8f / 255, 0x35 / 255);
const INK = rgb(0x0f / 255, 0x1b / 255, 0x22 / 255);
const BODY = rgb(0x4c / 255, 0x5b / 255, 0x62 / 255);
const PANEL = rgb(0xf2 / 255, 0xf6 / 255, 0xf7 / 255);
const RULE = rgb(0xdd / 255, 0xe5 / 255, 0xe8 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
// Nothing may be drawn below this line; the footer lives underneath it.
const FLOOR = MARGIN + 26;

export type GuideKind = "attendee" | "exhibitor";

function guidePath(kind: GuideKind): string {
  return path.join(process.cwd(), "public", "guides", `${kind}-guide.pdf`);
}

type Fonts = { reg: PDFFont; bold: PDFFont };
type Logos = { img: PDFImage; h: number }[];

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  f: Fonts;
  logos: Logos;
  kindLabel: string;
  y: number;
};

// Break `text` into lines that fit `width`, honouring existing newlines.
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of String(text ?? "").split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out;
}

// pdf-lib throws on anything the standard fonts cannot encode. Names and
// organizations are user input, so sanitize rather than fail a whole send:
// a guide with a stripped character beats no guide at all.
function safe(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[•]/g, "-")
    .replace(/ /g, " ")
    // Keep newlines: callers use them for deliberate line breaks, and the
    // printable-range filter below would otherwise weld two lines into one
    // word with nothing to show it happened.
    .replace(/\r\n?/g, "\n")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

const lineHeight = (size: number) => size * 1.42;

// How tall a run of text will be, without drawing it.
function textHeight(text: string, font: PDFFont, size: number, width: number): number {
  return wrap(safe(text), font, size, width).length * lineHeight(size);
}

type TextOpts = {
  font: PDFFont; size: number; color?: ReturnType<typeof rgb>;
  x?: number; width?: number;
};

// Draw text at an explicit y on an explicit page, returning the new y. Every
// primitive is written this way so the same code can measure (on a scratch
// page) and draw (on the real one).
function put(page: PDFPage, text: string, y: number, o: TextOpts): number {
  const x = o.x ?? MARGIN;
  const lines = wrap(safe(text), o.font, o.size, o.width ?? CONTENT_W);
  const lh = lineHeight(o.size);
  let cy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cy, size: o.size, font: o.font, color: o.color ?? BODY });
    cy -= lh;
  }
  return cy;
}

async function loadLogos(doc: PDFDocument): Promise<Logos> {
  const out: Logos = [];
  for (const [file, h] of [["aalb.png", 26], ["lurie.png", 22]] as [string, number][]) {
    try {
      const bytes = await readFile(path.join(process.cwd(), "public", "logos", file));
      out.push({ img: await doc.embedPng(bytes), h });
    } catch {
      // A missing logo must never cost someone their guide.
    }
  }
  return out;
}

function drawHeader(ctx: Ctx) {
  let x = MARGIN;
  for (const { img, h } of ctx.logos) {
    const w = (img.width / img.height) * h;
    ctx.page.drawImage(img, { x, y: PAGE_H - MARGIN - h + 4, width: w, height: h });
    x += w + 14;
  }
  const right = (t: string, y: number, font: PDFFont, color: ReturnType<typeof rgb>) => {
    const spaced = safe(t).toUpperCase().split("").join(" ");
    ctx.page.drawText(spaced, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(spaced, 8), y, size: 8, font, color,
    });
  };
  right("2nd Joint Conference", PAGE_H - MARGIN - 4, ctx.f.bold, TEAL);
  right(ctx.kindLabel, PAGE_H - MARGIN - 16, ctx.f.bold, GOLD);
}

function drawFooter(page: PDFPage, f: Fonts) {
  const y = MARGIN - 6;
  page.drawLine({
    start: { x: MARGIN, y: y + 22 }, end: { x: PAGE_W - MARGIN, y: y + 22 },
    thickness: 0.8, color: RULE,
  });
  page.drawText("True Language Access: Yesterday, Today, and Tomorrow", {
    x: MARGIN, y: y + 6, size: 8.5, font: f.bold, color: GOLD,
  });
  const tail = safe("August 15-16, 2026  ·  Lurie Children's Hospital, Chicago");
  page.drawText(tail, {
    x: PAGE_W - MARGIN - f.reg.widthOfTextAtSize(tail, 8.5), y: y + 6,
    size: 8.5, font: f.reg, color: BODY,
  });
}

function startPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  drawHeader(ctx);
  drawFooter(ctx.page, ctx.f);
  ctx.y = PAGE_H - MARGIN - 52;
}

// Start a new page if `needed` points below the footer.
function ensure(ctx: Ctx, needed: number) {
  if (ctx.y - needed < FLOOR) startPage(ctx);
}

// The gold letter-spaced eyebrow the guide uses above every section. Kept with
// the block that follows it, so a section never begins as an orphan heading.
function eyebrow(ctx: Ctx, text: string, keepWith = 40) {
  ensure(ctx, 18 + keepWith);
  const spaced = safe(text).toUpperCase().split("").join(" ");
  ctx.page.drawText(spaced, { x: MARGIN, y: ctx.y, size: 8.5, font: ctx.f.bold, color: GOLD });
  ctx.y -= 18;
}

type Row = { label: string; value: string };

// Two-column label/value grid, the guide's own "At a Glance" pattern.
function grid(ctx: Ctx, rows: Row[], opts?: { x?: number; width?: number }) {
  const totalW = opts?.width ?? CONTENT_W;
  const originX = opts?.x ?? MARGIN;
  const colW = (totalW - 24) / 2;
  for (let i = 0; i < rows.length; i += 2) {
    const pair = rows.slice(i, i + 2);
    const rowH = Math.max(
      ...pair.map((r) =>
        textHeight(r.label, ctx.f.bold, 9.5, colW) + 2 + textHeight(r.value || "-", ctx.f.reg, 9.5, colW)),
    );
    ensure(ctx, rowH + 12);
    const top = ctx.y;
    pair.forEach((r, c) => {
      const x = originX + c * (colW + 24);
      let y = put(ctx.page, r.label, top, { font: ctx.f.bold, size: 9.5, color: INK, x, width: colW });
      y -= 2;
      put(ctx.page, r.value || "Not provided", y, { font: ctx.f.reg, size: 9.5, x, width: colW });
    });
    ctx.y = top - rowH - 12;
  }
}

// A panel sized to its contents.
//
// The body runs twice: once on a scratch page to find its height, then for real
// on a box of exactly that height. Guessing the height instead is how a long
// dietary note ends up printed outside its own background.
function panel(
  ctx: Ctx, body: (page: PDFPage, y: number, innerW: number, f: Fonts) => number,
  opts?: { fill?: ReturnType<typeof rgb>; accent?: boolean; eyebrow?: string },
) {
  const padX = 16;
  const innerW = CONTENT_W - padX * 2;

  const scratch = ctx.doc.addPage([PAGE_W, PAGE_H]);
  const bodyH = -body(scratch, 0, innerW, ctx.f);
  ctx.doc.removePage(ctx.doc.getPageCount() - 1);

  const boxH = bodyH + 24;
  // The heading and its panel move together. Splitting them across a page
  // break leaves a gold heading dangling at the bottom of the previous one.
  if (opts?.eyebrow) eyebrow(ctx, opts.eyebrow, boxH);
  ensure(ctx, boxH + 18);
  const top = ctx.y;
  ctx.page.drawRectangle({
    x: MARGIN, y: top - boxH, width: CONTENT_W, height: boxH,
    color: opts?.fill ?? PANEL,
    ...(opts?.accent ? { borderColor: GOLD, borderWidth: 1.2 } : {}),
  });
  body(ctx.page, top - 14, innerW, ctx.f);
  ctx.y = top - boxH - 18;
}

// The QR block: a scannable square plus the reason to scan it.
async function qrBlock(ctx: Ctx, args: { url: string; heading: string; body: string }) {
  const size = 84;
  ensure(ctx, size + 12);
  const top = ctx.y;
  let qrW = 0;
  try {
    const dataUrl = await QRCode.toDataURL(args.url, { margin: 0, width: 300, errorCorrectionLevel: "M" });
    const img = await ctx.doc.embedPng(Buffer.from(dataUrl.split(",")[1], "base64"));
    ctx.page.drawImage(img, { x: MARGIN, y: top - size, width: size, height: size });
    qrW = size + 18;
  } catch {
    // Fall through to the printed link, which needs no camera anyway.
  }
  const x = MARGIN + qrW;
  const w = PAGE_W - MARGIN - x;
  let y = put(ctx.page, args.heading, top - 10, { font: ctx.f.bold, size: 11, color: INK, x, width: w });
  y -= 3;
  y = put(ctx.page, args.body, y, { font: ctx.f.reg, size: 9.5, x, width: w });
  y -= 2;
  y = put(ctx.page, args.url.replace(/^https?:\/\//, ""), y, {
    font: ctx.f.bold, size: 8.5, color: TEAL, x, width: w,
  });
  ctx.y = Math.min(top - size, y) - 20;
}

// Shared opening: logos, "PREPARED FOR", the name, and the line under it.
function drawTitle(ctx: Ctx, name: string, subtitle: string | null, nameSize: number) {
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y + 16 }, end: { x: MARGIN + 28, y: ctx.y + 16 },
    thickness: 1.4, color: GOLD,
  });
  ctx.page.drawText("PREPARED FOR", { x: MARGIN + 36, y: ctx.y + 12, size: 8.5, font: ctx.f.bold, color: GOLD });
  ctx.y -= 14;
  ctx.y = put(ctx.page, name, ctx.y, { font: ctx.f.bold, size: nameSize, color: INK });
  // Pull the subtitle up under the display line, which sets far looser than
  // body copy and otherwise leaves a hole beneath the name.
  ctx.y += nameSize * 0.32;
  if (subtitle) {
    ctx.y = put(ctx.page, subtitle, ctx.y, { font: ctx.f.reg, size: 12 });
    ctx.y += 2;
  }
  ctx.y -= 14;
}

async function newCtx(kind: GuideKind, kindLabel: string): Promise<{ ctx: Ctx; base: PDFDocument }> {
  const base = await PDFDocument.load(await readFile(guidePath(kind)));
  const doc = await PDFDocument.create();
  const f: Fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const logos = await loadLogos(doc);
  const ctx: Ctx = { doc, page: null as unknown as PDFPage, f, logos, kindLabel, y: 0 };
  startPage(ctx);
  return { ctx, base };
}

async function finish(ctx: Ctx, base: PDFDocument, title: string): Promise<Uint8Array> {
  const copied = await ctx.doc.copyPages(base, base.getPageIndices());
  copied.forEach((p) => ctx.doc.addPage(p));
  ctx.doc.setTitle(safe(title));
  ctx.doc.setAuthor("Americans Against Language Barriers");
  ctx.doc.setSubject("2026 Lurie Children's & AALB Conference");
  return ctx.doc.save();
}

export type AttendeeGuideArgs = {
  firstName: string;
  lastName?: string | null;
  affiliation?: string | null;
  attendanceMode?: string | null;
  attendDay?: string | null;
  portalUrl: string;
  // What we already hold, printed so they can correct it before they travel.
  dietary?: string | null;
  accessibilityNotes?: string | null;
  primaryLanguages?: string | null;
  needsParking?: boolean | null;
  // Set when their seat came with a sponsor's table.
  sponsorName?: string | null;
};

// Attendee cover: who they are to us, what we will act on, and how to fix it.
export async function buildAttendeeGuide(a: AttendeeGuideArgs): Promise<Uint8Array> {
  const { ctx, base } = await newCtx("attendee", "Attendee Guide");
  const fullName = [a.firstName, a.lastName].filter(Boolean).join(" ").trim() || "Our guest";
  const virtual = (a.attendanceMode || "").toLowerCase() === "virtual";

  drawTitle(ctx, fullName, (a.affiliation || "").trim() || null, 30);

  ctx.y = put(ctx.page, virtual
    ? "Your place is confirmed. You are joining us online, so the pages that follow cover the schedule, the sessions, and claiming your CEUs. The travel and check-in pages are there if your plans change."
    : "Your place is confirmed. Everything you need is in the pages that follow. This first page is the part that is only about you, including what we already have on file for your meals and access needs.",
    ctx.y, { font: ctx.f.reg, size: 10.5 });
  ctx.y -= 16;

  eyebrow(ctx, "Your registration");
  grid(ctx, [
    { label: "Attending", value: virtual ? "Online, via the livestream" : "In person, Lurie Children's Hospital" },
    { label: "Days", value: a.attendDay ? `One day: ${a.attendDay}` : "Both days, Saturday and Sunday" },
    {
      label: "Check-in",
      value: virtual
        ? "Nothing to check in for. Your joining link arrives by email."
        : "Saturday 9:00-9:30 AM, Sunday 8:30-9:00 AM, 11th floor. Bring photo ID both days.",
    },
    { label: "Badge name", value: fullName + (a.sponsorName ? `\nGuest of ${a.sponsorName}` : "") },
  ]);
  ctx.y -= 4;

  const has = (v?: string | null) => (v || "").trim();
  const rows: Row[] = [
    { label: "Dietary needs", value: has(a.dietary) || "None told to us. Lunch is vegan both days." },
    { label: "Access needs", value: has(a.accessibilityNotes) || "None told to us." },
  ];
  if (!virtual) {
    rows.push({
      label: "Parking",
      value: a.needsParking ? "You asked about parking. Details are on the travel page." : "Not requested.",
    });
  }
  if (has(a.primaryLanguages)) rows.push({ label: "Languages", value: has(a.primaryLanguages) });
  const closing = "If any of this is wrong or has changed, update it in your portal and we will see it. We plan meals and seating from exactly these answers.";

  panel(ctx, (page, top, innerW, f) => {
    const colW = (innerW - 24) / 2;
    let y = top;
    for (let i = 0; i < rows.length; i += 2) {
      const pair = rows.slice(i, i + 2);
      let lowest = y;
      pair.forEach((r, c) => {
        const x = MARGIN + 16 + c * (colW + 24);
        let ly = put(page, r.label, y, { font: f.bold, size: 9.5, color: INK, x, width: colW });
        ly -= 2;
        ly = put(page, r.value, ly, { font: f.reg, size: 9.5, x, width: colW });
        lowest = Math.min(lowest, ly);
      });
      y = lowest - 12;
    }
    y -= 2;
    return put(page, closing, y, { font: f.reg, size: 9, x: MARGIN + 16, width: innerW });
  }, { eyebrow: "What we have on file for you" });

  await qrBlock(ctx, {
    url: a.portalUrl,
    heading: "Your portal",
    body: "Scan to see your registration, update your details, or tell us anything you need from us.",
  });

  return finish(ctx, base, `Attendee Guide for ${fullName} · 2026 Lurie Children's & AALB Conference`);
}

export type ExhibitorGuideArgs = {
  companyName: string;
  contactName?: string | null;
  tierName: string;
  teamUrl: string;
  // Seats included with their level and how many are still unclaimed.
  seatsIncluded?: number;
  seatsRemaining?: number;
  team?: { name: string; comp: boolean }[];
  // Shipping contact, straight from the guide, so the label agrees with it.
  shipTo?: { name: string; line1: string; line2?: string };
};

// Exhibitor cover: their table, their team, and a label they can actually use.
export async function buildExhibitorGuide(s: ExhibitorGuideArgs): Promise<Uint8Array> {
  const { ctx, base } = await newCtx("exhibitor", "Exhibitor Guide");

  drawTitle(ctx, s.companyName, s.tierName, 26);

  ctx.y = put(ctx.page,
    "Thank you for exhibiting with us. The pages that follow cover load-in, shipping, parking, and when the room is busiest. This first page is yours: your table, your team, and a label you can put straight onto a box.",
    ctx.y, { font: ctx.f.reg, size: 10.5 });
  ctx.y -= 16;

  eyebrow(ctx, "Your table");
  grid(ctx, [
    {
      label: "Load-in",
      value: "Friday, August 14, 4:30 to 8:00 PM, or Saturday, August 15, 7:00 to 8:00 AM. Fully set up by 8:45 AM Saturday, after which nothing may be moved in or around the space.",
    },
    { label: "Teardown", value: "Please stay set up until 4:30 PM on Sunday, August 16." },
    { label: "Before you travel", value: "Text Adriana at 773-573-0678 with your expected arrival time and someone will meet you." },
    {
      label: "Included",
      value: typeof s.seatsIncluded === "number"
        ? `${s.seatsIncluded} conference ${s.seatsIncluded === 1 ? "ticket" : "tickets"} with your level`
        : "See your agreement",
    },
  ]);
  ctx.y -= 4;

  const team = s.team || [];
  const remaining = s.seatsRemaining ?? 0;
  const seatNote = remaining > 0
    ? `${remaining} included ${remaining === 1 ? "ticket is" : "tickets are"} still unclaimed. Add your people with the link below and they are registered as attendees, badges and all.`
    : "All of your included tickets are claimed. Anyone else from your team is welcome to register at the usual rate through the same link.";

  panel(ctx, (page, top, innerW, f) => {
    let y = top;
    if (team.length) {
      for (const m of team) {
        y = put(page, `${m.name}${m.comp ? "" : "  (registered separately)"}`, y, {
          font: f.reg, size: 10, color: INK, x: MARGIN + 16, width: innerW,
        });
        y -= 2;
      }
    } else {
      y = put(page, "Nobody registered yet.", y, { font: f.reg, size: 10, x: MARGIN + 16, width: innerW });
      y -= 2;
    }
    y -= 6;
    return put(page, seatNote, y, { font: f.reg, size: 9.5, x: MARGIN + 16, width: innerW });
  }, { eyebrow: "Who is coming from your team" });

  await qrBlock(ctx, {
    url: s.teamUrl,
    heading: "Add or change your team",
    body: "Scan or share this link. Whoever you add is tied to your table, so we know exactly who is coming and for whom.",
  });

  // A pre-addressed shipping label. The guide tells exhibitors where to ship;
  // this puts their own name on it, so a box arriving early can be matched to
  // a table without anyone guessing.
  const ship = s.shipTo || { name: "Claudia Fairley", line1: "225 E Chicago Ave.", line2: "Chicago, IL 60611" };
  // Its own page, and big. You are meant to cut this out, which you cannot do
  // if it shares a sheet with the team list you wanted to keep. Set at a size
  // that still reads from across a loading dock.
  startPage(ctx);
  eyebrow(ctx, "Shipping label");
  ctx.y = put(ctx.page,
    "Print this page, cut along the border, and tape it to each box you send ahead. Once a shipment is on its way, email contact@aalb.org with an inventory of what you sent and the address we should notify when it arrives.",
    ctx.y, { font: ctx.f.reg, size: 10.5 });
  ctx.y -= 20;

  const labelH = 300;
  const top = ctx.y;
  ctx.page.drawRectangle({
    x: MARGIN, y: top - labelH, width: CONTENT_W, height: labelH,
    color: WHITE, borderColor: INK, borderWidth: 1.4,
  });
  const lx = MARGIN + 28;
  const lw = CONTENT_W - 56;
  let ly = top - 34;
  ly = put(ctx.page, "DELIVER TO", ly, { font: ctx.f.bold, size: 9, color: GOLD, x: lx, width: lw });
  ly -= 6;
  ly = put(ctx.page, ship.name, ly, { font: ctx.f.bold, size: 22, color: INK, x: lx, width: lw });
  ly = put(ctx.page, ship.line1, ly, { font: ctx.f.reg, size: 16, color: INK, x: lx, width: lw });
  if (ship.line2) ly = put(ctx.page, ship.line2, ly, { font: ctx.f.reg, size: 16, color: INK, x: lx, width: lw });
  ly -= 14;
  ctx.page.drawLine({
    start: { x: lx, y: ly + 10 }, end: { x: MARGIN + CONTENT_W - 28, y: ly + 10 },
    thickness: 0.8, color: RULE,
  });
  ly -= 10;
  ly = put(ctx.page, "EXHIBITOR MATERIALS FOR", ly, { font: ctx.f.bold, size: 9, color: GOLD, x: lx, width: lw });
  ly -= 6;
  ly = put(ctx.page, s.companyName, ly, { font: ctx.f.bold, size: 20, color: INK, x: lx, width: lw });
  ly -= 4;
  put(ctx.page, "2026 Lurie Children's & AALB Conference  ·  August 15-16  ·  11th floor", ly, {
    font: ctx.f.reg, size: 11, x: lx, width: lw,
  });
  ctx.y = top - labelH - 18;

  return finish(ctx, base, `Exhibitor Guide for ${s.companyName} · 2026 Lurie Children's & AALB Conference`);
}

// A filename someone can find again in their downloads folder.
export function guideFilename(kind: GuideKind, who: string): string {
  const slug = safe(who).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || kind;
  return `${slug}-${kind}-guide.pdf`;
}
