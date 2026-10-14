/**
 * Dynamic Time Warping for aligning two MFCC frame sequences of different
 * lengths. Used to compare a learner's recording to the native-speaker model
 * without any server round-trip.
 */

export type DtwMetric = "euclidean" | "cosine";

export type DtwProfile = {
  /** Path-normalized distance (total accumulated distance / path length). */
  distance: number;
  /** Per-alignment frame distance along the optimal path (unordered). */
  frameDistances: Float32Array;
};

function frameDistance(a: Float32Array, b: Float32Array, metric: DtwMetric): number {
  if (metric === "cosine") {
    // Scale-free: insensitive to overall loudness/level differences between the
    // two recordings, so a genuine match isn't penalised for arbitrary gain.
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let d = 0; d < a.length; d++) {
      dot += a[d] * b[d];
      na += a[d] * a[d];
      nb += b[d] * b[d];
    }
    const denom = Math.sqrt(na * nb);
    if (denom < 1e-8) return 1;
    return 1 - dot / denom;
  }
  let sum = 0;
  for (let d = 0; d < a.length; d++) {
    const diff = a[d] - b[d];
    sum += diff * diff;
  }
  return Math.sqrt(sum / a.length);
}

/**
 * Sakoe-Chiba banded DTW that also returns the per-frame distances along the
 * optimal alignment path. The path profile lets the caller reward/penalize the
 * *worst* part of the match (a single mispronounced letter), not just the
 * average, which is essential for words where one bad phone is diluted.
 *
 * `distance` is path-normalized (accumulated distance divided by path length),
 * so it is comparable across utterances of different duration. Identical
 * sequences yield ~0; unrelated sequences yield progressively larger values.
 */
export function dtwProfile(
  a: Float32Array[],
  b: Float32Array[],
  bandRatio = 0.25,
  metric: DtwMetric = "euclidean",
): DtwProfile {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return { distance: Infinity, frameDistances: new Float32Array(0) };

  const band = Math.max(Math.abs(n - m), Math.ceil(Math.max(n, m) * bandRatio));
  const INF = Infinity;
  const W = m + 1;
  const cost = new Float64Array((n + 1) * W).fill(INF);
  // Backpointers: 0 = diagonal, 1 = from above (i-1,j), 2 = from left (i,j-1).
  const bp = new Int8Array((n + 1) * W).fill(-1);
  cost[0] = 0;

  for (let i = 1; i <= n; i++) {
    const jStart = Math.max(1, i - band);
    const jEnd = Math.min(m, i + band);
    for (let j = jStart; j <= jEnd; j++) {
      const diag = cost[(i - 1) * W + (j - 1)];
      const up = cost[(i - 1) * W + j];
      const left = cost[i * W + (j - 1)];
      let best = diag;
      let dir = 0;
      if (up < best) { best = up; dir = 1; }
      if (left < best) { best = left; dir = 2; }
      if (best === INF) continue;
      cost[i * W + j] = frameDistance(a[i - 1], b[j - 1], metric) + best;
      bp[i * W + j] = dir;
    }
  }

  const total = cost[n * W + m];
  if (!isFinite(total)) return { distance: Infinity, frameDistances: new Float32Array(0) };

  const dists: number[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) dists.push(frameDistance(a[i - 1], b[j - 1], metric));
    const dir = i >= 1 && j >= 1 ? bp[i * W + j] : -1;
    if (dir === 0) { i--; j--; }
    else if (dir === 1) { i--; }
    else if (dir === 2) { j--; }
    else if (i > 0) { i--; }
    else { j--; }
  }

  return { distance: total / (n + m), frameDistances: Float32Array.from(dists) };
}

/**
 * Convenience wrapper returning only the path-normalized distance
 * (total accumulated distance divided by the path length).
 */
export function dtwDistance(
  a: Float32Array[],
  b: Float32Array[],
  bandRatio = 0.25,
  metric: DtwMetric = "euclidean",
): number {
  return dtwProfile(a, b, bandRatio, metric).distance;
}
