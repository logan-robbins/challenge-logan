import { db } from "./firestore";
import { SUBMISSIONS_PER_DAY } from "./constants";
import { FieldValue } from "firebase-admin/firestore";

export async function checkRateLimit(userId: string): Promise<boolean> {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return true;
  }

  const data = userDoc.data()!;
  const now = Date.now();
  const lastSubmission = data.lastSubmissionAt?.toMillis?.() ?? 0;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  // Reset count if last submission was more than 24h ago
  if (lastSubmission < dayAgo) {
    return true;
  }

  return (data.submissionCount ?? 0) < SUBMISSIONS_PER_DAY;
}

export async function incrementSubmissionCount(userId: string): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const now = Date.now();
  const data = userDoc.data();
  const lastSubmission = data?.lastSubmissionAt?.toMillis?.() ?? 0;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  if (lastSubmission < dayAgo) {
    // Reset window
    await userRef.set(
      { submissionCount: 1, lastSubmissionAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  } else {
    await userRef.update({
      submissionCount: FieldValue.increment(1),
      lastSubmissionAt: FieldValue.serverTimestamp(),
    });
  }
}
