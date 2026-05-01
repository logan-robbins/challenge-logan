import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { BetaManagedAgentsStreamSessionEvents } from "@anthropic-ai/sdk/resources/beta/sessions/events";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — run scripts/setup-managed-agent.ts first`);
  return v;
}

type ContentBlock = {
  type: string;
  text?: string;
  source?: unknown;
  title?: string;
  _meta?: unknown;
  [key: string]: unknown;
};

type FileResource = { file_id: string; mount_path: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMessageContent(content: string | ContentBlock[]): any[] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  return content.map((block) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _meta, ...rest } = block;
    return rest;
  });
}

function extractErrorMessage(errField: unknown): string {
  if (typeof errField === "string") return errField;
  if (errField && typeof errField === "object") {
    const e = errField as Record<string, unknown>;
    const parts: string[] = [];
    if (e.type) parts.push(String(e.type));
    if (e.mcp_server_name) parts.push(`(${e.mcp_server_name})`);
    if (e.message) parts.push(String(e.message));
    return parts.join(" ") || "Session error";
  }
  return "Session error";
}

async function listOutputFiles(sessionId: string) {
  await new Promise((r) => setTimeout(r, 2000)); // wait for indexing lag
  const files: Array<{ id: string; filename: string; size: number }> = [];
  try {
    for await (const f of client.beta.files.list({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scope_id: sessionId, betas: ["managed-agents-2026-04-01"],
    } as any)) {
      files.push({ id: f.id, filename: (f as any).filename ?? f.id, size: (f as any).size_bytes ?? 0 });
    }
  } catch {
    // non-fatal — artifacts just won't be listed
  }
  return files;
}

export async function POST(request: NextRequest) {
  const { messages, password, sessionId: incomingSessionId, pendingFileResources } =
    (await request.json()) as {
      messages: Array<{ role: string; content: string | ContentBlock[] }>;
      password: string;
      sessionId?: string | null;
      pendingFileResources?: FileResource[];
    };

  if (!password || password !== process.env.CHAT_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  let agentId: string;
  let envId: string;
  try {
    agentId = requireEnv("AGENT_ID");
    envId = requireEnv("ENV_ID");
  } catch (err) {
    return new Response((err as Error).message, { status: 503 });
  }

  const lastMsg = messages[messages.length - 1];
  const messageContent = buildMessageContent(lastMsg.content);

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));

      try {
        let sessionId = incomingSessionId ?? null;

        if (!sessionId) {
          const sessionResources = (pendingFileResources ?? []).map((f) => ({
            type: "file" as const,
            file_id: f.file_id,
            mount_path: f.mount_path,
          }));
          const session = await client.beta.sessions.create({
            agent: agentId,
            environment_id: envId,
            title: "Help Chat",
            ...(sessionResources.length > 0 ? { resources: sessionResources } : {}),
          });
          sessionId = session.id;
        } else if (pendingFileResources && pendingFileResources.length > 0) {
          for (const f of pendingFileResources) {
            await client.beta.sessions.resources.add(sessionId, {
              type: "file",
              file_id: f.file_id,
              mount_path: f.mount_path,
            });
          }
        }

        send({ t: "session", v: sessionId });

        const stream = await client.beta.sessions.events.stream(sessionId);

        await client.beta.sessions.events.send(sessionId, {
          events: [{ type: "user.message", content: messageContent }],
        });

        const finalize = async (sid: string) => {
          const artifacts = await listOutputFiles(sid);
          if (artifacts.length > 0) send({ t: "artifacts", v: artifacts });
          send({ t: "done" });
          controller.close();
        };

        for await (const event of stream as AsyncIterable<BetaManagedAgentsStreamSessionEvents>) {
          const e = event as BetaManagedAgentsStreamSessionEvents & Record<string, unknown>;

          switch (e.type) {
            case "session.status_running":
              send({ t: "status", v: "Working…" });
              break;

            case "agent.thinking":
              send({ t: "status", v: "Thinking…" });
              break;

            case "agent.mcp_tool_use": {
              const server = (e.mcp_server_name as string) || "mcp";
              const tool = (e.name as string) || "tool";
              send({ t: "status", v: `${server} · ${tool}` });
              break;
            }

            case "agent.tool_use": {
              const toolName = (e.name as string) || "";
              if (toolName === "bash") {
                const cmd = ((e.input as Record<string, unknown>)?.command as string) ?? "";
                const trimmed = cmd.replace(/\s+/g, " ").trim();
                const label = trimmed.length > 72 ? trimmed.slice(0, 72) + "…" : trimmed;
                send({ t: "status", v: label ? `$ ${label}` : "bash" });
              } else if (toolName === "web_search") {
                const q = ((e.input as Record<string, unknown>)?.query as string) ?? "";
                const label = q.length > 60 ? q.slice(0, 60) + "…" : q;
                send({ t: "status", v: label ? `search: ${label}` : "web_search" });
              } else {
                send({ t: "status", v: toolName });
              }
              break;
            }

            case "agent.message": {
              const blocks = (e.content as Array<{ type: string; text?: string }>) ?? [];
              const text = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
              if (text) send({ t: "text", v: text });
              break;
            }

            case "session.status_terminated":
              await finalize(sessionId!);
              return;

            case "session.status_idle": {
              const stopReason = e.stop_reason as { type: string } | undefined;
              if (stopReason?.type !== "requires_action") {
                await finalize(sessionId!);
                return;
              }
              break;
            }

            case "session.error": {
              const errMsg = extractErrorMessage((e as Record<string, unknown>).error);
              send({ t: "error", v: errMsg });
              send({ t: "done" });
              controller.close();
              return;
            }
          }
        }

        await finalize(sessionId!);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(enc.encode(JSON.stringify({ t: "error", v: msg }) + "\n"));
        controller.close();
        return;
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
