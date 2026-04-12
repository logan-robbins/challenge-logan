export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border pb-16 pt-20 text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
      <div className="relative mx-auto max-w-3xl px-4">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Challenge{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Logan
          </span>
        </h1>
        <div className="mx-auto mt-5 max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-left font-mono text-sm text-zinc-500">
          <span className="text-zinc-600">$</span>{" "}
          <span className="text-zinc-400">Prompt:</span>{" "}
          <span className="text-zinc-500">
            Claude, build the snarkiest website you can think of for people to
            submit hard software / systems engineering tasks so I can prove I
            can solve or implement *any* system that doesn&apos;t break the laws
            of physics. Make an upvote/downvote, require GitHub SSO.
          </span>
        </div>
        <p className="mt-6 text-xl text-zinc-400 sm:text-2xl">
          I don&apos;t care that you memorized which sorting algorithm to use.
          Information travels through a medium, everything else is details.
          Leetcode is out of business. AI turns Thinkers into Doers.
        </p>
        <p className="mt-4 text-lg text-zinc-500">
          From the silicon up&mdash;submit a &ldquo;tough&rdquo; design or algo
          challenge below and I&apos;ll solve it in a few minutes because
          I&apos;m an AI-powered human in 2026.
        </p>
        <p className="mt-6 font-mono text-sm text-zinc-600">
          // Current record: 0 problems Logan couldn&apos;t solve. But keep
          trying, it&apos;s hilarious.
        </p>
      </div>
    </section>
  );
}
