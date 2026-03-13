import StatusBadge from "./StatusBadge";
import VoteButtons from "./VoteButtons";

interface ChallengeCardProps {
  challenge: {
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
  };
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const timeAgo = challenge.createdAt
    ? getTimeAgo(new Date(challenge.createdAt))
    : "";

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-surface p-5 transition hover:border-zinc-600">
      <VoteButtons
        challengeId={challenge.id}
        initialUpvotes={challenge.upvotes}
        initialDownvotes={challenge.downvotes}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-100">
            {challenge.title}
          </h3>
          <StatusBadge status={challenge.status} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {challenge.description}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-600">
          {challenge.authorAvatar && (
            <img
              src={challenge.authorAvatar}
              alt=""
              className="h-5 w-5 rounded-full"
            />
          )}
          <span>{challenge.authorName}</span>
          {timeAgo && (
            <>
              <span>&middot;</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>

        {challenge.publishedResponse && (
          <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="mb-1 font-mono text-xs font-semibold text-orange-400">
              // Logan&apos;s response:
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {challenge.publishedResponse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
