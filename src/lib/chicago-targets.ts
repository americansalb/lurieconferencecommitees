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
// mail merge, and it is the reason the notes are long and the list is short.
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
    note: `I came across your work on liquid medication dosing errors among Hispanic parents with limited English proficiency, and then went and read the language-concordant drug label study, and I have not been able to stop thinking about either one. Most conversations about language access in healthcare stop at the encounter, the interpreter in the room, the consent form. Your ConcordantRx work follows the patient home, to the moment a parent is standing at a kitchen counter with a syringe and a label, and asks whether we got that part right. That is the part of the problem I hear the least about and worry about the most.`,
  },
  {
    org: "Health Literacy & Learning at Northwestern",
    firstName: "Stacy",
    lastName: "Cooper Bailey",
    title: "Professor of Medicine; Director, CAHRA Health Literacy & Learning Program (HeLP)",
    email: "stacy-bailey@northwestern.edu",
    source: "https://www.feinberg.northwestern.edu/sites/cahra/about/our-team/",
    note: `Health literacy and language access keep turning out to be the same problem approached from two directions, and the Health Literacy and Learning Program is one of the few places I know of that treats it seriously enough to have built a research program around it. A family can be handed discharge instructions in flawless Spanish and still walk out not knowing what to do; the translation was fine, the document was never comprehensible to begin with. That distinction gets flattened constantly in language-access conversations, usually by people who have never had to measure it.`,
  },

  // ─── Medicine and public health at UIC ────────────────────────────────────
  {
    org: "UIC's Hispanic Center of Excellence",
    firstName: "Monica",
    lastName: "Vela",
    title: "Director, Hispanic Center of Excellence; Professor of Medicine",
    email: "mvela@uic.edu",
    source: "https://medicine.uic.edu/profiles/vela-monica/",
    note: `You gave a talk last September called "Language Concordant Care and its Contributions to Health Equity," which is close enough to the subject of this conference that I read the description twice to make sure I had not somehow found our own agenda by mistake. The Hispanic Center of Excellence has been at UIC since 1991, which means it predates nearly every institutional equity office in this city and has outlasted a fair number of them. That kind of longevity usually means the work was real before it was fashionable.`,
  },
  {
    org: "the Odehmenan Health Equity Center",
    firstName: "Adriana",
    lastName: "Black",
    title: "Director of Health Equity Innovation and Collaboration; Founding Director, Odehmenan Health Equity Center",
    email: "ablack3@uic.edu",
    source: "https://publichealth.uic.edu/profiles/adriana-black",
    note: `Naming a health equity center Odehmenan, this heart of ours in Potawatomi, is a choice most institutions would have workshopped down into something safer. It also says something about how the center thinks about language: that a word carries a claim, and that translating it away costs you the claim. Your center hosted Dr. Vela's talk on language-concordant care last fall, so I suspect none of this is a new argument to you.`,
  },
  {
    org: "UIC School of Public Health",
    firstName: "Amparo",
    lastName: "Castillo",
    title: "Clinical Assistant Professor, Community Health Sciences",
    email: "amparo@uic.edu",
    source: "https://publichealth.uic.edu/profiles/amparo-castillo/",
    note: `The Diabetes Empowerment Education Program is one of the few health education programs I can point to that was designed for low health literacy from the start rather than translated into it afterward, and having a physician who trains the trainers is a large part of why. Most of what passes for culturally appropriate patient education in this country is an English program run through a translator and a stock photo swap. Yours was built the other way around.`,
  },
  {
    org: "UIC's Transnational Research and Practice Lab",
    firstName: "Kelechi",
    lastName: "Ibe-Lamberts",
    title: "Clinical Associate Professor; Chair, APHA Caucus on Refugee and Immigrant Health",
    email: "klamber4@uic.edu",
    source: "https://blst.uic.edu/profiles/ibe-lamberts-kelechi",
    note: `Language access conversations in this country have a way of collapsing into Spanish and then stopping, which leaves African immigrant families, often multilingual, often navigating a language the hospital has no contract for, somewhere off the edge of the plan. The Interconnected African Wellness Assembly and your work chairing the APHA refugee and immigrant health caucus are both aimed squarely at that gap. I would rather have that in the room for this than discover afterward that we talked around it for two days.`,
  },
  {
    org: "UIC Occupational Therapy",
    firstName: "Mansha",
    lastName: "Mirza",
    title: "Faculty, Department of Occupational Therapy (rank not published)",
    email: "mmirza2@uic.edu",
    source: "https://ahs.uic.edu/disability-human-development/faculty/",
    note: `Your research page lists clinical communication with non-English speaking patients as an area, which is a plainer description of this conference's subject than anything we have managed to put on our own website. The disability and refugee side of it is the part I think gets least attention. A family navigating both a language barrier and a rehabilitation system is dealing with two sets of jargon at once, and interpreters are rarely trained for the second one.`,
  },

  // ─── Spanish, heritage language, and bilingual education ──────────────────
  {
    org: "UIC Hispanic and Italian Studies",
    firstName: "Kim",
    lastName: "Potowski",
    title: "Professor of Spanish Linguistics; Director of Undergraduate Studies",
    email: "kimpotow@uic.edu",
    source: "https://hip.uic.edu/people/faculty/",
    note: `Spanish in Chicago has been sitting on my desk for a while now. The reason a conference like this one has to happen in this city and not somewhere else is essentially the argument of that book: Chicago's Spanish is not one language community but many, layered by generation and country of origin and neighborhood, and a hospital that treats it as a single checkbox on an intake form will get it wrong in ways nobody downstream ever traces back. I also watched your TEDx talk, and the framing of monolingualism as something we do to children rather than something that simply happens to them is the sharpest version of that argument I have heard.`,
  },
  {
    org: "UIC Spanish Heritage Language Program",
    firstName: "Angela",
    lastName: "Betancourt-Ciprian",
    title: "Clinical Assistant Professor; Director, Spanish Heritage Language Program",
    email: "abetan3@uic.edu",
    source: "https://hip.uic.edu/profiles/betancourt-ciprian-angela/",
    note: `Nearly every bilingual person working in a Chicago hospital came up through a heritage-speaker pathway, and almost none of them were ever told that the Spanish they grew up with was a professional asset rather than something to apologize for. Directing the Spanish Heritage Language Program puts you at the exact point where that gets decided. I noticed you were on the organizing committee for the Illinois Dual Language Summit too, so you already know what it takes to get people in a room around this.`,
  },
  {
    org: "Loyola University Chicago",
    firstName: "Clara",
    lastName: "Burgo",
    title: "Professor of Spanish",
    email: "cburgo@luc.edu",
    source: "https://www.luc.edu/modernlang/profiles/burgoclara.shtml",
    note: `Clases mixtas took on something most Spanish departments would rather not look at directly: that a heritage speaker and a second-language learner sitting in the same classroom are not doing the same task, and that pretending otherwise costs the heritage speaker more. The same thing happens in hospitals. A bilingual nurse who grew up speaking Spanish at home and a clinician who took Medical Spanish get treated as interchangeable resources, and it is almost always the first one who ends up absorbing the work without the title.`,
  },
  {
    org: "Truman College",
    firstName: "Madeline",
    lastName: "Troche-Rodriguez",
    title: "Faculty Director, Transitional Bilingual Learning Community",
    email: "mtroche-rodriguez@ccc.edu",
    source: "https://www.ccc.edu/truman/departments/transitional-bilingual-learning-community/",
    note: `The Transitional Bilingual Learning Community has been running since 2002, which means you have moved more than two decades of Chicago's English learners into college-credit coursework without ever asking them to trade one language for the other. That premise, that a student's first language is the thing to build on rather than the thing to get past, is exactly the argument this conference is making about hospitals. You have a considerably longer track record of proving it than we do.`,
  },

  // ─── Hospitals and health systems ─────────────────────────────────────────
  {
    org: "the RUSH BMO Institute for Health Equity",
    firstName: "David",
    lastName: "Ansell",
    title: "SVP Community Health Equity; Co-Director, RUSH BMO Institute for Health Equity",
    email: "David_Ansell@rush.edu",
    source: "https://rushu.rush.edu/rush-medical-college/departments/department-internal-medicine/division-community-global-health-equity",
    note: `Rush lists you on both its health equity experts page and its Spanish-speaking experts page, which is a combination I did not find anywhere else in the city. Most institutions keep those two lists staffed by entirely different people, and the gap between them is roughly the subject of this conference. The Chicago Health Map makes the same point geographically. A life expectancy gap that large across a few miles is not produced by any one failure, but a family who cannot ask a question in their own language is somewhere inside almost every version of the story.`,
  },
  {
    org: "Shirley Ryan AbilityLab",
    firstName: "Matt",
    lastName: "Ginsberg-Jaeckle",
    title: "Director, Global Patient Services",
    email: "international@sralab.org",
    sharedInbox: true,
    source: "Global Patient Services page, sralab.org",
    note: `"Interpreters are not just a box, where one language goes in, and another comes out." I read that line of yours a while back and it has been doing a lot of work in my head since. The Coleman-funded study on interpreter-mediated aphasia assessments is the same argument with data attached: if you cannot separate the language barrier from the language impairment, you can misdiagnose a person into the wrong year of their life. You also came up through the interpreter booth rather than into it from administration, which is rare enough at director level that I noticed.`,
  },
  {
    org: "UChicago Medicine",
    firstName: "Diala",
    lastName: "Atassi",
    title: "Chief of Global and National Programs",
    email: "international.services@uchospitals.edu",
    sharedInbox: true,
    source: "International Programs page, uchicagomedicine.org",
    note: `At UChicago Medicine, Interpreter Services reports up through International Programs, which is an organizational choice more than an administrative one. It puts language alongside the rest of what it takes to care for someone arriving from outside the system rather than filing it under compliance. Your top five languages run Spanish, Arabic, Cantonese, Polish, Mandarin, which is a fair description of the South Side and not much like the list any national vendor would have predicted. Volume up seventy-one percent since 2015 suggests the demand found you faster than the budget did.`,
  },
  {
    org: "Cook County Health",
    firstName: "Linh",
    lastName: "Dang",
    title: "Chief Experience Officer",
    email: "patientexperience@cookcountyhealth.org",
    sharedInbox: true,
    source: "Leadership page, cookcountyhealth.org (address published in the page's own encoded contact link)",
    note: `Cook County Health staffs Spanish interpreters on site around the clock and Polish on weekdays, which is not a decision anyone reaches from a spreadsheet. It means somebody looked at who actually walks through the door in this county and staffed to that rather than to a national average. Coming from NYC Health and Hospitals, you have now run patient experience in the two American health systems that serve the widest range of languages by some distance. What I would most want to hear is what transfers between them and what does not.`,
  },
  {
    org: "Loyola Medicine",
    firstName: "Michelle",
    lastName: "Peters",
    title: "Regional VP, Community Health & Well-Being",
    email: "LoyolaHealth@lumc.edu",
    sharedInbox: true,
    source: "Community benefit report FY2024 and leadership listing, loyolamedicine.org",
    note: `Loyola's community benefit report puts language assistance at $3,886,246 for fiscal 2024, over thirty thousand minutes of interpreting a month. I have read a lot of these reports and very few break that line out at all, which means most systems either are not tracking it or would rather not publish it. The other number in yours is the one that explains it: roughly one in ten households in your service area is limited English proficient, against about four percent statewide.`,
  },
  {
    org: "UI Health",
    firstName: "Rani",
    lastName: "Morrison Williams",
    title: "Chief Diversity & Community Health Equity Officer",
    email: "UIHealthDiversity@uic.edu",
    sharedInbox: true,
    source: "Diversity and community health equity leadership page, hospital.uillinois.edu",
    note: `Taking on preferred-language data as a data quality problem rather than a courtesy field is an unglamorous choice and the right one. A system that does not reliably know which of its patients need an interpreter cannot staff for it, cannot budget for it, and cannot tell whether anything it tries is working. Being the first person to hold the chief diversity and community health equity role at UI Health means you inherited that question rather than a system that had already answered it.`,
  },
  {
    org: "La Rabida Children's Hospital",
    firstName: "Michele",
    lastName: "Wysoglad",
    title: "VP Development and External Affairs",
    email: "mwysoglad@larabida.org",
    source: "https://www.larabida.org/contact/",
    note: `La Rabida is the only hospital in the region built entirely around children with complex, chronic conditions, which means your families are not passing through. They come back for years, and every one of those return visits is another chance for a language barrier to compound rather than resolve. With more than nine in ten of your patients on Medicaid, I would guess a fair number of those families are doing all of that in a language the system defaults out of. I am writing to you because external affairs is the front door here, and I would be grateful if you pointed this toward whoever at La Rabida owns interpreting, or came yourself.`,
  },

  // ─── Public health, government, and the courts ────────────────────────────
  {
    org: "IDPH's Center for Minority Health Services",
    firstName: "Tiffani",
    lastName: "Saunders",
    title: "Chief, Center for Minority Health Services; IDPH Language Access Plan Coordinator",
    email: "dph.cmhs.info@illinois.gov",
    sharedInbox: true,
    source: "IDPH Language Access Plan approved February 2026, dph.illinois.gov",
    note: `I read the Language Access Plan IDPH approved in February, all the way through, which I suspect is not a large club. The part that stayed with me was not the vendor contracts but the schedule attached to them: training for every front-line and managerial staff member starting this quarter, new hires inside sixty days, I Speak cards in every IDPH building by the end of December. Deadlines are what separate a language access plan from a language access statement, and most of the ones I read do not have any. Since you coordinate that plan, you are also the person who will find out first whether those dates hold.`,
  },
  {
    org: "the Cook County Department of Public Health",
    firstName: "Kiran",
    lastName: "Joshi",
    title: "Chief Operating Officer",
    email: "healthycook@cookcountyhhs.org",
    sharedInbox: true,
    source: "Leadership page, cookcountypublichealth.org",
    note: `Standing up a community behavioral health unit and a community immunization unit inside a suburban county health department means you have twice now had to build a service for people the existing system was not reaching, and in suburban Cook County a large share of those people are not reached because of language before anything else. Behavioral health is the hardest version of it. There is no way to do a competent psychiatric assessment through a family member, and yet a great deal of it still happens exactly that way.`,
  },
  {
    org: "Northwestern's Center for Community Health",
    firstName: "Darius",
    lastName: "Tandon",
    title: "Director, IPHAM Center for Community Health",
    email: "cch@northwestern.edu",
    sharedInbox: true,
    source: "IPHAM Center for Community Health staff page, feinberg.northwestern.edu",
    note: `The Alliance for Research with Chicagoland Communities exists because academic health research has a long habit of arriving in a neighborhood, collecting what it needs, and leaving, and language is usually the first place that asymmetry shows up. A study recruits in English, or recruits in translated English, and then reports findings about a community half of whom could never have enrolled in it. ARCC's whole structure is an attempt to make that harder to do.`,
  },
  {
    org: "the Administrative Office of Illinois Courts",
    firstName: "Noor",
    lastName: "Alawawda",
    title: "Senior Program Manager, Language Access",
    email: "nalawawda@illinoiscourts.gov",
    source: "https://www.illinoiscourts.gov/public/find-a-language-interpreter/",
    note: `The Illinois Court Interpreter Registry is the closest thing this state has to a settled answer on who is qualified to interpret in a high-stakes setting, and healthcare has nothing equivalent. A hospital can put very nearly anyone in the room and still call it access. You have been at the AOIC since roughly the beginning of court interpreter certification here, which means you watched standards get built around a profession in real time, spoken language and sign language both. That is a story I would like the clinicians and interpreters coming to this to hear from someone who was actually there for it.`,
  },
  {
    org: "the Illinois School for the Deaf",
    firstName: "Julee",
    lastName: "Nist",
    title: "Superintendent",
    email: "julee.nist@illinois.gov",
    source: "https://isd.illinois.gov/district-leadership",
    note: `The Illinois School for the Deaf publishes a videophone number for the superintendent's office, which is a small thing that tells me something: leadership there is reachable in ASL directly, not through a relay and a gatekeeper. Most of what gets said about deaf children in healthcare is said by hearing people. The gap between an interpreter being present and a child actually understanding what is about to happen to them is where the damage lives, and the people who see that gap most clearly are the ones working in ASL every day.`,
  },
  {
    org: "the Illinois Public Health Association",
    firstName: "Tracey",
    lastName: "Smith",
    title: "Associate Executive Director for Public Health Practice",
    email: "tsmith@ipha.com",
    source: "https://ipha.com/about/meet-the-team",
    note: `Public health practice in Illinois runs through local health departments that are, in a good many counties, the only door a limited-English family has into the health system at all, and unlike hospitals they have no billing code to hang interpreter costs on. I have been trying to understand how that actually gets handled in practice rather than on paper, and IPHA seems to be where that question would land if it lands anywhere.`,
  },

  // ─── Pediatrics and the interpreting profession ───────────────────────────
  {
    org: "the Illinois Chapter of the AAP",
    firstName: "Abby",
    lastName: "Creek",
    title: "Senior Program Manager, Health Equity Initiatives",
    email: "acreek@illinoisaap.com",
    source: "https://illinoisaap.org/about-2/",
    note: `ICAAP already publishes a bilingual flyer on language interpretation services for pediatric practices, which puts your chapter ahead of most of the state associations I have looked at. Most treat interpreting as a compliance footnote if they mention it at all. Health equity initiatives is where that flyer lives, so I suspect you are the person who has had to field the practical questions from practices that want to do this well and cannot afford a full-time interpreter.`,
  },
  {
    org: "CCHI",
    firstName: "Natalya",
    lastName: "Mytareva",
    title: "Executive Director",
    email: "managing.director@cchicertification.org",
    source: "https://cchicertification.org/about-us/",
    note: `CCHI is the only healthcare interpreter credential I know of that covers ASL alongside spoken languages under one commission, rather than treating deaf patients as a separate problem for a separate body. Most of the field still runs those as two worlds with two vocabularies, and the people who pay for that are the families who need both. This conference is trying to hold them together for two days, which is easier said in a program than done in a room.`,
  },
  {
    org: "MATI",
    firstName: "Amy",
    lastName: "Olen",
    title: "Secretary, MATI Board; Associate Professor, UW-Milwaukee",
    email: "amytolen@uwm.edu",
    source: "MATI board roster (matiata.org) and UW-Milwaukee faculty directory",
    note: `Ethics in community interpreting is the part of this that almost never makes it onto a conference program, because it does not resolve into a best practice. An interpreter who has just heard a clinician say something untrue has a genuinely hard decision to make, and no policy manual has ever made it an easy one. MATI's membership covers Illinois as well as Wisconsin, and a good share of the interpreters working in Chicago hospitals sit inside it.`,
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
    hold: "Same UIC occupational therapy department as Mansha Mirza, who is getting the letter.",
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
  // CCHI and NBCMI: one letter per organization. Natalya Mytareva above has it.
  {
    org: "CCHI",
    firstName: "Amanda",
    lastName: "David",
    title: "Commissioner (ASL); term Oct 2024 - Oct 2027",
    email: "adavid@cchicertification.org",
    hold: "Natalya Mytareva at CCHI is getting the letter; three notes into one small national office is the tell we are avoiding.",
    source: "https://cchicertification.org/about-us/",
    note: `Being a Sign Language Designated Medical Interpreter inside a medical school is a job almost nobody holds, and the reason almost nobody holds it is the reason this conference exists.`,
  },
  {
    org: "CCHI",
    firstName: "Marisa",
    lastName: "Rueda Will",
    title: "Commissioner; term Oct 2024 - Oct 2027",
    email: "mruedawill@cchicertification.org",
    hold: "Natalya Mytareva at CCHI is getting the letter.",
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
    hold: "Shares the patient experience mailbox with Linh Dang, who is getting the letter.",
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

/** The rows the loader will actually act on: real, published addresses only. */
export function loadableChicagoTargets(): ChicagoTarget[] {
  const seen = new Set<string>();
  return CHICAGO_TARGETS.filter((t) => {
    const email = t.email.trim().toLowerCase();
    if (!email || !email.includes("@")) return false;
    // A real address we have chosen not to use. See `hold` on the type.
    if (t.hold) return false;
    // One letter per address: several people can share a front-desk mailbox,
    // and two "personal" notes landing in one inbox is the exact tell we are
    // trying to avoid.
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}
