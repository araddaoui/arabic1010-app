/**
 * Dependency-free audio feature extraction for pronunciation comparison.
 *
 * Everything here operates on raw Float32 PCM in the browser: we convert an
 * AudioBuffer to 16 kHz mono, trim silence, then compute a stream of MFCC
 * frames. Those frames are what DTW (see ./dtw.ts) aligns when comparing a
 * learner's recording against the native-speaker model.
 */

/** Mix an AudioBuffer down to a single channel and resample to 16 kHz. */
export function toMono16k(buffer: AudioBuffer, target = 16000): Float32Array {
  const channels = buffer.numberOfChannels;
  const srcLen = buffer.length;
  const mono = new Float32Array(srcLen);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < srcLen; i++) mono[i] += data[i];
  }
  if (channels > 1) for (let i = 0; i < srcLen; i++) mono[i] /= channels;

  const srcRate = buffer.sampleRate;
  if (srcRate === target) return mono;

  const ratio = srcRate / target;
  const outLen = Math.max(1, Math.floor(srcLen / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(srcLen - 1, i0 + 1);
    const frac = pos - i0;
    out[i] = mono[i0] * (1 - frac) + mono[i1] * frac;
  }
  return out;
}

/** Drop leading/trailing near-silence, keeping a small pad. */
export function trimSilence(samples: Float32Array, rate = 16000, threshold = 0.012): Float32Array {
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start++;
  while (end > start && Math.abs(samples[end]) < threshold) end--;
  if (end <= start) return new Float32Array(0);
  const pad = Math.floor(rate * 0.02);
  start = Math.max(0, start - pad);
  end = Math.min(samples.length - 1, end + pad);
  return samples.slice(start, end + 1);
}

/** In-place iterative radix-2 FFT. `re`/`im` must share a power-of-two length. */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const vr = re[b] * cr - im[b] * ci;
        const vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr;
        im[b] = im[a] - vi;
        re[a] += vr;
        im[a] += vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel: number) => 700 * (10 ** (mel / 2595) - 1);

type MelFilter = { start: number; end: number; weights: Float32Array };

function melFilterbank(numFilters: number, fftSize: number, rate: number): MelFilter[] {
  const lowMel = hzToMel(0);
  const highMel = hzToMel(rate / 2);
  const points: number[] = [];
  for (let i = 0; i < numFilters + 2; i++) {
    const mel = lowMel + ((highMel - lowMel) * i) / (numFilters + 1);
    points.push(Math.floor(((fftSize + 1) * melToHz(mel)) / rate));
  }
  const filters: MelFilter[] = [];
  for (let m = 1; m <= numFilters; m++) {
    const left = points[m - 1];
    const center = points[m];
    const right = points[m + 1];
    const start = left;
    const end = Math.max(left + 1, right);
    const weights = new Float32Array(end - start);
    for (let k = start; k < end; k++) {
      weights[k - start] =
        k <= center
          ? (k - left) / Math.max(1, center - left)
          : (right - k) / Math.max(1, right - center);
    }
    filters.push({ start, end, weights });
  }
  return filters;
}

function dctMatrix(numCoeffs: number, numFilters: number): Float32Array[] {
  const rows: Float32Array[] = [];
  for (let c = 0; c < numCoeffs; c++) {
    const row = new Float32Array(numFilters);
    for (let n = 0; n < numFilters; n++) row[n] = Math.cos((Math.PI * c * (n + 0.5)) / numFilters);
    rows.push(row);
  }
  return rows;
}

/**
 * Compute MFCC frames (13 coefficients each, first = log-energy term).
 * 25 ms windows, 10 ms hop, 26 mel filters.
 */
export function mfccFrames(samples: Float32Array, rate = 16000, numCoeffs = 13): Float32Array[] {
  const frameLen = Math.round(rate * 0.025);
  const hop = Math.round(rate * 0.01);
  const fftSize = 1 << Math.ceil(Math.log2(frameLen));
  const numFilters = 26;

  const window = new Float32Array(frameLen);
  for (let i = 0; i < frameLen; i++) window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frameLen - 1));
  const filters = melFilterbank(numFilters, fftSize, rate);
  const dct = dctMatrix(numCoeffs, numFilters);

  const frames: Float32Array[] = [];
  for (let start = 0; start + frameLen <= samples.length; start += hop) {
    const re = new Float32Array(fftSize);
    const im = new Float32Array(fftSize);
    for (let i = 0; i < frameLen; i++) re[i] = samples[start + i] * window[i];
    fft(re, im);

    const half = fftSize / 2;
    const power = new Float32Array(half + 1);
    for (let k = 0; k <= half; k++) power[k] = re[k] * re[k] + im[k] * im[k];

    const mel = new Float32Array(numFilters);
    for (let m = 0; m < numFilters; m++) {
      const f = filters[m];
      let sum = 0;
      for (let k = f.start; k < f.end && k <= half; k++) sum += f.weights[k - f.start] * power[k];
      mel[m] = Math.log(sum + 1e-10);
    }

    const coeffs = new Float32Array(numCoeffs);
    for (let c = 0; c < numCoeffs; c++) {
      let sum = 0;
      const row = dct[c];
      for (let m = 0; m < numFilters; m++) sum += row[m] * mel[m];
      coeffs[c] = sum;
    }
    frames.push(coeffs);
  }
  return frames;
}

/**
 * Cepstral mean normalization: subtract each coefficient's mean across the
 * utterance. This makes the comparison insensitive to microphone/level
 * differences between the learner and the native-speaker recording.
 */
export function cepstralMeanNormalize(frames: Float32Array[]): Float32Array[] {
  if (!frames.length) return frames;
  const dim = frames[0].length;
  const mean = new Float32Array(dim);
  for (const f of frames) for (let d = 0; d < dim; d++) mean[d] += f[d];
  for (let d = 0; d < dim; d++) mean[d] /= frames.length;
  return frames.map((f) => {
    const out = new Float32Array(dim);
    for (let d = 0; d < dim; d++) out[d] = f[d] - mean[d];
    return out;
  });
}

/** Root-mean-square level of a PCM buffer in [0, 1]-ish range. */
export function rmsLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}
