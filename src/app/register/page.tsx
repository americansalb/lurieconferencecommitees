import RegisterFunnel from "./RegisterFunnel";
import { activeTier, PRICES, registrationClosed } from "@/components/landing/pricing-data";

// Re-render at most hourly so the displayed rate follows the live pricing
// schedule; checkout charges by the live clock, and the two must agree.
export const revalidate = 3600;

export const metadata = {
  title: "Register",
  description:
    "Register for the 2026 Lurie Children's and AALB Conference. August 15 and 16, 2026, Chicago. Virtual and in-person tickets available with CEU certification.",
};

export default function RegisterPage({ searchParams }: { searchParams?: { code?: string } }) {
  if (registrationClosed()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="text-[11px] font-bold tracking-widest uppercase text-[#0E5566]">
            2026 Lurie Children&rsquo;s &amp; AALB Conference
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Registration has closed.</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            The 2026 conference has wrapped. Thank you to everyone who joined us — and if you&rsquo;d
            like to hear about next year&rsquo;s conference, email{" "}
            <a href="mailto:contact@aalb.org" className="font-semibold text-[#0066B3]">contact@aalb.org</a>.
          </p>
        </div>
      </div>
    );
  }
  const tier = activeTier(new Date());
  const live = PRICES[tier.id];
  return (
    <RegisterFunnel
      tierLabel={tier.label}
      tierEnd={tier.end}
      inPersonPrice={live.inPerson}
      virtualPrice={live.virtual}
      initialCode={searchParams?.code}
    />
  );
}
