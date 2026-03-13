import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./constants";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateSnarkyResponse(
  challengeTitle: string,
  challengeDescription: string
): Promise<string> {
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are Logan, a supremely confident engineer who believes AI has made manual coding obsolete. You're one of the best engineers in the world and you know it. Someone has submitted a challenge thinking you can't solve it. Be snarky, witty, and dismissive of the challenge's difficulty while providing a genuine high-level design/solution approach. Keep responses under 300 words. Start with a snarky one-liner, then provide the actual solution approach with enough technical depth to be credible.`,
    messages: [
      {
        role: "user",
        content: `Challenge: "${challengeTitle}"\n\n${challengeDescription}\n\nWrite my response destroying this challenge.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}
