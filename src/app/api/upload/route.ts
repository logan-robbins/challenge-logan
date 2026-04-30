import { NextRequest } from "next/server";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import JSZip from "jszip";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BINARY_EXTS = new Set([
  "png","jpg","jpeg","gif","webp","ico","bmp","tiff","tif","heic","avif",
  "pdf","doc","docx","xls","xlsx","ppt","pptx","odt","ods","odp",
  "zip","tar","gz","tgz","bz2","7z","rar","xz","lz4","zst",
  "exe","dll","so","dylib","bin","class","jar","pyc","pyo","wasm","o","obj",
  "mp3","mp4","m4a","m4v","mov","avi","mkv","wav","flac","ogg","webm",
  "woff","woff2","ttf","otf","eot",
  "psd","ai","sketch","fig","xcf",
  "db","sqlite","sqlite3","mdb",
  "keystore","pfx","p12",
]);

const TEXT_FILE_MAX = 1 * 1024 * 1024;
const ZIP_PAYLOAD_MAX = 8 * 1024 * 1024;
const ZIP_FILE_LIMIT = 500;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
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
    return new Response("Zip too large (50MB max)", { status: 413 });
  }

  let zip: JSZip;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    zip = await JSZip.loadAsync(buf);
  } catch {
    return new Response("Invalid zip", { status: 400 });
  }

  const allEntries = Object.values(zip.files)
    .filter((e) => !e.dir)
    .filter((e) => !e.name.startsWith("__MACOSX/") && !e.name.endsWith(".DS_Store"));

  const entries: { path: string; text: string }[] = [];
  let totalSize = 0;
  let skippedBinary = 0;
  let skippedTooBig = 0;
  let skippedOverBudget = 0;

  for (const entry of allEntries) {
    if (entries.length >= ZIP_FILE_LIMIT) { skippedOverBudget++; continue; }
    const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
    if (BINARY_EXTS.has(ext)) { skippedBinary++; continue; }
    const data = await entry.async("uint8array");
    if (data.byteLength > TEXT_FILE_MAX) { skippedTooBig++; continue; }
    if (totalSize + data.byteLength > ZIP_PAYLOAD_MAX) { skippedOverBudget++; continue; }
    const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
    if (text.indexOf("\u0000") >= 0 || text.indexOf("\uFFFD") >= 0) {
      skippedBinary++;
      continue;
    }
    entries.push({ path: entry.name, text });
    totalSize += data.byteLength;
  }

  let payload = `[Uploaded archive: ${file.name} — ${entries.length} files, ${formatBytes(totalSize)}]\n\n`;
  if (skippedBinary || skippedTooBig || skippedOverBudget) {
    const parts: string[] = [];
    if (skippedBinary) parts.push(`${skippedBinary} binary`);
    if (skippedTooBig) parts.push(`${skippedTooBig} >1MB`);
    if (skippedOverBudget) parts.push(`${skippedOverBudget} over total budget`);
    payload += `[Skipped: ${parts.join(", ")}]\n\n`;
  }
  payload += "Directory tree:\n```\n";
  payload += entries.map((e) => e.path).sort().join("\n");
  payload += "\n```\n\n";
  for (const e of entries) {
    payload += `==== ${e.path} ====\n${e.text}\n\n`;
  }

  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const uploadName = safeName.endsWith(".txt") ? safeName : `${safeName}.txt`;

  let uploaded;
  try {
    const blob = await toFile(Buffer.from(payload, "utf-8"), uploadName, {
      type: "text/plain",
    });
    uploaded = await client.beta.files.upload({
      file: blob,
      betas: ["files-api-2025-04-14"],
    });
  } catch (err) {
    console.error("anthropic files upload failed", err);
    return new Response("Upload to Anthropic failed", { status: 502 });
  }

  return Response.json({
    file_id: uploaded.id,
    name: file.name,
    fileCount: entries.length,
    totalSize,
    summary: { skippedBinary, skippedTooBig, skippedOverBudget },
  });
}

export const config = {
  api: { bodyParser: false },
};
