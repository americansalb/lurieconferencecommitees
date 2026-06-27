// Hand-curated starter prospect list for the bulk sponsor/exhibitor inviter.
// These are web-verified, fresh targets with a real published contact email.
// Intentionally LEFT OUT: already-confirmed sponsors (e.g. LanguageLine, paid)
// and orgs tied to confirmed speakers (Equiti/Alonzo, Tica/Will, NCIHC/Speroff),
// which are warm relationships to handle personally, not cold invites.
//
// This only powers the "Load suggested targets" convenience button: it pre-fills
// the paste box. Nothing is sent until a team member reviews the preview and
// clicks. Edit freely. Tab-delimited so commas inside notes stay safe.

type Target = [company: string, contact: string, email: string, website: string, note: string];

const TARGETS: Target[] = [
  ["CyraCom", "", "getstarted@cyracom.com", "https://www.cyracom.com", "Your healthcare interpreting platform is built for exactly the clinicians and interpreters in our room, and we'd be glad to give CyraCom a table in front of them."],
  ["AMN Healthcare Language Services", "", "lscs@amnhealthcare.com", "https://www.amnhealthcare.com/language-services/", "Our interpreters and hospital leaders rely on your video interpreting every shift; we'd love to host you as an exhibitor where they gather."],
  ["Propio Language Services", "Lisa Stokesbury", "lstokesbury@propio.com", "https://propio.com", "Propio's growth in healthcare interpreting maps right onto our attendees; an exhibitor table puts you in front of the people who buy what you build."],
  ["MasterWord Services", "", "info@masterword.com", "https://www.masterword.com", "MasterWord's training and language services are exactly what our interpreters and hospital partners come to discover; join us as an exhibitor."],
  ["Wordly", "", "contact@wordly.ai", "https://www.wordly.ai", "We'd love to explore Wordly powering live AI translation for the conference itself, plus an exhibitor table; a perfect showcase for where this is all heading."],
  ["Jeenie", "", "support@jeenie.com", "https://jeenie.com", "Jeenie's on-demand interpreting energy fits our forward-looking track; we'd love an exhibitor presence from you."],
  ["Gallaudet University", "", "sponsorship@gallaudet.edu", "https://gallaudet.edu", "Your programs are a natural draw for our access-focused audience; an exhibitor table introduces them to future partners and students."],
  ["CCHI", "", "admin@cchicertification.org", "https://cchicertification.org", "So many of our attendees hold your certification; CCHI belongs in the room, and we'd be glad to offer you a complimentary partner table."],
  ["IMIA", "", "outreach@imiaweb.org", "https://www.imiaweb.org", "Our certified-interpreter audience is your membership; we'd love to give IMIA a complimentary presence among them."],
  ["American Translators Association", "Chelsey Sleeter", "sponsorship@atanet.org", "https://www.atanet.org", "The ATA's healthcare-interpreting community overlaps heavily with our attendees; come connect with them as our guest."],
  ["Registry of Interpreters for the Deaf", "", "communications@rid.org", "https://rid.org", "For our Deaf-access track, RID's presence would be invaluable; we'd welcome you with a complimentary table."],
  ["Tarjimly", "", "yassin@tarjim.ly", "https://www.tarjimly.org", "Your refugee-interpreting mission is the heart of what we do; we'd be honored to offer you a complimentary table."],

  // Pediatric / children's angle (this is a children's-hospital conference).
  // Web-verified contacts only; the big children's brands (Abbott, Enfamil,
  // Medela, WTTW, Ronald McDonald House) are relationship/form-only and live
  // in the separate creative-targets file for manual outreach, not here.
  ["American Academy of Pediatrics", "", "ksamp@aap.org", "https://www.aap.org", "As the home of American pediatrics and practically our neighbor in Itasca, the AAP belongs at a children's-hospital conference on language access; we'd be honored to have you partner or exhibit."],
  ["Sesame Workshop", "", "Partnerships@sesame.org", "https://sesameworkshop.org", "Your multilingual work for immigrant and refugee children is the spirit of this conference; hosted by a children's hospital, we'd love Sesame Workshop as a partner, families would light up."],
  ["Reach Out and Read", "", "info@reachoutandread.org", "https://reachoutandread.org", "You put books into well-child visits in dozens of languages, and we put language access at the center of pediatric care; a natural partnership, and we'd love you in the room."],
  ["Lee & Low Books", "", "sales@leeandlow.com", "https://www.leeandlow.com", "As the leading bilingual children's book publisher, you'd be a perfect exhibitor at a children's-hospital language-access conference and a hit with our attendees who serve multilingual families."],
  ["Children's Hospital Association", "", "memberservices@childrenshospitals.org", "https://www.childrenshospitals.org", "Lurie Children's is one of your members, and language access is a shared priority across every children's hospital you represent; we'd welcome CHA as a partner."],
  ["La Rabida Children's Hospital", "Anne Mullen", "amullen@larabida.org", "https://larabida.org", "As a fellow Chicago children's hospital serving so many Medicaid and multilingual families, you're a natural ally; we'd love La Rabida to exhibit or join us as a community partner."],
  ["Family Voices", "Ian Whitney", "iwhitney@familyvoices.org", "https://familyvoices.org", "Family-centered care for children with special health needs runs straight through language access; we'd be honored to have Family Voices as a partner at our children's-hospital conference."],
];

// Tab-delimited (TSV) with a header row, so buildSponsorInviteRows maps columns
// by name and notes containing commas are not split.
export const PROSPECT_TARGETS_TSV =
  ["Company", "Contact", "Email", "Website", "Note"].join("\t") +
  "\n" +
  TARGETS.map((r) => r.join("\t")).join("\n");
