import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingAbout } from "@/components/landing/about";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      <LandingHero />
      <LandingAbout />
      <LandingFooter />
    </div>
  );
}
