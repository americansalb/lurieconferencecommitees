// Hand-curated Chicago direct-invitation list: named leaders at organizations
// whose daily work IS language access, invited to attend as people rather than
// as a segment. Loaded into the attendee pipeline via Attendees -> "Load
// Chicago list"; each person gets the "chicago" letter, which opens with the
// per-person `note` below BEFORE the conference introduces itself.
//
// ─── The rule that makes this list worth having ────────────────────────────
// Every `note` is written from something specific and verifiable about THAT
// organization: a clinic they opened, the languages they actually serve, a
// program they run, a neighborhood they're rooted in. If a note could be
// pasted onto a different row without anyone noticing, it has failed and
// should be rewritten. That is the entire difference between this list and a
// mail merge, and it is the reason the list is short.
//
// ─── How they have to SOUND (this is half the job) ─────────────────────────
// Specific is not the same as convincing. A first draft of these was factually
// perfect and every single one still read as machine-written, because they all
// had the same four tics. Do not reintroduce them:
//   1. NO closing epigram. Real work email does not land a zinger at the end of
//      every paragraph. End on a plain sentence, a question, or the ask.
//   2. NO "most institutions do X, but you do Y" setup. It is the single most
//      recognisable shape in the genre and it appeared in a third of the file.
//   3. NO balanced opposites ("the part I hear least about and worry about
//      most"), no scene-painting, no rule-of-three lists.
//   4. VARY THE LENGTH. Twenty-seven notes of four sentences each in identical
//      cadence is the giveaway even when every fact is right. Some of these
//      should be two sentences. One person writing to twenty-seven people
//      writes at wildly different lengths depending on how much they have.
// Use contractions, the way the rest of the letter does. Say the fact and stop;
// do not explain what the fact means. Being a little plain and a little
// awkward reads as human. Being polished reads as generated.
//
// ─── Sourcing rules (read before adding anyone) ────────────────────────────
// 1. `email` holds ONLY an address literally published on a real page. No
//    address was ever guessed from a first.last@org pattern. A row with
//    `email: ""` is a researched, real person we could not find a public
//    address for — it stays here as a lead and is SKIPPED by the loader until
//    someone fills it in.
// 2. `source` is the page each person's name, title, and (where present)
//    address came from, so any row can be re-checked in one click.
// 3. Names and titles are recorded as published. Titles rotate — spot-check a
//    row before sending if its source is old.
// 4. Where the published address is a shared org mailbox (info@, contact@)
//    rather than the person's own, `sharedInbox` is true. Those letters still
//    open "Hi <first name>," and are addressed to the named person; they just
//    arrive at a front desk, so expect lower reach and never send two
//    different asks to the same shared inbox.
//
// ─── ONE LETTER PER EMPLOYER (added after the first audit) ─────────────────
// The list reached 127 sendable rows and only 75 unique email domains, which
// meant 52 letters were landing where a colleague was already getting one:
// four at the DuPage Federation, three each at SWOP, Sinai, Centro de
// Informacion, Waukegan Township. Colleagues at a small nonprofit forward each
// other cold email. Three "hand-written personal notes" surfacing in one
// office in one week is precisely the tell every other rule in this file
// exists to avoid, and it is worse than a bad note because it exposes all
// three at once. So each employer keeps exactly ONE contact and the rest carry
// `hold`. Two traps when adding people:
//   - Dedupe on the EMPLOYER, not the `org` string. Three Town of Cicero
//     departments and two Northwestern centers were written as five different
//     organizations and survived a dedupe by name. Check the domain.
//   - Pick the contact whose desk this conference is actually about, not the
//     most senior one. The Language Access Resource Center's program director
//     beats her own executive director here.
//   - Never write a hold reason that points at another person. Three of them
//     ended up naming someone who was later held themselves, and an org goes
//     silent by accident that way: SWOP's second letter was withdrawn because
//     of a colleague who was not getting one either. Name the surviving
//     contact, and re-check the chain after every trim.
// The unit of this rule is the set of people who would COMPARE NOTES, which at
// a small nonprofit is the whole staff and at a university is one department.
// It is not the mail domain. This file spent a while enforcing a domain cap of
// four on uic.edu, and the rule as written conceded its own problem in the same
// sentence — "eleven departments who have never met" is a description of eleven
// employers, not one. What that cap actually guarded was a mail gateway, and a
// paced drip of five notes is not a deliverability event at a university that
// receives millions. It cost five people who belonged on the list, including
// the director of the Clinical Medical Spanish elective, which is close to the
// most on-topic desk in the state.
// So: at a large institution the cap is per DEPARTMENT, and two people from the
// same department or the same sub-field still collapse to one. Where it bites,
// prefer the desk furthest from this field — farmworker health, disability,
// Indigenous health equity — over a second heritage-language linguist, since
// the near desks are the ones we already reach.
// A department triage line at a hospital, university or county government is
// held outright: a letter to a named person read by whoever is on the intake
// queue that morning has no one whose job it is to care. A shared mailbox at a
// small nonprofit is different — it is often the director's own inbox — so
// those still send.
//
// ─── PEOPLE WE ALREADY KNOW (added after the second audit) ─────────────────
// The overlap between this file and AALB's own contact list was never a
// coincidence and should have been predicted. This list was built by asking
// who in Chicagoland works on healthcare language access; AALB is one of the
// organizations that answer names that question, so the search and the address
// book are close to the same query. The people who rank highest by "their job
// is language access" are, for that exact reason, the people Kevin already
// has a number for.
//
// A cold-invitation template is the wrong instrument for them, and not because
// it is impolite. The letters work by showing that someone read the
// recipient's own work. Coming from a stranger that reads as diligence.
// Coming from someone who could have called, the same sentence reads as a mail
// merge — and it retroactively marks every other letter they have had from us
// as one too. The downside is not a lost registration, it is a damaged
// relationship, so the trade is bad even at a high response rate.
//
// So a known contact carries `hold` with the reason written plainly, and their
// organization simply goes unwritten-to. That is not a gap: the org is reached
// by a phone call, which outperforms anything in this file. When a held person
// was the one holding an org's single letter, do NOT promote a colleague into
// the slot — the cap exists to stop one office getting three notes, not to
// guarantee every org gets one. Nobody is deleted; the row keeps its research.
//
// Only Kevin can populate this. Nothing in a published title reveals who is
// already in his network, so this rule is applied on his say-so and there is
// no way to infer it from a source URL.
//
// ─── TWO RULES THIS FILE KEPT BREAKING ────────────────────────────────────
// GEOGRAPHY. Cook, DuPage, Lake, Kane, Will, McHenry. The person has to work
// at an address in those six counties. A statewide or national organization
// qualifies only if this particular seat is in a Chicago-area office, which
// has to be checked and not assumed: the Illinois Public Health Association
// is Springfield, the School for the Deaf is Jacksonville, MATI's secretary is
// in Milwaukee, and the National Latinx Psychological Association's president
// is in Virginia. All four were on the send list. Relevance is not proximity,
// and nobody drives four hours each way to a two-day conference.
//
// SENIORITY. Stop reaching for the executive director. This list filled up
// with presidents, chiefs and directors because they are who a search engine
// surfaces, and they are close to the worst people to cold-email: their inbox
// has a gatekeeper, their August is booked, and they delegate conferences.
// The people this conference is actually for read their own email — staff
// interpreters, patient navigators and promotores, care coordinators,
// schedulers and registration clerks, staff and school nurses, social workers,
// medical assistants, health educators, program coordinators, residents. They
// also have a professional development line to spend, which a director does
// not need and will not bother with. Roughly one leader to every two or three
// people who do the work. Their addresses are harder to find; that is the job,
// and an empty `email` on the right person beats a published address on their
// boss.
//
// ─── Deliberately excluded ─────────────────────────────────────────────────
// Lurie Children's staff (they are the host), confirmed speakers and
// sponsors, and any organization already receiving a SPONSORSHIP ask from
// src/lib/prospect-targets.ts or an AMBASSADOR ask from
// src/lib/ambassador-targets.ts at the same shared inbox — one organization
// should not get two unrelated cold asks in the same week.
//
// Some people cleared research but are NOT worth sending to right now: a
// colleague two desks away is already getting a letter, or their org is
// already getting a different ask. Those rows carry `hold` with the reason
// instead of being deleted or having their address blanked out. Blanking the
// address would have been the easy move and it would have been a lie — the
// address is real, the judgement is ours, and next year's reader deserves to
// see which is which.

export type ChicagoTarget = {
  /** Organization as it should read in the subject line and footer. */
  org: string;
  firstName: string;
  lastName: string;
  /** Published title, for the dashboard and for spot-checking currency. */
  title: string;
  /** Published address only, or "" if none was found. "" = not loadable. */
  email: string;
  /** True when `email` is a shared org mailbox rather than the person's own. */
  sharedInbox?: boolean;
  /**
   * Why we are NOT writing to this person despite having their address.
   * Almost always: someone else at the same small team is already getting a
   * letter. Set this rather than clearing `email` — the loader skips it
   * either way, but only this way stays honest about which rows are research
   * failures and which are our own decisions.
   */
  hold?: string;
  /**
   * A real, sendable person we are holding in the second wave. Tier 2 is NOT
   * a quality judgement about the human — it is a judgement about how well
   * their address is sourced. A row is tier 2 when its `source` carries any
   * of: an address decoded rather than read plainly, a title the source
   * itself hedges or omits, an address that belongs to somewhere other than
   * their employer, an address recovered from a court filing or a journal
   * affiliation rather than a current staff page, a personal webmail account,
   * or a note saying it is worth a phone check first. Tier 1 is the hundred
   * whose name, title and address were all read off one current page owned by
   * the organization they work for.
   * Send tier 1, see what bounces, then decide about tier 2.
   */
  tier2?: boolean;
  /** Page the name/title/address came from. */
  source: string;
  /**
   * Paragraph one of their letter: specific to this organization, ending in a
   * natural bridge to why we're writing. Plain text; blank lines become real
   * paragraph breaks. This is the whole point of the list.
   */
  note: string;
};

