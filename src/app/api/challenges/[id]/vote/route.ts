import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firestore";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: challengeId } = await params;
  const body = await request.json();
  const value = body.value as number;

  if (value !== 1 && value !== -1) {
    return NextResponse.json(
      { error: "Value must be 1 or -1" },
      { status: 400 }
    );
  }

  const challengeRef = db.collection("challenges").doc(challengeId);
  const userId = session.user.id;

  try {
    await db.runTransaction(async (tx) => {
      const challengeDoc = await tx.get(challengeRef);
      if (!challengeDoc.exists) {
        throw new Error("Challenge not found");
      }

      // Find existing vote
      const votesQuery = db
        .collection("votes")
        .where("challengeId", "==", challengeId)
        .where("userId", "==", userId);
      const existingVotes = await tx.get(votesQuery);

      if (!existingVotes.empty) {
        const existingVote = existingVotes.docs[0];
        const existingValue = existingVote.data().value as number;

        if (existingValue === value) {
          // Toggle off — remove vote
          tx.delete(existingVote.ref);
          tx.update(challengeRef, {
            [value === 1 ? "upvotes" : "downvotes"]: FieldValue.increment(-1),
            score: FieldValue.increment(value === 1 ? -1 : 1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          // Flip vote
          tx.update(existingVote.ref, { value });
          tx.update(challengeRef, {
            upvotes: FieldValue.increment(value === 1 ? 1 : -1),
            downvotes: FieldValue.increment(value === 1 ? -1 : 1),
            score: FieldValue.increment(value === 1 ? 2 : -2),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      } else {
        // New vote
        const newVoteRef = db.collection("votes").doc();
        tx.set(newVoteRef, {
          challengeId,
          userId,
          value,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.update(challengeRef, {
          [value === 1 ? "upvotes" : "downvotes"]: FieldValue.increment(1),
          score: FieldValue.increment(value),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vote failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
