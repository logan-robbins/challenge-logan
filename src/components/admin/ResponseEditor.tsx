"use client";

import { useState } from "react";

interface ResponseEditorProps {
  challengeId: string;
  initialDraft: string | null;
  initialPublished: string | null;
  initialStatus: "pending" | "solved" | "impossible";
  onUpdate?: () => void;
}

export default function ResponseEditor({
  challengeId,
  initialDraft,
  initialPublished,
  initialStatus,
  onUpdate,
}: ResponseEditorProps) {
  const [response, setResponse] = useState(
    initialPublished ?? initialDraft ?? ""
  );
  const [status, setStatus] = useState(initialStatus);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  async function generateDraft() {
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResponse(data.draftResponse);
      setMessage("Draft generated. Edit it and publish when ready.");
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Generation failed"}`
      );
    } finally {
      setGenerating(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishedResponse: response,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setMessage("Published!");
      onUpdate?.();
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Publish failed"}`
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={generateDraft}
          disabled={generating}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-zinc-300 transition hover:border-orange-500 hover:text-orange-400 disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate AI Draft"}
        </button>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "pending" | "solved" | "impossible")
          }
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="pending">Pending</option>
          <option value="solved">Solved</option>
          <option value="impossible">Impossible</option>
        </select>
      </div>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={8}
        placeholder="Write your snarky response here, or generate an AI draft first..."
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
      />

      {message && (
        <p
          className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
        >
          {message}
        </p>
      )}

      <button
        onClick={publish}
        disabled={publishing || !response.trim()}
        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        {publishing ? "Publishing..." : "Publish Response"}
      </button>
    </div>
  );
}
