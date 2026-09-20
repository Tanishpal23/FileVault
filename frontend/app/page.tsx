import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import CapabilityBar from "@/components/landing/CapabilityBar";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Security from "@/components/landing/Security";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <CapabilityBar />
        <Features />
        <HowItWorks />
        <Security />
        <Pricing />
        <FinalCTA />
      </main>
    </div>
  );
}
