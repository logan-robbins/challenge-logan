"use client";

import { useState, useEffect, useCallback } from "react";
import ChallengeCard from "./ChallengeCard";

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorAvatar: string;
  status: "pending" | "solved" | "impossible";
  upvotes: number;
  downvotes: number;
  publishedResponse: string | null;
  createdAt: string | null;
}

export default function ChallengeList({
  refreshKey,
}: {
  refreshKey?: number;
}) {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [sort, setSort] = useState<"score" | "newest">("score");
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges?sort=${sort}`);
      const data = await res.json();
      setChallenges(data.challenges);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges, refreshKey]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100">The Gauntlet</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSort("score")}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              sort === "score"
                ? "bg-orange-500/20 text-orange-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setSort("newest")}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              sort === "newest"
                ? "bg-orange-500/20 text-orange-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-zinc-500">
            No challenges yet. Either nobody&apos;s brave enough, or they
            already know I&apos;ll crush it.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </section>
  );
}
