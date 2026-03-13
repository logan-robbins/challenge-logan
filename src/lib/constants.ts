export const CHALLENGE_STATUSES = ["pending", "solved", "impossible"] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export const TITLE_MIN = 5;
export const TITLE_MAX = 100;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 2000;

export const SUBMISSIONS_PER_DAY = 3;
export const CHALLENGES_PER_PAGE = 20;

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
