import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="font-mono text-sm font-bold text-orange-400"
            >
              challengelogan.com
            </a>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              ADMIN
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            Back to site
          </a>
        </div>
      </nav>
      {children}
    </div>
  );
}
