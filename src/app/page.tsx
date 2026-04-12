"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ChallengeForm from "@/components/ChallengeForm";
import ChallengeList from "@/components/ChallengeList";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <ChallengeForm onSubmitted={() => setRefreshKey((k) => k + 1)} />

      <div className="mx-auto max-w-2xl px-4">
        <hr className="border-border" />
      </div>

      <ChallengeList refreshKey={refreshKey} />

      <footer className="border-t border-border py-8 text-center">
        <p className="font-mono text-xs text-zinc-600">
          Built by Logan, obviously. The AI typed it though.
        </p>
      </footer>
    </div>
  );
}
