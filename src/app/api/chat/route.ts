import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert engineering assistant with access to BrightData for live web search and scraping, and Microsoft Learn for official Microsoft and Azure documentation. Follow 2026 best practices: cite sources when using tools, use tools proactively when current information would improve your answer, and prefer concise actionable responses. Use GitHub-flavored markdown — fenced code blocks with language tags, tables, lists, headings.`;

export async function POST(request: NextRequest) {
  const { messages, password } = await request.json();

  if (!password || password !== process.env.CHAT_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const stream = client.beta.messages.stream({
    betas: ["mcp-client-2025-04-04"],
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "adaptive" } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output_config: { effort: "medium" } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    ] as any,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const send = (obj: any) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stream.on("streamEvent", (event: any) => {
          if (event.type === "content_block_start") {
            const block = event.content_block;
            if (!block) return;
            if (block.type === "thinking") {
              send({ t: "status", v: "Thinking…" });
            } else if (block.type === "mcp_tool_use") {
              const tool = block.name || "tool";
              const server = block.server_name || "mcp";
              send({ t: "status", v: `Calling ${server} · ${tool}` });
            } else if (block.type === "tool_use") {
              send({ t: "status", v: `Using tool · ${block.name || ""}` });
            } else if (block.type === "text") {
              send({ t: "status", v: "" });
            }
          }
        });

        stream.on("text", (text: string) => {
          send({ t: "text", v: text });
        });

        await stream.finalMessage();
        send({ t: "done" });
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
