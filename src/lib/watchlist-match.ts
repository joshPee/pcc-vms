export function nameSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  let matches = 0;
  const maxWords = Math.max(words1.length, words2.length);

  for (const word1 of words1) {
    for (const word2 of words2) {
      if (
        word1 === word2 ||
        word1.includes(word2) ||
        word2.includes(word1) ||
        levenshtein(word1, word2) <= 2
      ) {
        matches++;
        break;
      }
    }
  }

  return matches / maxWords;
}

function levenshtein(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export type WatchlistEntry = {
  id: number;
  full_name: string;
  reason: string;
  description?: string | null;
};

export function findWatchlistMatches(
  visitorName: string,
  entries: WatchlistEntry[],
  threshold = 0.75
): WatchlistEntry[] {
  return entries.filter(
    (entry) => nameSimilarity(visitorName, entry.full_name) >= threshold
  );
}
