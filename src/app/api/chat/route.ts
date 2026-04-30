import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert engineering assistant with access to BrightData for live web search and scraping, and Microsoft Learn for official Microsoft and Azure documentation. Follow 2026 best practices: cite sources when using tools, use tools proactively when current information would improve your answer, and prefer concise actionable responses.`;

export async function POST(request: NextRequest) {
  const { messages, password } = await request.json();

  if (!password || password !== process.env.CHAT_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    betas: ["mcp-client-2025-04-04"] as any,
    mcp_servers: [
      {
        type: "url",
        url: `https://mcp.brightdata.com/mcp?token=${process.env.BRIGHTDATA_API_TOKEN}`,
        name: "brightdata",
      },
      {
        type: "url",
        url: "https://learn.microsoft.com/api/mcp",
        name: "microsoft-learn",
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        stream.on("text", (text) => {
          controller.enqueue(encoder.encode(text));
        });
        await stream.finalMessage();
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
