"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface VoteButtonsProps {
  challengeId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: 1 | -1 | null;
}

export default function VoteButtons({
  challengeId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote = null,
}: VoteButtonsProps) {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote);
  const [loading, setLoading] = useState(false);

  async function vote(value: 1 | -1) {
    if (!session?.user || loading) return;

    // Optimistic update
    const prevUp = upvotes;
    const prevDown = downvotes;
    const prevVote = userVote;

    if (userVote === value) {
      // Toggle off
      setUserVote(null);
      if (value === 1) setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
    } else if (userVote !== null) {
      // Flip
      setUserVote(value);
      if (value === 1) {
        setUpvotes((v) => v + 1);
        setDownvotes((v) => v - 1);
      } else {
        setUpvotes((v) => v - 1);
        setDownvotes((v) => v + 1);
      }
    } else {
      // New vote
      setUserVote(value);
      if (value === 1) setUpvotes((v) => v + 1);
      else setDownvotes((v) => v + 1);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
    } finally {
      setLoading(false);
    }
  }

  const score = upvotes - downvotes;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => vote(1)}
        disabled={!session?.user}
        className={`rounded p-1 transition ${
          userVote === 1
            ? "text-orange-400"
            : "text-zinc-500 hover:text-zinc-300"
        } disabled:cursor-not-allowed disabled:opacity-40`}
        title={session?.user ? "Upvote" : "Sign in to vote"}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <span
        className={`text-sm font-bold tabular-nums ${
          score > 0
            ? "text-orange-400"
            : score < 0
              ? "text-blue-400"
              : "text-zinc-500"
        }`}
      >
        {score}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={!session?.user}
        className={`rounded p-1 transition ${
          userVote === -1
            ? "text-blue-400"
            : "text-zinc-500 hover:text-zinc-300"
        } disabled:cursor-not-allowed disabled:opacity-40`}
        title={session?.user ? "Downvote" : "Sign in to vote"}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
