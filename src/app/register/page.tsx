import RegisterFunnel from "./RegisterFunnel";
import { activeTier, PRICES } from "@/components/landing/pricing-data";

export const metadata = {
  title: "Register",
  description:
    "Register for the 2026 Lurie Children's and AALB Conference. August 15 and 16, 2026, Chicago. Virtual and in-person tickets available with CEU certification.",
};

export default function RegisterPage() {
  const tier = activeTier(new Date());
  const live = PRICES[tier.id];
  return (
    <RegisterFunnel
      tierLabel={tier.label}
      tierEnd={tier.end}
      inPersonPrice={live.inPerson}
      virtualPrice={live.virtual}
    />
  );
}
