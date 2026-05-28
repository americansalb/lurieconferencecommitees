import Nav from "./Nav";
import Hero from "./Hero";
import Theme from "./Theme";
import Venue from "./Venue";
import Pricing from "./Pricing";
import CallForPresenters from "./CallForPresenters";
import SponsorsBlock from "./SponsorsBlock";
import FAQ from "./FAQ";
import Hosts from "./Hosts";
import Footer from "./Footer";
import { CONFERENCE } from "./tokens";

// JSON-LD for Google's rich Event results. Includes the EducationEvent
// type so it surfaces under conference / professional development searches.
const eventLd = {
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
      price: "105",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://conference.aalb.org/register",
    },
    {
      "@type": "Offer",
      name: "In-Person Registration",
      price: "210",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://conference.aalb.org/register",
    },
  ],
  image: "https://conference.aalb.org/conference/venue.jpg",
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }}
      />
      <Nav />
      <main>
        <Hero />
        <Theme />
        <Venue />
        <Pricing />
        <CallForPresenters />
        <SponsorsBlock />
        <FAQ />
        <Hosts />
      </main>
      <Footer />
    </div>
  );
}
