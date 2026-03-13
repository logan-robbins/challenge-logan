import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firestore";
import { generateSnarkyResponse } from "@/lib/claude";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { challengeId } = await request.json();
  if (!challengeId) {
    return NextResponse.json(
      { error: "challengeId required" },
      { status: 400 }
    );
  }

  const challengeDoc = await db
    .collection("challenges")
    .doc(challengeId)
    .get();

  if (!challengeDoc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = challengeDoc.data()!;
  const draftResponse = await generateSnarkyResponse(data.title, data.description);

  await challengeDoc.ref.update({
    draftResponse,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ draftResponse });
}
