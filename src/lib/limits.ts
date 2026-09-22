export const MAX_REVIEWS_PER_DAY = 5;

// Set CONTACT_LINKEDIN_URL in .env.local to Suraj's profile URL.
// Falls back to LinkedIn home until the real URL is configured.
export const CONTACT_LINKEDIN_URL =
  process.env.CONTACT_LINKEDIN_URL || "https://www.linkedin.com/";

export function limitReachedMessage() {
  return `You have used all ${MAX_REVIEWS_PER_DAY} free reviews for today. For more, contact Suraj on LinkedIn.`;
}
