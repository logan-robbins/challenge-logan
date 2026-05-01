import { NextRequest } from "next/server";
import Anthropic, { toFile } from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "heic", "avif"]);

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function sanitizeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password !== process.env.CHAT_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("No file", { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return new Response("File too large (50MB max)", { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = file.type.startsWith("image/") || IMAGE_EXTS.has(ext);
  const safeName = sanitizeName(file.name);
  const mountPath = `/workspace/${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  let uploaded;
  try {
    const blob = await toFile(buf, safeName, { type: file.type || "application/octet-stream" });
    uploaded = await client.beta.files.upload({
      file: blob,
      betas: ["files-api-2025-04-14"],
    } as Parameters<typeof client.beta.files.upload>[0]);
  } catch (err) {
    console.error("Files API upload failed:", err);
    return new Response("Upload to Anthropic failed", { status: 502 });
  }

  return Response.json({
    file_id: uploaded.id,
    name: file.name,
    size: file.size,
    sizeFormatted: formatBytes(file.size),
    kind: isImage ? "image" : "file",
    mountPath,
  });
}

export const config = {
  api: { bodyParser: false },
};
