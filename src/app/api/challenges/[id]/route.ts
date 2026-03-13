import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await db.collection("challenges").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = doc.data()!;
  return NextResponse.json({
    id: doc.id,
    title: data.title,
    description: data.description,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    status: data.status,
    upvotes: data.upvotes,
    downvotes: data.downvotes,
    score: data.score,
    publishedResponse: data.publishedResponse ?? null,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
    responsePublishedAt:
      data.responsePublishedAt?.toDate?.().toISOString() ?? null,
  });
}
