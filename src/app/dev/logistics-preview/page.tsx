import { notFound } from "next/navigation";
import LogisticsView, { type Data } from "@/app/attendees/LogisticsView";

// Dev-only harness for the Accommodations tab, so its layout can be checked
// without a live DB. The sample notes are deliberately messy (mixed case,
// slashes, "and", multiple needs in one sentence) because that's how the real
// free-text fields come in. Never served in production.
const SAMPLE: Data = {
  registered: {
    total: 24, inPerson: 15, virtual: 9, oneDay: 3, oneDaySat: 2, oneDaySun: 1, modeUnset: 1,
    parking: { asked: 15, yes: 6, no: 7, unsure: 2 },
    accessibility: {
      people: [
        { id: "1", name: "Rosa Delgado", email: "rosa.delgado@example.org", affiliation: "Rush University Medical Center", mode: "in-person", attendDay: null, paid: true, note: "I use a wheelchair and would appreciate accessible seating near the front." },
        { id: "2", name: "Marcus Webb", email: "mwebb@example.org", affiliation: null, mode: "virtual", attendDay: null, paid: true, note: "ASL interpretation please. I am Deaf and will be joining the live stream both days." },
        { id: "3", name: "Priya Raman", email: "praman@example.org", affiliation: "Cook County Health", mode: "in-person", attendDay: null, paid: true, note: "CART captioning if available. Also a quiet space between sessions would help a lot." },
      ],
      tags: [
        { key: "asl", label: "ASL interpretation", count: 1 },
        { key: "cart", label: "CART / live captions", count: 1 },
        { key: "wheelchair", label: "Wheelchair / mobility", count: 1 },
        { key: "sensory", label: "Sensory-friendly", count: 1 },
        { key: "seating", label: "Seating / front row", count: 1 },
      ],
    },
    dietary: {
      people: [
        { id: "4", name: "Aisha Karim", email: "akarim@example.org", affiliation: "Lurie Children's", mode: "in-person", attendDay: null, paid: true, note: "Halal, no pork please" },
        { id: "5", name: "Tomás Herrera", email: "therrera@example.org", affiliation: null, mode: "in-person", attendDay: null, paid: true, note: "Vegetarian / no fish" },
        { id: "6", name: "Dana Fitzgerald", email: "dfitz@example.org", affiliation: "Northwestern Medicine", mode: "in-person", attendDay: null, paid: true, note: "Severe tree nut allergy, anaphylaxis risk, please flag with catering." },
      ],
      tags: [
        { key: "vegetarian", label: "Vegetarian", count: 1 },
        { key: "halal", label: "Halal", count: 1 },
        { key: "nut", label: "Nut allergy", count: 1 },
        { key: "allergy-other", label: "Other allergy", count: 1 },
        { key: "pork", label: "No pork", count: 1 },
      ],
      inPersonWithNotes: 3,
    },
    languages: [
      { language: "Spanish", count: 14 }, { language: "English", count: 12 },
      { language: "Mandarin", count: 4 }, { language: "Arabic", count: 3 },
      { language: "Polish", count: 2 }, { language: "Asl", count: 2 },
      { language: "Urdu", count: 1 }, { language: "Tagalog", count: 1 },
    ],
    languagesAnswered: 19,
  },
  pending: {
    total: 6, inPerson: 4, virtual: 2, oneDay: 0, oneDaySat: 0, oneDaySun: 0, modeUnset: 0,
    parking: { asked: 4, yes: 2, no: 1, unsure: 1 },
    accessibility: {
      people: [
        { id: "7", name: "Grace Okafor", email: "gokafor@example.org", affiliation: null, mode: "in-person", attendDay: null, paid: false, note: "Large print handouts please, low vision." },
      ],
      tags: [{ key: "vision", label: "Large print / vision", count: 1 }],
    },
    dietary: {
      people: [
        { id: "8", name: "Lev Mikhailov", email: "lmikhailov@example.org", affiliation: null, mode: "in-person", attendDay: null, paid: false, note: "gluten free" },
      ],
      tags: [{ key: "gluten", label: "Gluten-free", count: 1 }],
      inPersonWithNotes: 1,
    },
    languages: [{ language: "Russian", count: 2 }, { language: "Spanish", count: 1 }],
    languagesAnswered: 4,
  },
};

export default function LogisticsPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <LogisticsView initial={SAMPLE} />
      </div>
    </div>
  );
}
