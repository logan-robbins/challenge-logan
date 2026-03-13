export interface Challenge {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  status: "pending" | "solved" | "impossible";
  upvotes: number;
  downvotes: number;
  score: number;
  draftResponse: string | null;
  publishedResponse: string | null;
  createdAt: string;
  updatedAt: string;
  responsePublishedAt: string | null;
}

export interface Vote {
  id: string;
  challengeId: string;
  userId: string;
  value: 1 | -1;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  submissionCount: number;
  lastSubmissionAt: string | null;
  createdAt: string;
}
