"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  TITLE_MIN,
  TITLE_MAX,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
} from "@/lib/constants";

export default function ChallengeForm({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTitle("");
      setDescription("");
      setSuccess(true);
      onSubmitted?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="submit" className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="text-2xl font-bold text-zinc-100">
        Think you&apos;ve got a hard one?
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Submit your best shot. I&apos;ll respond when I stop laughing.
      </p>

      {!session?.user ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-zinc-400">
            Sign in with GitHub to submit a challenge. I need to know who to
            publicly humiliate.
          </p>
          <button
            onClick={() => signIn("github")}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-medium text-black transition hover:bg-zinc-200"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-zinc-300"
            >
              Challenge Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Build a lock-free concurrent B-tree"
              minLength={TITLE_MIN}
              maxLength={TITLE_MAX}
              required
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <p className="mt-1 text-right text-xs text-zinc-600">
              {title.length}/{TITLE_MAX}
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-300"
            >
              Describe the Problem
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the engineering problem in detail. Constraints, requirements, scale — give me your worst."
              minLength={DESCRIPTION_MIN}
              maxLength={DESCRIPTION_MAX}
              rows={5}
              required
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <p className="mt-1 text-right text-xs text-zinc-600">
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
              Challenge submitted. Prepare to be humbled.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Challenge"}
          </button>
        </form>
      )}
    </section>
  );
}
