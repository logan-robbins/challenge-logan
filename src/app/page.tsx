"use client";

import { useState } from "react";
import AuthButton from "@/components/AuthButton";
import HeroSection from "@/components/HeroSection";
import ChallengeForm from "@/components/ChallengeForm";
import ChallengeList from "@/components/ChallengeList";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-mono text-sm font-bold text-orange-400">
            challengelogan.com
          </span>
          <AuthButton />
        </div>
      </nav>

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
