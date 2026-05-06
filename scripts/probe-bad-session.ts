/**
 * Probe what error Anthropic returns for a bogus/stale session ID.
 * Run: npx tsx scripts/probe-bad-session.ts
 */
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
  const fakeIds = [
    "sesn_011CfakeFakeFakeFakeFakeFa", // well-formed but nonexistent
  ];
  for (const sid of fakeIds) {
    console.log(`--- ${sid} ---`);
    try {
      const stream = await client.beta.sessions.events.stream(sid);
      for await (const e of stream as AsyncIterable<any>) {
        console.log("event:", (e as any).type);
      }
    } catch (err) {
      const e = err as any;
      console.log("threw:", e.constructor?.name, "status:", e.status, "type:", e.error?.error?.type ?? e.error?.type, "msg:", e.message);
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
