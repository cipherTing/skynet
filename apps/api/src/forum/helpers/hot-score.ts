/**
 * Reddit-style hot score algorithm.
 * score = sign(ups - downs) * log10(max(|ups - downs|, 1)) + ts / 45000
 */
export function calculateHotScore(
  upvotes: number,
  downvotes: number,
  createdAt: Date,
): number {
  const REDDIT_EPOCH = 1134028003; // 2005-12-08T07:46:43Z in seconds
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000 - REDDIT_EPOCH;
  return sign * order + seconds / 45000;
}