export const CHICAGO_TARGETS: ChicagoTarget[] = [
  // ─── Health literacy and communication research ───────────────────────────
  {
    org: "Northwestern Feinberg School of Medicine",
    firstName: "Michael",
    lastName: "Wolf",
    title: "Director, CAHRA; James R. Webster Jr. Professor",
    email: "mswolf@northwestern.edu",
    source: "https://www.feinberg.northwestern.edu/sites/cahra/about/our-team/",
    note: `I've been reading the ConcordantRx work, mostly the studies on liquid dosing errors among Spanish-speaking parents. We built this program around the interpreted visit and I've come round to thinking that's the easier half of the problem. Nobody on our agenda right now speaks to what happens once the family is home with the bottle and the label, and I'd rather that be you than nobody.`,
  },
  {
    org: "Health Literacy & Learning at Northwestern",
    firstName: "Stacy",
    lastName: "Cooper Bailey",
    title: "Professor of Medicine; Director, CAHRA Health Literacy & Learning Program (HeLP)",
    email: "stacy-bailey@northwestern.edu",
    hold:
      "One letter per org, applied across org names: her program sits inside CAHRA, and CAHRA's director Michael Wolf is already getting a letter at the same northwestern.edu domain. Two rows named it differently, which is exactly how a duplicate survives a dedupe by organization.",
    source: "https://www.feinberg.northwestern.edu/sites/cahra/about/our-team/",
    note: `I'm writing about a conference on language access in pediatric care, but the reason I'm writing to you specifically is health literacy. A discharge instruction can be translated perfectly and still be unreadable, and our program doesn't currently tell those two failures apart. HeLP looks like one of the few places actually measuring the difference.`,
  },

  // ─── Medicine and public health at UIC ────────────────────────────────────
  {
    org: "UIC's Hispanic Center of Excellence",
    firstName: "Monica",
    lastName: "Vela",
    title: "Director, Hispanic Center of Excellence; Professor of Medicine",
    email: "mvela@uic.edu",
    hold:
      "The single likeliest name on this list to already be in Kevin's phone — directing a national Hispanic Center of Excellence is how you meet everyone in this field. This used to also cite the UIC domain cap; that cap is gone and this reason stands on its own. Promote her first if he says he does not know her.",
    source: "https://medicine.uic.edu/profiles/vela-monica/",
    note: `Your talk last September was called "Language Concordant Care and its Contributions to Health Equity." That's close enough to our whole agenda that I double-checked we hadn't lifted it off you. The Hispanic Center of Excellence has been at UIC since 1991, so you've been at this a great deal longer than we have.`,
  },
  {
    org: "the Odehmenan Health Equity Center",
    firstName: "Adriana",
    lastName: "Black",
    title: "Director of Health Equity Innovation and Collaboration; Founding Director, Odehmenan Health Equity Center",
    email: "ablack3@uic.edu",
    source: "https://publichealth.uic.edu/profiles/adriana-black",
    note: `Odehmenan. This heart of ours. I looked up what it meant before writing to you, which I suppose is part of the point of naming it that. Your center hosted Monica Vela's talk on language-concordant care last fall so none of this is new to you, but I wanted to ask you directly rather than hope you came across us somewhere.`,
  },
  {
    org: "UIC School of Public Health",
    firstName: "Amparo",
    lastName: "Castillo",
    title: "Clinical Assistant Professor, Community Health Sciences",
    email: "amparo@uic.edu",
    source: "https://publichealth.uic.edu/profiles/amparo-castillo/",
    note: `The Diabetes Empowerment Education Program was built in Spanish for low-literacy learners instead of translated into that afterward. It's what I point to when people ask me what "culturally appropriate" is supposed to mean in practice.`,
  },
  {
    org: "UIC's Transnational Research and Practice Lab",
    firstName: "Kelechi",
    lastName: "Ibe-Lamberts",
    title: "Clinical Associate Professor; Chair, APHA Caucus on Refugee and Immigrant Health",
    email: "klamber4@uic.edu",
    source: "https://blst.uic.edu/profiles/ibe-lamberts-kelechi",
    note: `Something I'm worried about with our program: language access in this country tends to mean Spanish and then stop. African immigrant families end up off the edge of the plan, frequently multilingual, frequently speaking a language the hospital holds no contract for. You chair the APHA caucus on refugee and immigrant health and you built the Interconnected African Wellness Assembly. I'd rather you said that in the room than have us talk around it for two days and work it out afterward.`,
  },
  {
    org: "UIC Occupational Therapy",
    firstName: "Mansha",
    lastName: "Mirza",
    title: "Faculty, Department of Occupational Therapy (rank not published)",
    email: "mmirza2@uic.edu",
    tier2: true,
    source: "https://ahs.uic.edu/disability-human-development/faculty/",
    note: `Your faculty page lists clinical communication with non-English speaking patients as a research area, which is a plainer description of this conference than anything currently on our own website. The disability side is what I'd want you for. A family working through a language barrier and a rehab system at the same time is handling two vocabularies, and interpreters are generally not trained on the second.`,
  },

  // ─── Spanish, heritage language, and bilingual education ──────────────────
  {
    org: "UIC Hispanic and Italian Studies",
    firstName: "Kim",
    lastName: "Potowski",
    title: "Professor of Spanish Linguistics; Director of Undergraduate Studies",
    email: "kimpotow@uic.edu",
    source: "https://hip.uic.edu/people/faculty/",
    note: `I read Spanish in Chicago last year and it's a good part of why this conference is happening here and not somewhere else. A hospital intake form has one box for Spanish. Your book is a few hundred pages on why that isn't one thing. I watched the TEDx talk too, and the bit about monolingualism being something done to children has stuck with me longer than most of what I hear at conferences, which is an awkward thing to say while inviting you to one.`,
  },
  {
    org: "UIC Spanish Heritage Language Program",
    firstName: "Angela",
    lastName: "Betancourt-Ciprian",
    title: "Clinical Assistant Professor; Director, Spanish Heritage Language Program",
    email: "abetan3@uic.edu",
    hold: "Same department and same sub-field as Kim Potowski, who is written to. Two notes into UIC Hispanic and Italian Studies about heritage speakers is the one place on this campus where the two recipients really would compare them.",
    source: "https://hip.uic.edu/profiles/betancourt-ciprian-angela/",
    note: `Most of the bilingual staff in Chicago hospitals came up as heritage speakers, and plenty of them were taught somewhere along the way that their Spanish wasn't quite the real article. You run the program where that goes one way or the other. I also saw you were on the organizing committee for the Illinois Dual Language Summit, so you know exactly how much work it is to get people in a room about this, and I'm asking anyway.`,
  },
  {
    org: "Loyola University Chicago",
    firstName: "Clara",
    lastName: "Burgo",
    title: "Professor of Spanish",
    email: "cburgo@luc.edu",
    source: "https://www.luc.edu/modernlang/profiles/burgoclara.shtml",
    note: `Clases mixtas is about heritage speakers and second-language learners being taught as though they're doing the same task. The hospital version is a bilingual nurse who grew up speaking Spanish and a physician who took Medical Spanish getting counted as the same resource, and it usually ends with the nurse interpreting for free. Nobody on our program can speak to the classroom end of it yet.`,
  },
  {
    org: "Truman College",
    firstName: "Madeline",
    lastName: "Troche-Rodriguez",
    title: "Faculty Director, Transitional Bilingual Learning Community",
    email: "mtroche-rodriguez@ccc.edu",
    tier2: true,
    source: "https://www.ccc.edu/truman/departments/transitional-bilingual-learning-community/",
    note: `The Transitional Bilingual Learning Community has been running since 2002. That's twenty-odd years of moving English learners into credit coursework without asking them to give up the first language, which is the same argument we're making about hospitals, except you can demonstrate it and we're still asserting it.`,
  },

  // ─── Hospitals and health systems ─────────────────────────────────────────
  {
    org: "the RUSH BMO Institute for Health Equity",
    firstName: "David",
    lastName: "Ansell",
    title: "SVP Community Health Equity; Co-Director, RUSH BMO Institute for Health Equity",
    email: "David_Ansell@rush.edu",
    source: "https://rushu.rush.edu/rush-medical-college/departments/department-internal-medicine/division-community-global-health-equity",
    note: `Rush lists you on its health equity experts page and on its Spanish-speaking physicians page. You're the only person I found in the city on both, and it's odd to me that being on both is rare. I've spent a fair amount of time with the Chicago Health Map as well. A life expectancy gap that big across a few miles has no single cause, but a parent who can't ask a question in their own language is somewhere in most versions of it.`,
  },
  {
    org: "Shirley Ryan AbilityLab",
    firstName: "Matt",
    lastName: "Ginsberg-Jaeckle",
    title: "Director, Global Patient Services",
    email: "international@sralab.org",
    sharedInbox: true,
    hold:
      "Front desk: international@sralab.org is Shirley Ryan AbilityLab's international patient services queue, not his inbox. Held until a direct address turns up.",
    source: "Global Patient Services page, sralab.org",
    note: `You said somewhere that interpreters are not just a box where one language goes in and another comes out. I've been quoting that at people for months without asking you first, so the least I can do is invite you. The Coleman-funded study on interpreter-mediated aphasia assessment makes the same point with data behind it: if you can't separate the language barrier from the language impairment, you can misdiagnose somebody badly. I also noticed you came up through the booth rather than into it from administration, which isn't common at director level.`,
  },
  {
    org: "UChicago Medicine",
    firstName: "Diala",
    lastName: "Atassi",
    title: "Chief of Global and National Programs",
    email: "international.services@uchospitals.edu",
    sharedInbox: true,
    hold:
      "Front desk: international.services@uchospitals.edu is UChicago Medicine's international services queue. Held until a direct address turns up.",
    source: "International Programs page, uchicagomedicine.org",
    note: `Interpreter Services reporting up through International Programs instead of sitting under compliance is a choice, and I think it's the right one. Your top five languages run Spanish, Arabic, Cantonese, Polish, Mandarin, which reads like the South Side and not much like the list a national vendor would have predicted. Seventy-one percent volume growth since 2015 is the number I'd most want to ask you about, since I doubt the budget grew seventy-one percent.`,
  },
  {
    org: "Cook County Health",
    firstName: "Linh",
    lastName: "Dang",
    title: "Chief Experience Officer",
    email: "patientexperience@cookcountyhealth.org",
    sharedInbox: true,
    hold:
      "Front desk: patientexperience@cookcountyhealth.org is a patient-complaints intake queue, which is the worst possible place for an invitation to land. Held until a direct address turns up.",
    source: "Leadership page, cookcountyhealth.org (address published in the page's own encoded contact link)",
    note: `Cook County Health staffs Spanish interpreters on site around the clock and Polish on weekdays. That's staffing to who actually walks in rather than to a national average, and it isn't the usual call. You've now run patient experience at Cook County and at NYC Health and Hospitals, probably the two most multilingual public systems in the country. What transferred and what didn't is the thing I'd most want to ask you.`,
  },
  {
    org: "Loyola Medicine",
    firstName: "Michelle",
    lastName: "Peters",
    title: "Regional VP, Community Health & Well-Being",
    email: "petermic@sjrmc.com",
    tier2: true,
    source:
      "Listed as Department Contact in the 2025 CHNA implementation report for Loyola University Medical Center and Gottlieb Memorial Hospital, loyolamedicine.org. Note the address is on sjrmc.com, not luhs.org.",
    note: `Loyola's FY2024 community benefit report puts language assistance at $3,886,246, over thirty thousand minutes of interpreting a month. I read a lot of these reports and yours is one of the very few that breaks the line out at all. The other number in it is the one that explains it: roughly one in ten households in your service area is limited English proficient, against about four percent statewide.`,
  },
  {
    org: "UI Health",
    firstName: "Rani",
    lastName: "Morrison Williams",
    title: "Chief Diversity & Community Health Equity Officer",
    email: "UIHealthDiversity@uic.edu",
    sharedInbox: true,
    hold:
      "Front desk: UIHealthDiversity@uic.edu is a department mailbox. Held until a direct address turns up.",
    source: "Diversity and community health equity leadership page, hospital.uillinois.edu",
    note: `Health equity work at UI Health runs on knowing who your patients actually are, and preferred language is one of the fields that gets collected as a courtesy rather than as data. You can't staff for interpreters you can't count.`,
  },
  {
    org: "La Rabida Children's Hospital",
    firstName: "Michele",
    lastName: "Wysoglad",
    title: "VP Development and External Affairs",
    email: "mwysoglad@larabida.org",
    source: "https://www.larabida.org/contact/",
    note: `La Rabida is the only hospital around here built entirely for children with complex chronic conditions, so your families aren't passing through. They come back for years, and a language barrier in that arrangement compounds instead of resolving. With better than nine in ten of your patients on Medicaid I'd guess a good number of them are doing all of it in a language the system defaults away from. I'm writing to you because external affairs is the front door. If someone at La Rabida owns interpreting I'd be grateful if you sent this along to them, or come yourself.`,
  },

  // ─── Public health, government, and the courts ────────────────────────────
  {
    org: "IDPH's Center for Minority Health Services",
    firstName: "Tiffani",
    lastName: "Saunders",
    title: "Chief, Center for Minority Health Services; IDPH Language Access Plan Coordinator",
    email: "dph.cmhs.info@illinois.gov",
    sharedInbox: true,
    hold:
      "Front desk: dph.cmhs.info@illinois.gov is a state agency information line. Held until a direct address turns up.",
    source: "IDPH Language Access Plan approved February 2026, dph.illinois.gov",
    note: `I read the Language Access Plan IDPH approved in February, the whole way through, which I suspect is a small club. What I kept looking at was the dates. Training for front-line and managerial staff starting this quarter, new hires inside sixty days, I Speak cards in every IDPH building by the end of December. Most of the plans I read don't carry dates at all. You coordinate that one, so you'll be the first to find out whether they hold.`,
  },
  {
    org: "the Cook County Department of Public Health",
    firstName: "Kiran",
    lastName: "Joshi",
    title: "Chief Operating Officer",
    email: "healthycook@cookcountyhhs.org",
    sharedInbox: true,
    hold:
      "Front desk: healthycook@cookcountyhhs.org is a program mailbox for the Healthy Cook County plan. Held until a direct address turns up.",
    source: "Leadership page, cookcountypublichealth.org",
    note: `You've stood up a community behavioral health unit and a community immunization unit inside a suburban county health department, so twice now you've had to build a service for people the existing one wasn't reaching. In suburban Cook a lot of that is language before it's anything else. Behavioral health is the hard case. There's no competent psychiatric assessment through a family member, and it still happens all the time.`,
  },
  {
    org: "Northwestern's Center for Community Health",
    firstName: "Darius",
    lastName: "Tandon",
    title: "Director, IPHAM Center for Community Health",
    email: "cch@northwestern.edu",
    sharedInbox: true,
    hold:
      "Front desk: cch@northwestern.edu is the center's general mailbox. Held until a direct address turns up.",
    source: "IPHAM Center for Community Health staff page, feinberg.northwestern.edu",
    note: `ARCC exists because health research has a habit of turning up in a neighborhood, taking what it needs and leaving. Language is usually where that shows first. A study recruits in English, or in translated English, then reports findings about a community half of whom could never have enrolled. I'd like the research side of this represented properly and you're the obvious person to ask.`,
  },
  {
    org: "the Administrative Office of Illinois Courts",
    firstName: "Noor",
    lastName: "Alawawda",
    title: "Senior Program Manager, Language Access",
    email: "nalawawda@illinoiscourts.gov",
    source: "https://www.illinoiscourts.gov/public/find-a-language-interpreter/",
    note: `The court interpreter registry is the closest thing Illinois has to a settled answer on who's qualified to interpret when the stakes are high. Healthcare has nothing equivalent. A hospital can put very nearly anyone in the room and still call it access. You've been at the AOIC since roughly the start of certification here, spoken language and sign language both, and I'd like the clinicians and interpreters coming to this to hear how that got built from someone who was actually there.`,
  },
  {
    org: "the Illinois School for the Deaf",
    firstName: "Julee",
    lastName: "Nist",
    title: "Superintendent",
    email: "julee.nist@illinois.gov",
    hold: "Not Chicagoland. Jacksonville is roughly two hundred and thirty miles away. The Deaf angle this row was carrying still needs covering — from a Chicago-area agency, and from Deaf staff rather than a superintendent.",
    source: "https://isd.illinois.gov/district-leadership",
    note: `ISD publishes a videophone number for the superintendent's office. Small thing, but it told me leadership there is reachable in ASL directly rather than through a relay and a gatekeeper. Most of what gets said about deaf children in healthcare is said by hearing people, and I'd rather that weren't true of this conference.`,
  },
  {
    org: "the Illinois Public Health Association",
    firstName: "Tracey",
    lastName: "Smith",
    title: "Associate Executive Director for Public Health Practice",
    email: "tsmith@ipha.com",
    hold: "Not Chicagoland. IPHA is a Springfield office.",
    source: "https://ipha.com/about/meet-the-team",
    note: `In a good many Illinois counties the local health department is the only door a limited-English family has into the health system, and unlike a hospital there's no billing code to hang interpreter costs on. I've been trying to work out how that actually gets handled and IPHA seems like where the question would land if it lands anywhere.`,
  },

  // ─── Pediatrics and the interpreting profession ───────────────────────────
  {
    org: "the Illinois Chapter of the AAP",
    firstName: "Abby",
    lastName: "Creek",
    title: "Senior Program Manager, Health Equity Initiatives",
    email: "acreek@illinoisaap.com",
    source: "https://illinoisaap.org/about-2/",
    note: `ICAAP publishes a bilingual flyer on interpretation services for pediatric practices, which puts your chapter ahead of most of the state chapters I've looked at, where interpreting turns up as a compliance footnote if it turns up. The flyer sits under health equity initiatives, so I'm guessing you're the one fielding calls from practices that want to do this properly and can't afford a full-time interpreter. Those calls are more or less what the conference is built around.`,
  },
  {
    org: "CCHI",
    firstName: "Natalya",
    lastName: "Mytareva",
    title: "Executive Director",
    email: "managing.director@cchicertification.org",
    hold:
      "Kevin knows Natalya. A letter assembled from public sources reads as research to a stranger and as a mail merge to anyone who has his phone number — sending it into his own network spends a real relationship to win a registration he can just ask for.",
    source: "https://cchicertification.org/about-us/",
    note: `CCHI is the only healthcare interpreter credential I know of that covers ASL and spoken languages under one commission instead of splitting them across two bodies with two vocabularies. We're trying to hold both together for two days, which is easier to put in a program than to do in a room.`,
  },
  {
    org: "MATI",
    firstName: "Amy",
    lastName: "Olen",
    title: "Secretary, MATI Board; Associate Professor, UW-Milwaukee",
    email: "amytolen@uwm.edu",
    hold: "Not Chicagoland. MATI is the regional association but this seat sits in Milwaukee.",
    source: "MATI board roster (matiata.org) and UW-Milwaukee faculty directory",
    note: `Ethics in community interpreting almost never makes a conference program, because it doesn't resolve into a best practice. An interpreter who's just heard a clinician say something untrue has a genuinely hard call and no manual has ever made it easy. I'd like that session to exist and I'd like you running it. MATI's membership covers Illinois too, so a fair share of the interpreters in Chicago hospitals sit inside it.`,
  },

  // ═══ HOLD: real published addresses, deliberately not being written to ════
  // Rush's Division of Community and Global Health Equity. David Ansell above
  // is getting the letter; four notes into one small division in one week is
  // the exact pattern this list exists to avoid.
  {
    org: "Rush University Medical Center",
    firstName: "Stephanie",
    lastName: "Crane",
    title: "Faculty, Division of Community and Global Health Equity",
    email: "Stephanie_Crane@rush.edu",
    hold: "David Ansell in the same Rush division is getting the letter.",
    source: "https://rushu.rush.edu/rush-medical-college/departments/department-internal-medicine/division-community-global-health-equity",
    note: `Rush's Division of Community and Global Health Equity is one of the few places where community health is a division of internal medicine rather than a department off to the side of it.`,
  },
  {
    org: "Rush University Medical Center",
    firstName: "Susan",
    lastName: "Lopez",
    title: "Faculty, Division of Community and Global Health Equity",
    email: "Susan_Lopez@rush.edu",
    hold: "David Ansell in the same Rush division is getting the letter.",
    source: "https://rushu.rush.edu/rush-medical-college/departments/department-internal-medicine/division-community-global-health-equity",
    note: `Rush lists you among its Spanish-speaking physicians as well as its health equity faculty, a combination that is far rarer than it should be.`,
  },
  {
    org: "Rush University Medical Center",
    firstName: "Octavio",
    lastName: "Vega",
    title: "Faculty, Division of Community and Global Health Equity",
    email: "Octavio_Vega@rush.edu",
    hold: "David Ansell in the same Rush division is getting the letter.",
    source: "https://rushu.rush.edu/rush-medical-college/departments/department-internal-medicine/division-community-global-health-equity",
    note: `Rush's community and global health equity faculty is the rare group where the community half and the global half are staffed by the same people.`,
  },
  {
    org: "Rush University Medical Center",
    firstName: "Carlos",
    lastName: "Olvera",
    title: "Rush University Medical Center",
    email: "carlos_olvera@rush.edu",
    hold: "Already a paid 2024 attendee — he is on the returning roster and gets that letter instead.",
    source: "src/lib/returning-2024.ts",
    note: `You were with us in 2024, which means this year's invitation should come from the returning roster and not from a cold list.`,
  },
  {
    org: "RUSH REACH",
    firstName: "Rukiya",
    lastName: "Curvey Johnson",
    title: "Director, RUSH Education and Career Hub",
    email: "reach@rush.edu",
    hold: "reach@rush.edu is already on another AALB outreach list; no personal address is published.",
    source: "REACH program page, rush.edu",
    note: `REACH puts Chicago Public Schools students into health careers years before college, which is the only real fix for a workforce that does not speak its patients' languages.`,
  },
  // ICAAP: Abby Creek above is getting the letter.
  {
    org: "the Illinois Chapter of the AAP",
    firstName: "Stephanie",
    lastName: "Atella",
    title: "Illinois Chapter of the AAP staff (title as listed on illinoisaap.org)",
    email: "satella@illinoisaap.com",
    hold: "Abby Creek at ICAAP is getting the letter.",
    source: "https://illinoisaap.org/about-2/",
    note: `ICAAP's bilingual interpretation flyer for pediatric practices is more practical than anything most state chapters publish on the subject.`,
  },
  {
    org: "the Illinois Chapter of the AAP",
    firstName: "Anelis",
    lastName: "Hernandez",
    title: "Illinois Chapter of the AAP staff (title as listed on illinoisaap.org)",
    email: "ahernandez@illinoisaap.com",
    hold: "Abby Creek at ICAAP is getting the letter.",
    source: "https://illinoisaap.org/about-2/",
    note: `ICAAP reaches the independent pediatric practices that carry the most language burden and have the least budget to meet it.`,
  },
  // City Colleges: Lee Jackson is already on the ambassador list.
  {
    org: "City Colleges of Chicago",
    firstName: "Jessica",
    lastName: "Navarro",
    title: "City Colleges of Chicago (title as listed on ccc.edu)",
    email: "jnavarro160@ccc.edu",
    hold: "Lee Jackson at City Colleges is already receiving an ambassador ask.",
    source: "ccc.edu staff directory",
    note: `City Colleges is where most of Chicago's bilingual healthcare workforce actually gets trained, whatever the four-year schools say about it.`,
  },
  {
    org: "City Colleges of Chicago",
    firstName: "Steven",
    lastName: "Teref",
    title: "City Colleges of Chicago (title as listed on ccc.edu)",
    email: "steref@ccc.edu",
    hold: "Lee Jackson at City Colleges is already receiving an ambassador ask.",
    source: "ccc.edu staff directory",
    note: `City Colleges teaches translation and interpreting to students who are already doing the work informally for their own families.`,
  },
  // FQHCs already receiving a sponsorship ask at their org mailbox.
  {
    org: "Erie Family Health Centers",
    firstName: "Cathy",
    lastName: "Junia",
    title: "Development and events contact",
    email: "cjunia@eriefamilyhealth.org",
    hold: "Erie is already receiving a sponsorship ask at info@eriefamilyhealth.org, and she is the giving contact who would field it.",
    source: "Support and events pages, eriefamilyhealth.org",
    note: `Erie has been serving Chicago's immigrant families since 1957, long enough that language access there is inherited practice rather than a policy someone wrote.`,
  },
  {
    org: "Near North Health",
    firstName: "Jill",
    lastName: "Roggeveen",
    title: "Near North Health (title as listed on nearnorthhealth.org)",
    email: "jroggeveen@nearnorthhealth.org",
    hold: "Near North is already receiving a sponsorship ask at nninfo@nearnorthhealth.org.",
    source: "nearnorthhealth.org staff listing",
    note: `Near North's clinics sit in the neighborhoods where the distance between a hospital's language plan and a patient's experience is widest.`,
  },
  // Same small UIC department as someone already on the list.
  {
    org: "UIC Occupational Therapy",
    firstName: "Yolanda",
    lastName: "Suarez-Balcazar",
    title: "Faculty, Department of Occupational Therapy (rank not published)",
    email: "ysuarez@uic.edu",
    hold: "Same department as Mansha Mirza, who is written to. This used to say neither of them was, which was the domain cap emptying a whole department by accident; now occupational therapy is reached, once.",
    source: "https://ahs.uic.edu/disability-human-development/faculty/",
    note: `Community-based participatory work with Latino families with disabilities sits at the intersection this conference is about, and very few people work there.`,
  },
  // Reporting directly to someone already on the list.
  {
    org: "the Administrative Office of Illinois Courts",
    firstName: "Dorothy",
    lastName: "Ksiazek",
    title: "Language Access program staff",
    email: "dksiazek@illinoiscourts.gov",
    hold: "Works directly under Noor Alawawda, who is getting the letter; one note to that office, not two.",
    source: "https://www.illinoiscourts.gov/public/find-a-language-interpreter/",
    note: `The court interpreter registry is the only credentialing infrastructure in Illinois that healthcare could plausibly borrow from.`,
  },
  {
    org: "the Illinois School for the Deaf",
    firstName: "Angela",
    lastName: "Kuhn",
    title: "Illinois School for the Deaf leadership",
    email: "angela.kuhn@illinois.gov",
    hold: "Julee Nist is her superintendent and is getting the letter.",
    source: "https://isd.illinois.gov/district-leadership",
    note: `A school that runs entirely in ASL knows more about what real communication access looks like than most hospital compliance offices do.`,
  },
  {
    org: "the Illinois Deaf and Hard of Hearing Commission",
    firstName: "Benro",
    lastName: "Olives",
    title: "Director",
    email: "DHH.Communications@Illinois.gov",
    hold: "IDHHC is already receiving a sponsorship ask at this same shared inbox (src/lib/prospect-targets.ts).",
    source: "https://idhhc.illinois.gov",
    note: `IDHHC licenses every ASL interpreter working in an Illinois hospital, which makes it the one body that could raise the floor statewide by changing a rule.`,
  },
  // CCHI and NBCMI: one letter per organization — and CCHI's is now nobody's.
  // Natalya Mytareva held the org's letter until she turned out to be someone
  // Kevin already knows, so CCHI reaches this conference through him and not
  // through this file. These two stay held: the point of the cap was never to
  // guarantee each org a letter, it was to keep one office from getting three.
  {
    org: "CCHI",
    firstName: "Amanda",
    lastName: "David",
    title: "Commissioner (ASL); term Oct 2024 - Oct 2027",
    email: "adavid@cchicertification.org",
    hold: "CCHI is Kevin's own contact, not a cold target; three notes into one small national office is the tell we are avoiding anyway.",
    source: "https://cchicertification.org/about-us/",
    note: `Being a Sign Language Designated Medical Interpreter inside a medical school is a job almost nobody holds, and the reason almost nobody holds it is the reason this conference exists.`,
  },
  {
    org: "CCHI",
    firstName: "Marisa",
    lastName: "Rueda Will",
    title: "Commissioner; term Oct 2024 - Oct 2027",
    email: "mruedawill@cchicertification.org",
    hold: "CCHI is Kevin's own contact, not a cold target.",
    source: "https://cchicertification.org/about-us/",
    note: `Building an interpreter training company from a working interpreter's chair rather than from a curriculum office produces a different kind of training.`,
  },
  {
    org: "NBCMI",
    firstName: "Joanna",
    lastName: "Larson",
    title: "Chair, National Board of Certification for Medical Interpreters",
    email: "nbcmichair@certifiedmedicalinterpreters.org",
    hold: "NBCMI is a division of IMIA, which is already on the sponsorship prospect list; this is also a role mailbox, not a personal address.",
    source: "https://www.certifiedmedicalinterpreters.org",
    note: `Maintaining working templates in Spanish, Somali, Nepali and Karen is what a certification body looks like when it is run by someone still interpreting.`,
  },
  {
    org: "Cook County Health",
    firstName: "Shannon",
    lastName: "Andrews",
    title: "Cook County Health leadership",
    email: "patientexperience@cookcountyhealth.org",
    hold: "Cook County Health's LEADERSHIP gets no letter: the only published address for either leader is the shared patientexperience@ triage line, and a named note read by whoever is on that queue has nobody whose job it is to care. The system is reached further down this file instead, through Ugoeze Otome at Stroger, whose own address is printed in her PubMed affiliation.",
    source: "Leadership page, cookcountyhealth.org",
    note: `Cook County Health serves more languages than almost any system in the country and does it on a public budget.`,
  },

  // ═══ LEADS: researched, real, no published address found ═════════════════
  // These are skipped by the loader. They stay here because next year the
  // address may exist, and because someone with a phone can still reach them.
  {
    org: "Esperanza Health Centers",
    firstName: "Nicole",
    lastName: "Kazee",
    title: "Chief Executive Officer (started July 1, 2026)",
    email: "",
    source: "esperanzachicago.org leadership page (bio still listed as coming soon)",
    note: `Esperanza's clinics run in Spanish first rather than in English with Spanish available, which is a different institution from the inside out.`,
  },
  {
    org: "Esperanza Health Centers",
    firstName: "Thomas",
    lastName: "Kim",
    title: "Chief Medical Officer",
    email: "",
    source: "esperanzachicago.org leadership page",
    note: `Sitting on the HANA Center board while running clinical care at a majority-Spanish-speaking FQHC covers two immigrant language communities that rarely get discussed together.`,
  },
  {
    org: "Esperanza Health Centers",
    firstName: "Diana",
    lastName: "Ramirez",
    title: "School-based health leadership",
    email: "",
    source: "esperanzachicago.org school-based health page",
    note: `School-based clinics are where a child's language needs and a parent's language needs come apart, and somebody has to hold both.`,
  },
  {
    org: "Erie Family Health Centers",
    firstName: "Sara",
    lastName: "Naureckas",
    title: "Erie Family Health Centers leadership; 25 years in pediatrics there",
    email: "",
    source: "eriefamilyhealth.org leadership page",
    note: `Twenty-five years of pediatrics at a health center where nearly half of patients are best served in Spanish is a career-length argument about language access.`,
  },
  {
    org: "Lawndale Christian Health Center",
    firstName: "Bruce",
    lastName: "Rowell",
    title: "Lawndale Christian Health Center clinical leadership",
    email: "",
    source: "lawndale.org provider directory",
    note: `Training at Children's Memorial and then practicing in North Lawndale means you have seen both ends of the same city's pediatric care.`,
  },
  {
    org: "Lawndale Christian Health Center",
    firstName: "James",
    lastName: "Brooks",
    title: "Chief Executive Officer; Board Chair, IPHCA",
    email: "",
    source: "lawndale.org and iphca.org board listings",
    note: `Chairing the state's community health center association while running one of its largest members puts you where policy and practice actually meet.`,
  },
  {
    org: "Alivio Medical Center",
    firstName: "Esther",
    lastName: "Corpuz",
    title: "Chief Executive Officer",
    email: "",
    source: "aliviomedicalcenter.org leadership page",
    note: `Alivio was founded by Latina women in Pilsen precisely because the existing system could not talk to them, which is the origin story this conference keeps circling back to.`,
  },
  {
    org: "Advocate Illinois Masonic Medical Center",
    firstName: "Fabiola",
    lastName: "Nevarez",
    title: "Language Services Supervisor (direct line 773-296-8231)",
    email: "",
    source: "advocatehealth.com language services listing",
    note: `Supervising language services at a hospital in a neighborhood this linguistically mixed means triaging between languages every single shift.`,
  },
  {
    org: "Columbia College Chicago",
    firstName: "Peter",
    lastName: "Cook",
    title: "ASL-English Interpretation faculty",
    email: "",
    source: "colum.edu ASL department pages (directory returning 503 at time of research)",
    note: `Columbia runs the only accredited ASL-English Interpretation bachelor's program in this region, which makes it the pipeline for every deaf patient's hospital visit here.`,
  },
  {
    org: "Columbia College Chicago",
    firstName: "K. Crom",
    lastName: "Saunders",
    title: "ASL-English Interpretation faculty",
    email: "",
    source: "colum.edu ASL department pages (directory returning 503 at time of research)",
    note: `The interpreters Columbia graduates are the ones who will be standing in an exam room when a deaf parent is told something they cannot afford to misunderstand.`,
  },
  {
    org: "Elmhurst University",
    firstName: "Brenda",
    lastName: "Gorman",
    title: "Faculty, communication sciences (phone 630-617-6122)",
    email: "",
    source: "elmhurst.edu faculty page (email obfuscated in JavaScript)",
    note: `EXCEMPILS trains bilingual speech-language pathologists, a specialty so short-staffed that bilingual children get misdiagnosed as delayed for want of anyone who can assess them.`,
  },
  {
    org: "Northwestern Medicine",
    firstName: "Dinee",
    lastName: "Simpson",
    title: "Chief Health Equity Executive",
    email: "",
    source: "nm.org leadership page (Northwestern Medicine publishes no staff addresses)",
    note: `Being the first person to hold a chief health equity role at Northwestern Medicine means the job description is still being written, which is the moment language access either gets into it or does not.`,
  },
  {
    org: "Rush University System for Health",
    firstName: "Ildemaro",
    lastName: "Gonzalez",
    title: "Chief Diversity, Equity and Inclusion Officer (started January 2025)",
    email: "",
    source: "rush.edu leadership page (Rush publishes no addresses on leadership pages)",
    note: `Arriving into a DEI role at a health system already publishing life expectancy gaps by neighborhood means inheriting a measured problem rather than an argued one.`,
  },
  {
    org: "Mile Square Health Center",
    firstName: "Karriem",
    lastName: "Watson",
    title: "Mile Square Health Center; formerly NIH All of Us",
    email: "",
    source: "UI Health and NIH public bios",
    note: `Running national research recruitment and then a Chicago federally qualified health center gives you both ends of the question about who studies leave out.`,
  },
  {
    org: "Northeastern Illinois University",
    firstName: "Jeanine",
    lastName: "Ntihirageza",
    title: "Faculty; African and refugee language communities",
    email: "",
    source: "neiu.edu faculty listing",
    note: `The refugee language communities in this city almost never appear in a hospital's language plan until someone shows up needing one.`,
  },
  {
    org: "2axend",
    firstName: "Corey",
    lastName: "Axelrod",
    title: "Founder; past president, Illinois Association of the Deaf",
    email: "",
    source: "2axend.com (address protected behind a form)",
    note: `2axend audits deaf accessibility for organizations that believed they already had it handled, which is most of them.`,
  },
  {
    org: "International Language Services",
    firstName: "Karin",
    lastName: "Ruschke",
    title: "Founding member, NCIHC and CCHI",
    email: "",
    source: "NCIHC and CCHI historical listings",
    note: `Helping found both national bodies that set healthcare interpreting standards, from Chicago, is a piece of this city's history that this conference sits directly on top of.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECOND WAVE: organizations that serve immigrants directly
  //
  // Everything above this line came from one research pass in the spring. This
  // block is a second pass with a narrower brief: Latino and Latin American
  // community organizations, Hispanic chambers of commerce, immigrant legal
  // aid, promotora and community health worker programs, bilingual education,
  // and the suburban agencies that do this work outside the city where nobody
  // looks. Same sourcing rules, same voice rules, same hold discipline.
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Latino community organizing ──────────────────────────────────────────
  {
    org: "Southwest Organizing Project",
    firstName: "Jeff",
    lastName: "Bartow",
    title: "Executive Director",
    email: "jbartow@swopchicago.org",
    source: "https://swopchicago.org/staff",
    note: `You've been organizing on the southwest side since 1989 and running SWOP since 2002, which means you've watched the language make-up of those neighborhoods change twice over. I'd rather have someone in the room who remembers what the last shift did to families than only people who arrived after it.`,
  },
  {
    org: "Southwest Organizing Project",
    firstName: "Jessica",
    lastName: "Biggs",
    title: "Director of Healthy Southwest",
    email: "Jbiggs@swopchicago.org",
    hold:
      "One letter per org: SWOP is written to through Jeff Bartow, the executive director.",
    source: "https://swopchicago.org/staff",
    note: `Healthy Southwest runs across six neighborhood schools and about a dozen social service agencies with eight lead organizations, and you supervise the community navigators and public health ambassadors inside it. The navigator job is the one this conference is really about. Somebody sits with a family, figures out what they actually need, and then has to get that across to a clinic that may not share a language with them.`,
  },
  {
    org: "Southwest Organizing Project",
    firstName: "Adriana",
    lastName: "Velazquez",
    title: "Administrative Director, Illinois Statewide Parent Mentor Program",
    email: "avelazquez@swopchicago.org",
    hold:
      "One letter per org: SWOP is written to through Jeff Bartow, the executive director.",
    source: "https://swopchicago.org/staff",
    note: `Your parent mentor team supports twenty schools and you connect immigrant families to citizenship and DACA legal help on top of that. Parents who've been through the mentor program are usually the ones who end up interpreting for other parents at the clinic, whether or not anyone asked them to.`,
  },
  {
    org: "Brighton Park Neighborhood Council",
    firstName: "Patrick",
    lastName: "Brosnan",
    title: "Executive Director",
    email: "Communications@BPNCchicago.org",
    sharedInbox: true,
    hold:
      "Front desk: Communications@BPNCchicago.org is a press inbox. Held until a direct address turns up.",
    source: "https://www.bpncchicago.org and coverage of the June 2026 opening at 4000 S. Archer",
    note: `The $8.7 million center you opened at 4000 S. Archer in June puts legal aid, benefits enrollment, immigration services, clinical services, a nutrition program and a community kitchen in one building. That's a decision about how many doors a family should have to walk through, and almost nobody funds it that way. You also have a clinician at each of your nine community school partners.`,
  },
  {
    org: "Enlace Chicago",
    firstName: "Sahida",
    lastName: "Martinez",
    title: "Promotora de Salud",
    email: "paes@enlacechicago.org",
    sharedInbox: true,
    hold:
      "Front desk: paes@enlacechicago.org is the parent engagement program's mailbox. Held until a direct address turns up.",
    source: "Enlace Chicago promotores program page and 2025 local coverage of Little Village promotoras",
    note: `You were Enlace's first promotora and you've been doing it ten years, after teaching high school in Mexico and immigrating here more than twenty-five years ago. The thing you said about parents needing access too, not just the kids, has stuck with me. I also read that your call volume dropped when people started staying home because of ICE, which is a public health number that won't show up in anybody's dashboard.`,
  },
  {
    org: "Centro Romero",
    firstName: "Daysi",
    lastName: "Funes",
    title: "Executive Director",
    email: "info@centroromero.org",
    sharedInbox: true,
    source: "https://www.centroromero.org",
    note: `Centro Romero served 26,196 people last year out of 6216 N. Clark, including 1,152 adult education students and 6,542 consultations, and you've been at this more than forty years. Rogers Park and Edgewater send people into hospital systems that are set up for Spanish and much less set up for everything else arriving on that stretch of Clark.`,
  },
  {
    org: "Casa Central",
    firstName: "Marty",
    lastName: "Castro",
    title: "President and Chief Executive Officer",
    email: "info@casacentral.org",
    sharedInbox: true,
    tier2: true,
    source: "https://www.casacentral.org leadership page",
    note: `Chairing the Illinois Human Rights Commission and then the U.S. Commission on Civil Rights is an unusual route into running a social service agency. Language access sits on the civil rights side of the line more often than the service side, and I suspect you already think of it that way.`,
  },
  {
    org: "Latinos Progresando",
    firstName: "Luis",
    lastName: "Gutierrez",
    title: "Founder and Chief Executive Officer",
    email: "info@latinospro.org",
    sharedInbox: true,
    source: "https://latinospro.org",
    note: `You started this in 1998 and you're still at it from 2724 W. Cermak. Between the immigration legal work and things like Mextalks and Mexayuno, Latinos Progresando is one of the few organizations in Marshall Square that people go to before there's an emergency rather than after.`,
  },
  {
    org: "Mujeres Latinas en Acción",
    firstName: "Angela",
    lastName: "Anderson Guerrero",
    title: "President and Chief Executive Officer",
    email: "mail@mujereslat.org",
    sharedInbox: true,
    tier2: true,
    source: "Mujeres Latinas en Acción leadership announcement, search closed June 2025",
    note: `You run the 24-Hour Chicago Rape Crisis Hotline with bilingual staff across every program, and the hotline is the hardest version of this problem. A survivor calling at two in the morning cannot wait on a phone interpreter queue. Mujeres has been Latina-led since 1973 and I'd like the conference to hear how you staff that line.`,
  },
  {
    org: "Spanish Coalition for Housing",
    firstName: "Joseph",
    lastName: "Lopez",
    title: "Executive Director",
    email: "help@sc4housing.org",
    sharedInbox: true,
    source: "https://www.sc4housing.org",
    note: `A housing counseling agency running the West Side Health Equity Collaborative and deploying its own community health workers across ten ZIP codes is not the org chart I expected. You were the first organization in the country certified as a HUD Housing Counseling Agency back in 1973, so I'll assume the health work is the same instinct showing up somewhere new.`,
  },
  {
    org: "ALSO Chicago",
    firstName: "Lori",
    lastName: "Crowder",
    title: "Executive Director",
    email: "also@also-chicago.org",
    sharedInbox: true,
    source: "https://also-chicago.org",
    note: `You've run ALSO since 2007 and you teach social welfare policy at Governors State, so you get the version of this that shows up in a statute and the version that shows up on a block. Violence prevention work runs on trust that takes years to build and about four minutes to lose, and a bad interpretation at the wrong moment is one of the ways it goes.`,
  },
  {
    org: "Corazón Community Services",
    firstName: "Martin",
    lastName: "Nava",
    title: "Executive Director",
    email: "mnava@corazoncs.org",
    source: "https://www.corazoncs.org/our-team",
    note: `You started as ED in January, coming from Trilogy with a master's in health communications, which is close to the exact subject of this conference. Cicero is about ninety-one percent Latino and Corazón has been at 5339 W. 25th since 2006, so the line you used about being an organic extension of the community isn't the usual thing an incoming director says. I'd be interested in what you've found in six months that the org chart didn't tell you.`,
  },
  {
    org: "Latino Union of Chicago",
    firstName: "Miguel",
    lastName: "Alvelo Rivera",
    title: "Executive Director",
    email: "miguel@latinounion.org",
    tier2: true,
    source: "https://www.latinounion.org",
    note: `The Albany Park Workers' Center took a four-year campaign to open and it's still the only worker center of its kind in the Midwest. Average day laborer wages went up two hundred percent. Day laborers are also close to the least likely group in the city to have a usable route into care, and the workers' center is where they already are.`,
  },
  {
    org: "Latino Union of Chicago",
    firstName: "Crystal",
    lastName: "Quevedo",
    title: "Organizing Director",
    email: "crystal@latinounion.org",
    hold:
      "One letter per org: Latino Union is written to through Miguel Alvelo Rivera, the executive director.",
    source: "https://www.latinounion.org",
    note: `Latino Union trained five thousand community members in three languages in a single year. I'd like to know how you staffed that, because the training is usually the easy part and finding people who can deliver it in all three is not.`,
  },

  // ─── Hispanic chambers of commerce ────────────────────────────────────────
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Jaime",
    lastName: "di Paulo",
    title: "President and Chief Executive Officer",
    email: "jaime@ihccbusiness.net",
    tier2: true,
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `IHCC started in 1990 as the Mexican American Chamber of Commerce of Illinois and now speaks for more than a hundred thousand businesses out of offices on North Michigan and in Naperville. Small business owners are the group that gets left out of health coverage conversations entirely, and a lot of your members are the employers of the people this conference is about.`,
  },
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Andres",
    lastName: "Solarte",
    title: "Director of Government Affairs and Community Relations",
    email: "asolarte@ihccbusiness.net",
    hold:
      "One letter per org: the Illinois Hispanic Chamber is written to through Jaime di Paulo, the president and CEO.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `We have someone from the Department of Justice speaking about how language access law is actually enforced, which is the session I think you'd get the most out of. Business owners hear about civil rights obligations from lawyers after something has gone wrong, rarely before.`,
  },
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Rosa Ivette",
    lastName: "Orozco",
    title: "Events and Membership Director",
    email: "ivette.orozco@ihccbusiness.net",
    hold:
      "One letter per org: the Illinois Hispanic Chamber is written to through Jaime di Paulo, the president and CEO.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `You're the person who'd know whether any of this is worth putting in front of IHCC members, so I'd rather ask you than guess.`,
  },
  {
    org: "Little Village Chamber of Commerce",
    firstName: "Blanca",
    lastName: "Soto",
    title: "Chief Operating Officer",
    email: "Blanca@littlevillagechamber.org",
    source: "https://littlevillagechamber.org",
    note: `The chamber hosts a Community Health and Resource Fair, which as far as I can tell makes it the only Hispanic chamber in the Chicago area running anything like a health program. You've held both of the chamber's top jobs and you manage SSA #25 along the 26th Street corridor. If a business district is going to be the front door to care for people who don't have another one, I'd like to understand how that happened here and not elsewhere.`,
  },

  // ─── Latino health professional associations ──────────────────────────────
  {
    org: "National Association of Medical Spanish",
    firstName: "Pilar",
    lastName: "Ortega",
    title: "President and Chief Executive Officer; CEO, Center for Clinician Multilingualism",
    email: "portega1@uic.edu",
    hold:
      "Kevin knows Pilar. This note quotes her own April 2025 paper back at her, which is exactly the move that reads as diligence from a stranger and as a form letter from someone who already has her number.",
    source: "medicalspanish.org leadership page and UIC College of Medicine faculty listing",
    note: `Your April 2025 paper in the Journal of Graduate Medical Education sets out a five-level proficiency standard covering more than fifty-five languages for graduate medical education. That is the piece of infrastructure this whole field has been missing, because until you can score a clinician's language the honest answer to whether they can practice in it is a shrug. You also built UIC's first medical Spanish program, taught it for nine years, wrote the textbook, and founded MOLA. If there's one session I'd want you to shape, it's the one about clinicians who speak the language versus clinicians who think they do.`,
  },
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Diana",
    lastName: "Ortega",
    title: "President, 2026-2028",
    email: "dortega.nahn@gmail.com",
    tier2: true,
    source: "NAHN Illinois chapter site, 2026-2028 board listing",
    note: `You've just started a two-year term, so the timing is either good or terrible. Nurses are the ones who end up doing the interpreting when nobody else is available, usually without being asked and without it counting as part of the job.`,
  },
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Rocio",
    lastName: "Olvera",
    title: "President-Elect; Treasurer, NAHN national",
    email: "rsanchez.nahn@gmail.com",
    hold:
      "One letter per org: NAHN Illinois is written to through Diana Ortega, the chapter president. Also, the published address is rsanchez@, which does not match this name — the chapter's other three are firstname/lastname patterns, so this is either a seat address inherited from a previous holder or a different person entirely. Re-verify from the chapter site before it is ever used.",
    source: "NAHN Illinois chapter site; national treasurer effective July 17, 2026",
    note: `Holding the Illinois chapter's president-elect seat and the national treasurer's seat at the same time means you see what Chicago is doing and what the rest of the country is doing. I'd like to know whether the language burden on Hispanic nurses looks different here than it does in the chapters you're reading budgets for.`,
  },
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Jennifer",
    lastName: "Sandoval",
    title: "Treasurer; faculty, DePaul University School of Nursing",
    email: "jensandoval.nahn@gmail.com",
    hold:
      "One letter per org: NAHN Illinois is written to through Diana Ortega, the chapter president.",
    source: "NAHN Illinois chapter board listing and DePaul faculty directory",
    note: `Your 2024 paper asked Latinx nurses what the first wave of COVID was actually like for them. You're teaching at DePaul now, so the students coming up behind that cohort are yours.`,
  },
  {
    org: "UIC College of Nursing",
    firstName: "Elizabeth",
    lastName: "Aquino",
    title: "Associate Dean; past President, NAHN Illinois, 2017-2021",
    email: "eaquino@uic.edu",
    source: "UIC College of Nursing directory and NAHN Illinois past-president listing",
    note: `You interviewed seventeen Latina nurse leaders and came out with six obstacles, including imposter syndrome, age discrimination and the absence of mentorship. Those are the reasons the bilingual nurse who's been interpreting for her unit for eight years is still not the one running it.`,
  },
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Susana",
    lastName: "Gonzalez",
    title: "Chapter member; 2020 ANA-Illinois Nurse Influencer Award",
    email: "susanagonzalez.ihna@gmail.com",
    hold:
      "One letter per org: NAHN Illinois is written to through Diana Ortega, the chapter president.",
    source: "ANA-Illinois 2020 award announcement",
    note: `Your award citation was specifically for mentoring bilingual, bicultural Spanish-speaking nurses. Awards for mentoring usually go to people who mentored a lot of everybody, so somebody deliberately noticed what you were doing.`,
  },
  {
    org: "UIC College of Medicine",
    firstName: "Maria Isabel",
    lastName: "Angulo",
    title: "Faculty; director, Clinical Medical Spanish elective",
    email: "angulo@uic.edu",
    source: "UIC College of Medicine course listing for the Clinical Medical Spanish elective",
    note: `Running the elective with live and simulated patient interviews in Spanish rather than vocabulary drills is the difference between a student who can name the organs and a student who can take a history. Two weeks isn't long, and I'd guess you know exactly which parts you'd extend if anybody gave you the room.`,
  },
  {
    org: "UIC Hispanic Center of Excellence",
    firstName: "Nicole",
    lastName: "Perez",
    title: "Director of Educational Research",
    email: "nperez57@uic.edu",
    hold:
      "UIC domain cap; the center's director Monica Vela is held too, so the center receives nothing. Worth keeping the original finding: this row said \"UIC Hispanic Center of Excellence\" and hers said \"UIC's Hispanic Center of Excellence\" — one apostrophe was the entire reason a dedupe by organization name did not catch the pair.",
    source: "UIC Hispanic Center of Excellence staff listing",
    note: `Somebody has to measure whether any of the pipeline work is producing clinicians who can actually practice in Spanish, as opposed to producing clinicians who identify as Hispanic. Those are different outcomes and they get reported as one number more often than they should.`,
  },
  {
    org: "Latino Medical Student Association, Loyola",
    firstName: "Victor",
    lastName: "Munoz",
    title: "Faculty advisor",
    email: "victor.munoz001@lumc.edu",
    tier2: true,
    source: "LMSA Loyola chapter page carrying the 2026-2027 board",
    note: `Medical students who grew up interpreting for their parents arrive already carrying this skill and get told nothing about how to use it professionally. If you can get a few of your students to two days of this, they'd be the youngest people in the room and probably not the least experienced.`,
  },
  {
    org: "Hispanic Dental Association",
    firstName: "Esther",
    lastName: "Lopez",
    title: "National Professional Trustee; Lead Dentist, RefugeeOne",
    email: "info@healthytoothdental.com",
    sharedInbox: true,
    hold:
      "Front desk, and the Hispanic Dental Association is already written to through its 2026 president Ana Zea: info@healthytoothdental.com is her private dental practice's general inbox, not an HDA address.",
    source: "Hispanic Dental Association board listing and RefugeeOne clinical staff page; address is her practice",
    note: `What you said about dialect, that patients can tell your intentions are good even when you get a word wrong for their region, is the most useful sentence I've read about this all year. It cuts against the instinct to stay silent unless your Spanish is perfect. Being lead dentist at RefugeeOne on top of the HDA seat also means you're working across languages that have almost no dental vocabulary support at all.`,
  },
  {
    org: "Hispanic Dental Association",
    firstName: "Ana",
    lastName: "Zea",
    title: "President, 2026",
    email: "azea@bu.edu",
    hold: "GEOGRAPHY. She is the national HDA president, but the only address published for her is a Boston University one, which means the seat is in Boston and not in this metro. The rule is that a statewide or national body qualifies only when that specific person sits at a Chicago-area desk. Caught in a retroactive audit of the rows written before the county rule existed; she was the only one of 92 who failed it.",
    source: "Hispanic Dental Association 2026 leadership listing",
    note: `You're president of the Hispanic Dental Association this year, and dental is close to absent from language access planning. Hospitals write interpreter policies and the dental clinic down the hall is not in them.`,
  },
  {
    org: "National Latinx Psychological Association",
    firstName: "Oswaldo",
    lastName: "Moreno",
    title: "President, 2026",
    email: "oamoreno@vcu.edu",
    hold: "Not Chicagoland, not even Illinois — the association is national and this year's president sits at Virginia Commonwealth. Holding a national officer because of the office they hold is exactly the error being corrected here.",
    source: "National Latinx Psychological Association 2026 leadership listing",
    note: `Mental health is where interpreting stops being about accuracy and starts being about whether the thing said in Spanish can survive the trip into English at all. I don't think the field has settled that and I'd like the conference to at least argue about it properly.`,
  },
  {
    org: "SACNAS, Northwestern University chapter",
    firstName: "Marcelo",
    lastName: "Vinces",
    title: "Co-advisor",
    email: "marcelo.vinces@northwestern.edu",
    source: "Northwestern SACNAS chapter page and the 2024 Linzer Award announcement",
    note: `You grew up in an Ecuadorian immigrant family and were undocumented, and you now advise the students coming through the same door. The Linzer Award in 2024 says the university noticed. Most of the people who fix language access in a hospital twenty years from now are undergraduates somewhere right now, and a good share of them are in chapters like yours.`,
  },
  {
    org: "NAHJ Chicago",
    firstName: "Araceli",
    lastName: "Gómez-Aldana",
    title: "Vice President; anchor, WBEZ",
    email: "agomez@wbez.org",
    source: "NAHJ Chicago board listing and WBEZ staff page",
    note: `Your February piece on the Operation Midway Blitz fallout still being felt in Latino neighborhoods got at something the health data won't show for another two years. People stop showing up for care and it doesn't register anywhere until the numbers get bad enough to publish. Coming as press is fine, coming as a participant is better, and you're welcome either way.`,
  },
  {
    org: "Prairie State Medical Society",
    firstName: "Audrey",
    lastName: "Tanksley",
    title: "President; Chief Medical Officer, CountyCare",
    email: "ATanksley123@gmail.com",
    tier2: true,
    source: "Prairie State Medical Society leadership listing and CountyCare executive listing",
    note: `CountyCare covers a membership where the language mix is closer to the actual county than any commercial plan in Illinois. Whatever your interpreter spend looks like on the claims side, it's a number very few people have seen.`,
  },
  {
    org: "Cook County Physicians Association",
    firstName: "Erica",
    lastName: "Taylor",
    title: "President",
    email: "erica@drericataylor.com",
    source: "Cook County Physicians Association leadership listing",
    note: `You're president of the Cook County Physicians Association, which means you can say something about language access without it reading as a hospital defending its own compliance record.`,
  },
  {
    org: "National Black Nurses Association, Chicago Chapter",
    firstName: "Vanessa",
    lastName: "Crim-Willis",
    title: "President",
    email: "info@chicagochapternbna.org",
    sharedInbox: true,
    tier2: true,
    source: "Chicago Chapter NBNA leadership listing",
    note: `Language access in Chicago gets discussed as a Spanish question and then a Polish question, and the West African and Haitian Creole speakers on the South and West sides fall out of the conversation entirely. Your members are working with them.`,
  },
  {
    org: "IC-RACE Lab, The Chicago School",
    firstName: "Nayeli",
    lastName: "Chavez-Dueñas",
    title: "Co-director",
    email: "ICRaceLab@gmail.com",
    sharedInbox: true,
    tier2: true,
    source: "IC-RACE Lab site; the lab publishes one shared address for both co-directors",
    note: `The HEART framework paper in American Psychologist put a name to something clinicians were already seeing in Latinx immigrant patients and had no vocabulary for. Trauma that arrives through immigration enforcement rather than through a single event doesn't fit the intake form, and the interpreter is usually the first person in the room to realize what's actually being described.`,
  },

  // ─── Bilingual education and adult literacy ───────────────────────────────
  {
    org: "Literacy Works",
    firstName: "Melanie",
    lastName: "Sampson",
    title: "Program Director, Clear Language Lab",
    email: "melanie@litworks.org",
    source: "https://www.litworks.org and HealthLiterateCookCounty.org",
    note: `The Clear Language Lab work with Cook County Health on health literacy for community health workers is the piece almost everybody skips. Material gets translated into Spanish at a reading level that was already too high in English, and then everyone is surprised it doesn't land. Your Community Voices Project seems to be the part where you check with actual readers instead of assuming.`,
  },
  {
    org: "Illinois Resource Center",
    firstName: "Josie",
    lastName: "Yanguas",
    title: "Director; chair, Illinois Advisory Council on Bilingual Education",
    email: "jyanguas@yahoo.com",
    tier2: true,
    source: "Illinois Resource Center staff listing and Illinois Advisory Council on Bilingual Education roster",
    note: `You've directed the IRC since 2006 and sat on the IAMME board since 1990, which is longer than most of the policy in this area has existed. Schools and hospitals hit the same wall from opposite sides and almost never compare notes about it.`,
  },
  {
    org: "Illinois State Board of Education",
    firstName: "Joanne",
    lastName: "Clyde",
    title: "Director, Multilingual and Language Development",
    email: "jclyde@isbe.net",
    source: "ISBE Multilingual and Language Development division listing and board reporting on Title III",
    note: `You've reported that Title III LIEP and ISEP have been flat funded since 2010 while the number of eligible students keeps rising. That's the same arithmetic hospitals run on interpreter budgets, and it produces the same result, which is that the service quietly gets rationed without anyone deciding to ration it.`,
  },
  // Two of Clyde's consultants, restored after the geography error described
  // in the collar-county section header. Both are line staff with their own
  // district caseloads, and both sit at ISBE's Chicago office — the 312
  // numbers on ISBE's published contact list are what places them there, and
  // are the reason the Springfield staff on the same list were not used.
  // Two, not nine: the whole department is about eleven people who sit
  // together, and three letters into it (with Clyde) is already the ceiling.
  {
    org: "Illinois State Board of Education — Multilingual/Language Development",
    firstName: "Michelle",
    lastName: "Lopez",
    title: "Principal Consultant, Program Compliance — Newcomer",
    email: "mlopez@isbe.net",
    tier2: true,
    source:
      "ISBE's published contact list (isbe.net Contact Information list). Her direct line is (312) 814-2237 — the 312 exchange is ISBE's Chicago office, 555 W. Monroe St., Suite 900, Chicago 60661, per https://www.isbe.net/Pages/contact-isbe.aspx. Springfield staff on the same list carry 217 numbers and were not used.",
    note: `Newcomer is your portfolio, which makes you one of very few people in the state whose job is specifically the first year — before anybody has a file, a screener result, or a relationship with the school. Hospitals meet the same families in the same window and have no equivalent role at all. What I'd want to ask is what you tell a district that has just enrolled a family it has no staff who can talk to.`,
  },
  {
    org: "Illinois State Board of Education — Multilingual/Language Development",
    firstName: "Randi",
    lastName: "Sucic",
    title:
      "Principal Consultant, Grants Review and Technical Assistance — Early Childhood",
    email: "rsucic@isbe.net",
    tier2: true,
    source:
      "ISBE's published contact list (isbe.net Contact Information list). Direct line (312) 814-5583, the Chicago office exchange. She is the assigned consultant for 141 districts including Waukegan CUSD 60, several of whose staff are also in this file.",
    note: `You've got the early childhood side and something like 141 districts, so you see the same argument play out in a hundred and forty-one slightly different ways. The question I keep getting stuck on is whether a district that does this well is doing anything portable, or whether it always comes down to one bilingual person who has been there nine years. You'd know which.`,
  },
  {
    org: "Chicago Public Schools",
    firstName: "Beata",
    lastName: "Arceo",
    title: "Office of Multilingual and Multicultural Education, International and Newcomer Student Services",
    email: "barceo@cps.edu",
    source: "CPS Office of Multilingual and Multicultural Education staff listing",
    note: `CPS translates elementary report cards into six languages and high school report cards into two. I've been trying to work out whether that's a budget decision or an assumption that by high school the kid translates for the parent, and I suspect you know which.`,
  },
  {
    org: "Illinois Association for Multilingual Multicultural Education",
    firstName: "James",
    lastName: "Cohen",
    title: "President",
    email: "jcohen2@niu.edu",
    hold: "Borderline: DeKalb is about sixty-five miles out and outside the six-county metro. Release if the radius is meant to be looser than that.",
    source: "IAMME board listing and Northern Illinois University faculty directory",
    note: `IAMME's membership is the group that has already had every argument about language access that healthcare is currently having for the first time.`,
  },
  {
    org: "Illinois Association for Multilingual Multicultural Education",
    firstName: "Francela",
    lastName: "Lopez",
    title: "Vice President",
    email: "FLopez@bn98.org",
    hold:
      "One letter per org: IAMME is written to through James Cohen, its president.",
    source: "IAMME board listing",
    note: `Doing this from inside a district rather than a university means you deal with the version where a family is standing in front of you and the translated form doesn't exist yet.`,
  },
  {
    org: "Learning Disabilities Association of Illinois",
    firstName: "Elizabeth",
    lastName: "Campos-Hamilton",
    title: "Region III; Parent Representative, IAMME",
    email: "ehamilton@ldaillinois.org",
    source: "LDA of Illinois regional listing and IAMME board listing",
    note: `You sit at the intersection of bilingual education and disability, which is where families get stuck hardest. A parent who needs an interpreter to get through an IEP meeting is being asked to follow two specialist vocabularies at once, in a language that isn't theirs, about their own child.`,
  },

  // ─── Immigrant legal services and civil rights ────────────────────────────
  {
    org: "Chicago Lawyers' Committee for Civil Rights",
    firstName: "Venu",
    lastName: "Gupta",
    title: "Executive Director",
    email: "vgupta@clccrul.org",
    source: "https://www.clccrul.org/staff",
    note: `You pull volunteer lawyers out of more than thirty member firms, which is a lot of billable hours pointed at people who can't pay for them. Language access complaints tend to die because nobody has the capacity to bring them, not because they lack merit.`,
  },
  {
    org: "Chicago Lawyers' Committee for Civil Rights",
    firstName: "Aneel",
    lastName: "Chablani",
    title: "Chief Program Officer",
    email: "achablani@clccrul.org",
    hold:
      "One letter per org: the Chicago Lawyers' Committee is written to through Venu Gupta, the executive director.",
    source: "https://www.clccrul.org/staff",
    note: `Migrant farmworker rights at ABLE in Toledo and before that death row work in Louisiana is an unusual road into Chicago civil rights practice. Farmworker language access is the hardest version of the problem in the country, and Illinois has somewhere between thirty-five and fifty-five thousand of those workers depending on whose count you use.`,
  },
  {
    org: "Chicago Lawyers' Committee for Civil Rights",
    firstName: "Ami",
    lastName: "Gandhi",
    title: "Senior Counsel",
    email: "agandhi@clccrul.org",
    hold:
      "One letter per org: the Chicago Lawyers' Committee is written to through Venu Gupta, the executive director.",
    source: "https://www.clccrul.org/staff",
    note: `You advised the election authorities that put the first Hindi ballots in the country into service. Getting a ballot right in a new language is the same problem as getting a consent form right, minus the part where somebody is frightened and in pain while they read it. I'd like to hear what the ballot work taught you that transfers.`,
  },
  {
    org: "Equip for Equality",
    firstName: "Cheryl",
    lastName: "Jansen",
    title: "Public Policy Director",
    email: "cherylj2@equipforequality.org",
    hold:
      "One letter per org: Equip for Equality is written to through Sujatha Jagadeesh Branch, whose civil rights team is nearer to this subject than public policy.",
    source: "https://www.equipforequality.org staff and public policy listings",
    note: `Equip for Equality says it can accommodate more than two hundred languages at all of its locations, which is a sentence I have not seen a healthcare organization in this state write down. Your legislative updates are also the only reliable place to find out what actually passed.`,
  },
  {
    org: "Equip for Equality",
    firstName: "Sujatha",
    lastName: "Jagadeesh Branch",
    title: "Vice President, Programs; Civil Rights Team",
    email: "sujatha@equipforequality.org",
    source: "https://www.equipforequality.org staff listing",
    note: `Running a civil rights team of around twenty-two attorneys and paralegals means you see the cases where the accommodation failed and somebody was hurt by it. Deaf patients and limited English proficient patients are covered by much of the same law, and I'd like to get the people working on each into one room for two days.`,
  },
  {
    org: "Legal Council for Health Justice",
    firstName: "Liesl",
    lastName: "Pereira",
    title: "Chief External Relations Officer",
    email: "lpereira@legalcouncil.org",
    source: "https://legalcouncil.org staff listing",
    note: `Legal Council for Health Justice puts the lawyer in the clinic instead of waiting for the client to find the office. When the client and the clinician don't share a language, that lawyer inherits the misunderstanding along with the case.`,
  },
  {
    org: "Health and Medicine Policy Research Group",
    firstName: "Wesley",
    lastName: "Epplin",
    title: "Director of Health Equity",
    email: "wepplin@hmprg.org",
    tier2: true,
    source: "https://hmprg.org staff listing",
    note: `HMPRG's health equity work is upstream enough that language access usually gets treated as a downstream service problem rather than a determinant. I'd argue it's both and I'd rather argue it with you than about you.`,
  },
  {
    org: "Chicago Mayor's Office for People with Disabilities",
    firstName: "Rachel",
    lastName: "Arfa",
    title: "Commissioner",
    email: "access@cityofchicago.org",
    sharedInbox: true,
    hold:
      "Front desk: access@cityofchicago.org is the disability office's public request line. Held until a direct address turns up.",
    source: "City of Chicago MOPD leadership page; the office publishes one shared address",
    note: `You're a deaf commissioner running the city office that enforces access, so the ASL side of this conference is your territory in a way it isn't for anybody else on this list. Deaf patients whose first language is ASL and hearing patients whose first language is Spanish get handled by two different departments in most hospitals, with two different budgets and no shared standard.`,
  },

  // ─── Community health centers and public health research ──────────────────
  {
    org: "Sinai Urban Health Institute",
    firstName: "Helen",
    lastName: "Margellos-Anast",
    title: "President",
    email: "helen.margellos@sinai.org",
    source: "https://www.sinaichicago.org/en/sinai-urban-health-institute/",
    note: `SUHI has been producing neighborhood-level health data for Chicago longer than the phrase health equity has been in general use, and you set up CROWD in 2017 to train community health workers rather than just study them. Eleven of the eighteen community health workers at Loyola were certified through your program, which I only found out by reading Loyola's paperwork rather than yours.`,
  },
  {
    org: "Sinai Urban Health Institute",
    firstName: "Stacy",
    lastName: "Ignoffo",
    title: "Executive Director, Community Health Innovations",
    email: "stacy.ignoffo@sinai.org",
    hold:
      "One letter per org: Sinai Urban Health Institute is written to through Helen Margellos-Anast, its president.",
    source: "https://www.sinaichicago.org/en/sinai-urban-health-institute/",
    note: `Community health worker programs live or die on whether the CHW is treated as a member of the care team or as outreach staff who happen to speak the language. That's a workforce design question and you're one of the few people in the city whose job is answering it.`,
  },
  {
    org: "Sinai Urban Health Institute",
    firstName: "Jacquelyn",
    lastName: "Jacobs",
    title: "Director of Evaluation",
    email: "jackie.jacobs@sinai.org",
    hold:
      "One letter per org: Sinai Urban Health Institute is written to through Helen Margellos-Anast, its president.",
    source: "SUHI staff listing and the IDEA study on diabetes equity",
    note: `You were corresponding author on the IDEA diabetes work for Black and Latine patients. Diabetes education is where language access gets expensive, because it's not one conversation, it's dozens over years, and nobody budgets for interpreting on that timeline.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Paola",
    lastName: "Seguil",
    title: "Director of Operations",
    email: "pseguil@communityhealth.org",
    hold:
      "CommunityHealth is Kevin's own contact through Vickie Chester, so nobody here is written to cold.",
    source: "https://www.communityhealth.org staff and volunteer listings",
    note: `CommunityHealth publishes its site in English, Spanish and Polish and recruits volunteer interpreters in both alongside bilingual nurses. Running that on a volunteer clinical model means you're scheduling language capacity and clinical capacity against each other every week, which is a harder operations problem than any salaried clinic has.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Vickie",
    lastName: "Chester",
    title: "Patient Access Manager",
    email: "vchester@communityhealth.org",
    hold:
      "Kevin knows Vickie. CommunityHealth therefore gets no letter from this file at all, which is the right outcome: it is reached by someone who can call.",
    source: "https://www.communityhealth.org staff listing",
    note: `Patient access at CommunityHealth is where a patient's language gets asked about for the first time, usually by whoever picks up the phone, and whatever gets written down then follows them through everything after.`,
  },
  {
    org: "Howard Brown Health",
    firstName: "Cecilia",
    lastName: "Hardacker",
    title: "Nursing education leadership (title not currently verifiable; see source)",
    email: "ceciliah@howardbrown.org",
    tier2: true,
    source: "Address published by Howard Brown in 2019 and still published in 2026; her individual staff page currently 404s, so the exact title is unconfirmed and is deliberately not stated here",
    note: `Howard Brown's patients include people who are navigating language, immigration status and being trans in the same appointment, and the interpreter is part of whether that appointment is safe. Training curricula for interpreters almost never cover gender-affirming care vocabulary in any language.`,
  },
  {
    org: "Chicago Hispanic Health Coalition",
    firstName: "Esther",
    lastName: "Sciammarella",
    title: "Executive Director",
    email: "chhc@chicagohispanichealthcoalition.org",
    sharedInbox: true,
    source: "https://chicagohispanichealthcoalition.org",
    note: `CHHC started in 1991 as an HHS Office of Minority Health pilot and now has more than six hundred member organizations and trains health promoters directly. You've been at this in one city for thirty-five years, so you've watched the same arguments come back around several times.`,
  },
  {
    org: "Michael Reese Health Trust",
    firstName: "Gina",
    lastName: "Massuda Barnett",
    title: "Program Director, Health Workforce",
    email: "gmassudabarnett@wearemichaelreese.org",
    source: "https://wearemichaelreese.org staff listing",
    note: `You came to the trust in 2024 after twenty-plus years at Cook County public health, and you're funding the CHW Community Billing Hub and Tapestry 360's refugee health program. The billing hub is the unglamorous thing that decides whether any of this survives the grant that started it.`,
  },

  // ─── Suburbs: the language access work nobody in the city hears about ─────
  {
    org: "DuPage Federation on Human Services Reform",
    firstName: "Eva",
    lastName: "Rafas",
    title: "Senior Program Director, Language Access Resource Center",
    email: "erafas@dupagefederation.org",
    tier2: true,
    source: "https://www.dupagefederation.org/ourteam and https://www.dupagefederation.org/larc",
    note: `LARC is the closest thing in Illinois to the thing this conference is arguing should exist. You pooled interpreters across health, human service, legal and educational organizations in 2005 because those organizations asked for it, you cover forty-plus languages face to face and two hundred by phone, and you're funded by a township mental health board and a hospital rather than by any of the systems that formally owe the obligation. You also announced ten training scholarships last year, which tells me demand outruns supply about the way I'd expect. I would like you at this conference more than almost anyone else on my list.`,
  },
  {
    org: "DuPage Federation on Human Services Reform",
    firstName: "Carolin",
    lastName: "Rivera",
    title: "Manager of Training and Education, Language Access Resource Center",
    email: "crivera@dupagefederation.org",
    hold:
      "One letter per org: the DuPage Federation is written to through Eva Rafas, who runs the Language Access Resource Center.",
    source: "https://www.dupagefederation.org/ourteam",
    note: `You ran the Spanish-language focus groups for the DuPage Early Childhood Community Profile, so you've done the version where you're the one asking parents questions rather than interpreting somebody else's. Training interpreters afterward has to be different once you've sat on that side of it.`,
  },
  {
    org: "DuPage Federation on Human Services Reform",
    firstName: "Victoria",
    lastName: "Jasso",
    title: "Program Coordinator, Language Access Resource Center",
    email: "vjasso@dupagefederation.org",
    hold:
      "One letter per org: the DuPage Federation is written to through Eva Rafas, who runs the Language Access Resource Center.",
    source: "https://www.dupagefederation.org/ourteam",
    note: `Coordinating a shared interpreter pool across dozens of agencies means you're the person who finds out at nine in the morning that nobody in the county speaks the language somebody needs at ten.`,
  },
  {
    org: "DuPage Federation on Human Services Reform",
    firstName: "Sabina",
    lastName: "Abdul-Qadir",
    title: "Executive Director, Administration",
    email: "sqadir@dupagefederation.org",
    hold:
      "One letter per org: the DuPage Federation is written to through Eva Rafas. She is more junior than the executive director but she runs the Language Access Resource Center, which is the part of the Federation this conference is actually about.",
    source: "https://www.dupagefederation.org/ourteam",
    note: `Your organization also supports the Illinois Welcoming Center staff statewide on language access and interpreter training. That's a small federation in Lombard carrying a state function, and I'd like to know whether that's by design or because nobody else picked it up.`,
  },
  {
    org: "Spanish Community Center",
    firstName: "Maria",
    lastName: "Munoz",
    title: "Illinois Welcoming Center Program Manager",
    email: "maria@spanishcenter.org",
    tier2: true,
    source: "https://www.spanishcenter.org/staffdirectory and https://www.spanishcenter.org/iwc",
    note: `Joliet's Welcoming Center puts Medicaid, SNAP, TANF and WIC enrollment in the same place as translation and interpretation, which means the language help isn't a referral to somewhere else. Will County families otherwise have to solve that themselves across four agencies.`,
  },
  {
    org: "Spanish Community Center",
    firstName: "Daniel",
    lastName: "Cabrera",
    title: "Citizenship and Immigration Program Manager",
    email: "daniel@spanishcenter.org",
    hold:
      "One letter per org: the Spanish Community Center is written to through Maria Munoz at the Illinois Welcoming Center.",
    source: "https://www.spanishcenter.org/staffdirectory",
    note: `A DOJ-recognized program running twenty-four services including DACA renewal, VAWA and U visas, in both languages, out of a building that opened in 1969. The U visa work in particular puts you in the room when somebody has to describe a crime to a stranger, which is the same problem an interpreter has in an emergency department at three in the morning.`,
  },
  {
    org: "Spanish Community Center",
    firstName: "Katherine",
    lastName: "Cruz",
    title: "Family Advocacy Center Program Lead",
    email: "katherine@spanishcenter.org",
    hold:
      "One letter per org: the Spanish Community Center is written to through Maria Munoz at the Illinois Welcoming Center.",
    source: "https://www.spanishcenter.org/staffdirectory",
    note: `Yours is the only Family Advocacy Center in Will and Kankakee counties, and your staff go to court with clients rather than sending them. Court interpreting and clinical interpreting are governed by completely separate rules and your clients cross between them in the same week.`,
  },
  {
    org: "Centro de Información",
    firstName: "Dianha",
    lastName: "Ortega-Ehreth",
    title: "Executive Director",
    email: "dortegaehreth@centrodeinformacion.org",
    source: "https://centrodeinformacion.org/about",
    note: `Three offices across Elgin, Carpentersville and Hanover Park is a lot of geography for one agency, and the Fox Valley gets discussed as if it were a suburb of the conversation rather than its own. You've been in nonprofits thirty years and in Elgin since 2010.`,
  },
  {
    org: "Centro de Información",
    firstName: "Ginna",
    lastName: "Larrota",
    title: "Welcoming Center Team Manager",
    email: "glarrota@centrodeinformacion.org",
    hold:
      "One letter per org: Centro de Informacion is written to through Dianha Ortega-Ehreth, the executive director.",
    source: "https://centrodeinformacion.org/about and https://centrodeinformacion.org/services",
    note: `Case management, crisis intervention and interpretation sitting under one manager means the interpreting isn't outsourced away from the people who know the family. That's rarer than it should be.`,
  },
  {
    org: "Centro de Información",
    firstName: "Maria",
    lastName: "Borrero",
    title: "Access to Justice Navigator Coordinator",
    email: "mborrero@centrodeinformacion.org",
    hold:
      "One letter per org: Centro de Informacion is written to through Dianha Ortega-Ehreth, the executive director.",
    source: "https://centrodeinformacion.org/about",
    note: `Centro de Información's court navigators and hospital interpreters are solving the same problem in two buildings that don't talk to each other. We have people from the Illinois court system's language access side coming, and I think that conversation is worth having in person.`,
  },
  {
    org: "Town of Cicero, Citizenship Department",
    firstName: "Arcadio",
    lastName: "Delgado",
    title: "Citizenship Assistance Director",
    email: "adelgado@thetownofcicero.com",
    source: "https://www.thetownofcicero.com/citizenship/",
    note: `Your department lists translation for citizenship appointments as a named free service alongside the ESL and citizenship classes, which makes a municipal office one of the few places in Cicero publishing language help as a service rather than an accommodation. Cicero is about ninety-one percent Latino and the town's health department page is an empty stub, so in practice you're part of the health infrastructure whether that's in your job description or not.`,
  },
  {
    org: "Town of Cicero, 708 Community Mental Health Board",
    firstName: "Carolyn",
    lastName: "Arias",
    title: "Executive Director and General Assistance Commissioner",
    email: "carias@thetownofcicero.com",
    hold:
      "One letter per employer: three Town of Cicero departments were listed as three organizations and would have put three letters into thetownofcicero.com in one week. Cicero is written to through Arcadio Delgado in Citizenship Assistance, the department nearest this subject.",
    source: "https://www.thetownofcicero.com/community/community-mental-health-board/",
    note: `Your board's referral commitment says regardless of legal status, in writing, on a town government page. That sentence is doing real work in 2026 and somebody made a decision to leave it up. You also fund Pilsen Wellness Center, Un Nuevo Despertar and Youth Crossroads, so you know which of them can actually deliver a session in Spanish and which of them say they can.`,
  },
  {
    org: "Town of Cicero, Office for People with Disabilities and Senior Services",
    firstName: "Ryan",
    lastName: "Chlada",
    title: "Executive Director",
    email: "rchlada@thetownofcicero.com",
    hold:
      "One letter per employer: Cicero is written to through Arcadio Delgado in Citizenship Assistance. See the note on the 708 Board row.",
    source: "https://www.thetownofcicero.com",
    note: `Deaf and hard of hearing residents in a town that is overwhelmingly Spanish-speaking need something the standard playbook doesn't cover, because the interpreter has to bridge two languages at once and there are very few of those people in Illinois.`,
  },
  {
    org: "Cass County Health Department",
    firstName: "Yazmin",
    lastName: "Perez-Carapia",
    title: "Immigrant Welcoming Center Coordinator",
    email: "yperez-carapia@casscohealth.org",
    hold: "Not Chicagoland. Cass County is Beardstown, about two hundred miles southwest — a real Welcoming Center doing real work, and a four-hour drive each way to a two-day conference.",
    source: "https://casscohealth.org/Welcoming-Center",
    note: `Your welcoming center publishes separate phone extensions for English, Spanish, French and Creole, and Burmese. A rural Illinois county health department listing a Burmese extension is not something I expected to find, and it says somebody counted who actually lives there instead of assuming. Beardstown is a long way to come for two days and I understand if it doesn't work, but the invitation is a real one.`,
  },
  {
    org: "Cass County Health Department",
    firstName: "Elsy",
    lastName: "Ayala",
    title: "Community Health Worker",
    email: "eayala@casscohealth.org",
    hold:
      "One letter per org: Cass County Health Department is written to through Yazmin Perez-Carapia at the Immigrant Welcoming Center.",
    source: "https://casscohealth.org community health worker listing",
    note: `Your department writes that its community health workers are bilingual in Spanish and can provide other languages as needed, with interpretation listed as an actual duty rather than an informal favour. Getting that written into the job is most of the battle.`,
  },
  {
    org: "Mano a Mano Family Resource Center",
    firstName: "Dulce",
    lastName: "Ortiz",
    title: "Executive Director",
    email: "dortiz@mamfrc.org",
    tier2: true,
    source: "mamfrc.org leadership listing (archived) and https://www.waukegantownship.com/154/Dulce-Ortiz",
    note: `You said you were still delivering food to people because they were afraid to leave the house. That is a health outcome and it will never be recorded as one. Between running Mano a Mano, the ICIRR board, a township trustee seat and the state Access to Justice community trust committee, you're connected to more of this than anyone else I've written to in Lake County.`,
  },
  {
    org: "Mano a Mano Family Resource Center",
    firstName: "Diana",
    lastName: "Gutierrez",
    title: "Community Health Education and Outreach Program Manager",
    email: "dgutierrez@mamfrc.org",
    hold:
      "One letter per org: Mano a Mano is written to through Dulce Ortiz, the executive director.",
    source: "mamfrc.org leadership listing (archived January 2025); the live page currently 404s",
    note: `You've trained promotores in Mexico and here, and you were a practitioner and researcher there before this. That's two health systems' worth of assumptions to hold at once. What you said about people already being in trauma before the political situation added more is the part clinicians tend to hear as background rather than history.`,
  },
  {
    org: "HACES",
    firstName: "Alicia",
    lastName: "Garcia",
    title: "Executive Director",
    email: "info@haces.org",
    sharedInbox: true,
    source: "https://haces.org/important-update-haces-leadership-transition/ for the role; HACES publishes no individual staff addresses",
    note: `You took over from the founder in January after six years on staff, and as director of programs you wrote the line about twenty-one thousand people in a single year receiving information, referrals and immigration support. Waukegan carries a share of Lake County's immigrant population that the county's own health department doesn't staff for.`,
  },
  {
    org: "Great Lakes Center for Farmworker Health and Wellbeing, UIC",
    firstName: "Maggie",
    lastName: "Acosta",
    title: "Assistant Director and Director of Outreach",
    email: "macosta4@uic.edu",
    hold:
      "One letter per org: the Great Lakes Center for Farmworker Health is written to through Linda Forst, its director and principal investigator.",
    source: "https://farmworkerhealth.uic.edu/profiles/acosta-maggie/",
    note: `Medical anthropology plus a decade of community public health is close to the right training for outreach to a population that moves. Illinois has somewhere between thirty-five and fifty-five thousand farmworkers and the range itself tells you how well anybody has been counting.`,
  },
  {
    org: "Great Lakes Center for Farmworker Health and Wellbeing, UIC",
    firstName: "Linda",
    lastName: "Forst",
    title: "Center Director and Principal Investigator",
    email: "lforst@uic.edu",
    tier2: true,
    source: "https://farmworkerhealth.uic.edu and UIC School of Public Health announcement of the NIOSH award",
    note: `Yours is the first federal agricultural safety center in the country built around the whole health of agricultural workers rather than machinery and pesticides alone. Occupational health and language access almost never appear on the same agenda, and I'd like to know whether the center ran into that or built around it from the start.`,
  },
  {
    org: "Illinois Migrant Council",
    firstName: "Magdalena",
    lastName: "Rivera",
    title: "President and Chief Executive Officer",
    email: "mrivera@illinoismigrant.org",
    source: "https://illinoismigrant.org/staff",
    note: `Sixty years, four regions, about forty counties, and your health program is pesticide safety and heat stress education with screening referrals for diabetes, TB and cancers. That's the whole care pathway for people who are in a county for eight weeks. Your site footer says auxiliary aids and services available on request, and I'd like to know how often anybody actually requests one.`,
  },
  {
    org: "Illinois Migrant Council",
    firstName: "Alvaro",
    lastName: "Bermudez",
    title: "Northern Region Coordinator",
    email: "abermudez@illinoismigrant.org",
    hold:
      "One letter per org: the Illinois Migrant Council is written to through Magdalena Rivera, its president and CEO.",
    source: "https://illinoismigrant.org/staff",
    note: `Your region is close enough to Chicago that your workers show up in Chicago emergency departments, and far enough that nobody at those hospitals knows where they came from.`,
  },
  {
    org: "Community Health Partnership of Illinois",
    firstName: "Diego",
    lastName: "Lobo",
    title: "Development Manager and Outreach Coordinator",
    email: "dloboprotti@chpofil.org",
    tier2: true,
    source: "Published on UIC's Great Lakes Center partners listing; chpofil.org itself blocks automated access",
    note: `Six clinics running a migrant and seasonal farmworker program with promotores de salud, sites from Harvard down to Rantoul, going back to 1970. Aurora, Kankakee and Princeville are three different language situations and one organization is carrying all of them.`,
  },
  {
    org: "Lake County Health Department and Community Health Center",
    firstName: "Christopher",
    lastName: "Hoff",
    title: "Executive Director",
    email: "CHoff@lakecountyil.gov",
    source: "Lake County official staff directory (archived February 2026); lakecountyil.gov blocks automated access",
    note: `You came to Lake County last March after a decade at DuPage and seven years at Kane, so you've now run public health in three counties whose immigrant populations look nothing alike. Your department runs a promotoras de salud program out of North Shore Health Center and names no lead for it anywhere public, which I mention because I looked hard and would have written to that person instead of bothering you.`,
  },
  {
    org: "Lake County Health Department and Community Health Center",
    firstName: "Lisa",
    lastName: "Kritz",
    title: "Director of Prevention",
    email: "lkritz@lakecountyil.gov",
    hold:
      "One letter per org: the Lake County Health Department is written to through Christopher Hoff, its executive director.",
    source: "Lake County Health Department program announcements, October 2025",
    note: `Lead exposure prevention runs on getting into people's homes, and the families most at risk in Waukegan and North Chicago are the ones least likely to open the door to a county employee they can't talk to.`,
  },
  {
    org: "Kane County Health Department",
    firstName: "Kim",
    lastName: "Peterson",
    title: "Director of Community Health",
    email: "askus@kanecountyil.gov",
    sharedInbox: true,
    hold:
      "Front desk: askus@kanecountyil.gov is the county's general public enquiry line, not the health department's. Held until a direct address turns up.",
    source: "https://www.kanehealth.com/Pages/Menu-About.aspx; Kane County publishes no individual staff addresses, so this is the only route to her",
    note: `Your division runs a program literally called Immigrant Health, and the page says immigration is considered a social determinant of health. Very few health departments will write that down. Aurora and Elgin between them hold a big share of the state's Spanish-speaking population outside Chicago and get almost none of the attention.`,
  },
  {
    org: "Cicero Community Collaborative",
    firstName: "Elida",
    lastName: "Ortiz",
    title: "Director",
    email: "CiceroCollaborative@gmail.com",
    sharedInbox: true,
    tier2: true,
    source: "cicerocommunitycollaborative.org (archived February 2025); the live site is currently down",
    note: `Sixty organizations in one consortium, four hundred thousand pounds of food in two years, and four hundred ninety-five dollar DACA scholarships. You taught ESL at Universidad Popular and computing at Corazón before this, so the language part of it isn't theoretical for you.`,
  },
  {
    org: "Cicero Family Service",
    firstName: "Corina",
    lastName: "Martinez",
    title: "Directora Asistente de Programas de Alcance Comunitario y Manejo de Casos",
    email: "cmartinez@cicerofs.org",
    source: "https://www.cicerofs.org/equipo-clinico for the title; address published on the Cicero Community Collaborative health committee page (archived)",
    note: `Your agency publishes its clinical team page in Spanish, with the titles in Spanish, which is a small thing that says the organization was built that way rather than translated afterward. Fifteen years across legal, educational and community settings means you've watched the same family get handled three different ways by three different systems.`,
  },
  {
    org: "Proviso Township Mental Health Commission",
    firstName: "Lisa",
    lastName: "Loster",
    title: "Associate Director",
    email: "lloster@ptmhc.org",
    source: "https://ptmhc.org/funding-information/",
    note: `You're the named contact for every FY26-27 funding application, so you see what every mental health provider in Proviso Township claims it can do before anybody checks. The commission publishes its own release of information form in English and Spanish, which I noticed because I went looking for it.`,
  },
  {
    org: "Proviso Township",
    firstName: "Lorenzo",
    lastName: "Webber",
    title: "Director of Youth Services",
    email: "lwebber@provisotownship.illinois.gov",
    tier2: true,
    source: "Proviso Township staff listing and Proviso Partners 4 Health board listing",
    note: `Maywood, Melrose Park and Bellwood are a single township and three different language situations. Young people are the ones interpreting for their parents in all three.`,
  },
  {
    org: "Waukegan Township",
    firstName: "Marc",
    lastName: "Jones",
    title: "Supervisor",
    email: "mjones@waukegantownship.com",
    hold:
      "One letter per org: Waukegan Township is written to through Chris Butler at the Eddie Washington Center. The supervisor is the more senior name, but the shelter director is the one whose day this conference is about.",
    source: "https://www.waukegantownship.com",
    note: `Township government is the layer that hands out general assistance and gets nobody's attention, and in Waukegan that means you're often the last office before someone goes without.`,
  },
  {
    org: "Waukegan Township",
    firstName: "Abigail",
    lastName: "Hernandez",
    title: "Named contact for the Senior Health Insurance Program (no title published)",
    email: "ahernandez@waukegantownship.com",
    hold:
      "One letter per org: Waukegan Township is written to through Chris Butler at the Eddie Washington Center.",
    source: "https://www.waukegantownship.com; the township publishes her as the SHIP contact without a title, and one is deliberately not invented here",
    note: `You're the person Waukegan Township lists for the Senior Health Insurance Program, so you already know that Medicare counselling for a senior who needs an interpreter takes three times as long and gets the same length of appointment as everybody else.`,
  },
  {
    org: "Waukegan Township",
    firstName: "Chris",
    lastName: "Butler",
    title: "Director, Eddie Washington Center",
    email: "cbutler@waukegantownship.com",
    source: "https://www.waukegantownship.com",
    note: `Intake at the Eddie Washington Center is where somebody has to explain their situation to a stranger while exhausted, and where a bad interpretation costs someone a bed.`,
  },
  {
    org: "Nicasa Behavioral Health Services",
    firstName: "Emperatriz",
    lastName: "Guerra",
    title: "Chief Clinical Officer",
    email: "info@nicasa.org",
    sharedInbox: true,
    tier2: true,
    source: "https://www.nicasa.org leadership listing; Nicasa publishes no individual staff addresses",
    note: `Thirty years at one behavioral health agency in Lake County, and a Hispanic Heritage Award from Waukegan Township in 2012 on top of it. Substance use treatment in a second language is one of the places where a slightly wrong word changes the clinical picture entirely.`,
  },
  {
    org: "Southwest Suburban Immigrant Project",
    firstName: "José Eduardo",
    lastName: "Vera",
    title: "Executive Director",
    email: "jvera@ssipchicago.org",
    tier2: true,
    source: "Address published on dupagefederation.org/ourteam; SSIP's own team page blocks automated access",
    note: `SSIP was started in 2010 by immigrant residents themselves in northern Will and southern DuPage, and was part of getting the Illinois Dream Act and temporary visitor driver's licenses through. Your homepage currently runs a health care is a human right campaign, which is why I'm writing rather than assuming this is only an immigration organization.`,
  },
  {
    org: "DuPage Health Coalition",
    firstName: "Kara",
    lastName: "Murphy",
    title: "President",
    email: "kmurphy@accessdupage.org",
    tier2: true,
    source: "https://www.dupagehealthcoalition.org and Access DuPage program materials",
    note: `Access DuPage has covered more than fifty-six thousand residents since 2001 for under four hundred dollars per member per year, which is a number I keep rechecking because it sounds wrong. Whatever you're doing to keep it there, interpreting is inside it somewhere and I'd like to know how it's paid for.`,
  },
  {
    org: "DuPage County Health Department",
    firstName: "Adam",
    lastName: "Forker",
    title: "Executive Director",
    email: "adam.forker@dupagehealth.org",
    source: "DuPage County Health Department leadership listing",
    note: `DuPage doesn't read as an immigrant county from the outside and the enrolment numbers say otherwise. Your county is also where LARC was built, which is the one piece of shared language infrastructure in the region.`,
  },
  {
    org: "DuPage County Health Department",
    firstName: "Lisa",
    lastName: "Lerner",
    title: "Community Initiatives Coordinator",
    email: "Lisa.Lerner@dupagehealth.org",
    hold:
      "One letter per org: the DuPage County Health Department is written to through Adam Forker, its executive director.",
    source: "DuPage County Prevention Leadership Team meeting minutes, February 2025",
    note: `The prevention leadership team meetings are where the county's agencies actually find out what each other are doing, and LARC presented at one of them last year. Coordination is the whole job and it never photographs well.`,
  },
  {
    org: "UIC Department of Disability and Human Development",
    firstName: "Rooshey",
    lastName: "Hasnain",
    title: "Contact, Immigrant and Refugee-Led Capacity Development Network of Illinois (no title published)",
    email: "roosheyh@uic.edu",
    tier2: true,
    source: "https://irlcdn.ahs.uic.edu/, which lists her as the sole contact without stating a title; one is deliberately not invented here",
    note: `The network you're the contact for is funded to build capacity at seventeen community organizations running Illinois Welcoming Centers. Those seventeen are exactly the organizations that field language questions first and have the least money to answer them.`,
  },
  {
    org: "VNA Health Care",
    firstName: "Linnea",
    lastName: "Windel",
    title: "President and Chief Executive Officer",
    email: "communications@vnahealth.com",
    sharedInbox: true,
    hold:
      "Front desk, and VNA Health Care is already written to through Sonny de Rama: communications@vnahealth.com is a press inbox and would be a second letter into the same organization.",
    source: "https://www.vnahealth.com leadership page; VNA publishes no individual executive addresses",
    note: `Fifteen clinics, about ninety thousand patients a year, and more than sixty-eight percent of them Hispanic. That makes VNA the largest community health center in the suburbs and one of the most Spanish-speaking patient populations in the state, and you also run an Illinois Welcoming Center inside it.`,
  },
  {
    org: "VNA Health Care",
    firstName: "Sonny",
    lastName: "de Rama",
    title: "Vice President of Development and Innovation",
    email: "sderama@vnahealth.com",
    tier2: true,
    source: "Published on https://www.dupagefederation.org/ourteam",
    note: `Your name is on VNA Health Care's development side and on the DuPage Federation's team page, so you see both one organization's funding and the county-wide version of the same question. Language access either gets written into a proposal at the start or it waits for the next cycle.`,
  },

  // ═══ HOLD (second wave): real addresses, deliberately not written to ══════
  // Same rule as the first wave. Blanking these would be tidier and it would
  // be a lie. Three sorts of hold appear below: a colleague at the same small
  // organization is already getting the letter; the address is a front desk
  // somebody else is already using; or the address as published looks wrong
  // and should be confirmed by a human before anything is sent to it.

  // SWOP: Jeff Bartow has the org's single letter; the other four staff are
  // held. This comment used to say three of them were getting letters, which
  // was true for about an hour.
  {
    org: "Southwest Organizing Project",
    firstName: "Edy",
    lastName: "Dominguez",
    title: "Community Health and Outreach Coordinator",
    email: "edominguez@swopchicago.org",
    hold: "Three SWOP colleagues are already getting letters.",
    source: "https://swopchicago.org/staff",
    note: `Joined the staff in August 2024 to coordinate community health and outreach on the southwest side.`,
  },
  {
    org: "Southwest Organizing Project",
    firstName: "Priyanka",
    lastName: "Reddy",
    title: "Healthy Chicago Zone Health Organizer",
    email: "preddy@swopchicago.org",
    hold: "One letter per org: SWOP is written to through Jeff Bartow. (This used to name Jessica Biggs, who is herself held — a hold pointing at a held person, which is how an org goes quiet by accident.)",
    source: "https://swopchicago.org/staff",
    note: `Leads Healthy Chicago Zone organizing across thirteen neighborhoods, which is a wider footprint than the name suggests.`,
  },
  {
    org: "Enlace Chicago",
    firstName: "Elizabeth",
    lastName: "Oviedo",
    title: "Promotora de Salud",
    email: "paes@enlacechicago.org",
    hold: "GAP, not a decision. Enlace Chicago receives nothing: both promotoras publish only the shared paes@ program mailbox and the executive director has no published address at all. Little Village has the densest promotora network in the city and this file cannot reach it. Worth a phone call.",
    source: "Enlace Chicago promotores program page",
    note: `A pediatric nurse in Mexico for eighteen years, joined Enlace in 2020, earned her community health worker certificate through Enlace's own Spanish-language program and then started a women's mental health support group.`,
  },
  {
    org: "Centro Romero",
    firstName: "Yordanka",
    lastName: "Brunet",
    title: "Public Benefits Director",
    email: "info@centroromero.org",
    hold: "Same front-desk inbox as Daysi Funes, who is getting the letter.",
    source: "https://www.centroromero.org",
    note: `Runs the Medicaid and Link card assistance that decides whether a family in Rogers Park is insured this year.`,
  },
  {
    org: "Casa Central",
    firstName: "Illeana",
    lastName: "Gomez",
    title: "Vice President, Senior and Community Services",
    email: "info@casacentral.org",
    hold: "Same front-desk inbox as Marty Castro, who is getting the letter.",
    source: "https://www.casacentral.org",
    note: `At Casa Central since 1992, now over the Adult Wellness Center, home care, La Posada interim housing and intact family services. Worth a phone call rather than an email.`,
  },
  {
    org: "Latinos Progresando",
    firstName: "Joe",
    lastName: "Valenzuela",
    title: "Title not verified",
    email: "j.valenzuela@latinospro.org",
    hold: "Published only as a press contact; his role is unconfirmed and the org's shared inbox is already in use.",
    source: "Latinos Progresando press release contact line",
    note: `Real published address, no verifiable title behind it. Confirm before anyone writes.`,
  },
  {
    org: "Corazón Community Services",
    firstName: "Elsie",
    lastName: "Salamanca",
    title: "Programs Manager",
    email: "esalamanca@corazoncs.org",
    hold: "Martin Nava is getting the letter and Corazón is a small organization.",
    source: "https://www.corazoncs.org/our-team",
    note: `Named contact for Civic Heart and Project SELF, and the person who pointed out that most Corazón staff come from the same blocks they serve.`,
  },
  {
    org: "Corazón Community Services",
    firstName: "Nancy Yazmin",
    lastName: "Ibarra",
    title: "Deputy Director",
    email: "nibarra@corazoncs.org",
    hold: "Martin Nava is getting the letter and Corazón is a small organization.",
    source: "https://www.corazoncs.org/our-team",
    note: `Says Corazón was among the first in the area to take on youth sexual health education and workforce readiness together.`,
  },

  // IHCC: two letters are going to that office already. The rest of the team
  // page is recorded here because next year the right person may be different.
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Keila",
    lastName: "Terrazas",
    title: "Cook County Small Business Source",
    email: "kterrazas@ihccbusiness.net",
    hold: "Two IHCC colleagues are already getting letters.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `Delivers business advising and webinars in multiple languages, which is the closest thing on the IHCC team page to what this conference is about.`,
  },
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Silvia",
    lastName: "Bonilla",
    title: "Director, Illinois Small Business Development Center",
    email: "sbonilla@ihccbusiness.net",
    hold: "Two IHCC colleagues are already getting letters.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `Runs the SBDC housed inside the chamber.`,
  },
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Marisa",
    lastName: "Alcantar",
    title: "Western Area office; SBA Community Navigator",
    email: "malcantar@ihccbusiness.net",
    hold: "Two IHCC colleagues are already getting letters.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `Covers the Naperville office, which is where the DuPage side of the chamber's membership actually is.`,
  },
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Marcela",
    lastName: "Cartagena",
    title: "Chief of Staff",
    email: "marcela@ihccbusiness.net",
    hold: "Two IHCC colleagues are already getting letters.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `The person who would decide whether the chamber's leadership goes to anything.`,
  },
  {
    org: "Illinois Hispanic Chamber of Commerce",
    firstName: "Hilda",
    lastName: "Alvarez Rodriguez",
    title: "Special Projects Manager",
    email: "hilda@ihccbusiness.net",
    hold: "Two IHCC colleagues are already getting letters.",
    source: "https://ihccbusiness.net/meet-the-ihcc-team/",
    note: `Special projects at a chamber usually means the things that don't fit anywhere else, which is where a health partnership would land.`,
  },
  {
    org: "Little Village Chamber of Commerce",
    firstName: "Verónica",
    lastName: "Peña",
    title: "Office Manager",
    email: "veronica@littlevillagechamber.org",
    hold: "Blanca Soto is getting the letter and the chamber has a small staff.",
    source: "https://littlevillagechamber.org",
    note: `The 26th Street corridor runs over a thousand businesses and this office is two people deep.`,
  },
  {
    org: "ALPFA Chicago",
    firstName: "Juan Sebastian",
    lastName: "Camacho",
    title: "Chapter President",
    email: "president@chicago.alpfa.org",
    hold: "Role-routed address on a chapter page that still references a 2024 board. Confirm the current president before sending.",
    source: "chicago.alpfa.org board page",
    note: `Latino finance and accounting professionals are a route to the employer side of health coverage that nonprofits can't reach.`,
  },

  // NAHN Illinois: four chapter officers are already getting letters.
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Monica",
    lastName: "Najera",
    title: "Board member",
    email: "mnajera.nahn@gmail.com",
    hold: "Four NAHN Illinois colleagues are already getting letters.",
    source: "NAHN Illinois chapter board listing",
    note: `On the current board; no further published detail found.`,
  },
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Araceli",
    lastName: "Orozco",
    title: "Board member",
    email: "aorozco.nahn@gmail.com",
    hold: "Four NAHN Illinois colleagues are already getting letters.",
    source: "NAHN Illinois chapter board listing",
    note: `On the current board; no further published detail found.`,
  },
  {
    org: "National Association of Hispanic Nurses, Illinois Chapter",
    firstName: "Cynthia",
    lastName: "Gonzalez",
    title: "Board member",
    email: "cynthi221@gmail.com",
    hold: "Four NAHN Illinois colleagues are already getting letters, and this is a personal address with no title attached.",
    source: "NAHN Illinois chapter board listing",
    note: `Listed on the chapter board with a personal address and nothing else published.`,
  },
  {
    org: "SACNAS, Northwestern University chapter",
    firstName: "Toni",
    lastName: "Gutierrez",
    title: "Co-advisor",
    email: "toni.gutierrez@northwestern.edu",
    hold: "Marcelo Vinces co-advises the same chapter and is getting the letter.",
    source: "Northwestern SACNAS chapter page",
    note: `Co-advises the chapter with Vinces; nothing further published about the split of the work.`,
  },
  {
    org: "IC-RACE Lab, The Chicago School",
    firstName: "Hector",
    lastName: "Adames",
    title: "Co-director",
    email: "ICRaceLab@gmail.com",
    hold: "The lab publishes one address for both co-directors and Nayeli Chavez-Dueñas is getting the letter.",
    source: "IC-RACE Lab site",
    note: `Co-authored the HEART framework work on healing ethno-racial trauma in Latinx immigrant communities.`,
  },
  {
    org: "Chicago Lawyers' Committee for Civil Rights",
    firstName: "Kate",
    lastName: "Walz",
    title: "Senior Counsel",
    email: "kwalz@clccrul.org",
    hold: "Three Chicago Lawyers' Committee colleagues are already getting letters.",
    source: "https://www.clccrul.org/staff",
    note: `Joined in March after roughly nineteen years at the Shriver Center, ending as vice president of advocacy.`,
  },
  {
    org: "Legal Council for Health Justice",
    firstName: "Ruth",
    lastName: "Edwards",
    title: "Staff",
    email: "redwards@legalcouncil.org",
    hold: "Liesl Pereira is getting the letter and no distinguishing detail was found for this row.",
    source: "https://legalcouncil.org staff listing",
    note: `Real published address, thin published record. Somebody who knows the organization should decide whether she is the right person.`,
  },
  {
    org: "Legal Council for Health Justice",
    firstName: "Julie",
    lastName: "Justicz",
    title: "Director of Litigation and Advocacy",
    email: "jjusticz@legalcouncil.org",
    hold: "Liesl Pereira at the same organization is getting the letter.",
    source: "https://legalcouncil.org staff listing",
    note: `Litigation is where a language access failure finally becomes visible, usually years after it happened.`,
  },
  {
    org: "Sinai Urban Health Institute",
    firstName: "Bijou",
    lastName: "Hunt",
    title: "Epidemiologist",
    email: "bijou.hunt@sinai.org",
    hold: "Three SUHI colleagues are already getting letters.",
    source: "SUHI staff listing",
    note: `Has published some of the most cited work on Chicago's Black and white mortality gaps.`,
  },
  {
    org: "Sinai Urban Health Institute",
    firstName: "Maureen",
    lastName: "Benjamins",
    title: "Senior Research Fellow",
    email: "Maureen.Benjamins@sinai.org",
    hold: "Three SUHI colleagues are already getting letters.",
    source: "SUHI staff listing",
    note: `Co-leads the big-city mortality comparisons that put Chicago's numbers next to everyone else's.`,
  },

  // CommunityHealth: nobody here is written to. Kevin knows Vickie Chester, so
  // the org is reached by phone and every published staff address below is kept
  // as a record rather than deleted.
  {
    org: "CommunityHealth",
    firstName: "Marzena",
    lastName: "Zagata",
    title: "Staff",
    email: "mzagata@communityhealth.org",
    hold: "CommunityHealth is Kevin's own contact and is not written to cold.",
    source: "https://www.communityhealth.org staff listing",
    note: `CommunityHealth runs in English, Spanish and Polish, and the Polish side of that is the part almost nobody else in the city staffs.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Emily",
    lastName: "Hendel",
    title: "Staff",
    email: "ehendel@communityhealth.org",
    hold: "CommunityHealth is Kevin's own contact and is not written to cold.",
    source: "https://www.communityhealth.org staff listing",
    note: `Published address, no further detail found.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Megan",
    lastName: "Doerr",
    title: "Staff",
    email: "mdoerr@communityhealth.org",
    hold: "CommunityHealth is Kevin's own contact and is not written to cold.",
    source: "https://www.communityhealth.org staff listing",
    note: `Published address, no further detail found.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Gloria",
    lastName: "Alvarez",
    title: "Staff",
    email: "galvarez@communityhealth.org",
    hold: "CommunityHealth is Kevin's own contact and is not written to cold.",
    source: "https://www.communityhealth.org staff listing",
    note: `Published address, no further detail found.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Miriam",
    lastName: "Barger",
    title: "Staff",
    email: "mbarger@communityhealth.org",
    hold: "CommunityHealth is Kevin's own contact and is not written to cold.",
    source: "https://www.communityhealth.org staff listing",
    note: `Published address, no further detail found.`,
  },

  // HACES publishes no individual addresses at all, so every one of these is
  // the same front desk. Alicia Garcia has it.
  {
    org: "HACES",
    firstName: "Beatriz",
    lastName: "Aguilera-Tenorio",
    title: "Program Manager, Immigrant Family Health Resource Program",
    email: "info@haces.org",
    hold: "Same front-desk inbox as Alicia Garcia, who is getting the letter.",
    source: "https://haces.org/our-staff/ and https://haces.org/health/",
    note: `Runs the health program the Healthcare Foundation of Northern Lake County funded in December 2021, doing wellness workshops and one-on-one navigation. On paper the best fit at HACES for this conference, and unreachable except through the front desk.`,
  },
  {
    org: "HACES",
    firstName: "Julián",
    lastName: "López Enriquez",
    title: "Community Relations Manager",
    email: "info@haces.org",
    hold: "Same front-desk inbox as Alicia Garcia, who is getting the letter.",
    source: "https://haces.org/our-staff/",
    note: `Community relations at the organization that handled twenty-one thousand people in a year in Waukegan.`,
  },
  {
    org: "HACES",
    firstName: "Rosa Elena",
    lastName: "Galarza",
    title: "Outreach and Education Coordinator, New Americans Initiative",
    email: "info@haces.org",
    hold: "Same front-desk inbox as Alicia Garcia, who is getting the letter.",
    source: "https://haces.org/our-staff/",
    note: `New Americans Initiative outreach is the first conversation a newly arrived family has with any institution.`,
  },
  {
    org: "HACES",
    firstName: "Ivette",
    lastName: "Martinez",
    title: "Parent Mentor Program Manager",
    email: "info@haces.org",
    hold: "Same front-desk inbox as Alicia Garcia, who is getting the letter.",
    source: "https://haces.org/our-staff/",
    note: `Placed fifty parent mentors across seven Waukegan schools this school year.`,
  },
  {
    org: "DuPage Federation on Human Services Reform",
    firstName: "Michael",
    lastName: "Manson",
    title: "Program Coordinator, Language Access Resource Center",
    email: "mmanson@dupagefederation.org",
    hold: "Four DuPage Federation colleagues are already getting letters.",
    source: "https://www.dupagefederation.org/ourteam",
    note: `Second coordinator on the LARC interpreter pool.`,
  },

  // Centro de Información publishes its whole team. Two are getting letters.
  {
    org: "Centro de Información",
    firstName: "Neomy",
    lastName: "Rojas",
    title: "Director for Programs and Grant Management",
    email: "nrojas@centrodeinformacion.org",
    hold: "Three Centro de Información colleagues are already getting letters.",
    source: "https://centrodeinformacion.org/about",
    note: `Holds both programs and grant management, which means she knows which services are funded past this year.`,
  },
  {
    org: "Centro de Información",
    firstName: "Julia",
    lastName: "Perez",
    title: "Director of Operations and Community Relations",
    email: "jperez@centrodeinformacion.org",
    hold: "Three Centro de Información colleagues are already getting letters.",
    source: "https://centrodeinformacion.org/about",
    note: `Operations across three offices in three towns.`,
  },
  {
    org: "Centro de Información",
    firstName: "Israel",
    lastName: "Vargas",
    title: "Public Benefits Manager",
    email: "ivargas@centrodeinformacion.org",
    hold: "Three Centro de Información colleagues are already getting letters.",
    source: "https://centrodeinformacion.org/about",
    note: `Public benefits enrollment in the Fox Valley, where the forms arrive in English regardless.`,
  },
  {
    org: "Centro de Información",
    firstName: "Amairani",
    lastName: "Jarvis",
    title: "Community Organizer",
    email: "ajarvis@centrodeinformacion.org",
    hold: "Three Centro de Información colleagues are already getting letters.",
    source: "https://centrodeinformacion.org/about",
    note: `Organizing across Elgin, Carpentersville and Hanover Park.`,
  },
  {
    org: "Centro de Información",
    firstName: "David",
    lastName: "Jimenez",
    title: "Communications Manager",
    email: "djimenez@centrodeinformacion.org",
    hold: "Three Centro de Información colleagues are already getting letters.",
    source: "https://centrodeinformacion.org/about",
    note: `Communications for an agency whose audience reads in two languages.`,
  },

  // Mano a Mano: Dulce Ortiz and Diana Gutierrez are getting letters. Note
  // that every mailto link on the Mano a Mano team page points at Dulce Ortiz
  // because of a copy-paste error; these come from the displayed text instead.
  {
    org: "Mano a Mano Family Resource Center",
    firstName: "Irma",
    lastName: "Barrientos",
    title: "Programs Manager, Healthy Families and Successful Children",
    email: "ibarrientos@mamfrc.org",
    hold: "Two Mano a Mano colleagues are already getting letters.",
    source: "mamfrc.org leadership listing (archived January 2025)",
    note: `Runs the two programs where Mano a Mano sees families with young children.`,
  },
  {
    org: "Mano a Mano Family Resource Center",
    firstName: "Eric",
    lastName: "Yanez",
    title: "Community Engagement Manager",
    email: "eyanez@mamfrc.org",
    hold: "Two Mano a Mano colleagues are already getting letters.",
    source: "mamfrc.org leadership listing (archived January 2025)",
    note: `Started in 2018 as a GED volunteer, became a community health worker, and became the organization's first community engagement manager in 2022. Born in Guanajuato.`,
  },
  {
    org: "Mano a Mano Family Resource Center",
    firstName: "Jorge",
    lastName: "Sanchez",
    title: "Programs Manager, Productive Parents",
    email: "jsanchez@mamfrc.org",
    hold: "Two Mano a Mano colleagues are already getting letters.",
    source: "mamfrc.org leadership listing (archived January 2025)",
    note: `Adult education and workforce for parents in Round Lake and Waukegan.`,
  },
  {
    org: "Cass County Health Department",
    firstName: "Olidia",
    lastName: "Montoya",
    title: "Community Health Worker",
    email: "omontoya@casscohealth.org",
    hold: "Two Cass County colleagues are already getting letters and it is a small department.",
    source: "https://casscohealth.org community health worker listing",
    note: `One of three named community health workers covering a rural county with Spanish, French, Creole and Burmese speakers in it.`,
  },
  {
    org: "Cass County Health Department",
    firstName: "Nataley",
    lastName: "Minor",
    title: "Community Health Worker",
    email: "nminor@casscohealth.org",
    hold: "Two Cass County colleagues are already getting letters and it is a small department.",
    source: "https://casscohealth.org community health worker listing",
    note: `Same three-person team in Beardstown.`,
  },

  // ── Addresses that look wrong as published. Do not silently correct them ──
  {
    org: "Town of Cicero, Citizenship Department",
    firstName: "George",
    lastName: "Navia",
    title: "Assistant Citizenship Director",
    email: "jnavia@thetownofcicero.com",
    hold: "The published local part starts with j, which does not match his first name. Confirm by phone before sending. Arcadio Delgado in the same department is getting the letter.",
    source: "https://www.thetownofcicero.com/citizenship/",
    note: `Second in the citizenship office that publishes translation as a free service.`,
  },
  {
    org: "Illinois Migrant Council",
    firstName: "Esperanza",
    lastName: "Gonzalez",
    title: "Vice President",
    email: "evelasquez@illinoismigrant.org",
    hold: "The published local part is evelasquez, which does not match her surname. Confirm before sending. Two IMC colleagues are already getting letters.",
    source: "https://illinoismigrant.org/staff",
    note: `Recorded exactly as published, mismatch and all, because guessing at the corrected version is how invented addresses get into a list like this.`,
  },
  {
    org: "ACCESS Community Health Network",
    firstName: "Dara",
    lastName: "Basley",
    title: "Director of Health Equity",
    email: "tdara.basley@achn.net",
    hold: "The leading t looks like a typo on the publishing page. Confirm before sending.",
    source: "Third-party conference listing; ACCESS itself publishes no individual staff addresses",
    note: `Health equity director at one of the largest FQHC networks in the country, and the only route to her found anywhere is an address that appears to be mistyped.`,
  },
  {
    org: "Nuestra Familia Cicero, Family Focus",
    firstName: "Jennifer",
    lastName: "Jimenez",
    title: "Case Manager",
    email: "jennifer.jimenez@family-focus.org",
    hold: "Found only on an archived committee page; family-focus.org blocks automated access and the role could not be confirmed.",
    source: "Cicero Community Collaborative welcoming committee page (archived)",
    note: `Low confidence on all of it. Confirm the person and the role before anything is sent.`,
  },

  // Two people whose organizations are already receiving a letter from someone
  // else on this list. Carried over from the first research pass.
  {
    org: "the Illinois Chapter of the AAP",
    firstName: "Jennie",
    lastName: "Pinkwater",
    title: "Executive Director",
    email: "jpinkwater@illinoisaap.com",
    hold: "Abby Creek at ICAAP is getting the letter.",
    source: "https://illinoisaap.org/about-2/",
    note: `Runs the chapter that publishes the bilingual interpretation flyer for pediatric practices.`,
  },
  {
    org: "Illinois Public Health Association",
    firstName: "Tom",
    lastName: "Hughes",
    title: "Executive Director",
    email: "thughes@ipha.com",
    hold: "Tracey Smith at IPHA is getting the letter.",
    source: "https://ipha.com staff listing",
    note: `IPHA is where the local health departments that have no language access budget compare notes about not having one.`,
  },
  {
    org: "Illinois Courts",
    firstName: "Alison",
    lastName: "Spanner",
    title: "Access to Justice division",
    email: "aspanner@illinoiscourts.gov",
    hold: "Two colleagues in the same small Administrative Office division are already getting letters.",
    source: "Illinois Courts Access to Justice division listing",
    note: `Third person from one division of the Administrative Office; the court system is already represented.`,
  },

  // ═══ LEADS (second wave): real, researched, no published address ══════════
  // Skipped by the loader. A striking number of the largest immigrant-serving
  // organizations in Illinois publish no individual staff address at all: The
  // Resurrection Project, Legal Aid Chicago, ICIRR, NIJC, HACIA, HACE, the
  // USHCC, Instituto, El Valor and the Pilsen Chamber are all on that list.
  // Every one of these people is reachable by phone by someone willing to make
  // the call, and none of them should be reached by a guessed address.
  {
    org: "Brighton Park Neighborhood Council",
    firstName: "Carmen",
    lastName: "Barragan",
    title: "Community Health Organizer Manager",
    email: "",
    source: "BPNC promotoras de salud program page",
    note: `BPNC's promotoras started about twelve years ago from mothers at their own kids' schools and there are six of them working year round now. Her line about community members seeing themselves in the promotoras is the entire argument for the model.`,
  },
  {
    org: "Enlace Chicago",
    firstName: "Marcela",
    lastName: "Rodriguez",
    title: "Executive Director (title from IRS filings, not confirmed on the org's own site)",
    email: "",
    source: "IRS Form 990 filing; enlacechicago.org does not publish a leadership page",
    note: `Little Village has more than a hundred and fifty promotorxs de salud working in it, which is probably the densest community health worker network in the city.`,
  },
  {
    org: "Instituto del Progreso Latino",
    firstName: "Karina",
    lastName: "Ayala-Bermejo",
    title: "President and Chief Executive Officer",
    email: "",
    source: "institutochicago.org leadership page",
    note: `The Instituto College of Nursing has put its first five cohorts through with a hundred percent NCLEX pass rate, which nobody expects from a community-based nursing school. Those graduates are bilingual nurses entering Chicago hospitals right now.`,
  },
  {
    org: "The Resurrection Project",
    firstName: "Eréndira",
    lastName: "Rendón",
    title: "Chief Program Officer",
    email: "",
    source: "resurrectionproject.org staff directory; the 2024 Ohtli Award announcement gives her title as VP of Immigrant Justice",
    note: `Won healthcare coverage for undocumented seniors and then adults in Illinois, which is the single biggest change to who can get care in this state in a decade. Also driver's licenses, the Chicago Legal Protection Fund and the Cook County Public Defender's immigration division.`,
  },
  {
    org: "The Resurrection Project",
    firstName: "Raul",
    lastName: "Raymundo",
    title: "Chief Executive Officer and co-founder",
    email: "",
    source: "resurrectionproject.org leadership page",
    note: `Opened a CommunityHealth microsite clinic inside Casa Hidalgo in Back of the Yards, which puts free care inside a building people already trusted.`,
  },
  {
    org: "El Valor",
    firstName: "Rey",
    lastName: "Gonzalez",
    title: "President and Chief Executive Officer",
    email: "",
    source: "elvalor.org leadership page",
    note: `El Valor was started in 1973 by Guadalupe Reyes in her own home because there was nowhere for her son with disabilities to go. It now serves four thousand people on a twenty-nine million dollar budget, and he chaired the board for thirty-two years before running it.`,
  },
  {
    org: "Little Village Chamber of Commerce",
    firstName: "Jennifer",
    lastName: "Aguilar",
    title: "Executive Director",
    email: "",
    source: "littlevillagechamber.org; only a general info address is published",
    note: `Runs the chamber that hosts a community health and resource fair on 26th Street.`,
  },
  {
    org: "HACIA",
    firstName: "Jacqueline",
    lastName: "Gomez",
    title: "Executive Director",
    email: "",
    source: "hacia.org leadership page; HACIA publishes no staff addresses",
    note: `Thirteen training programs including a clean energy contractor incubator, from an association founded in 1979. Construction is where language and safety meet hardest.`,
  },
  {
    org: "HACIA",
    firstName: "Ivette",
    lastName: "Treviño",
    title: "Director of Strategic Partnerships",
    email: "",
    source: "hacia.org staff page; no addresses published",
    note: `Ran the Little Village Chamber before this, so she knows a business corridor with over a thousand businesses, nine hundred million dollars of activity and eighty-five thousand residents from the inside.`,
  },
  {
    org: "HACIA",
    firstName: "Alma",
    lastName: "Tello",
    title: "Senior Director",
    email: "",
    source: "hacia.org staff page; no addresses published",
    note: `Was deputy director of the state's Office of Minority Economic Empowerment, which is where the money for this kind of work gets decided.`,
  },
  {
    org: "HACIA",
    firstName: "Sarah",
    lastName: "Reese",
    title: "Programs Director",
    email: "",
    source: "hacia.org staff page; no addresses published",
    note: `Programs director over the training side, where apprentices arrive with varying English and identical safety exposure.`,
  },
  {
    org: "HACIA",
    firstName: "Leah",
    lastName: "Goldbloom",
    title: "Workforce Program Manager",
    email: "",
    source: "hacia.org staff page; no addresses published. Their bio gives their pronouns as they/them.",
    note: `Workforce programs are where a trainee's language gets treated either as a barrier to fix or as an asset to deploy, and the choice is usually made by whoever runs the program.`,
  },
  {
    org: "HACE",
    firstName: "Patricia",
    lastName: "Mota",
    title: "President and Chief Executive Officer",
    email: "",
    source: "hace.org leadership page; no staff addresses published",
    note: `Grew partnerships by a million and a half in her first year and took Mujeres de HACE from one city to eight.`,
  },
  {
    org: "Pilsen Chamber of Commerce",
    firstName: "Pedro",
    lastName: "Guerra",
    title: "Executive Director",
    email: "",
    source: "Pilsen Chamber of Commerce site; no staff addresses published",
    note: `Co-founded BTEC and now runs the chamber for a neighborhood whose small businesses are often the only Spanish-speaking institution on the block.`,
  },
  {
    org: "United States Hispanic Chamber of Commerce",
    firstName: "Ramiro",
    lastName: "Cavazos",
    title: "President and Chief Executive Officer",
    email: "",
    source: "ushcc.com leadership page; no staff addresses published",
    note: `Speaks for more than two hundred and sixty chambers nationally. Employer-sponsored coverage for Hispanic-owned small businesses is the health story nobody assigns to a chamber.`,
  },
  {
    org: "United States Hispanic Chamber of Commerce",
    firstName: "Fernando",
    lastName: "Meersohn",
    title: "Director of Chamber Relations",
    email: "",
    source: "ushcc.com staff page; no addresses published",
    note: `Owns the relationship with those two hundred and sixty local chambers, which makes him the shortest path from one conversation to all of them.`,
  },
  {
    org: "MOLA",
    firstName: "Jonathan",
    lastName: "Moreira",
    title: "President",
    email: "",
    source: "molaonline.org leadership page; no addresses published",
    note: `Senior author on work showing thirty-six month post-transplant survival of 49.2 percent for Hispanic patients, the lowest of any group. That number should be a scandal and instead it's a citation.`,
  },
  {
    org: "National Hispanic Medical Association, Chicago Chapter",
    firstName: "Emma",
    lastName: "Olivera",
    title: "Chapter Co-Chair",
    email: "",
    source: "NHMA chapter listing; no addresses published",
    note: `Chicago chapter co-chair of the national Hispanic physicians' association, which is the group most often asked to interpret for colleagues.`,
  },
  {
    org: "Legal Aid Chicago",
    firstName: "Lisa",
    lastName: "Palumbo",
    title: "Director, Immigration and Workers' Rights",
    email: "",
    source: "legalaidchicago.org staff page; no addresses published",
    note: `Twenty-five years there, fluent Spanish, has argued in the Seventh Circuit, and her group holds the state's migrant farmworker law practice. That last piece exists in almost no other legal aid office in the country.`,
  },
  {
    org: "Legal Aid Chicago",
    firstName: "Amina",
    lastName: "Najib",
    title: "Associate Director, Immigration and Workers' Rights",
    email: "",
    source: "legalaidchicago.org staff page; no addresses published",
    note: `Fluent in Spanish and Arabic, previously at NIJC.`,
  },
  {
    org: "ICIRR",
    firstName: "Lawrence",
    lastName: "Benito",
    title: "Executive Director",
    email: "",
    source: "icirr.org contact page publishes three role-routed addresses and no staff directory",
    note: `Celebrated forty million dollars for public benefits outreach and interpretation services in last June's end-of-session statement. ICIRR publishes its healthcare access materials in English, Spanish, Polish, Korean, Chinese and Arabic, which is six more languages than most state agencies manage.`,
  },
  {
    org: "ICIRR",
    firstName: "Luvia",
    lastName: "Quiñones",
    title: "Health Policy Director",
    email: "",
    source: "Referenced in ICIRR materials on the Immigrant Health Care Access Initiative; no address and no 2026 confirmation found",
    note: `On paper the single best-matched person in Illinois for this conference, and ICIRR publishes no way to reach her. Worth a phone call to the main line.`,
  },
  {
    org: "National Immigrant Justice Center",
    firstName: "Mary Meg",
    lastName: "McCarthy",
    title: "Executive Director",
    email: "",
    source: "immigrantjustice.org leadership page; no addresses published",
    note: `NIJC's clients are in detention or in removal proceedings, where a language failure is not an inconvenience.`,
  },
  {
    org: "National Immigrant Justice Center",
    firstName: "Lisa",
    lastName: "Koop",
    title: "Associate Director of Legal Services",
    email: "",
    source: "immigrantjustice.org leadership page; no addresses published",
    note: `Runs the legal services side, where interpretation quality is evidence.`,
  },
  {
    org: "Greater Chicago Legal Clinic",
    firstName: "Adam",
    lastName: "Salzman",
    title: "Executive Director",
    email: "",
    source: "gclclaw.org; no staff addresses published",
    note: `Started in 1981 as the South Chicago Legal Clinic for workers laid off by the steel mills, and its attorneys are described as accessible to clients regardless of their English. That description is forty years old and still unusual.`,
  },
  {
    org: "The Immigration Project",
    firstName: "Charlotte",
    lastName: "Alvarez",
    title: "Executive Director",
    email: "",
    source: "immigrationproject.org; no staff addresses published",
    note: `Covers eighty-six Illinois counties, which is most of the state and almost none of the attention.`,
  },
  {
    org: "MALDEF",
    firstName: "Susana",
    lastName: "Sandoval Vargas",
    title: "Interim Regional Counsel, Midwest",
    email: "",
    source: "maldef.org staff listing; no addresses published",
    note: `Eleven states out of the Chicago office.`,
  },
  {
    org: "ACLU of Illinois",
    firstName: "Khadine",
    lastName: "Bennett",
    title: "Director of Advocacy and Intergovernmental Affairs",
    email: "",
    source: "aclu-il.org staff page; no addresses published",
    note: `The person who takes the Springfield side of anything the ACLU wants changed in Illinois law.`,
  },
  {
    org: "CommunityHealth",
    firstName: "Stephanie",
    lastName: "Willding",
    title: "Chief Executive Officer",
    email: "",
    source: "communityhealth.org leadership page; her address is not published although staff addresses are",
    note: `Runs the largest free clinic in the country on volunteer clinicians, in three languages.`,
  },
  {
    org: "Tapestry 360 Health",
    firstName: "Emily",
    lastName: "Rivera",
    title: "Director of Refugee Health",
    email: "",
    source: "tapestry360health.org; no staff addresses published",
    note: `Said about a third of her patients are best served in a language other than English. Her program has been contracted by the state since January 2022 to do health screenings for Afghan arrivals, alongside Heartland and HIAS.`,
  },
  {
    org: "Sinai Urban Health Institute",
    firstName: "Rachel",
    lastName: "Morris",
    title: "Director, CROWD",
    email: "",
    source: "sinaichicago.org; her address is not published although several SUHI colleagues' are",
    note: `Runs the community health worker training center that certified more than half of Loyola's CHW team.`,
  },
  {
    org: "Spanish Community Center",
    firstName: "Lorena",
    lastName: "Penaloza",
    title: "Interim Executive Director (status may have changed)",
    email: "",
    source: "spanishcenter.org; the interim designation may be out of date",
    note: `Her agency runs the only family advocacy center in Will and Kankakee counties.`,
  },
  {
    org: "Onward Neighborhood House",
    firstName: "Gerbis",
    lastName: "Badell",
    title: "Director of Community Services",
    email: "",
    source: "onwardhouse.org staff page; the organization publishes no addresses",
    note: `Oversees an Illinois Welcoming Center staffed by a coordinator and five case managers, which is a bigger welcoming center team than most agencies have.`,
  },
  {
    org: "Community Health Partnership of Illinois",
    firstName: "Eleace",
    lastName: "Sawyers",
    title: "President and Chief Executive Officer",
    email: "",
    source: "chpofil.org (archived December 2025); the live site blocks automated access",
    note: `Seven health center sites across more than seven counties, and a national migrant health public service award in 2022.`,
  },
  {
    org: "Cicero Family Service",
    firstName: "Katherine",
    lastName: "Bartholomew",
    title: "Directora Ejecutiva",
    email: "",
    source: "cicerofs.org; no staff addresses published",
    note: `Bilingual, twenty years in community mental health, running the agency since 2019 in a town that is ninety-one percent Latino.`,
  },
  {
    org: "Cicero Family Service",
    firstName: "Mauricio",
    lastName: "Cifuentes",
    title: "Director de Programas",
    email: "",
    source: "cicerofs.org; no staff addresses published",
    note: `A law degree from Universidad Javeriana in Bogotá and a social work doctorate from Loyola, now on the state's Behavioral Health Workforce Advisory Council. That council is deciding who counts as qualified, which is where the bilingual workforce question gets settled.`,
  },
  {
    org: "Will County Health Department",
    firstName: "Elizabeth",
    lastName: "Bilotta",
    title: "Executive Director",
    email: "",
    source: "willcountyhealth.org; only a general info address is published",
    note: `Her outreach staff filed 2,986 Medicaid and marketplace applications in 2025 across sixty-six events. WIC alone serves about 8,500 participants a month in Joliet, Bolingbrook and Monee.`,
  },
  {
    org: "Greater Family Health",
    firstName: "Lupe",
    lastName: "Fonseca",
    title: "Chief Executive Officer",
    email: "",
    source: "greaterfamilyhealth.org; no staff addresses published",
    note: `An FQHC covering fifty-four municipalities that publishes its site in English, Spanish, Hindi, Russian, Arabic and traditional Chinese. That language list is a statement about who they expect through the door.`,
  },
  {
    org: "Erie HealthReach Waukegan",
    firstName: "Shemenia",
    lastName: "Ladd",
    title: "Director of Health Center Operations",
    email: "",
    source: "eriefamilyhealth.org; Erie publishes no staff addresses",
    note: `Erie publishes its site in English, Mexican Spanish and Arabic and sees more than eighty-two thousand patients across thirteen sites. The Waukegan location is the one furthest from everything else.`,
  },
  {
    org: "Mano a Mano Family Resource Center",
    firstName: "Andrea",
    lastName: "Barba",
    title: "Community Health Worker",
    email: "",
    source: "Chicago Tribune coverage of the TIERRA program, April 2026",
    note: `Runs nine-week forest therapy groups of six to ten people, mostly Latino families, and said the thing that mattered was that they built a community in the group.`,
  },
  {
    org: "Cicero Community Collaborative",
    firstName: "Janette",
    lastName: "Andrade",
    title: "Community Outreach Coordinator and Parent Ambassador Liaison",
    email: "",
    source: "cicerocommunitycollaborative.org (archived); the live site is down",
    note: `Parent ambassadors are the layer between a collaborative of sixty organizations and an actual household.`,
  },
  {
    org: "PASO, West Suburban Action Project",
    firstName: "Marien",
    lastName: "Casillas Pabellon",
    title: "Executive Director",
    email: "",
    source: "Named in Loyola Medicine's 2025 community health needs assessment; pasoaction.org is a parked domain with no working capture since December 2022",
    note: `Named as a community partner in Loyola's own CHNA for Melrose Park, and there is no longer any website behind the organization. Real people, no reachable address.`,
  },
  {
    org: "Healthy Communities Foundation",
    firstName: "Maria",
    lastName: "Pesqueira",
    title: "President and Chief Executive Officer",
    email: "",
    source: "healthycommunitiesfoundation.org; no staff addresses published",
    note: `Ran Mujeres Latinas en Acción before this, so she has been on both sides of the grant.`,
  },
  {
    org: "Polk Bros Foundation",
    firstName: "Divya",
    lastName: "Mohan Little",
    title: "Program Officer",
    email: "",
    source: "polkbrosfdn.org; no staff addresses published",
    note: `Polk Bros is transitioning away from its health strategy through the autumn, so anyone approaching them on health framing is working from a map that is about to be out of date.`,
  },

  // ─── Language communities that are not Spanish ─────────────────────────────
  // This section exists because the rest of the file kept proving a point it
  // did not mean to make: language access in Chicago is written about as though
  // it means Spanish, and then stops. These organisations serve Polish, Khmer,
  // Assyrian Neo-Aramaic, Korean, Urdu, Gujarati, Bengali, Arabic, Tagalog,
  // Toishanese, Burmese and Karen speakers, and most of them publish no staff
  // addresses at all, so this section is mostly leads rather than letters.
  // That imbalance is itself the finding: the smaller the language community,
  // the harder it is to reach the people serving it, in exactly the way it is
  // hard for a hospital to reach them.
  {
    org: "Indo-American Center",
    firstName: "Farhat",
    lastName: "Khatoon",
    title: "Community Health Worker",
    email: "fkhatoon@indoamerican.org",
    source: "https://indoamerican.org/about-us/staff",
    note: `Interpreter vendors treat Hindi, Urdu, Gujarati and Punjabi as more or less interchangeable, and a Gujarati speaker handed a Hindi interpreter will usually go along with it rather than make a fuss in a clinic. You do the accompaniment and the follow-up afterward, which means you are one of the few people who finds out what was actually understood. The distance between what a chart records as interpreted and what the patient walked out knowing is most of what we want to spend two days on.`,
  },
  {
    org: "Indo-American Center",
    firstName: "Bhakti",
    lastName: "Vasani",
    title: "Public Benefits Case Manager",
    email: "bvasani@indoamerican.org",
    source: "https://indoamerican.org/about-us/staff",
    note: `Medicaid redetermination notices go out in a short list of languages, and Gujarati is generally not one of them on the assumption that a Gujarati speaker reads Hindi. The coverage gap that follows turns up months later at a clinic with no idea why the person went uninsured. Most of the people coming to this are on the clinical end of that sequence and very few are on the paperwork end, which is the wrong balance.`,
  },
  {
    org: "Assyrian National Council of Illinois",
    firstName: "Shoshan",
    lastName: "Sarkis",
    title: "Assistant Director",
    email: "shoshan@ancil.org",
    source: "https://ancil.org/contact",
    note: `Chicagoland has one of the largest Assyrian populations anywhere and close to no trained medical interpreter capacity in Neo-Aramaic, so clinical conversations tend to route through whichever relative came along, often a young one. ANCIL running home care puts you nearest the elders least likely to have any English at all. What a hospital actually does when it has nothing at all for a language is the part no procedure manual covers.`,
  },
  {
    org: "Assyrian National Council of Illinois",
    firstName: "Fadia",
    lastName: "",
    title: "Intake (ANCIL publishes staff surnames only as an initial, so the full name is not available)",
    email: "fmarogail@ancil.org",
    hold:
      "One letter per employer, and ANCIL is small enough that the whole office would compare them. Shoshan Sarkis is the one written to. Worth noting the loss: intake is the better seat for this and we are writing to the assistant director instead, because a letter that opens without a surname to a person whose full name we could not establish is a worse first contact than one to a colleague.",
    source: "https://ancil.org/contact",
    note: `Intake is where somebody first says what they need, in Neo-Aramaic, before it gets sorted into whatever box a form allows.`,
  },
  {
    org: "Hanul Family Alliance",
    firstName: "Nayeon",
    lastName: "Yang",
    title: "Nutrition Program Manager, Chicago",
    email: "nyang@hanulusa.org",
    source: "https://hanulusa.org/what-we-do/senior-services",
    note: `A congregate meal site sees the same older adults every week, which is more contact than any clinic gets, and it makes the staff there the first to notice when something is going wrong medically. The Kedzie site skews lower income and more likely to be on Medicaid than the suburban ones. What an elder says about a doctor's visit a week afterward is usually more accurate than what they said in the room.`,
  },
  {
    org: "Hanul Family Alliance",
    firstName: "Miran",
    lastName: "Lee",
    title: "Nutrition Program Manager, Mt. Prospect",
    email: "mlee@hanulusa.org",
    hold: "Same program and same job title as Nayeon Yang, one site apart. Two identical roles at one organisation is the clearest case there is for sending one letter.",
    source: "https://hanulusa.org/what-we-do/senior-services",
    note: `Runs the suburban end of a program feeding several hundred Korean older adults, which is a different population from the Chicago site — more settled, further from any clinic with Korean capacity.`,
  },
  {
    org: "Indo-American Center",
    firstName: "Fahmida",
    lastName: "Begum",
    title: "Public Health Coordinator",
    email: "fbegum@indoamerican.org",
    hold: "Same health team as Farhat Khatoon, who is written to.",
    source: "https://indoamerican.org/about-us/staff",
    note: `Rohingya families on the north side get logged as Bengali speakers routinely, which is the more consequential kind of mistake because it looks like a match on paper.`,
  },
  {
    org: "Indo-American Center",
    firstName: "Umer",
    lastName: "Jabin",
    title: "Public Health Coordinator",
    email: "ujabin@indoamerican.org",
    hold: "Same health team and same job title as Fahmida Begum, and the team is already reached through Farhat Khatoon.",
    source: "https://indoamerican.org/about-us/staff",
    note: `Runs health sessions near Devon where the room needs three or four South Asian languages at once and the funder's materials exist in one.`,
  },
  {
    org: "Indo-American Center",
    firstName: "Salek",
    lastName: "Khalid",
    title: "Community Navigator Program Coordinator",
    email: "skhalid@indoamerican.org",
    hold: "Same organisation and adjacent to the health team already reached through Farhat Khatoon.",
    source: "https://indoamerican.org/about-us/staff",
    note: `Navigator work is where a language failure gets caught, which is almost always after the appointment rather than during it.`,
  },
  {
    org: "Indo-American Center",
    firstName: "Shaista",
    lastName: "Siddiqui",
    title: "Golden Diner Program Coordinator",
    email: "sshaista@indoamerican.org",
    hold: "Two letters into Indo-American Center is already the ceiling for an organisation this size; Farhat Khatoon and Bhakti Vasani are the two.",
    source: "https://indoamerican.org/about-us/staff",
    note: `Sees the same South Asian elders weekly at the congregate meal, which is more regular contact than any clinic in their lives manages.`,
  },
  // ─── EMS, trauma and prehospital care ─────────────────────────────────────
  // The furthest desk from this field that the field completely depends on.
  // Nobody below has ever filed a document with "language access" in the title.
  // What they have is a clock: on-scene time, triage accuracy, and a history
  // that has to come from somewhere before a decision gets made. When the
  // patient can't answer, that cost lands on them first and gets coded as
  // something else. Every one of these is a different hospital or department,
  // so the per-employer rule is satisfied by construction rather than by
  // cutting people.
  // CURRENCY WARNING on the trauma coordinators: five rows below come from the
  // Illinois Trauma Coordinators' Directory revised 06/06/2023. Three years is
  // long enough for a role to turn over. The addresses are real and published;
  // the titles may not be current, which is why each note is written so it
  // still makes sense if the person has moved on.
  {
    org: "Northwest Community EMS System (Endeavor Health)",
    firstName: "Kourtney",
    lastName: "Chesney",
    title: "EMS System Coordinator",
    email: "kourtney.chesney@endeavorhealth.org",
    source:
      "https://www.nwcemss.org/assets/1/documents/2026_NWC_EMSS_Directory_01-05.pdf (system directory dated 5 January 2026, email printed beside her name)",
    note: `Here's the thing I can't get anyone to answer. When a crew burns four extra minutes on scene because they can't get a history, does that show up in your run review as anything at all, or does it just look like a slow call? You'd know. I'm putting together a conference on language access in pediatric care and almost everyone coming works in a building, not a driveway, which is most of why I'm writing to you.`,
  },
  {
    org: "Northwest Community EMS System (Endeavor Health)",
    firstName: "Nichole",
    lastName: "Junge",
    title: "EMS Educator",
    email: "nichole.junge@endeavorhealth.org",
    tier2: true,
    source:
      "https://www.nwcemss.org/assets/1/documents/2026_NWC_EMSS_Directory_01-05.pdf (system directory dated 5 January 2026)",
    note: `Whatever goes into your lesson plans ends up on scene across a lot of northwest suburban towns, which is a wider blast radius than most curriculum jobs have. I'm curious whether patient assessment gets taught with the assumption that the patient answers you. If you've ever used a case in class where that fell apart, I'd like to hear it, and I'd like our audience to hear it more.`,
  },
  {
    org: "Loyola University Medical Center EMS System",
    firstName: "Marlo",
    lastName: "Jorgenson",
    title: "ECRN Coordinator / EMS Instructor",
    email: "Marlo.Jorgenson@luhs.org",
    source: "https://www.loyolamedicine.org/ems/staff",
    note: `ECRNs give orders off a picture somebody else built over a radio. If the crew couldn't get a history, you're the next person the problem lands on and you still have to decide. That's a failure mode I've never seen written up anywhere, and it's the one I'd most like on our agenda.`,
  },
  {
    org: "Loyola University Medical Center EMS System",
    firstName: "Joshua",
    lastName: "Hintz",
    title: "Paramedic Program Coordinator, NREMT Course Coordinator",
    email: "Joshua.Hintz@luhs.org",
    source: "https://www.loyolamedicine.org/ems/staff",
    note: `You're training people to a national registry standard while they do clinicals in Maywood and the towns around it. The exam rewards a clean, fast history and those streets don't always hand you one. I'd genuinely like to know whether you prepare students for that on purpose or whether they find out in the field.`,
  },
  {
    org: "Cook County Health — Chicago West EMS System (Stroger)",
    firstName: "Matt",
    lastName: "Strzalka",
    title: "EMS Educator",
    email: "mstrzalka@cookcountyhhs.org",
    source: "https://chicagoems.org/resource-hospitals/",
    note: `Your system covers the West Side, so your crews walk into households where the patient, the family and whoever called 911 may each be working in a different language. You're the one who has to turn that into something teachable. What do you tell a new medic to do in the first sixty seconds? I'd like to put that answer in front of a room of pediatricians who have never had to give one.`,
  },
  {
    org: "Advocate Illinois Masonic — Chicago North EMS System",
    firstName: "Rachel",
    lastName: "Thornburg",
    title: "EMS Operations Coordinator",
    email: "Rachel.Thornburg@aah.org",
    source: "https://chicagoems.org/resource-hospitals/",
    note: `Chicago North covers a stretch where the household language changes street to street. My suspicion is that the friction from that is real and measured nowhere, because it doesn't have a field to go in. If I'm wrong I'd like to be told so before I say it out loud at a conference in front of three hundred people.`,
  },
  {
    org: "UChicago Medicine — Chicago South EMS System",
    firstName: "Cyd",
    lastName: "Gajewski",
    title: "EMS System Coordinator",
    email: "cynthia.gajewski@uchicagomedicine.org",
    source: "https://chicagoems.org/resource-hospitals/",
    note: `Where I keep getting stuck is the handoff. What the crew couldn't establish on scene becomes what the ED doesn't know on arrival, and I can't tell from outside whether that gap gets closed in practice or just gets absorbed. You run one set of protocols across a very varied South Side catchment, so you'd know how often it happens.`,
  },
  {
    org: "Northwestern Memorial — Chicago Central EMS System",
    firstName: "Patti",
    lastName: "Lindeman",
    title: "EMS System Coordinator",
    email: "plindema@nm.org",
    source: "https://chicagoems.org/resource-hospitals/",
    note: `Chicago Central takes in downtown, which means a real share of your patients are people nobody on scene knows, who can't say where they're from and have nobody with them who can. That's a triage accuracy problem before it's a language problem. How does your system handle an unaccompanied patient who can't give a history?`,
  },
  {
    org: "Mount Prospect Fire Department",
    firstName: "Tina",
    lastName: "Hayes",
    title: "RN, Paramedic; alternate, NWC EMS System Education Committee",
    email: "thayes@mountprospect.org",
    tier2: true,
    source:
      "https://www.nwcemss.org — Advisory Board membership list, May 2024, Education Committee section. TITLE CAVEAT: her formal departmental title at the fire department is not published; what is published is her credentials and her committee seat, and the title field says only that.",
    note: `Sitting on the education committee as a working field provider puts you on both sides of the gap I'm interested in — what gets taught, and what actually happens at two in the morning. When a crew can't get a history from the patient, does the current training tell them what to do next, or does everyone improvise it fresh every time?`,
  },
  {
    org: "Illinois Department of Public Health, Division of EMS",
    firstName: "Danielle",
    lastName: "Albinger",
    title: "Region 9 EMS Coordinator, BSN, RN",
    email: "Danielle.albinger@illinois.gov",
    source:
      "https://www.nwcemss.org — Advisory Board membership list, May 2024, listing her IDPH title and the West Chicago office at 245 W Roosevelt Rd (DuPage County) beside this address.",
    note: `Region 9 takes in Elgin and Aurora, and you're the person the system plans get submitted to. Narrow question: does anything in any of those plans address a patient who can't answer assessment questions? If the answer is no, has anyone ever raised it with you? I'd rather know that than guess at it from the outside.`,
  },
  {
    org: "Ascension Resurrection Medical Center",
    firstName: "Virginia",
    lastName: "Logan",
    title: "EMS Coordinator",
    email: "Virginia.logan@ascension.org",
    tier2: true,
    source:
      "https://www.nwcemss.org — Advisory Board membership list, May 2024, listed as EMS Coordinator, Ascension Resurrection.",
    note: `Resurrection sits in a part of the Northwest Side with long-settled Polish and Ukrainian households alongside much newer arrivals, so a single shift can cross several languages. I'm trying to work out what crews actually have that works, as opposed to what the policy says they have. Your read from the receiving end would be worth more to me than another literature search.`,
  },
  {
    org: "Mount Sinai Hospital, Chicago",
    firstName: "Laila",
    lastName: "Robateau",
    title: "Trauma Program contact, RN (as listed June 2023)",
    email: "Laila.Robateau@sinai.org",
    tier2: true,
    source:
      "Illinois Trauma Coordinators' Directory, Region 11 section (illinoistraumanurse.org, rev. 06/06/2023). CURRENCY CAVEAT: three years old; current title unconfirmed.",
    note: `In a trauma activation the history often has to come from a relative standing in the corridor, at speed, and a lot of those relatives on the West and Southwest Sides are working in Spanish. Everybody agrees that's not ideal and nobody I've asked can tell me what the alternative looks like at three in the morning. If it's just what happens, I'd rather hear that plainly than hear a policy read to me.`,
  },
  {
    org: "Northwestern Medicine McHenry Hospital",
    firstName: "Joan",
    lastName: "Rembacz",
    title: "Clinical Nurse Specialist, Emergency Services and CDU; TNS course coordinator (as listed June 2023)",
    email: "Joan.rembacz@nm.org",
    tier2: true,
    source:
      "Illinois Trauma Coordinators' Directory, TNS Course Coordinator section (illinoistraumanurse.org, rev. 06/06/2023). CURRENCY CAVEAT: three years old; current title unconfirmed.",
    note: `McHenry County's Spanish-speaking population has grown faster than most people's mental map of it, mine included until recently. You're in the unusual position of both seeing it in the department and getting to teach about it through the TNS course. Does triage accuracy actually suffer when the patient can't answer, or does the team route around it well enough that it never shows in the numbers?`,
  },
  {
    org: "Ascension Saint Joseph Medical Center, Joliet",
    firstName: "Leslie",
    lastName: "Livett",
    title: "TNS course coordinator (as listed June 2023)",
    email: "leslie.livett@ascension.org",
    tier2: true,
    source:
      "Illinois Trauma Coordinators' Directory, TNS Course Coordinator section (illinoistraumanurse.org, rev. 06/06/2023). CURRENCY CAVEAT: three years old; current title unconfirmed.",
    note: `Will County grew fast and the population that arrived isn't the one the older protocols were written for. You're teaching the trauma nurses who'll meet that first. I want to know whether the course says anything at all about assessing a patient who can't answer you, and I'd rather ask than assume it doesn't.`,
  },
  {
    org: "Advocate Sherman Hospital, Elgin",
    firstName: "Belinda",
    lastName: "Hardy",
    title: "Trauma Coordinator, RN, BSN (as listed June 2023)",
    email: "Belinda.Hardy@aah.org",
    tier2: true,
    source:
      "Illinois Trauma Coordinators' Directory, Region 9 section (illinoistraumanurse.org, rev. 06/06/2023). CURRENCY CAVEAT: three years old; current title unconfirmed.",
    note: `Elgin is one of the most heavily Spanish-speaking cities in the six counties and Sherman is where its serious injuries land. Trauma runs on a fixed sequence with a clock attached and the sequence assumes somebody in the room can tell you what happened. What does your team do when nobody can, and does it cost time you can measure?`,
  },
  {
    org: "Advocate Condell Medical Center, Libertyville",
    firstName: "Sharon",
    lastName: "Esterquest",
    title: "Trauma Coordinator, BSN, RN (as listed June 2023)",
    email: "Sharon.Esterquest@aah.org",
    tier2: true,
    source:
      "Illinois Trauma Coordinators' Directory, Region 10 section (illinoistraumanurse.org, rev. 06/06/2023). CURRENCY CAVEAT: three years old; current title unconfirmed.",
    note: `You're the Level I for Lake County, receiving from Waukegan and North Chicago as well as from the parts of the county that look nothing like them. Injury prevention only works if the message gets into the household in a form it can actually use, and that's where I think most of it quietly fails. How have you handled that?`,
  },
  {
    org: "Malcolm X College, City Colleges of Chicago",
    firstName: "Rick",
    lastName: "Conner",
    title: "Lead Instructor, Paramedic Program",
    email: "rconner25@ccc.edu",
    tier2: true,
    source:
      "Malcolm X College Paramedic Program Student Handbook 2024-2025 (ccc.edu), email printed beside his name in the faculty list",
    note: `Your students go from your classroom into the parts of this city with the widest spread of household languages anywhere in Illinois, so what they practise with you is more or less what those blocks get for the next twenty years. Does the paramedic curriculum give them anything concrete for a patient who can't answer, or is it left to the preceptor?`,
  },
  {
    org: "Malcolm X College, City Colleges of Chicago",
    firstName: "Chris",
    lastName: "Easley",
    title: "Clinical Coordinator and Co-Lab Instructor, Paramedic Program",
    email: "ceasley2@ccc.edu",
    source:
      "Malcolm X College Paramedic Program Student Handbook 2024-2025 (ccc.edu), email printed beside his name in the faculty list",
    note: `You place students into clinical sites and then hear back about how they did, which is a view of where new medics freeze that almost nobody else has. Is not being able to get a history off a patient one of the recurring ones? What do your preceptors say about it when they're being honest?`,
  },
  {
    org: "Moraine Valley Community College",
    firstName: "Sheila",
    lastName: "Moran",
    title: "EMS Program Director",
    email: "morans33@morainevalley.edu",
    tier2: true,
    source:
      "Moraine Valley Community College 2026 Paramedic Program Application (morainevalley.edu), name, phone and email printed together",
    note: `Standing up a paramedic program means the curriculum isn't in concrete yet, which is a narrow window and the reason I'm writing now rather than in two years. Your district covers a good deal of the southwest suburbs. If assessment of a patient who can't answer is going to be in there deliberately, it more or less has to go in at the start.`,
  },
  {
    org: "Advocate Lutheran General Hospital, Park Ridge",
    firstName: "Delilah",
    lastName: "Mendez",
    title: "Trauma Coordinator, RN, BSN, MPH (as listed June 2023)",
    email: "delilah.mendez@aah.org",
    hold:
      "Fourth Advocate row in this section. Sherman (Kane), Condell (Lake) and Illinois Masonic (Chicago) already cover three counties and three different job contexts; Park Ridge duplicates Cook, which Thornburg holds. Advocate trauma coordinators plausibly sit in the same system-level meeting, and four near-identical asks arriving in that meeting is the exact thing the per-employer rule exists to prevent. Promote her if any of the other three bounce — the MPH alongside the trauma role makes her the most likely of the four to already think about this at population level.",
    source:
      "Illinois Trauma Coordinators' Directory, Region 9 section (illinoistraumanurse.org, rev. 06/06/2023). CURRENCY CAVEAT: three years old; current title unconfirmed.",
    note: `The MPH next to the trauma role suggests you already think about this a population at a time rather than a patient at a time. Lutheran General pulls from a stretch of northwest Cook with a lot of first-generation households. My interest is narrow: does the injury prevention material actually reach those families, and how would you know if it didn't?`,
  },
  // ─── Cook County school districts: the people the letter actually reaches ──
  // Districts publish real addresses, which is the binding constraint on this
  // whole list. They also employ exactly the person this conference is about
  // and never invites: the building nurse who takes the phone call from a
  // parent, the family liaison who runs the bilingual parent committee, the
  // social worker whose caseload is literally the EL roster.
  // Per-employer reading: a district is not one employer for this purpose, but
  // a district's NURSE TEAM is, and so is its EL department. Where several
  // people hold the same published title, only one is here.
  {
    org: "Cicero School District 99",
    firstName: "Adela",
    lastName: "Plaku",
    title: "Lead Nurse",
    email: "aplaku@cicd99.edu",
    source: "https://www.cicd99.edu — district health services staff listing",
    note: `District 99 is around twelve thousand students and the great majority of your families speak Spanish at home. You're the person those health office calls eventually roll up to. I'm organising a conference on language access in pediatric care and the agenda so far is heavy on hospitals, which is a mistake — a school nurse handles more real conversations with LEP parents in a week than most clinics manage in a month. I'd like you in the room.`,
  },
  {
    org: "Cicero School District 99",
    firstName: "Patricia",
    lastName: "Chatta",
    title: "EC Diagnostics Nurse",
    email: "pchatta@cicd99.edu",
    tier2: true,
    source: "https://www.cicd99.edu — district health services staff listing",
    note: `Early childhood diagnostics is where a language difference and a developmental delay are easiest to confuse, and hardest to tell apart quickly. I don't think our field has been honest about how often that goes wrong in the other direction too — a real delay read as "he's just bilingual." You'd know what that actually looks like at intake.`,
  },
  {
    org: "Cicero School District 99",
    firstName: "Dalia",
    lastName: "Merril",
    title: "Program Supervisor, Multilingual Department",
    email: "dmerrill@cicd99.edu",
    source:
      "https://www.cicd99.edu — Multilingual Department staff card. NAME/ADDRESS MISMATCH as published: her name is printed 'Merril' with one L and the address has two. Reproduced exactly as published, not corrected.",
    note: `A second Program Supervisor shares your title in the department, so forgive me for picking one of you more or less arbitrarily. What I'm after is the operational reality: Cicero runs dual language at several buildings, and I'd like to know what the health and special-education side of that looks like from where you sit, as opposed to what the program description says.`,
  },
  {
    org: "Cicero School District 99",
    firstName: "Stephanie",
    lastName: "Cordero",
    title: "Cicero West School Nurse",
    email: "scordero@cicd99.edu",
    tier2: true,
    source: "https://www.cicd99.edu — building staff listing, Cicero West",
    note: `Cicero West is a dual language site, so your building has made a deliberate institutional choice about language that the clinic down the street has not. I'm curious whether that changes anything in the health office, or whether the health office is still doing what health offices everywhere do.`,
  },
  {
    org: "Berwyn South School District 100",
    firstName: "Junely",
    lastName: "Escobar",
    title: "Family Liaison",
    email: "jescobar@bsd100.org",
    source: "https://www.bsd100.org — Emerson, Room 105, 708-303-4135",
    note: `You're the district's dedicated bilingual family liaison, which means you are the answer to the question hospitals keep asking themselves in strategy documents. They pay consultants for a version of what you already do daily. I'm putting together a conference on language access in pediatric care and I'd rather hear from you than from another vendor.`,
  },
  {
    org: "Berwyn South School District 100",
    firstName: "Maria",
    lastName: "Torres",
    title: "School Nurse",
    email: "maria.torres@bsd100.org",
    source: "https://www.bsd100.org — health services listing; splits Emerson and Heritage",
    note: `Splitting two buildings means you're the health office for a lot of families and physically present for about half of them at any given moment. The medication and asthma-plan conversations that go through you are the same conversations a pediatric clinic has, with less time and no interpreter line. I'd like the clinic half of our audience to hear what that's actually like.`,
  },
  {
    org: "Berwyn South School District 100",
    firstName: "Susana",
    lastName: "Valenzuela",
    title: "Bilingual Literacy Specialist & EL Core Leader",
    email: "svalenzuela@bsd100.org",
    tier2: true,
    source: "https://www.bsd100.org — Hiawatha",
    note: `Berwyn South names a whole team of EL Core Leaders and I've written to exactly one of you on purpose, because five near-identical letters into one district is how a personal note stops being one. Literacy is the part of this I understand least. A family can be handed a perfectly translated discharge instruction and still not be able to use it, and I don't think medicine has any way of noticing that happened.`,
  },
  {
    org: "Berwyn North School District 98",
    firstName: "Mary Beth",
    lastName: "Arenella",
    title: "Home School Community Liaison",
    email: "MArenella@bn98.org",
    source: "https://www.bn98.org — District Office, 708-484-6200",
    note: `Home school community liaison is one of those titles that sounds administrative and turns out to be the person who knows which families are actually reachable and how. That knowledge doesn't exist anywhere in a hospital. We're running a conference on language access in pediatric care in Chicago and I think you'd change what the clinical people in the room think the problem is.`,
  },
  {
    org: "Berwyn North School District 98",
    firstName: "Margaret",
    lastName: "Henderson",
    title: "School Nurse Certified",
    email: "mhenderson@bn98.org",
    source: "https://www.bn98.org — Jefferson Elementary, 708-795-2454",
    note: `Jefferson's health office sees the same children a pediatric practice does, roughly two hundred times more often. What I want to know is what you do when you need a parent on the phone right now and there isn't a shared language — because whatever that is, it's the honest answer, and the honest answer isn't in anyone's policy.`,
  },
  {
    org: "Summit School District 104",
    firstName: "Tina Marie",
    lastName: "Lopez",
    title: "District 104 Lead Nurse, BSN, RN, PEL-CSN, RNC-OB",
    email: "tlopez@sd104.us",
    tier2: true,
    source: "https://www.sd104.us — health services; Graves School and Heritage MS, 708-924-7998",
    note: `The RNC-OB alongside the school nurse credentials is an unusual combination and it's why I'm writing to you rather than to your district office. You've done the maternal side and now you're doing the school-age side of the same families. Our conference is on language access in pediatric care and nobody on the agenda has seen both ends of that.`,
  },
  {
    org: "Summit School District 104",
    firstName: "Racheal",
    lastName: "Romo",
    title: "UNIDOS Parent Liaison",
    email: "rromo@sd104.us",
    tier2: true,
    source: "https://www.sd104.us — Multilingual Programs. First name published as 'Racheal'.",
    note: `UNIDOS is a named program with a person attached to it, which already puts Summit ahead of most health systems, where family engagement is a line in a strategic plan and nobody's actual job. I'd like to know what you've found works to get parents to show up, because the clinical side has been guessing at that for twenty years.`,
  },
  {
    org: "Summit School District 104",
    firstName: "Yuritzi",
    lastName: "Chavez",
    title: "Bilingual School Psychologist",
    email: "ychavez@sd104.us",
    tier2: true,
    source: "https://www.sd104.us — Walker and Graves schools; published as 'Dr. Yuritzi Chavez'",
    note: `A bilingual school psychologist is a genuinely scarce role and you're doing the assessment work that is most easily wrecked by a language mismatch. Testing a child in a language they're still acquiring produces a number, and the number looks just as authoritative as a real one. I'd like our audience to sit with that for a while.`,
  },
  {
    org: "Summit School District 104",
    firstName: "Maureen",
    lastName: "Kuhn-Rojas",
    title: "EL Program Coordinator",
    email: "mkuhn@sd104.us",
    source: "https://www.sd104.us — Multilingual Programs page, where she is listed simply as 'Coordinator'",
    note: `Summit is small enough that the EL program is a person rather than a department, which I suspect makes you the one who notices when something isn't working. Do the health forms and the emergency contact cards actually get back from families in usable shape? That's a mundane question and I think it's a much bigger deal than the conference circuit realises.`,
  },
  {
    org: "Leyden High School District 212",
    firstName: "Areli",
    lastName: "Diaz",
    title: "Teacher, Multilingual Learners Department Chair",
    email: "adiaz@leyden212.org",
    source:
      "https://www.leyden212.org/academics/departments — her name links to mailto:adiaz@leyden212.org under 'Multilingual Learners and Literacy'. CAVEAT: that link's screen-reader-only label wrongly reads cschmidt@leyden212.org, a stale copy-paste; the actual href is adiaz@. There is no Christina Schmidt on any Leyden page.",
    note: `Leyden's own page tells families to contact the Multilingual Department Chair at their campus, which makes you the district's front door for more than thirty language groups. Two high schools, 3,500 students, and the translation resources page lists Google Translate and Microsoft Translate by name. I'd like you to say out loud at our conference what that's like, because the hospitals in the room are quietly doing the same thing and calling it a strategy.`,
  },
  {
    org: "Leyden High School District 212",
    firstName: "Marlene",
    lastName: "Cuevas",
    title: "BSN, RN",
    email: "mcuevas@leyden212.org",
    source:
      "https://www.leyden212.org/parents-community/health-care-services/contact-us — East Leyden, Franklin Park, 847-451-3084. TITLE CAVEAT: Leyden publishes no job-title string for its nurses, only credentials under an 'East'/'West' heading. The title field holds exactly what is published; she is the building nurse by page context.",
    note: `East Leyden's health office covers a student body drawn from more than thirty language groups. That's a harder job than the equivalent in a hospital, because you don't have a phone line to call and you have to finish the conversation before the bell. I'm inviting you to a conference on language access in pediatric care and I'd like it to be less hospital-shaped than it currently is.`,
  },
  // ─── Collar-county districts: Lake, Kane, Will, DuPage, McHenry ───────────
  // Cook County is not where the pressure is. The districts below sit in towns
  // that took most of the region's newcomer growth in the last decade without
  // any of the interpreter infrastructure a Chicago hospital can assume, and
  // several of them publish a staff directory precisely because there is no
  // switchboard to hide behind.
  // Two whole blocks came out of this section on the geography rule rather
  // than for cause: HFS's Division of Medical Programs is a statewide body
  // whose named staff could not be placed at a Chicago-area desk, and
  // Northern Illinois University is DeKalb.
  // CORRECTION, made after this section shipped: ISBE's multilingual
  // department was dropped here too, on a research note claiming it is
  // Springfield-based. That note was wrong, and a second researcher's data
  // contradicts it person by person — ISBE's own contact list gives every one
  // of these consultants a 312 number matching the Chicago office at 555 W.
  // Monroe St., Suite 900, and the Springfield staff (217 numbers) were
  // separately identified and dropped. Two of them are restored below. Not
  // all nine: they are one department of about eleven who sit together, and
  // the compare-notes cap binds harder than the county rule here.
  // Per-employer reading is per DEPARTMENT: a district's nurses are one unit,
  // its EL office another, its social workers a third.
  {
    org: "Round Lake Area Schools CUSD 116 (Lake County)",
    firstName: "Maria",
    lastName: "Colunga",
    title: "Community Outreach & Engagement Specialist",
    email: "mcolunga@rlas-116.org",
    tier2: true,
    source: "https://www.rlas-116.org/parent-involvement4/bpac",
    note: `Every district with enough English learners has to convene a Bilingual Parent Advisory Committee, and in most of them it is a compliance artifact that meets three times and produces minutes. You are the name and the phone number on Round Lake's, which means when a parent has been through something at a school or a clinic and wants to say so out loud, the room you run is where it gets said. That is a better record of how interpretation actually went than any of the data the systems collect on themselves, and almost nobody in this field has access to it.`,
  },
  {
    org: "Round Lake Area Schools CUSD 116 (Lake County)",
    firstName: "Carolina",
    lastName: "Herrera",
    title: "Social Worker",
    email: "cherrera@rlas-116.org",
    source: "https://rlhs.rlas-116.org/school-services/educational-services/social-workers",
    note: `The high school's own page lists your caseload as ESL 1 and ESL 2. Not a grade level, not an alphabet split, not a building — a language program. Whatever the intention, the district has organised clinical support around the fact of not speaking English yet, and you are the person living inside that arrangement daily. We spend two days on interpretation in medical and legal settings and rarely hear from anyone whose assignment was drawn that way to begin with.`,
  },
  {
    org: "Round Lake Area Schools CUSD 116 (Lake County)",
    firstName: "Alex",
    lastName: "Zermeno",
    title: "Multilingual Learner Department Chair",
    email: "azermeno@rlas-116.org",
    source: "https://rlhs.rlas-116.org/academics/departments/english-as-a-new-language",
    note: `Round Lake High School's newcomers arrive with medical histories that live in another country and often another language, and the first person a family tells anything to is usually somebody in your department rather than a nurse or a doctor. Teachers end up interpreting in situations nobody trained them for and no policy acknowledges. What that costs, and who absorbs it, is a fair amount of what the two days are about.`,
  },
  {
    org: "Round Lake Area Schools CUSD 116 (Lake County)",
    firstName: "Denise",
    lastName: "Rodriguez",
    title: "Round Lake Middle School Nurse, RN",
    email: "drodriguez@rlas-116.org",
    source: "https://rlms.rlas-116.org/our-school/school-nurse",
    note: `Your school page says Hablo espanol, with the exclamation mark. That single line does more work than it looks like: it means you get every Spanish-language call in the building, including the ones about students who are not yours and the ones that are not medical at all. Health systems solve that by procuring a vendor. A school nurse solves it by being the person who picks up, which is a different job with none of the same protections.`,
  },
  {
    org: "Round Lake Area Schools CUSD 116 (Lake County)",
    firstName: "Ariana",
    lastName: "Melesio",
    title: "Raymond Ellis Elementary School Nurse, BSN, RN, TNS",
    email: "amelesio@rlas-116.org",
    source: "https://rees.rlas-116.org/our-school/school-nurse",
    note: `A Trauma Nurse Specialist credential in an elementary building is an unusual combination — it means the emergency side of your training is mostly idle and then occasionally the only thing that matters. Add Spanish, which your page advertises, and you are the person who both handles the injury and explains it to a parent who will not otherwise be told anything until an ambulance arrives. The handoff between those two moments is one of the places this conference actually digs into.`,
  },
  {
    org: "Round Lake Area Schools CUSD 116 (Lake County)",
    firstName: "Consuelo",
    lastName: "Gomez",
    title: "Multilingual Learner Teaching Assistant",
    email: "cgomez@rlas-116.org",
    source: "https://rlhs.rlas-116.org/academics/departments/english-as-a-new-language",
    note: `Teaching assistants get pulled into parent conferences, discipline meetings and phone calls home as the person who speaks the language, without the title, the training or the pay that would come with being called an interpreter. It happens in hospitals to housekeeping staff and in schools to TAs, for the same reason and with the same consequences. This is one of the few rooms where that is treated as the substantive problem it is rather than a scheduling inconvenience.`,
  },
  {
    org: "Waukegan CUSD 60 (Lake County)",
    firstName: "Nancy",
    lastName: "Rocha-Bueno",
    title: "District Translator",
    email: "nrocha-bueno@wps60.org",
    tier2: true,
    source: "https://www.wps60.org/o/wcusd/page/bilingual-and-multicultural-department",
    note: `Translation and interpretation are two different professions that districts and hospitals both routinely assume are one, so the person hired to render documents ends up on the phone doing live work with no notice. The document side is also where a bad decision quietly replicates — a mistranslated consent form or discipline notice goes out to thousands of families at once and nobody catches it for a year. Very little of the field's attention goes there.`,
  },
  {
    org: "Waukegan CUSD 60 (Lake County)",
    firstName: "Hector",
    lastName: "Caceres",
    title: "Language Assessor",
    email: "hcaceres@wps60.org",
    source: "https://www.wps60.org/o/wcusd/page/bilingual-and-multicultural-department",
    note: `You administer the screener that decides whether a child is an English learner, and that determination follows them for years through placement, testing and sometimes special education referral. It is a fifteen-minute interaction with a very long tail. The parallel in medicine is the intake question about preferred language, asked once, entered once, and then trusted by every clinician downstream who never repeats it.`,
  },
  {
    org: "Waukegan CUSD 60 (Lake County)",
    firstName: "Sylvia",
    lastName: "Roldan",
    title: "Bilingual Family Support, Waukegan High School Brookside Campus",
    email: "sroldan@wps60.org",
    tier2: true,
    source: "https://www.wps60.org/o/wcusd/page/bilingual-and-multicultural-department",
    note: `Brookside is where the students who are furthest from a standard path end up, and their families are correspondingly the least likely to have a stable phone number, an English-speaking relative to lean on or any experience getting a straight answer out of an institution. Being the bilingual contact at that particular campus is a harder version of the same job done at the main building. The conference is mostly about medical and legal interpretation, and the families you work with move through both of those systems more than most.`,
  },
  {
    org: "Waukegan CUSD 60 (Lake County)",
    firstName: "Housseine",
    lastName: "Bachiri",
    title: "PreK-12 Specialist",
    email: "hbachiri@wps60.org",
    source: "https://www.wps60.org/o/wcusd/page/bilingual-and-multicultural-department",
    note: `Waukegan's bilingual department is built for Spanish because most of the district is, which leaves whoever handles everything else doing a lot of improvising with no vendor contract behind them. That is the exact position a hospital finds itself in at two in the morning with a language it has never encountered, and hospitals tend to think of it as a rare event rather than a standing condition. Two days on what people actually do in that situation is the point of this.`,
  },
  {
    org: "Waukegan CUSD 60 (Lake County)",
    firstName: "Ricardo",
    lastName: "Aceves",
    title: "Bilingual Coordinator, PreK-12",
    email: "raceves@wps60.org",
    tier2: true,
    source: "https://www.wps60.org/o/wcusd/page/bilingual-and-multicultural-department",
    note: `Coordinating PreK through twelve means you see the same families for fifteen years, which is longer than any clinician, caseworker or attorney in their lives will get. You know which ones stopped calling the school and why. That longitudinal view is almost impossible to reconstruct from any single institution's records and it is the thing this field is worst at.`,
  },
  {
    org: "West Aurora SD 129 (Kane County)",
    firstName: "Hector",
    lastName: "Salcido",
    title: "Multilingual Learner Assessor",
    email: "hsalcido@sd129.org",
    tier2: true,
    source: "https://www.sd129.org/district/departments/multilingual-learners (published in plaintext as a mailto link; the district's other multilingual staff addresses are obfuscated in JavaScript and were not used)",
    note: `The district points assessment-process questions at you directly, which means you field the calls from parents who do not understand why their child was placed where they were placed. Explaining a testing decision to somebody in their own language, when the decision itself was made through an instrument designed in English, is a specific kind of hard. It has a close cousin in explaining a diagnosis arrived at through an interpreter.`,
  },
  {
    org: "West Aurora SD 129 (Kane County)",
    firstName: "Valerie",
    lastName: "McCall",
    title: "Director of Family Support and Educational Equity",
    email: "valerie.mccall@sd129.org",
    tier2: true,
    source: "https://www.sd129.org/district/departments/student-services (address published in plaintext in the district's nondiscrimination notice, which also names her Nondiscrimination Coordinator)",
    note: `You are also West Aurora's named nondiscrimination coordinator, which means a language complaint arrives on your desk as a civil rights matter rather than a service problem. That framing changes what evidence counts and what a resolution has to look like. Hospitals almost never see language failures arrive in that form until it is a lawsuit, and the difference between the two vantage points is worth an argument in person.`,
  },
  {
    org: "School District U-46 (Elgin, Kane/Cook/DuPage)",
    firstName: "Laura",
    lastName: "Godinez",
    title: "Multilingual and Multicultural Education Program Placement Specialist",
    email: "lauragodinez@u-46.org",
    source: "https://www.u-46.org/page/family-welcome-center",
    note: `U-46 is the second largest district in the state and you do the English proficiency screening and the placement recommendation, so a very large number of children in the Fox Valley pass through a judgment you make. The volume is what makes it interesting: at that scale the shortcuts and defaults become visible in a way they never are in a single clinic. Whatever your screening process does badly, it does badly thousands of times, and you are one of the few people positioned to say what that is.`,
  },
  {
    org: "School District U-46 (Elgin, Kane/Cook/DuPage)",
    firstName: "Reyna",
    lastName: "De La Mora",
    title: "Multilingual and Multicultural Education Family Welcome Center Facilitator",
    email: "reynadelamora@u-46.org",
    tier2: true,
    source: "https://www.u-46.org/page/family-welcome-center",
    note: `A welcome center is the first institutional building a newly arrived family walks into, and how that hour goes shapes what they expect from every institution afterward, including the hospital. People who work registration desks and intake windows are structurally the most informed and least consulted group in this whole field. That is the gap the two days are aimed at.`,
  },
  {
    org: "School District U-46 (Elgin, Kane/Cook/DuPage)",
    firstName: "Patricia",
    lastName: "Ortiz",
    title: "Data Entry Specialist, Family Welcome Center",
    email: "patriciaortiz@u-46.org",
    tier2: true,
    source: "https://www.u-46.org/page/family-welcome-center",
    note: `The home language survey a family fills out at your counter becomes a field in a system, and from that point on the field is what the district knows — not the conversation, not the nuance about which language the parent actually prefers for serious news versus everyday notices. Medical records work identically and fail identically. You are one of the few people who has seen both the conversation and the field it collapsed into, which is exactly the comparison nobody in this field ever gets to make.`,
  },
  {
    org: "Bensenville SD 2 (DuPage County)",
    firstName: "Lara",
    lastName: "Schwarz",
    title: "Community Liaison and CARE Coordinator",
    email: "lschwarz@bsd2.org",
    source: "https://www.bsd2.org/departments/superintendent-s-office/community-relations",
    note: `Bensenville sits under the flight path with a large immigrant workforce attached to the airport, which produces a particular pattern: shift work, no daytime availability, and appointments that get missed for reasons that look like non-compliance on paper. You are the person who finds out the real reason. Health systems build no-show interventions without ever hearing that explanation from someone who has actually asked.`,
  },
  {
    org: "Bensenville SD 2 (DuPage County)",
    firstName: "Sue",
    lastName: "Vitale",
    title: "Blackhawk Middle School CARE Facilitator",
    email: "svitale@bsd2.org",
    tier2: true,
    source: "https://www.bsd2.org/departments/teaching-learning",
    note: `Middle school is where a child who has been interpreting for their parents since elementary starts to resent it, and where the family stops being able to rely on them. That transition is invisible to every adult institution around the family, and it is usually the moment a clinic starts getting incomplete histories with no idea why. Somebody in your seat sees it happen in real time.`,
  },
  {
    org: "Bensenville SD 2 (DuPage County)",
    firstName: "Kristine",
    lastName: "Stalzer",
    title: "Student Services Coordinator, Tioga School",
    email: "kstalzer@bsd2.org",
    source: "https://www.bsd2.org/departments/student-services",
    note: `Special education evaluation across a language barrier is the single most consequential place this goes wrong, because a language difference and a disability look alike on the wrong instrument and the resulting placement lasts years. The medical version is a mental health assessment done through an interpreter nobody briefed. Both fail the same way and neither field talks to the other about it.`,
  },
  {
    org: "Community Unit School District 300 (Kane/McHenry)",
    firstName: "David",
    lastName: "Rojas",
    title: "Director of EL Services and World Languages",
    email: "David.Rojas@d300.org",
    tier2: true,
    source: "https://www.d300.org/academics/english-learners (name, title and address all published as literal plain text)",
    note: `D300 runs three dual language academies, which is a real institutional commitment rather than a compliance minimum, and it means your staff are among the few in the region who treat the home language as an asset to be developed rather than a barrier to be routed around. That premise is almost entirely absent from how medicine and the courts approach the same families. Hearing it argued by someone who has actually built programs on it would change the shape of the two days.`,
  },
  {
    org: "Community Unit School District 300 (Kane/McHenry)",
    firstName: "Nallely",
    lastName: "Coria",
    title: "Translator, Communications",
    email: "nallely.coria@d300.org",
    tier2: true,
    source: "https://www.d300.org/about/faculty-staff-directory (title verbatim as published: ADM TRANSLATOR-COMMUNICATIONS; the district's directory obfuscates addresses in reversed JavaScript strings and this one was decoded, so it is worth a phone check before sending)",
    note: `Sitting in communications rather than the EL office means you translate the district's voice — closures, emergencies, policy changes — not classroom material. That is the register institutions are worst at, because the English original was written by someone optimising for legal safety rather than comprehension, and no amount of accurate translation fixes a source text nobody can follow. Hospitals produce the same documents and make the same assumption about what translating them accomplishes.`,
  },
  {
    org: "Community Unit School District 300 (Kane/McHenry)",
    firstName: "Alma",
    lastName: "Torres",
    title: "Family School Liaison, Meadowdale Elementary",
    email: "alma.torres@d300.org",
    tier2: true,
    source: "https://www.d300.org/about/faculty-staff-directory (Meadowdale is one of D300's three dual language academies; address decoded from the directory's reversed JavaScript, worth a phone check before sending)",
    note: `A liaison at a dual language academy has a different relationship with families than one at a school where the home language is a problem to be managed — parents come in expecting to be understood, and they say more. What they say includes a lot about doctors and courts and landlords that never reaches any of those places. That is the material this conference is short of.`,
  },
  {
    org: "Community Unit School District 300 (Kane/McHenry)",
    firstName: "Cynthia",
    lastName: "Chaidez",
    title: "Bilingual School Social Worker, Golfview Elementary",
    email: "cynthia.chaidez@d300.org",
    tier2: true,
    source: "https://www.d300.org/about/faculty-staff-directory (the -BI suffix marking a bilingual designation is the district's own title string; address decoded from reversed JavaScript, worth a phone check before sending)",
    note: `Bilingual clinical work is not bilingual conversation — assessing a child's mental state in a language means having the vocabulary for symptoms that patients themselves often lack in any language, and doing it without a second adult in the room mediating. There are very few people in the region who do it and they are mostly in schools rather than clinics, which is backwards given where the acute need shows up. That imbalance is one of the things worth naming out loud in a room like this.`,
  },
  {
    org: "Joliet Public Schools District 86 (Will County)",
    firstName: "Patricia",
    lastName: "Alvarez",
    title: "Translator, Gompers Junior High School",
    email: "palvarez@joliet86.org",
    tier2: true,
    source: "https://www.joliet86.org/o/gjh/staff (address published as literal plain text and as a mailto link; title verbatim as published)",
    note: `Being the translator attached to a single junior high rather than a central office means you are on-site when things happen rather than scheduled in advance, so you get the unplanned conversations — the ones in hallways after a meeting has officially ended, which is usually when the real question gets asked. Interpreters in hospitals know that pattern precisely and rarely get to describe it to anyone who designs the systems. Will County is also underrepresented in almost every regional conversation about this.`,
  },
  {
    org: "Joliet Public Schools District 86 (Will County)",
    firstName: "Susan",
    lastName: "Badalamenti",
    title: "Nurse, Hufford Junior High School",
    email: "sbadalamenti@joliet86.org",
    tier2: true,
    source: "https://www.joliet86.org/o/hjh/staff (address published as literal plain text and as a mailto link, present in both the March and December 2025 captures of the directory)",
    note: `A school nurse making a call home about a medication, an injury or a suspected condition is doing patient communication with none of a hospital's resources — no interpreter line on hold, no bilingual colleague down the hall, frequently no second attempt. You improvise and then the improvisation becomes the record. What happens in that gap between what a hospital can do and what you can do is one of the more useful things this conference could actually get on the table.`,
  },
  {
    org: "Joliet Public Schools District 86 (Will County)",
    firstName: "Maria",
    lastName: "Arroyo",
    title: "Social Worker, Gompers Junior High School",
    email: "mgarroyo@joliet86.org",
    tier2: true,
    source: "https://www.joliet86.org/o/gjh/staff (address published as literal plain text and as a mailto link)",
    note: `School social work is where the family's whole situation shows up at once — housing, immigration status, a parent's untreated condition, a court date nobody understood — and none of the specialist systems that produced those problems ever see them assembled. You do. Two days of people describing their own narrow slice is worth much less than one person who has seen how the slices fit together.`,
  },
  {
    org: "Schaumburg CCSD 54 (Cook County)",
    firstName: "Cinzia",
    lastName: "Bellarosa",
    title: "Parent Liaison",
    email: "CinziaBellarosa@sd54.org",
    source: "https://www.sd54.org/page/language-and-culture",
    note: `Schaumburg's newcomer population is unusually varied for a suburban district — it is not one language with a long tail but genuinely many, which makes every standard solution a partial one. A liaison in that setting develops a working sense of which languages the systems around you can actually serve and which ones you have to route around personally. Nobody publishes that map and it is one of the more valuable things anyone could bring into this room.`,
  },
  {
    org: "Schaumburg CCSD 54 (Cook County)",
    firstName: "Barb",
    lastName: "Velez",
    title: "Welcome and Assessment Center",
    email: "BarbaraVelez@sd54.org",
    tier2: true,
    source: "https://www.sd54.org/page/language-and-culture (the district's own directory lists her role as Bilingual; the title above is the department name as published, because no individual job title is given)",
    note: `Running intake and screening means you meet families at the exact moment they have the least information and the most at stake, and you decide in one sitting what the district will believe about their child. Emergency departments do the same thing in triage and have spent decades arguing about how to do it fairly. The two conversations have never been in the same room and there is no good reason for that.`,
  },
  {
    org: "CCSD 15 (Palatine, Cook County)",
    firstName: "Ana",
    lastName: "Flores",
    title: "Bilingual Parent Liasion",
    email: "floresa2@ccsd15.net",
    tier2: true,
    source: "https://www.ccsd15.net/our-district/departments/multilingual-programs/family-liaisons-enlaces-de-familia (title reproduced exactly as the district publishes it, misspelling and all)",
    note: `Yours is the only staff address CCSD 15 publishes anywhere on that site apart from the director's, which tells you something about how the district expects families to reach it and how much traffic therefore lands on you. Being a single accessible person in front of an otherwise closed institution is a familiar position to anyone who has worked a hospital language line. It is also the position where you learn the most and get asked the least.`,
  },
  {
    org: "Community High School District 99 (Downers Grove, DuPage County)",
    firstName: "Jade",
    lastName: "Bottoms",
    title: "BSN, RN, CSN",
    email: "jbottoms@csd99.org",
    tier2: true,
    source: "https://south.csd99.org/student-life/health-services-nurse (the district publishes the credential string in place of a job title, reproduced here verbatim rather than inventing one)",
    note: `Downers Grove South's catchment has changed considerably faster than the district's reputation has, and a high school nurse is usually the first person in the building to notice a demographic shift because it shows up in what languages the calls home need to be in. High school is also where students start managing their own medical appointments and interpreting for their parents at the same time. Both of those are conference material and neither gets discussed by anyone who has watched it from a school health office.`,
  },
  {
    org: "Barrington CUSD 220 (Lake/Cook)",
    firstName: "Bridget",
    lastName: "Heroff",
    title: "District Nursing Coordinator",
    email: "bheroff@barrington220.org",
    tier2: true,
    source: "https://www.barrington220.org/families/health-services (the same page also lists her in the building roster as Certified School Nurse, MSN, RN, NCSN, PEL-SN at Barrington High School; hers is the only individual address the health office publishes)",
    note: `Barrington is a district where the affluence of the tax base hides a service population that is not affluent at all, and coordinating nursing across it means you see both halves of that in the same week. Language access resourcing tends to follow a district's average rather than its actual distribution, which leaves the families who need it inside districts that look like they do not need anything. That mismatch is worth describing to a room full of people who allocate by ZIP code.`,
  },
  {
    org: "Berwyn North SD 98 (Cook County)",
    firstName: "Josefina",
    lastName: "Torres Velazquez",
    title: "School Nurse Non-Certified, Lincoln Middle School",
    email: "JTorres@bn98.org",
    tier2: true,
    source: "https://www.bn98.org/staff (title reproduced exactly as the district publishes it)",
    note: `Non-Certified is the district's word, not mine, and it draws a line that does not exist in practice: the parent on the phone gets the same conversation regardless of which side of it you are on, and in a district where most of those calls are in Spanish you are likely handling more of them than the certified colleague. Health systems draw the identical line around who is allowed to interpret and then quietly depend on the people it excludes. Naming that is most of what the two days are for.`,
  },
  {
    org: "Berwyn South SD 100 (Cook County)",
    firstName: "Maricela",
    lastName: "Huerta",
    title: "Bilingual Interventionist and EL Core Leader, Pershing Elementary",
    email: "mhuerta@bsd100.org",
    tier2: true,
    source: "https://pershing.bsd100.org/about-us/staff",
    note: `Intervention work is diagnostic in a way general instruction is not — you are trying to establish whether a child cannot do something or cannot do it in English yet, which is a distinction that entire professions get wrong routinely and expensively. Speech pathologists, psychologists and paediatricians all face the same question and mostly answer it with instruments that were never built for it. You answer it several times a week.`,
  },
  {
    org: "Summit SD 104 (Cook County)",
    firstName: "Elizabeth",
    lastName: "Campuzano",
    title: "Social Worker, Graves Dual Language School",
    email: "ecampuzano@sd104.us",
    source: "https://www.sd104.us/page/school-social-work",
    note: `Clinical work in a dual language building means the language question is settled before you start, which is rare enough that it makes the rest visible — you find out what the actual difficulty was once the interpretation problem is removed. Almost every other setting in this field is still stuck on the first problem and assumes it is the only one. A description of what remains after it is solved would be genuinely new information for most of this room.`,
  },
  // ─── Special education co-ops and early childhood ─────────────────────────
  // Two seats nobody in language access ever writes to. Special education
  // co-operatives are the shared body several districts buy their specialists
  // from, so one person covers six towns and sees the same evaluation problem
  // repeat across all of them. Head Start and Early Intervention reach the
  // family earlier than any other public system does — before school, often
  // before a paediatrician has been seen twice — which makes them the only
  // people who watch a language barrier form rather than inheriting one.
  // Sourcing caveats matter here: LADSE's addresses are served in the page's
  // og:description rather than the rendered body, and NDSEC's are Cloudflare
  // data-cfemail hex that had to be decoded. Both were read deterministically,
  // but a browser spot-check before a send would be cheap insurance.
  {
    org: "LADSE — La Grange Area Department of Special Education (Cook County)",
    firstName: "Carrie",
    lastName: "Morfoot",
    title: "Deaf and Hard of Hearing Program Coordinator",
    email: "cmorfoot@ladse.org",
    tier2: true,
    source: "https://www.ladse.org/deaf--hard-of-hearing.html (address is served in the page og:description; the body renders client-side)",
    note: `Deaf and hard of hearing students in immigrant families are the case that breaks every assumption both fields run on: the child's first language may be ASL while the parents' is Spanish or Polish, so a meeting needs two interpreters working in series and somebody has to have thought about that a week in advance. Hospitals discover this at the bedside and improvise badly. You have presumably had to build a working answer, and there is nobody at this conference who has.`,
  },
  {
    org: "LADSE — La Grange Area Department of Special Education (Cook County)",
    firstName: "Rebecca",
    lastName: "Vance",
    title: "Interim Nursing Coordinator",
    email: "rvance@ladse.org",
    tier2: true,
    source: "https://www.ladse.org/nursing.html (address is served in the page og:description; the body renders client-side)",
    note: `Co-op nursing means you carry medically complex students across several districts at once, which is a caseload built out of exactly the children whose care plans depend on a parent understanding something precisely. Seizure protocols and feeding schedules do not survive an approximate translation. Most of the people coming to this argue about interpretation in the abstract and you are administering the consequences of it.`,
  },
  {
    org: "LADSE — La Grange Area Department of Special Education (Cook County)",
    firstName: "Karen",
    lastName: "Bylsma",
    title: "Vocational Transitional Services",
    email: "kbylsma@ladse.org",
    tier2: true,
    source: "https://www.ladse.org/vocational.html (address is served in the page og:description; the body renders client-side)",
    note: `Transition planning is where a family finds out what adulthood is actually going to look like — guardianship, benefits, whether their child will work — and it is conducted almost entirely in acronyms. Doing that conversation across a language barrier, with parents who may also be navigating their own immigration status, is a genuinely brutal piece of communication. Nobody in medical interpreting has to deliver news with that time horizon and it would be worth their hearing what it takes.`,
  },
  {
    org: "LADSE — La Grange Area Department of Special Education (Cook County)",
    firstName: "Kelly",
    lastName: "Rathbun-Hunt",
    title: "Early Childhood Education Program Coordinator",
    email: "krathbun@ladse.org",
    tier2: true,
    source: "https://www.ladse.org/early-childhood-education.html (address is served in the page og:description; the body renders client-side)",
    note: `At three years old the question of whether a child has a speech delay or is simply acquiring two languages on a normal timeline is close to unanswerable with the tools that exist, and getting it wrong in either direction costs the family years. Paediatricians refer on the same weak signal and rarely find out what happened next. You do find out, repeatedly, which makes you one of very few people with an evidence base on it.`,
  },
  {
    org: "LADSE — La Grange Area Department of Special Education (Cook County)",
    firstName: "Amanda",
    lastName: "Meyer",
    title: "LINC Program Coordinator",
    email: "ameyer@ladse.org",
    tier2: true,
    source: "https://www.ladse.org/linc.html (address is served in the page og:description; the body renders client-side)",
    note: `Programs for students with significant emotional and behavioural needs generate the most interpreted crisis conversations of anything in a school system, and crisis is precisely when interpretation quality collapses — everyone is fast, upset, and reaching for whoever is nearest. Emergency departments have the identical failure and have written it up as though it were unique to them. It is not, and hearing that from the school side would land.`,
  },
  {
    org: "NDSEC — North DuPage Special Education Cooperative (DuPage County)",
    firstName: "Maria",
    lastName: "Ojuolape",
    title: "Coordinator, Early Childhood Special Education, Wood Dale Early Childhood Education Center",
    email: "mojuolape@ndsec.org",
    tier2: true,
    source: "https://www.ndsec.org/contact_us/administration (address decoded from Cloudflare data-cfemail hex; decoding is deterministic but a browser spot-check before sending is cheap)",
    note: `Early childhood special education is the first time most families meet a formal evaluation process, and the impression it leaves determines how they handle every institutional encounter afterward, including medical ones. If that first meeting went through a bad interpreter, the family becomes cautious in ways that get recorded years later as non-engagement. Nobody tracks that causal chain and you are positioned at the start of it.`,
  },
  {
    org: "NDSEC — North DuPage Special Education Cooperative (DuPage County)",
    firstName: "James",
    lastName: "Zinni",
    title: "Coordinator, Language and Social Skills Opportunities Program",
    email: "jzinni@ndsec.org",
    tier2: true,
    source: "https://www.ndsec.org/contact_us/administration (address decoded from Cloudflare data-cfemail hex; the same page lists him as the Roselle District 12 contact)",
    note: `A program whose subject is language and social skills, serving a county where a growing share of families speak something other than English at home, sits on top of a question the field mostly avoids: what a communication disorder even means when the child is operating across two languages with different competence in each. Speech pathologists in hospitals face the same question with less time to think about it. Two days is enough to actually argue it.`,
  },
  {
    org: "Community Action Agency for McHenry County (Head Start), Woodstock",
    firstName: "Araceli",
    lastName: "Jimenez",
    title: "Family Services Manager",
    email: "araceli.jimenez@headstartmchenrycounty.org",
    source: "https://www.headstartmchenrycounty.org (listed under Management Team)",
    note: `McHenry County has a large agricultural and food processing workforce and almost none of the language infrastructure that Cook County takes for granted, so families there are further from every service and further from any interpreter. Family services in that setting means you are frequently the referral, not the person making one. What a county without capacity actually does is a more useful case study than another account of how a large hospital system runs its program.`,
  },
  {
    org: "Community Action Agency for McHenry County (Head Start), Woodstock",
    firstName: "Tanya",
    lastName: "Cantin",
    title: "Health and Nutrition Manager",
    email: "tanya.cantin@headstartmchenrycounty.org",
    tier2: true,
    source: "https://www.headstartmchenrycounty.org/contact (also published as Health & Nutrition Manager with a capitalised address variant)",
    note: `Head Start requires a health screening and a dental exam for every enrolled child, which means you are chasing paediatric appointments for hundreds of families and finding out exactly where the system will not accommodate them. That is a census of local clinic access nobody else compiles. The people who commission language services rarely hear from anyone who has tried to book across all of them in the same month.`,
  },
  {
    org: "Catholic Charities Diocese of Joliet — Early Childhood Services, Alexandria Center (Will County)",
    firstName: "Angela",
    lastName: "Phillips",
    title: "Site Supervisor",
    email: "aphillips@cc-doj.org",
    source: "https://catholiccharitiesjoliet.org/services/ecsd-alexandria-center",
    note: `Running a Head Start centre means the daily language work is not scheduled — it is a parent at the door at pickup, a bus driver relaying something, a form nobody can fill in. None of it is billable or documented and all of it is the actual mechanism by which a family stays connected to services. Will County is also barely represented in any regional conversation about this, which is its own reason.`,
  },
  {
    org: "Catholic Charities Diocese of Joliet — Early Childhood Services, Broadway Center (Will County)",
    firstName: "Lanetra",
    lastName: "Dees",
    title: "Site Supervisor",
    email: "ldees@cc-doj.org",
    source: "https://catholiccharitiesjoliet.org/services/ecsd-broadway-center",
    note: `Head Start's home visiting requirement puts your staff inside apartments, which is a level of access no clinic or court will ever have and which produces a completely different picture of why a family missed something. Home visitors also end up interpreting for whatever else is going on in the household that day. That role has no name, no training and no boundary, and it is worth putting in front of a room that thinks of interpretation as a scheduled service.`,
  },
  {
    org: "Catholic Charities Diocese of Joliet — Early Childhood Services, Rockdale Center (Will County)",
    firstName: "Erica",
    lastName: "Alzamora",
    title: "Site Supervisor",
    email: "ealzamora@cc-doj.org",
    source: "https://catholiccharitiesjoliet.org/services/ecsd-rockdale-center (Rockdale operates on the Joliet Junior College campus and runs both Head Start and Early Head Start)",
    note: `Early Head Start reaches infants and pregnant women, which puts your centre in contact with families during prenatal care and delivery — the setting where language failures are both most consequential and most studied, and where the studies almost never include anyone outside the hospital. Being on a community college campus also means a share of your parents are students, which changes what they can and cannot ask for. Both of those are angles this conference does not currently have.`,
  },
  {
    org: "Clearbrook — Child and Family Connections #6 (Early Intervention), Arlington Heights",
    firstName: "Sherry",
    lastName: "Mackey",
    title: "Local Interagency Council Coordinator and Parent Liaison",
    email: "smackey@clearbrook.org",
    source: "https://www.clearbrook.org/cfc",
    note: `Early Intervention is the one system that is legally obliged to deliver services in the family's home and in a way the family can actually use, which makes it the closest thing this country has to a working language access mandate at the point of care. Whether that obligation survives contact with a therapist shortage and a per-visit funding model is the question. You would know better than almost anyone, and it is a much more concrete conversation than the one this field usually has.`,
  },
  {
    org: "Easterseals — Gilchrist Marchman Child Development Center, Chicago (Cook County)",
    firstName: "Wendy",
    lastName: "Ramos",
    title: "Site Director",
    email: "wramos@eastersealschicago.org",
    tier2: true,
    source: "https://www.eastersealschicago.org/about (1312 S. Racine Ave., Chicago)",
    note: `A centre on Racine serving Pilsen and the near west side takes in families who are simultaneously dealing with a developmental concern and, often, a precarious status — and the two get tangled, because parents decline evaluations for reasons that have nothing to do with the evaluation. Clinicians read that as refusal. You know what it actually is. That gap between recorded reason and real reason is most of what this conference should be about and rarely is.`,
  },
  {
    org: "Easterseals — Early Learning Center, Hickory Hills (Cook County)",
    firstName: "Jennifer",
    lastName: "Alexander",
    title: "Site Director",
    email: "jalexander@eastersealschicago.org",
    tier2: true,
    source: "https://www.eastersealschicago.org/about (8020 87th Street, Hickory Hills)",
    note: `The southwest suburbs have Arabic and Polish speaking populations large enough to matter and small enough that no vendor prioritises them, so a centre out there is regularly the only place a family gets addressed in their own language all week. Suburban language need is consistently underestimated because it is dispersed rather than concentrated. Saying that in a room full of people who plan around density would be useful.`,
  },
  {
    org: "Two Rivers Head Start Agency, Aurora (Kane County)",
    firstName: "Kelly",
    lastName: "Neidel",
    title: "Head Start Executive Director",
    email: "kneidel@trhsa.org",
    tier2: true,
    source: "Two Rivers Head Start Agency Annual Report 2025, https://www.trhsa.org (the only named individual address published anywhere on the site; the public pages otherwise route to a shared family services inbox)",
    note: `Aurora is the second largest city in Illinois with a majority Latino population and a fraction of the attention Chicago gets in any regional planning conversation, including this one. A Head Start agency there is running language access at scale with none of the institutional infrastructure a hospital would consider baseline. That is a more instructive case than another well-resourced programme describing its best practice.`,
  },
  {
    org: "Metropolitan Family Services — DuPage (Head Start), Wheaton",
    firstName: "Allison",
    lastName: "Delgado",
    title: "Head Start Director",
    email: "delgadoa@metrofamily.org",
    tier2: true,
    source: "Metropolitan Family Services DuPage Head Start annual report for FY2022-23, published at https://www.metrofamily.org — the most recent one on their site, so the role should be confirmed by phone before sending",
    note: `DuPage has real poverty and real linguistic diversity distributed through towns that do not look like they have either, which means services get sized to a perception rather than a population. Head Start enrolment data is one of the few honest counts of who is actually there. Bringing that to a conference whose mental map stops at the city limits would be worth doing.`,
  },
  {
    org: "SGA Youth and Family Services (Early Head Start), Chicago",
    firstName: "Amanda",
    lastName: "McMillen",
    title: "Head Start Director",
    email: "amcmillen@sga-youth.org",
    source: "Start Early, Early Head Start Network FY24 Annual Report (address published verbatim); sga-youth.org itself was returning errors, so the address should be confirmed by phone before sending. Center at 3501 W. 48th Place, serving Brighton Park and McKinley Park",
    note: `Brighton Park and McKinley Park are among the neighbourhoods that absorbed the most recent arrivals with the least warning, and Early Head Start there means infants whose mothers may have delivered days after arriving. The prenatal and postpartum window is where interpretation failures cause the most measurable harm and where the least outreach happens. A description of the last two years from inside that catchment would change the tenor of the room.`,
  },
  {
    org: "Onward Neighborhood House, Chicago",
    firstName: "Darica",
    lastName: "Charles",
    title: "Program Director, Early Childhood Education",
    email: "dcharles@onwardhouse.org",
    source: "https://onwardhouse.org/programs/early-childhood-education",
    note: `A settlement house that has been on the northwest side for over a century has watched the same building serve four or five different language communities in sequence, which is a perspective almost nothing else in this field can offer. The mistakes institutions make with each new group are apparently identical each time and nobody who makes them has the memory to notice. Somebody in the room should be able to say that.`,
  },
  {
    org: "One Hope United, Waukegan Early Learning Center (Lake County)",
    firstName: "Kenneth",
    lastName: "Shackelford",
    title: "Head Start Director",
    email: "kshackelford@onehopeunited.org",
    hold:
      "The Start Early FY24 network report literally prints this as 'Head Start Director Name: Kenneth Shackelford (currently being filled)'. A letter addressed to someone whose post the source itself describes as vacant is the worst possible first contact, and there is no way to resolve it from published material. Worth a phone call to Waukegan before it goes anywhere — this is the only named Lake County early childhood contact in the whole list.",
    source: "Start Early, Early Head Start Network FY24 Annual Report, p.14 (2111 S. Ernie Krueger Circle, Waukegan)",
    note: `Waukegan's early learning families are the ones furthest from every regional service and closest to the industrial employers whose injury rates end up in Lake County emergency rooms.`,
  },
  // ─── Courts, legal aid and immigration law ────────────────────────────────
  // The courts solved a version of this problem thirty years before healthcare
  // admitted it had one: certification, a published language access plan, a
  // named coordinator, and a rule about when a family member may not
  // interpret. Nobody in a hospital has read any of it. These are the people
  // who administer it daily plus the attorneys whose clients live on both
  // sides of the gap.
  // Six of the nineteen are leadership (Meza, Palumbo, Weisberg, Fennell,
  // Mosley, Lee); the rest are staff attorneys, fellows, paralegals, intake
  // and monitoring staff, which is deliberate.
  // Two of these are ADJUNCT addresses, not employer addresses — Carter and
  // Elgindy both work elsewhere and are reachable only through the Loyola
  // clinic page. That is stated in each `source` and must stay stated.
  // Dropped on the compare-notes rule rather than for cause: Elizabeth Cull
  // (Kane County interpreter office is two people, and Nicacio is the one
  // doing the scheduling) and Nicole May (same Amica Center case as
  // Georgevich, so the two letters would be visibly the same letter). Equip
  // for Equality gets four because it is a 50-plus-person statewide body and
  // these are four unrelated units — civil rights, independent monitoring,
  // the special education clinic, and intake. Gavin Martin is excluded
  // because EFE's own directory gives him a mailto pointing at a colleague's
  // address. Stephanie Altman is excluded because Shriver lists her as
  // "Of Counsel; former Director" and a letter to a former director of
  // anything is a letter that gets forwarded. Marilu Moreno at ICIRR is
  // excluded because no title is published for her and I will not write one.
  {
    org: "Administrative Office of the Illinois Courts, Access to Justice Division",
    firstName: "Sophia",
    lastName: "Akbar",
    title: "Senior Program Manager, Language Access",
    email: "sakbar@illinoiscourts.gov",
    tier2: true,
    source:
      "Address published at https://www.illinoiscourts.gov/public/find-a-language-interpreter/e-services-find-a-language-interpreter-language-access-program-resources/ as the contact for pre-approval of interpreter skill-building hours. Title from https://www.2civility.org/ensuring-language-access-in-illinois-courts/ and MAY HAVE CHANGED — the May 2026 Cook County plan names someone else in a similar role. Neither source states her office; AOIC has Chicago and Springfield offices, so Chicago basing is inferred from the division, not confirmed.",
    note: `You're the person listed for pre-approving interpreter skill-building hours, which means you've had to make judgment calls about what actually counts as training. Medical interpreting has the same argument going on with none of the same infrastructure behind it. I'm also interested in the remote-hearing work — video interpreting broke in courts a few years before it broke in clinics, and I don't think anyone wrote down what you learned.`,
  },
  {
    org: "Circuit Court of Cook County, Office of Interpreter Services",
    firstName: "Teresa",
    lastName: "Meza",
    title: "Acting Director, Office of Interpreter Services",
    email: "teresa.meza@cookcountyil.gov",
    tier2: true,
    source:
      "Listed as LAP Contact in the Circuit Court of Cook County Language Access Plan, May 2026, Sec. VIII (https://ocj-web-files.s3.us-east-2.amazonaws.com/documents/2026_Cook_County_Language_Access_Plan_May_2026.pdf)",
    note: `Your plan puts it at 61 full and part-time interpreters with 32 certified, in languages down to Assyrian and Toisan, plus contracted agency coverage when nobody in-house is free. I'd like to ask you about the mornings when the coverage doesn't work — what you do, and who you call. Hospitals hit the same wall and treat it as a vendor's problem rather than a staffing one.`,
  },
  {
    org: "Sixteenth Judicial Circuit (Kane County)",
    firstName: "Jazmin",
    lastName: "Nicacio",
    title: "Assistant Interpreter Coordinator",
    email: "nicaciojazmin@16thcircuit.illinoiscourts.gov",
    source:
      "Sixteenth Judicial Circuit Court Language Access Plan, Part 7, Language Access Contact Information (https://www.illinois16thjudicialcircuit.org/Documents/LAJP.pdf)",
    note: `You and Elizabeth are the two names on the Kane County plan, so I assume the day-to-day scheduling lands on you. The thing I'd want your read on is what happens when a party brings a relative to interpret and the court has to say no. Clinics say no to that far less often, and when they do they usually lose the argument.`,
  },
  {
    org: "Loyola University Chicago School of Law, Health Justice Project",
    firstName: "Alice",
    lastName: "Setrini",
    title: "Clinical Teaching Fellow",
    email: "asetrini@luc.edu",
    source:
      "https://www.luc.edu/law/academics/clinical-programs/healthjusticeproject/aboutus/ — the same bio states she previously managed Legal Aid Chicago's Medical-Legal Partnerships Project.",
    note: `You've now seen medical-legal partnership from the legal aid side and from the law school side, which is a fairly rare vantage point. My interest is narrower than the usual MLP conversation: what happens to an intake done through a phone interpreter, and whether anything gets lost there that later turns into a bad case. You'd know better than most whether that's a real failure mode or one I've invented.`,
  },
  {
    org: "Loyola University Chicago School of Law, Health Justice Project",
    firstName: "Martha Laura",
    lastName: "Garcia-Izaguirre",
    title: "Supervising Attorney and Clinical Fellow",
    email: "mgarcia15@luc.edu",
    source:
      "https://www.luc.edu/law/academics/clinical-programs/healthjusticeproject/aboutus/",
    note: `You supervise the students doing the actual client interviews, which makes you the one who catches it when an interview goes sideways. I'm interested in the bilingual-attorney question specifically — the courts have a formal answer about when speaking the language is enough and when you still need an interpreter, and healthcare mostly doesn't. Curious whether you apply a rule or a feel.`,
  },
  {
    org: "Legal Council for Health Justice",
    firstName: "Meghan",
    lastName: "Carter",
    title: "Senior Staff Attorney",
    email: "mcarter12@luc.edu",
    tier2: true,
    source:
      "Address and adjunct title published at https://www.luc.edu/law/academics/clinical-programs/healthjusticeproject/aboutus/, which also identifies her as Senior Staff Attorney at Legal Council for Health Justice. THIS IS HER LOYOLA ADJUNCT ADDRESS, not a Legal Council address — Legal Council's public staff page lists no attorney emails.",
    note: `Legal Council's model puts you inside the clinic rather than waiting for a referral to arrive, which is the setting where the interpreter question stops being theoretical. A client can be entitled to a certified interpreter in a courtroom on Tuesday and get a bilingual medical assistant on Thursday for a conversation with higher stakes. I'd like to know whether your clients notice that difference or whether only you do.`,
  },
  {
    org: "Legal Aid Chicago",
    firstName: "Mona",
    lastName: "Elgindy",
    title: "Supervisory Attorney, Medical Legal Partnership Group",
    email: "melgind@luc.edu",
    tier2: true,
    source:
      "Address and adjunct title published at https://www.luc.edu/law/academics/clinical-programs/healthjusticeproject/aboutus/, which identifies her as Supervisory Attorney in Legal Aid Chicago's Medical Legal Partnership Group. Recovery Legal Care co-director role from https://legalaidchicago.org/newsroom/in-the-news/uchicago-medicine-legal-aid-chicago-launch-bedside-program-to-provide-in-hospital-legal-support-for-trauma-patients-injured-by-violence/. THIS IS HER LOYOLA ADJUNCT ADDRESS, not a Legal Aid Chicago address.",
    note: `Recovery Legal Care does bedside intake with trauma patients at UChicago Medicine, which is about the hardest possible setting to get interpretation right — the patient is injured, the family is there, and nobody is in a state to object to whoever ends up doing it. Courts eventually wrote rules about family members interpreting because the errors were provable on the record. There's no record in a trauma bay, and I'd like your view on what that changes.`,
  },
  {
    org: "Legal Aid Chicago",
    firstName: "Lisa",
    lastName: "Palumbo",
    title: "Director of Immigrants & Workers' Rights Practice Group",
    email: "lpalumbo@legalaidchicago.org",
    tier2: true,
    source:
      "Title from the legalaidchicago.org full staff listing. Address from her own signature block in Garcia v. Pioneer Hi-Bred International, filed 2024-04-15 (courtlistener.com/docket/18709701/137/), given as her address of record for e-service at Legal Aid Chicago, 120 S. LaSalle St., Suite 900, Chicago 60603. A masked ZoomInfo listing showed the same address; that was ignored and only the filing used. This is the oldest address in the file — 2024.",
    note: `Garcia v. Pioneer is a multi-plaintiff action for Spanish-speaking farmworkers, so I'd guess most of the facts in it reached you through an interpreter before they were ever a pleading. What I'd want to ask is what you do when the interpretation itself is the weakest link in your own evidence. Clinicians have the identical problem and no procedure for it at all.`,
  },
  {
    org: "National Immigrant Justice Center",
    firstName: "Mary",
    lastName: "Georgevich",
    title: "Senior Litigation Attorney",
    email: "mgeorgevich@immigrantjustice.org",
    tier2: true,
    source:
      "Title from the NIJC staff page, Wayback snapshot 2026-07-16 (web.archive.org/web/20260716191513/https://immigrantjustice.org/about-nijc/staff/) — the live site is captcha-walled. Address from her own signature block in Z. v. U.S. Dept. of Homeland Security, filed 2026-07-22 (courtlistener.com/docket/73277892/42/), given as her address of record at NIJC's Chicago office, 111 W. Jackson Blvd., Suite 800.",
    note: `You're counsel of record in Amica Center v. EOIR, which is about detained people losing the programming that told them what their rights were. Hospitals have a smaller version of that — the notice of rights exists, it's in English, and nobody reads it out loud. I don't know whether that's a legal problem or just a bad habit, and I'd rather ask someone litigating the harder version of it.`,
  },
  {
    org: "National Immigrant Justice Center",
    firstName: "Gerardo",
    lastName: "Romo",
    title: "Equal Justice Works Fellow",
    email: "gromo@immigrantjustice.org",
    tier2: true,
    source:
      "Title from the NIJC staff page, Wayback snapshot 2026-07-16. Address from his own signature block in Z. v. DHS, filed 2026-07-22 (courtlistener.com/docket/73277892/42/), given as his address of record at NIJC's Chicago office.",
    note: `You're early in a fellowship on NIJC's federal litigation team, and I mention that because the invitation is genuinely open at that stage — most of this room is clinical and mid-career, and it would be a better conference if it weren't. If detention-side language access is anywhere near what your fellowship touches, almost nobody attending has heard it described from that direction.`,
  },
  {
    org: "Equip for Equality",
    firstName: "Andrea",
    lastName: "Meneses",
    title: "Paralegal, Civil Rights Team",
    email: "andrea.meneses@equipforequality.org",
    source:
      "Published staff directory, https://www.equipforequality.org/about/staff-directory/ (Chicago office, 312-600-3056)",
    note: `You're case support on the civil rights team, which usually means you're the one talking to the client in between the milestones. I'd like people in the room who do intake and follow-up rather than only the people who argue the case, because the language problems tend to show up in the gaps.`,
  },
  {
    org: "Equip for Equality",
    firstName: "Myria",
    lastName: "Freeman",
    title: "Senior Clinical Monitor, Independent Monitoring Unit",
    email: "myria@equipforequality.org",
    tier2: true,
    source:
      "Published staff directory, https://www.equipforequality.org/about/staff-directory/ (Chicago office, 312-766-3591)",
    note: `Monitoring puts you inside facilities looking at how residents are actually treated, which is a different vantage point from anyone who works in one. What I'd want to ask is whether a language barrier ever becomes a documented finding, or whether it stays something you notice and can't cite.`,
  },
  {
    org: "Equip for Equality",
    firstName: "René",
    lastName: "Valenzuela",
    title: "Skadden Fellow and Staff Attorney, Special Education Rights Clinic",
    email: "rene@equipforequality.org",
    tier2: true,
    source:
      "Published staff directory, https://www.equipforequality.org/about/staff-directory/ (Chicago office, 312-757-6718). His individual case focus is not published.",
    note: `The special education rights clinic is one of the few places a parent gets to push back on an evaluation, and plenty of those evaluations were done across a language gap to begin with. Whether the district got the parent an interpreter for the IEP meeting is the kind of detail that either is or isn't in the file. I'd like to hear which it usually is.`,
  },
  {
    org: "Equip for Equality",
    firstName: "Mari",
    lastName: "Monteiro",
    title: "Intake and Traumatic Brain Injury Project Manager and Attorney",
    email: "mariangela@equipforequality.org",
    source:
      "Published staff directory, https://www.equipforequality.org/about/staff-directory/ (Chicago office, 312-895-7358)",
    note: `You run intake, so you hear the complaint before anyone has shaped it into anything. That's the version I'm most interested in — how many callers can't get through the front door of the system they're calling about because of the language it's conducted in. And if the brain injury side of your work has anything to say about capacity and interpretation together, that's a conversation nobody is having.`,
  },
  {
    org: "Disability Rights Advocates",
    firstName: "Rachel",
    lastName: "Weisberg",
    title: "Directing Attorney – Illinois",
    email: "rweisberg@dralegal.org",
    tier2: true,
    source:
      "Title and address published at https://dralegal.org/staff-members/rachel-weisberg/. Prior Equip for Equality role and the deaf-prisoner case from https://www.equipforequality.org/news/court-sanctions-illinois-prisons-for-failing-deaf-and-hard-of-hearing-prisoners/",
    note: `You were counsel on the sanctions ruling against IDOC over deaf and hard-of-hearing prisoners waiting months for audiological evaluations and hearing aids. That's the clearest case I know of where a language access failure was also plainly a medical one, and a court treated it that way. I'd like the clinical half of this audience to hear it described as something other than a scheduling problem.`,
  },
  {
    org: "Hughes Socol Piers Resnick & Dym, Ltd.",
    firstName: "Kelli",
    lastName: "Fennell",
    title: "Partner; Secretary, AILA Chicago Chapter",
    email: "kfennell@hsplegal.com",
    source:
      "Title, practice description and address published at https://www.hsplegal.com/attorneys/kelli-fennell; the AILA role and the identical address are published at https://ailachicago.org/officers-liaisons/",
    note: `Your caseload — family-based, naturalization, asylum, U visa, deferred action — is the one that generates psychological evaluations conducted through an interpreter. Those get written by clinicians who mostly have no training in working through one, and then read by adjudicators as though they were routine. I'd like to know how often you've had an evaluation come back weak for that reason.`,
  },
  {
    org: "Law Offices of KiKi M. Mosley",
    firstName: "KiKi",
    lastName: "Mosley",
    title: "Chapter Chair, AILA Chicago Chapter; solo immigration practitioner",
    email: "kiki@kikislaw.com",
    source:
      "Published on the official AILA Chicago officers page, https://ailachicago.org/officers-liaisons/, and independently on her own firm site kikislaw.com — identical address in both places. Office at 401 S. LaSalle St., Chicago.",
    note: `You're chairing the chapter, so part of this is asking whether it's worth putting in front of your members — but I'd rather you came. The asylum office liaison work is the part I'd want to ask about: what that office does and doesn't do about interpretation during an interview, and whether an applicant has any way to object to it.`,
  },
  {
    org: "Shriver Center on Poverty Law",
    firstName: "Andrea",
    lastName: "Kovach",
    title: "Senior Attorney, Healthcare Justice",
    email: "andreakovach@povertylaw.org",
    source: "https://www.povertylaw.org/about-us/staff-departments/",
    note: `Healthcare justice at the policy level is where language services either get paid for or don't, and the clinical people at this conference mostly meet that as a line item somebody else already decided. If there's a live reimbursement fight in Illinois, I'd want it described by someone who's actually in it rather than summarised by a hospital.`,
  },
  {
    org: "Illinois Coalition for Immigrant and Refugee Rights (ICIRR)",
    firstName: "Brandon",
    lastName: "Lee",
    title: "Director of Communications",
    email: "blee@icirr.org",
    source: "https://www.icirr.org/contact",
    note: `Communications is an odd invitation to a clinical conference, which is roughly why I'm sending it. ICIRR has to say things in a lot of languages quickly, usually about something frightening and often before the agencies have said anything. I'd like to ask how you actually do that — who translates, how fast, and what you do when there's no vendor for the language.`,
  },
  // ─── Higher education, health services research and policy ────────────────
  // The last section, and the one furthest from the usual list. Two seats:
  // the faculty who train the people who will spend a career working across a
  // language gap, and the working clinicians, educators and analysts whose
  // published work is about a language problem they did not call one.
  // Seven of the twenty-one are leadership (Bing, Jackson, Hebert-Beirne,
  // Mora, Barnfield, Johnson, Barrera); the rest are faculty
  // below chair level, staff nurses and educators, analysts, an EMS
  // instructor and a financial counsellor.
  // A sourcing note on the clinicians: several of these addresses come from
  // PubMed affiliation strings, where an author prints their own working
  // address for correspondence. That is a published address in the ordinary
  // sense, but it means the EXACT JOB TITLE is often not stated, and where it
  // is not, the title field says so rather than guessing one. Two Lawrence
  // Hall rows have an EMPTY title for the same reason — the page names them
  // and describes what they handle without ever giving a title, so none is
  // written here.
  // Andrea Ortez at Woods Fund is NOT here, though her address was found:
  // this file already recorded her as dropped because admin@woodsfund.org is
  // a front desk and there was no one specific fact to write a note from.
  // That decision stands; Samantha Collazo took the slot instead. Also
  // dropped: Catherine Balthazar (dean over Bing), Lorena Cruz-Garabito
  // (same eleven-person UI Health team as Viviana Rodriguez), and N. Coley at
  // Lawrence Hall, whose first name is published as an initial only.
  {
    org: "Roosevelt University",
    firstName: "Tammy",
    lastName: "Oberg De La Garza",
    title:
      "Professor of Language and Literacy; Director, Dual Language Teacher Leadership M.A. Program",
    email: "tobergdelagarza@roosevelt.edu",
    source: "https://blogs.roosevelt.edu/dual-language/faculty/",
    note: `The teachers coming out of your programme are going to spend part of their careers being asked to interpret — for a colleague, for a school nurse, for a parent conference nobody planned as a bilingual meeting. It's relied on constantly and trained for almost never. I'd like to know whether the M.A. touches it at all or whether it's the thing they work out in year two.`,
  },
  {
    org: "Roosevelt University",
    firstName: "Erin",
    lastName: "Mackinney",
    title:
      "Associate Professor of ESL/Bilingual Education, College of Humanities, Education & Social Sciences",
    email: "emackinney@roosevelt.edu",
    source: "https://www.roosevelt.edu/profile/emackinney",
    note: `There's a version of the academic-versus-conversational language distinction that turns up in a clinic: a child fluent enough to interpret for a teacher and nowhere near fluent enough to interpret a diagnosis, with no adult in the room able to tell the difference. That's your field's finding before it's ours, and mostly it hasn't crossed over.`,
  },
  {
    org: "Governors State University (University Park, Will County)",
    firstName: "Nicole",
    lastName: "Bing",
    title:
      "Department Chair and Associate Professor, Department of Communication Disorders",
    email: "nbing@govst.edu",
    tier2: true,
    source:
      "Governors State's published Department of Communication Disorders faculty and staff directory (govst.edu). The exact page path was not captured during research — worth re-opening the directory before this one sends, though the name, title and address were read off it together. Catherine Balthazar, the college dean, was on the same page and deliberately not used.",
    note: `Telling a disorder from a difference in a bilingual child is still the hardest call in your field and one of the fastest ones made, usually by whoever had an opening in their schedule. Governors State sits in a part of the region where it gets made a lot. I'd like a communication disorders view in a room that will otherwise be mostly physicians.`,
  },
  {
    org: "National Louis University",
    firstName: "Kristin",
    lastName: "Lems",
    title:
      "Professor of ESL/Bilingual Education, National College of Education",
    email: "klems@nl.edu",
    source: "https://nl.edu/faculty/l/lems-kristin/",
    note: `Your work is on reading in a second language, which is the part that gets skipped whenever someone says a patient is bilingual. Discharge instructions get handed to people who speak English fine and read it at a level nobody has ever measured. I'd like to know what you'd do to a discharge sheet if somebody let you.`,
  },
  {
    org: "Concordia University Chicago",
    firstName: "Erin",
    lastName: "Real",
    title:
      "Associate Professor of Spanish; Spanish Program Leader, Division of Humanities",
    email: "erin.real@cuchicago.edu",
    source:
      "https://www.cuchicago.edu/faculty/college-of-theology-arts--humanities/division-humanities/erin-real/",
    note: `Whether somebody who has finished four semesters of Spanish should be talking to a patient without an interpreter is a question health systems answer by never asking it. You'd have a defensible answer. I'd like it said out loud in front of people who currently staff on self-reported fluency.`,
  },
  {
    org: "City Colleges of Chicago — Harry S Truman College",
    firstName: "Lee",
    lastName: "Jackson",
    title: "Senior Dean of Adult Education",
    email: "ljackson410@ccc.edu",
    source: "https://www.ccc.edu/truman/site/adult-education/",
    note: `Your adult education students are, demographically, the same people every hospital in this city describes as hard to reach. They come to you voluntarily, at night, after work. Whatever you understand about why they turn up for you and not for a follow-up appointment is worth more than another outreach plan, and I'd rather hear it from you than infer it.`,
  },
  {
    org: "DePaul University",
    firstName: "María Luisa",
    lastName: "Ortega Hernández",
    title:
      "Senior Professional Lecturer, Spanish, Department of Modern Languages",
    email: "mlortega@depaul.edu",
    source: "https://www.depaul.edu/faculty/maria-luisa-ortega-hernandez",
    note: `I'm inviting some language faculty because this is otherwise going to be clinicians talking to clinicians about what is fundamentally a linguistics problem. Register is the specific thing I'd want in the room — the way one speaker sounds different depending on who they're addressing. It's behind a lot of what gets misheard in an exam room and medicine has no name for it.`,
  },
  {
    org: "University of Illinois Chicago — School of Public Health",
    firstName: "Jeni",
    lastName: "Hebert-Beirne",
    title:
      "Professor of Community Health Sciences and Assistant Dean for Community Engagement",
    email: "jheber1@uic.edu",
    source: "https://publichealth.uic.edu/people/?search=Hebert-Beirne",
    note: `Community engagement at a school of public health often means a partnership conducted in English with an organisation that is then quietly expected to do the translating, unpaid. I'd like to hear you say whether that's a fair description, and what UIC does differently if it does anything.`,
  },
  {
    org: "Loyola University Chicago, Parkinson School of Health Sciences and Public Health",
    firstName: "Nallely",
    lastName: "Mora",
    title:
      "Research Assistant Professor, Public Health Sciences; Program Director, Master of Public Health",
    email: "namora@luc.edu",
    source:
      "https://www.luc.edu/parkinson/ourpeople/facultystaffprofiles/nallelymorafaculty.shtml",
    note: `You decide what an MPH is required to contain. Language access is in almost none of them and graduates walk into it in their first job. I'd want to ask what it would actually take to put it in a curriculum, and whether you think it belongs there or somewhere else.`,
  },
  {
    org: "Health & Medicine Policy Research Group",
    firstName: "Mayra",
    lastName: "Diaz",
    title: "Senior Policy Analyst",
    email: "mdiaz@hmprg.org",
    source: "https://www.hmprg.org/our-people/",
    note: `Policy is where language services either become a reimbursable service or stay an unfunded expectation, and most of the clinicians coming to this have never seen that argument written down anywhere. If HMPRG has a position on it, or a considered reason for not having taken one, I'd like it in the room.`,
  },
  {
    org: "Lawrence Hall — Community Wellness",
    firstName: "Aaron",
    lastName: "Brown",
    title: "",
    email: "abrown@lawrencehall.org",
    tier2: true,
    source:
      "https://lawrencehall.org/our-programs/community-wellness/ — address printed on the page. NO TITLE IS PUBLISHED for him; the page says he handles JAC referrals and nothing more, so the title field is left empty rather than inferred. Programme serves South Shore, Auburn Gresham, Austin, Englewood, Humboldt Park, North Lawndale, Roseland and East/West Garfield Park.",
    note: `You handle the JAC referrals, so the young people who reach you have already been through at least one system that made a decision about them. If a family's English was part of why an early conversation went badly, you'd be one of very few people positioned to notice it after the fact. This is billed as a health conference, but the referral chain runs through both.`,
  },
  {
    org: "Lawrence Hall — Community Wellness",
    firstName: "Francesca",
    lastName: "Valenziano",
    title: "",
    email: "fvalenziano@lawrencehall.org",
    tier2: true,
    source:
      "https://lawrencehall.org/our-programs/community-wellness/ — address printed on the page. NO TITLE IS PUBLISHED; the page says she oversees the mentoring programme. Title deliberately left empty.",
    note: `You oversee the mentoring side, so you're matching adults to young people and thinking hard about who fits with whom. I'd guess language comes into that — a mentee whose parents don't speak English is a different matching problem, and the mentor ends up doing more than mentoring. I'd like to know if you match on it deliberately or if it sorts itself out.`,
  },
  {
    org: "Cook County Health — John H. Stroger Jr. Hospital",
    firstName: "Ugoeze",
    lastName: "Otome",
    title:
      "Clinician-researcher, John H. Stroger Jr. Hospital of Cook County (exact job title is not printed in the source)",
    email: "ugoeze.otome@cookcountyhealth.org",
    tier2: true,
    source:
      "PubMed PMID 41361030 — 'Readmission rates before and after the implementation of 2022 revised AAP clinical practice guidelines for the management of neonatal hyperbilirubinemia: a single center study,' J Perinatol 2026. The address is printed literally in her affiliation string ('John H. Stroger Jr. Hospital of Cook County, Chicago, IL, USA. ugoeze.otome@cookcountyhealth.org.'), which also documents the Chicago siting.",
    note: `Your readmission study is about what happens after a family goes home holding instructions, which is exactly the point where a language problem stops being observable to anyone in the building. Stroger's population makes that a sharper question than it would be almost anywhere else. I don't know whether the data can separate the families who couldn't follow the plan from the ones who couldn't get back — but if it can, I'd like to hear about it before it's written up.`,
  },
  {
    org: "University of Chicago Medicine",
    firstName: "Joy",
    lastName: "Ayemoba",
    title:
      "Division of Pediatric Surgery, University of Chicago Medical Center (exact job title is not printed in the source)",
    email: "jayemoba@uchicagomedicine.org",
    tier2: true,
    source:
      "PubMed PMID 40344996 — 'Addressing disparities in telehealth access for children on the Southside of Chicago,' Am J Surg 2025. The address is printed as the electronic address in her affiliation.",
    note: `The telehealth access work is the clearest description I've read of a service built to remove a barrier and installing a different one on the way in. The language layer of that is worse than the broadband layer and studied far less — a video visit run through a phone interpreter is a three-way call in which nobody can see who is speaking. If your data touches that at all, even at the edges, I'd like to hear it.`,
  },
  {
    org: "University of Chicago Medicine",
    firstName: "Eileen",
    lastName: "Dowdall",
    title: "Central Nursing Education — MSN, CNL, RN, CMSRN",
    email: "eileen.dowdall@uchicagomedicine.org",
    tier2: true,
    source:
      "PubMed PMID 41871118 (J Nurs Care Qual 2026), where the byline prints both the unit and the address: 'Eileen Dowdall, MSN, CNL, RN, CMSRN, Central Nursing Education, University of Chicago Medicine, Chicago, Illinois... (eileen.dowdall@uchicagomedicine.org; dowdalle@morainevalley.edu)'. She also holds a concurrent clinical education role at OSF Little Company of Mary in Evergreen Park. Escape-room teaching work is PMID 40865021.",
    note: `You built an escape room to refresh critical skills and a movement-based method for teaching mobility, which tells me you concluded some time ago that lecturing nurses at them doesn't work. I've got a session on communicating with a patient through an interpreter and I keep hitting the same wall — it's a skill, and I'd be teaching it with slides. I'd take any advice you have. I'd rather you came.`,
  },
  {
    org: "Illinois Chapter, American Academy of Pediatrics (ICAAP)",
    firstName: "Lauren",
    lastName: "Erbach Barnfield",
    title: "Program Director, Mental Health and Development",
    email: "lbarnfield@illinoisaap.com",
    tier2: true,
    source:
      "https://illinoisaap.org/about-2/ — NOTE the address domain is illinoisaap.COM while the website is illinoisaap.ORG. Verified twice; the .com is what is published and is not a typo.",
    note: `Developmental screening is where a language barrier does the most damage per minute: a screen that depends entirely on what a parent reports, administered through whoever happened to be free. Your programme sits over that for paediatricians across the state. I'd like to know what ICAAP currently tells them to do when the screen and the family don't share a language.`,
  },
  {
    org: "Loyola University Medical Center EMS System (Maywood, Cook County)",
    firstName: "Samantha",
    lastName: "Collazo",
    title: "EMS Instructor; Licensing and Continuing Education Specialist",
    email: "samantha.collazo@luhs.org",
    tier2: true,
    source:
      "Loyola Medicine EMS staff directory (loyolamedicine.org/ems/staff) — address published beside her name and title, listed there as 'Sam Collazo, BA, EMT-P'.",
    note: `You sit on both sides of it — teaching, and tracking whether everyone's hours and licenses are where they need to be. That means you've got a clear view of what people are actually choosing to spend con-ed time on. What I'm trying to find out is whether anything currently in the CE menu touches assessing a patient who can't give you a history, or whether it's all skills and cards.`,
  },
  {
    org: "Beloved Community Family Wellness Center",
    firstName: "Margie",
    lastName: "Johnson",
    title: "Chief Executive Officer",
    email: "mjohnson@bcfwc.org",
    tier2: true,
    source:
      "https://www.bcfwc.org/our-services confirms the organisation and her role. THE ADDRESS ITSELF came from a third-party chamber of commerce directory rather than from bcfwc.org — medium confidence. Worth a bounce test or a phone check before this one sends.",
    note: `Working at family level rather than patient level means you see the part clinics never do, which is what happens to the instructions after the visit ends. I'd like this conference to have somebody in it who isn't describing a hospital, and a wellness centre is a different vantage point from a clinic even when the medicine is the same.`,
  },
  {
    org: "Illinois Association of School Nurses / UIC College of Nursing",
    firstName: "Gloria",
    lastName: "Barrera",
    title:
      "Foundation Liaison, IASN; Director of the RN to BSN Program, UIC College of Nursing",
    email: "gloriabarrera.rn@gmail.com",
    tier2: true,
    source:
      "https://www.iasn.org/board-of-directors (address published there by her, a personal account used professionally) and https://nursing.uic.edu/news-stories/gloria-barrera-named-director-of-rn-bsn-program/ for the UIC role. She is NOT on the current Downers Grove South health services roster, whatever older pages say.",
    note: `School nursing is where I'd start if I wanted to find the children in this region whose health information has never once reached their parents in a language they read. You're teaching working nurses on the RN-to-BSN side at the same time, so you see both the practice and what people were never taught in the first place. And since you're on IASN's board — is this worth putting in front of that membership, or not?`,
  },
  {
    org: "Northwestern Medicine Palos Hospital (Palos Heights, Cook County)",
    firstName: "Angela",
    lastName: "Helms",
    title:
      "Healthcare Epidemiology and Infection Prevention (department printed in the affiliation; exact job title unconfirmed)",
    email: "angela.helms@nm.org",
    tier2: true,
    source:
      "PubMed PMID 37939850 — first author of 'Investigation of a pseudo-outbreak of Mycobacterium franklinii,' Am J Infect Control 2024. The address is printed inside that record's affiliation string, which names Northwestern Medicine Palos Hospital, Palos Heights, IL as her site.",
    note: `You ran the investigation that identified and closed out the Mycobacterium franklinii pseudo-outbreak. Infection prevention isn't an obvious invitation to a conference about language, except that isolation precautions get explained at a doorway, quickly, to somebody who is already frightened — and the written version may or may not exist in their language. I'd like to know whose job that is in your building, or whether it turns out to be nobody's.`,
  },
  {
    org: "UI Health (University of Illinois Hospital & Health Sciences System)",
    firstName: "Viviana",
    lastName: "Rodriguez",
    title: "Financial Counselor (CAC, CHAA)",
    email: "vrod@uic.edu",
    tier2: true,
    source:
      "UI Health's published 'Meet the Financial Counseling Team' page, which prints each counsellor's name, credentials and address. Lorena Cruz-Garabito is on the same eleven-person team and was deliberately NOT used — two of these letters landing in one team is exactly the thing that gives the whole list away.",
    note: `Financial counselling might be the hardest conversation in the building to interpret: the vocabulary is bureaucratic, the stakes are immediate, and the patient is being asked to disclose things they may not want to say to a stranger on a phone line. You're doing it as a certified application counsellor, so you're translating in both directions at once. I'd like the clinical people at this to hear that part described by somebody who does it.`,
  },
];

