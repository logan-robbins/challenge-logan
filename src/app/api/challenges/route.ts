import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firestore";
import { checkRateLimit, incrementSubmissionCount } from "@/lib/rate-limit";
import {
  TITLE_MIN,
  TITLE_MAX,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
  CHALLENGES_PER_PAGE,
} from "@/lib/constants";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") ?? "score";
  const status = searchParams.get("status") ?? "all";
  const cursor = searchParams.get("cursor");

  let query = db.collection("challenges").orderBy(
    sort === "newest" ? "createdAt" : "score",
    "desc"
  );

  if (status !== "all") {
    query = query.where("status", "==", status);
  }

  if (cursor) {
    const cursorDoc = await db.collection("challenges").doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  query = query.limit(CHALLENGES_PER_PAGE);

  // Include draft responses only for admin users
  const includeDrafts = searchParams.get("include") === "drafts";
  let isAdmin = false;
  if (includeDrafts) {
    const session = await auth();
    isAdmin = session?.user?.isAdmin ?? false;
  }

  const snapshot = await query.get();
  const challenges = snapshot.docs.map((doc) => {
    const data = doc.data();
    const result: Record<string, unknown> = {
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
    };
    if (isAdmin) {
      result.draftResponse = data.draftResponse ?? null;
    }
    return result;
  });

  return NextResponse.json({ challenges });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description } = body;

  if (
    !title ||
    typeof title !== "string" ||
    title.length < TITLE_MIN ||
    title.length > TITLE_MAX
  ) {
    return NextResponse.json(
      { error: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters` },
      { status: 400 }
    );
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.length < DESCRIPTION_MIN ||
    description.length > DESCRIPTION_MAX
  ) {
    return NextResponse.json(
      {
        error: `Description must be ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} characters`,
      },
      { status: 400 }
    );
  }

  const allowed = await checkRateLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 3 submissions per 24 hours." },
      { status: 429 }
    );
  }

  const challengeRef = db.collection("challenges").doc();
  await challengeRef.set({
    title: title.trim(),
    description: description.trim(),
    authorId: session.user.id,
    authorName: session.user.name ?? "Anonymous",
    authorAvatar: session.user.image ?? "",
    status: "pending",
    upvotes: 0,
    downvotes: 0,
    score: 0,
    draftResponse: null,
    publishedResponse: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    responsePublishedAt: null,
  });

  await incrementSubmissionCount(session.user.id);

  // Also upsert the user doc
  await db
    .collection("users")
    .doc(session.user.id)
    .set(
      {
        name: session.user.name ?? "Anonymous",
        avatar: session.user.image ?? "",
      },
      { merge: true }
    );

  return NextResponse.json({ id: challengeRef.id }, { status: 201 });
}
