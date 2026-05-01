import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const password = params.get("password");
  const fileId = params.get("file_id");
  const filename = params.get("name") ?? "download";

  if (!password || password !== process.env.CHAT_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!fileId) {
    return new Response("Missing file_id", { status: 400 });
  }

  try {
    const resp = await client.beta.files.download(fileId);
    const contentType = resp.headers.get("content-type") ?? "application/octet-stream";
    const body = await resp.arrayBuffer();
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "_")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Download failed";
    return new Response(msg, { status: 502 });
  }
}
