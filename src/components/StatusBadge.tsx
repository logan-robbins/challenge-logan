const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  solved: {
    label: "Solved",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  impossible: {
    label: "Impossible",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
} as const;

export default function StatusBadge({
  status,
}: {
  status: "pending" | "solved" | "impossible";
}) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