// Researched and deliberately not represented above:
//   • IPHCA grants staff addresses (agarner@, rmcguire@iphca.org) — IPHCA is
//     already a sponsorship prospect and these are not the decision-makers.
//   • Endeavor Health publishes no named equity, community health, or
//     interpreter leader among its 23 listed executives.
//   • CHICATA, the most Chicago-local spoken-language interpreter association,
//     returns 403 on every route; the Illinois Association of the Deaf site has
//     an expired certificate. Both are worth retrying by hand.
//   • Sinai Chicago, Saint Anthony, and Humboldt Park Health all failed to load
//     during research (403/503/DNS). They are the obvious gap in this list.
// Stale-data traps caught while researching, so nobody repeats them: Berneice
// Mills-Thomas is NOT Near North's CEO (Tristé Lieteau Smith is), Toni Bush is
// NOT PCC's CEO (Alyssa Sianghio is), Ngozi Ezike still appears on an IDPH
// about page but left in 2022, and Marcos DeLeon has been replaced at Rush.

// ── Second wave: dead ends, traps and judgement calls ──────────────────────
//
// Read this before adding anyone. Every item below cost real time to find out.
//
// Addresses that look like contacts and are not:
//   • Catholic Charities' page contains eceniceros@catholiccharities.net inside
//     a <script> tag. It is a third-party software licence string, not a
//     person. Do not mail it.
//   • Every mailto href on Mano a Mano's team page points at dortiz@mamfrc.org
//     because of a copy-paste error in their markup. The per-person addresses
//     are correct only in the visible text, so read the text, not the link.
//     mamfrc.org/leadership-team/ 404s despite being linked site-wide.
//   • edelgado@orazoncs.org (a Corazón intern) is missing the "c" in
//     "corazoncs" exactly as published. Reproduced verbatim in the hold block
//     rather than silently corrected. Same policy for the other three in the
//     "addresses that look wrong" section: do not guess at the fix.
//
// People who have moved on, per the organisations themselves:
//   • Celeste Flores has left Mano a Mano (their own Instagram, 2025-03-27).
//   • Vanessa Melgoza appears to have left Corazón.
//   • Anna Yankelev's Lake County address is stale; she is at HMPRG now.
//   • HACES's own staff page still lists founder Maria Elena Jonas as ED. She
//     is not. The page is wrong, not the research.
//   • PTMHC's mailto links are shifted by one row, which labels Joseph
//     Vasilevski's line with his retired predecessor's address.
//
// Unresolved conflicts, left unresolved on purpose:
//   • Marcela Escobar's UIC page claims she is HDA Chicago president; HDA lists
//     Carolina Garcia. • Jose Baltierra vs Carly Luque at NAHJ Chicago.
//   • Alberto Mendez has two different titles on two Instituto pages.
//   • CHICATA's officer slate is headed "Elected Officers (2024-2025)" and may
//     simply be out of date.
//   • Karina Garcia at the Aurora Regional Hispanic Chamber appears only in a
//     LinkedIn snippet, never on the chamber's own site. Not used.
//
// Domains that are gone or hostile:
//   • esperanzacommunityservices.org is now parked/spam.
//     panafricanassociation.org is squatted. Nuestro Center no longer exists
//     (NXDOMAIN; merged into "Nuestro Josselyn"). pasoaction.org is parked with
//     no capture since 2022-12-18, though Marien Casillas Pabellon and Nancy
//     Salgado are real. There is no Illinois Welcoming Center in Melrose Park.
//     The Town of Cicero health department page is an empty stub.
//   • Bot walls, all worth retrying by hand: lakecountyil.gov,
//     cicerocommunitycollaborative.org (521), accessdupage.org, peoplesrc.org,
//     family-focus.org, ssipchicago.org, chpofil.org, lakecountycf.org.
//
// Organisations that publish zero individual staff addresses, so everyone from
// them sits in the leads block: ICIRR (no staff page at all), Kane County,
// Erie Family Health, Josselyn, HACES, Nicasa, Will County, Greater Family
// Health, LRII, Onward House. Lake County runs a promotoras program out of
// North Shore Health Center and publishes no outreach, CHW or language-access
// position to go with it.
//
// Dropped for want of one specific verifiable fact, which is the bar for a note
// here: Jamal Ross (friendhealth@friendhealth.org) and Andrea Ortez
// (admin@woodsfund.org). Carl Wolf at Respond Now is real and reachable but is
// a general anti-poverty fit rather than an immigrant-serving one.
//
// A note on the summarising fetch: asking a fetch tool to "get the contacts"
// from ata-md.org/leadership-council/ returned eight confident, specific,
// entirely invented addresses. The raw HTML contains exactly one address. Pull
// raw HTML for every address in this file. No exceptions, however plausible.

/** The rows the loader will actually act on: real, published addresses only. */
export function loadableChicagoTargets(
  { includeSecondWave = false }: { includeSecondWave?: boolean } = {},
): ChicagoTarget[] {
  const seen = new Set<string>();
  return CHICAGO_TARGETS.filter((t) => {
    const email = t.email.trim().toLowerCase();
    if (!email || !email.includes("@")) return false;
    // A real address we have chosen not to use. See `hold` on the type.
    if (t.hold) return false;
    // Default is the first wave only: the hundred whose name, title and
    // address were all read off one current page owned by their own employer.
    // Everyone else is real and sendable but worth a bounce test first, so
    // they wait for an explicit second-wave load rather than riding along.
    if (t.tier2 && !includeSecondWave) return false;
    // One letter per address: several people can share a front-desk mailbox,
    // and two "personal" notes landing in one inbox is the exact tell we are
    // trying to avoid.
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}
