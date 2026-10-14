/**
 * Dynamic Time Warping for aligning two MFCC frame sequences of different
 * lengths. Used to compare a learner's recording to the native-speaker model
 * without any server round-trip.
 */

function frameDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let d = 0; d < a.length; d++) {
    const diff = a[d] - b[d];
    sum += diff * diff;
  }
  return Math.sqrt(sum / a.length);
}

/**
 * Sakoe-Chiba banded DTW. Returns the path-normalized distance
 * (total accumulated distance divided by the path length), so it is
 * comparable across utterances of different duration. Identical sequences
 * yield ~0; unrelated sequences yield progressively larger values.
 */
export function dtwDistance(a: Float32Array[], b: Float32Array[], bandRatio = 0.25): number {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return Infinity;

  const band = Math.max(Math.abs(n - m), Math.ceil(Math.max(n, m) * bandRatio));
  const INF = Infinity;
  let prev = new Float64Array(m + 1).fill(INF);
  let curr = new Float64Array(m + 1).fill(INF);
  prev[0] = 0;

  for (let i = 1; i <= n; i++) {
    curr.fill(INF);
    const jStart = Math.max(1, i - band);
    const jEnd = Math.min(m, i + band);
    for (let j = jStart; j <= jEnd; j++) {
      const best = Math.min(prev[j], curr[j - 1], prev[j - 1]);
      if (best === INF) continue;
      curr[j] = frameDistance(a[i - 1], b[j - 1]) + best;
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  const dist = prev[m];
  if (!isFinite(dist)) return Infinity;
  return dist / (n + m);
}
