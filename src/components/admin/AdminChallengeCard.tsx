"use client";

import StatusBadge from "@/components/StatusBadge";
import ResponseEditor from "./ResponseEditor";
import { useState } from "react";

interface AdminChallengeCardProps {
  challenge: {
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
  };
}

export default function AdminChallengeCard({
  challenge,
}: AdminChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-zinc-100">{challenge.title}</h3>
            <StatusBadge status={challenge.status} />
            {challenge.publishedResponse && (
              <span className="text-xs text-green-400">Published</span>
            )}
            {!challenge.publishedResponse && challenge.draftResponse && (
              <span className="text-xs text-yellow-400">Has draft</span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            by {challenge.authorName} &middot; Score:{" "}
            {challenge.upvotes - challenge.downvotes} (
            {challenge.upvotes}/{challenge.downvotes})
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          {expanded ? "Collapse" : "Respond"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-background p-4">
            <p className="text-xs font-medium text-zinc-600">
              Challenge description:
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {challenge.description}
            </p>
          </div>
          <ResponseEditor
            challengeId={challenge.id}
            initialDraft={challenge.draftResponse}
            initialPublished={challenge.publishedResponse}
            initialStatus={challenge.status}
          />
        </div>
      )}
    </div>
  );
}
