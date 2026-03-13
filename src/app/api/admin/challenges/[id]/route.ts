import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firestore";
import { CHALLENGE_STATUSES } from "@/lib/constants";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { publishedResponse, status } = body;

  const challengeRef = db.collection("challenges").doc(id);
  const challengeDoc = await challengeRef.get();

  if (!challengeDoc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (publishedResponse !== undefined) {
    updates.publishedResponse = publishedResponse;
    updates.responsePublishedAt = FieldValue.serverTimestamp();
  }

  if (status !== undefined) {
    if (!CHALLENGE_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
  }

  await challengeRef.update(updates);

  return NextResponse.json({ success: true });
}
