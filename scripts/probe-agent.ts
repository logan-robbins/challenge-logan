/**
 * Probe the live agent: send a message, log every event, dump stop_reason.
 * Run: npx tsx scripts/probe-agent.ts
 */
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
  const agentId = process.env.AGENT_ID!;
  const envId = process.env.ENV_ID!;
  console.log(`agent=${agentId} env=${envId}`);

  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: envId,
    title: "probe",
  });
  console.log(`session=${session.id}`);

  const stream = await client.beta.sessions.events.stream(session.id);

  await client.beta.sessions.events.send(session.id, {
    events: [{ type: "user.message", content: [{ type: "text", text: "Say hello in one short sentence." }] }],
  });

  let textChars = 0;
  for await (const event of stream as AsyncIterable<any>) {
    const e = event as any;
    if (e.type === "agent.message") {
      const blocks = e.content ?? [];
      for (const b of blocks) {
        console.log(`  block.type=${b.type}${b.text ? ` text="${String(b.text).slice(0, 80)}"` : ""}`);
        if (b.type === "text" && b.text) textChars += b.text.length;
      }
      console.log(`event=${e.type} blocks=${blocks.length}`);
    } else if (e.type === "session.error") {
      console.log(`event=${e.type} error=${JSON.stringify(e.error)}`);
    } else if (e.type === "session.status_idle" || e.type === "session.status_terminated") {
      console.log(`event=${e.type} stop_reason=${JSON.stringify(e.stop_reason)}`);
      if (e.type === "session.status_terminated") break;
      if (e.stop_reason?.type !== "requires_action") break;
    } else {
      console.log(`event=${e.type}`);
    }
  }
  console.log(`\nTOTAL TEXT CHARS: ${textChars}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
