import Nav from "./Nav";
import Hero from "./Hero";
import Theme from "./Theme";
import Speakers from "./Speakers";
import Venue from "./Venue";
import Pricing from "./Pricing";
import SponsorsBlock from "./SponsorsBlock";
import FAQ from "./FAQ";
import Hosts from "./Hosts";
import Footer from "./Footer";
import { CONFERENCE } from "./tokens";
import { activeTier, PRICES } from "./pricing-data";

// JSON-LD for Google's rich Event results. Includes the EducationEvent
// type so it surfaces under conference / professional development searches.
// Built per render (not module-level) so the offer prices track the live
// pricing schedule instead of freezing the rate that was active at build.
const buildEventLd = () => {
  const live = PRICES[activeTier(new Date()).id];
  return {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: CONFERENCE.name,
  description: CONFERENCE.theme,
  startDate: CONFERENCE.startDate,
  endDate: CONFERENCE.endDate,
  eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: [
    {
      "@type": "Place",
      name: CONFERENCE.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: "225 E Chicago Ave",
        addressLocality: "Chicago",
        addressRegion: "IL",
        postalCode: "60611",
        addressCountry: "US",
      },
    },
    {
      "@type": "VirtualLocation",
      url: "https://conference.aalb.org",
    },
  ],
  organizer: [
    {
      "@type": "Organization",
      name: "Ann & Robert H. Lurie Children's Hospital of Chicago",
      url: "https://www.luriechildrens.org",
    },
    {
      "@type": "Organization",
      name: "Americans Against Language Barriers",
      url: "https://www.aalb.org",
    },
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Virtual Registration",
      price: String(live.virtual),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://conference.aalb.org/register",
    },
    {
      "@type": "Offer",
      name: "In-Person Registration",
      price: String(live.inPerson),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://conference.aalb.org/register",
    },
  ],
  image: "https://conference.aalb.org/conference/venue.jpg",
  };
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildEventLd()) }}
      />
      <Nav />
      <main>
        <Hero />
        <Theme />
        <Speakers />
        <Venue />
        <Pricing />
        <SponsorsBlock />
        <FAQ />
        <Hosts />
      </main>
      <Footer />
    </div>
  );
}
