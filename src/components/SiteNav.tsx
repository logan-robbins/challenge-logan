"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";

const NAV_ITEMS = [
  { label: "Challenge Logan", href: "/" },
  { label: "Agent Governance", href: "/agent-governance" },
  { label: "Agent Workflows", href: "/agent-workflows" },
  { label: "OpenClawps", href: "/openclawps" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Don't render on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#1a1a28] bg-[#08080e]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Left: Logo + Desktop Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-sm font-bold text-orange-400"
            >
              challengelogan.com
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    pathname === item.href
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Auth + Hamburger */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <AuthButton />
            </div>
            <button
              onClick={() => setOpen(!open)}
              className="rounded-lg p-2 text-zinc-400 transition hover:text-white sm:hidden"
              aria-label="Menu"
            >
              {open ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-[#1a1a28] px-4 pb-4 pt-2 sm:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  pathname === item.href
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-[#1a1a28] pt-3">
              <AuthButton />
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
