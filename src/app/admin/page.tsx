"use client";

import { useState, useEffect, useCallback } from "react";
import AdminChallengeCard from "@/components/admin/AdminChallengeCard";

interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  authorName: string;
  status: "pending" | "solved" | "impossible";
  upvotes: number;
  downvotes: number;
  draftResponse: string | null;
  publishedResponse: string | null;
  createdAt: string | null;
}

export default function AdminPage() {
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? "/api/challenges?sort=newest&include=drafts"
          : `/api/challenges?sort=newest&status=${filter}&include=drafts`;
      const res = await fetch(url);
      const data = await res.json();
      setChallenges(data.challenges);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-zinc-100">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review challenges, generate responses, crush dreams.
      </p>

      <div className="mt-6 flex gap-2">
        {["all", "pending", "solved", "impossible"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${
              filter === f
                ? "bg-orange-500/20 text-orange-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center text-zinc-500">
          No challenges found.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {challenges.map((c) => (
            <AdminChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  );
}
