/**
 * Inline SVG animation strings for all 28 Arabic letters.
 * These are embedded directly so they work with vite-plugin-singlefile
 * (no external fetch needed).
 *
 * IMPORTANT — paste source SVGs here VERBATIM. Do not hand-edit colours or
 * sizing. `prepareSvg()` below normalises everything at runtime:
 *   • recolours the authoring ink colour to the app's gold
 *   • forces the SVG to fill its container while preserving aspect ratio
 * This keeps the stored strings byte-identical to the originals, so there is
 * no chance of a transcription error when adding new letters.
 */

const GOLD = "#FFD54A";

/**
 * Every letter is normalised to finish in this many seconds.
 *
 * A fixed multiplier does not work here: the source files are authored at very
 * different speeds (alif 3.00s, baa 5.32s, jiim 6.55s), so a single factor
 * makes short letters sluggish and long ones interminable. Scaling each file so
 * its *last* stroke lands on the same beat gives consistent pacing across all
 * 28, and keeps the internal rhythm of each animation intact.
 */
export const TARGET_DURATION_S = 4.5;

/** True for white, which masks rely on and must never be recoloured. */
function isWhite(hex: string): boolean {
  const h = hex.toLowerCase();
  return h === "#fff" || h === "#ffffff";
}

/** Parse a SMIL time ("3.00s", "0.69s", "250ms") to seconds. */
function parseTime(value: string): number | null {
  const t = value.trim();
  const ms = t.match(/^([\d.]+)ms$/);
  if (ms) return parseFloat(ms[1]) / 1000;
  const s = t.match(/^([\d.]+)s?$/);
  if (s) return parseFloat(s[1]);
  return null;
}

/** Factor that makes the final stroke land on TARGET_DURATION_S. */
function timingScale(raw: string): number {
  let maxEnd = 0;
  const animateTag = /<animate\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = animateTag.exec(raw)) !== null) {
    const tag = m[0];
    const d = tag.match(/\bdur="([^"]+)"/);
    const b = tag.match(/\bbegin="([^"]+)"/);
    const dv = d ? parseTime(d[1]) ?? 0 : 0;
    const bv = b ? parseTime(b[1]) ?? 0 : 0;
    maxEnd = Math.max(maxEnd, bv + dv);
  }
  return maxEnd > 0 ? TARGET_DURATION_S / maxEnd : 1;
}

/**
 * Normalises a raw authoring SVG for display on the dark canvas.
 *
 * The source files are authored as black ink on white for print. Three things
 * must change for them to work here, and all of them are done at runtime so
 * the stored strings stay byte-identical to the originals:
 *
 *   1. Recolour ink to gold. Every non-white colour is remapped, rather than
 *      matching a fixed list — a single unlisted shade previously rendered the
 *      whole glyph near-invisible against the dark canvas.
 *   2. Namespace mask ids. Every file declares the same `tk-m0` / `tk-m1`;
 *      if two coexist the first wins and the second letter's reveal breaks.
 *   3. Scale timing. The authoring durations are tuned for a print preview and
 *      read as a blink here.
 *
 * Mask geometry (`stroke="#fff"`) is deliberately preserved.
 */
export function prepareSvg(raw: string, uid = ""): string {
  let out = raw;

  // 1. Recolour every non-white stroke/fill to gold.
  out = out.replace(
    /(stroke|fill)="(#[0-9a-fA-F]{3,8})"/g,
    (m, attr, hex) => (isWhite(hex) ? m : `${attr}="${GOLD}"`)
  );

  // 2. Namespace mask ids so multiple letters can coexist safely.
  if (uid) {
    const safe = uid.replace(/[^a-zA-Z0-9_-]/g, "");
    out = out.replace(/id="(tk-[^"]+)"/g, (_m, id) => `id="${id}-${safe}"`);
    out = out.replace(/url\(#(tk-[^)]+)\)/g, (_m, id) => `url(#${id}-${safe})`);
  }

  // 3. Normalise timing so every letter finishes on the same beat.
  const k = timingScale(raw);
  if (k !== 1) {
    const scale = (v: string) => {
      const secs = parseTime(v);
      return secs === null ? v : `${(secs * k).toFixed(2)}s`;
    };
    out = out.replace(/\bdur="([^"]+)"/g, (_m, v) => `dur="${scale(v)}"`);
    out = out.replace(/\bbegin="([^"]+)"/g, (_m, v) => `begin="${scale(v)}"`);
  }

  // 4. Drop fixed pixel dimensions so the SVG scales to its container.
  //    Only bare width/height — `stroke-width` is preceded by "-", not
  //    whitespace, so it is untouched.
  out = out.replace(/\s(width|height)="[^"]*"/g, " ");
  if (!/preserveAspectRatio=/.test(out)) {
    out = out.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid meet"');
  }
  out = out.replace(/<svg\b/, '<svg style="width:100%;height:100%;overflow:visible"');

  return out;
}

/**
 * ─────────────────────────────────────────────────────────────
 * STATUS — which letters use real authored artwork
 * ─────────────────────────────────────────────────────────────
 * Tell them apart by viewBox:
 *   • REAL      → viewBox has authored dimensions (e.g. "0 0 94 215.8"),
 *                 uses <mask> + per-segment stroke-width. Supplied by you.
 *   • FALLBACK  → viewBox is "0 0 300 300". A rough approximation I wrote;
 *                 NOT an accurate letterform. Replace when the real file lands.
 *
 * REAL (28):     alif · baa · taa · thaa · jiim · haa · khaa · raa · zaay · siin ·
 *                shiin · saad · daad · taa_emphatic · zaa_emphatic · ayn · ghayn ·
 *                daal · dhaal · faa · qaaf · kaaf · laam · miim · nuun · haa_soft ·
 *                waaw · yaa
 * FALLBACK (0):  None (all 28 letters now use professional mask-based SVG assets)
 *
 * Update this block whenever a real file is added.
 * ─────────────────────────────────────────────────────────────
 */
export const LETTER_SVGS: Record<string, string> = {
  alif: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61.7 215.8" width="61.7" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 30.44 64.4 L 30.22 66.12 L 30 67.84 L 29.77 69.56 L 29.55 71.29 L 29.33 73.01 L 29.1 74.73 L 29.3 76.63 L 29.51 78.54 L 29.71 80.44 L 29.91 82.35 L 30.11 84.25 L 30.31 86.15 L 30.51 88.06 L 30.71 89.96 L 30.91 91.87 L 31.11 93.77 L 31.31 95.68 L 31.51 97.58 L 31.72 99.48 L 31.92 101.39 L 32.12 103.29 L 32.32 105.2 L 32.52 107.1 L 32.72 109 L 32.92 110.91 L 33.12 112.81 L 33.12 114.8 L 33.12 116.79 L 33.12 118.78 L 33.12 120.77 L 33.12 122.76 L 32.93 124.45 L 32.74 126.13 L 32.55 127.82 L 32.36 129.5 L 32.17 131.18" fill="none" stroke="#fff" stroke-width="10.47" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="3.00s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="30.44" y1="64.4" x2="30.22" y2="66.12" stroke-width="2.3" />
<line x1="30.22" y1="66.12" x2="30" y2="67.84" stroke-width="3.06" />
<line x1="30" y1="67.84" x2="29.77" y2="69.56" stroke-width="3.83" />
<line x1="29.77" y1="69.56" x2="29.55" y2="71.29" stroke-width="4.59" />
<line x1="29.55" y1="71.29" x2="29.33" y2="73.01" stroke-width="5.36" />
<line x1="29.33" y1="73.01" x2="29.1" y2="74.73" stroke-width="6.12" />
<line x1="29.1" y1="74.73" x2="29.3" y2="76.63" stroke-width="6.47" />
<line x1="29.3" y1="76.63" x2="29.51" y2="78.54" stroke-width="6.39" />
<line x1="29.51" y1="78.54" x2="29.71" y2="80.44" stroke-width="6.31" />
<line x1="29.71" y1="80.44" x2="29.91" y2="82.35" stroke-width="6.24" />
<line x1="29.91" y1="82.35" x2="30.11" y2="84.25" stroke-width="6.16" />
<line x1="30.11" y1="84.25" x2="30.31" y2="86.15" stroke-width="6.09" />
<line x1="30.31" y1="86.15" x2="30.51" y2="88.06" stroke-width="6.01" />
<line x1="30.51" y1="88.06" x2="30.71" y2="89.96" stroke-width="5.93" />
<line x1="30.71" y1="89.96" x2="30.91" y2="91.87" stroke-width="5.86" />
<line x1="30.91" y1="91.87" x2="31.11" y2="93.77" stroke-width="5.78" />
<line x1="31.11" y1="93.77" x2="31.31" y2="95.68" stroke-width="5.7" />
<line x1="31.31" y1="95.68" x2="31.51" y2="97.58" stroke-width="5.63" />
<line x1="31.51" y1="97.58" x2="31.72" y2="99.48" stroke-width="5.55" />
<line x1="31.72" y1="99.48" x2="31.92" y2="101.39" stroke-width="5.47" />
<line x1="31.92" y1="101.39" x2="32.12" y2="103.29" stroke-width="5.4" />
<line x1="32.12" y1="103.29" x2="32.32" y2="105.2" stroke-width="5.32" />
<line x1="32.32" y1="105.2" x2="32.52" y2="107.1" stroke-width="5.24" />
<line x1="32.52" y1="107.1" x2="32.72" y2="109" stroke-width="5.17" />
<line x1="32.72" y1="109" x2="32.92" y2="110.91" stroke-width="5.09" />
<line x1="32.92" y1="110.91" x2="33.12" y2="112.81" stroke-width="5.01" />
<line x1="33.12" y1="112.81" x2="33.12" y2="114.8" stroke-width="4.86" />
<line x1="33.12" y1="114.8" x2="33.12" y2="116.79" stroke-width="4.63" />
<line x1="33.12" y1="116.79" x2="33.12" y2="118.78" stroke-width="4.4" />
<line x1="33.12" y1="118.78" x2="33.12" y2="120.77" stroke-width="4.17" />
<line x1="33.12" y1="120.77" x2="33.12" y2="122.76" stroke-width="3.94" />
<line x1="33.12" y1="122.76" x2="32.93" y2="124.45" stroke-width="3.6" />
<line x1="32.93" y1="124.45" x2="32.74" y2="126.13" stroke-width="3.14" />
<line x1="32.74" y1="126.13" x2="32.55" y2="127.82" stroke-width="2.68" />
<line x1="32.55" y1="127.82" x2="32.36" y2="129.5" stroke-width="2.22" />
<line x1="32.36" y1="129.5" x2="32.17" y2="131.18" stroke-width="1.76" />
</g>
</svg>`,

  baa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132.6 215.8" width="132.6" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 100.89 95.91 L 101.04 97.89 L 101.19 99.86 L 101.33 101.84 L 102.07 103.53 L 102.8 105.22 L 103.53 106.9 L 103.75 108.37 L 103.97 109.83 L 104.19 111.3 L 103.97 113.17 L 103.75 115.04 L 102.73 116.14 L 101.7 117.24 L 100.67 118.34 L 99.35 119.07 L 98.03 119.8 L 96.72 120.53 L 95 121.19 L 93.28 121.85 L 91.57 122.51 L 89.85 123.17 L 88.14 123.83 L 86.38 124.27 L 84.62 124.71 L 82.86 125.15 L 81.1 125.59 L 79.34 126.03 L 77.37 126.28 L 75.39 126.53 L 73.41 126.78 L 71.43 127.04 L 69.45 127.29 L 67.47 127.54 L 65.49 127.79 L 63.7 127.82 L 61.91 127.85 L 60.12 127.88 L 58.33 127.92 L 56.54 127.95 L 54.75 127.98 L 52.96 128.01 L 51.2 127.79 L 49.44 127.57 L 47.68 127.35 L 45.92 127.13 L 44.6 126.84 L 43.28 126.54 L 41.96 126.25 L 40.5 125.66 L 39.03 125.08 L 37.57 124.49 L 36.36 123.72 L 35.15 122.95 L 33.9 121.78 L 32.65 120.61 L 31.41 119.43 L 30.53 118.01 L 29.65 116.58 L 29.43 115.59 L 29.21 114.6 L 29.43 112.84 L 29.65 111.08 L 29.87 109.32 L 30.09 107.56 L 30.75 105.8 L 31.85 104.34 L 32.95 102.87 L 34.05 101.4" fill="none" stroke="#fff" stroke-width="14.54" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.32s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 69.01 151.54 L 68.13 152.42 L 66.44 152.71 L 64.76 153 L 63.07 153.3" fill="none" stroke="#fff" stroke-width="13.24" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.27s" begin="0.69s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#FFD54A" stroke-linecap="round" stroke-linejoin="round">
<line x1="100.89" y1="95.91" x2="101.04" y2="97.89" stroke-width="3.17" />
<line x1="101.04" y1="97.89" x2="101.19" y2="99.86" stroke-width="4.89" />
<line x1="101.19" y1="99.86" x2="101.33" y2="101.84" stroke-width="6.61" />
<line x1="101.33" y1="101.84" x2="102.07" y2="103.53" stroke-width="7.11" />
<line x1="102.07" y1="103.53" x2="102.8" y2="105.22" stroke-width="6.38" />
<line x1="102.8" y1="105.22" x2="103.53" y2="106.9" stroke-width="5.64" />
<line x1="103.53" y1="106.9" x2="103.75" y2="108.37" stroke-width="5.06" />
<line x1="103.75" y1="108.37" x2="103.97" y2="109.83" stroke-width="4.62" />
<line x1="103.97" y1="109.83" x2="104.19" y2="111.3" stroke-width="4.18" />
<line x1="104.19" y1="111.3" x2="103.97" y2="113.17" stroke-width="3.96" />
<line x1="103.97" y1="113.17" x2="103.75" y2="115.04" stroke-width="3.96" />
<line x1="103.75" y1="115.04" x2="102.73" y2="116.14" stroke-width="4.54" />
<line x1="102.73" y1="116.14" x2="101.7" y2="117.24" stroke-width="5.71" />
<line x1="101.7" y1="117.24" x2="100.67" y2="118.34" stroke-width="6.88" />
<line x1="100.67" y1="118.34" x2="99.35" y2="119.07" stroke-width="7.61" />
<line x1="99.35" y1="119.07" x2="98.03" y2="119.8" stroke-width="7.9" />
<line x1="98.03" y1="119.8" x2="96.72" y2="120.53" stroke-width="8.2" />
<line x1="96.72" y1="120.53" x2="95" y2="121.19" stroke-width="8.42" />
<line x1="95" y1="121.19" x2="93.28" y2="121.85" stroke-width="8.59" />
<line x1="93.28" y1="121.85" x2="91.57" y2="122.51" stroke-width="8.75" />
<line x1="91.57" y1="122.51" x2="89.85" y2="123.17" stroke-width="8.91" />
<line x1="89.85" y1="123.17" x2="88.14" y2="123.83" stroke-width="9.08" />
<line x1="88.14" y1="123.83" x2="86.38" y2="124.27" stroke-width="9.17" />
<line x1="86.38" y1="124.27" x2="84.62" y2="124.71" stroke-width="9.18" />
<line x1="84.62" y1="124.71" x2="82.86" y2="125.15" stroke-width="9.2" />
<line x1="82.86" y1="125.15" x2="81.1" y2="125.59" stroke-width="9.21" />
<line x1="81.1" y1="125.59" x2="79.34" y2="126.03" stroke-width="9.23" />
<line x1="79.34" y1="126.03" x2="77.37" y2="126.28" stroke-width="9.27" />
<line x1="77.37" y1="126.28" x2="75.39" y2="126.53" stroke-width="9.33" />
<line x1="75.39" y1="126.53" x2="73.41" y2="126.78" stroke-width="9.39" />
<line x1="73.41" y1="126.78" x2="71.43" y2="127.04" stroke-width="9.46" />
<line x1="71.43" y1="127.04" x2="69.45" y2="127.29" stroke-width="9.52" />
<line x1="69.45" y1="127.29" x2="67.47" y2="127.54" stroke-width="9.58" />
<line x1="67.47" y1="127.54" x2="65.49" y2="127.79" stroke-width="9.64" />
<line x1="65.49" y1="127.79" x2="63.7" y2="127.82" stroke-width="9.71" />
<line x1="63.7" y1="127.82" x2="61.91" y2="127.85" stroke-width="9.77" />
<line x1="61.91" y1="127.85" x2="60.12" y2="127.88" stroke-width="9.83" />
<line x1="60.12" y1="127.88" x2="58.33" y2="127.92" stroke-width="9.9" />
<line x1="58.33" y1="127.92" x2="56.54" y2="127.95" stroke-width="9.96" />
<line x1="56.54" y1="127.95" x2="54.75" y2="127.98" stroke-width="10.02" />
<line x1="54.75" y1="127.98" x2="52.96" y2="128.01" stroke-width="10.08" />
<line x1="52.96" y1="128.01" x2="51.2" y2="127.79" stroke-width="10.16" />
<line x1="51.2" y1="127.79" x2="49.44" y2="127.57" stroke-width="10.25" />
<line x1="49.44" y1="127.57" x2="47.68" y2="127.35" stroke-width="10.34" />
<line x1="47.68" y1="127.35" x2="45.92" y2="127.13" stroke-width="10.43" />
<line x1="45.92" y1="127.13" x2="44.6" y2="126.84" stroke-width="10.49" />
<line x1="44.6" y1="126.84" x2="43.28" y2="126.54" stroke-width="10.52" />
<line x1="43.28" y1="126.54" x2="41.96" y2="126.25" stroke-width="10.54" />
<line x1="41.96" y1="126.25" x2="40.5" y2="125.66" stroke-width="10.53" />
<line x1="40.5" y1="125.66" x2="39.03" y2="125.08" stroke-width="10.47" />
<line x1="39.03" y1="125.08" x2="37.57" y2="124.49" stroke-width="10.42" />
<line x1="37.57" y1="124.49" x2="36.36" y2="123.72" stroke-width="10.28" />
<line x1="36.36" y1="123.72" x2="35.15" y2="122.95" stroke-width="10.06" />
<line x1="35.15" y1="122.95" x2="33.9" y2="121.78" stroke-width="9.74" />
<line x1="33.9" y1="121.78" x2="32.65" y2="120.61" stroke-width="9.33" />
<line x1="32.65" y1="120.61" x2="31.41" y2="119.43" stroke-width="8.91" />
<line x1="31.41" y1="119.43" x2="30.53" y2="118.01" stroke-width="8.27" />
<line x1="30.53" y1="118.01" x2="29.65" y2="116.58" stroke-width="7.4" />
<line x1="29.65" y1="116.58" x2="29.43" y2="115.59" stroke-width="6.74" />
<line x1="29.43" y1="115.59" x2="29.21" y2="114.6" stroke-width="6.3" />
<line x1="29.21" y1="114.6" x2="29.43" y2="112.84" stroke-width="5.71" />
<line x1="29.43" y1="112.84" x2="29.65" y2="111.08" stroke-width="4.95" />
<line x1="29.65" y1="111.08" x2="29.87" y2="109.32" stroke-width="4.2" />
<line x1="29.87" y1="109.32" x2="30.09" y2="107.56" stroke-width="3.45" />
<line x1="30.09" y1="107.56" x2="30.75" y2="105.8" stroke-width="2.78" />
<line x1="30.75" y1="105.8" x2="31.85" y2="104.34" stroke-width="2.43" />
<line x1="31.85" y1="104.34" x2="32.95" y2="102.87" stroke-width="2.31" />
<line x1="32.95" y1="102.87" x2="34.05" y2="101.4" stroke-width="2.18" />
</g>
<circle cx="102.65" cy="116.14" r="3.44" fill="#FFD54A" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.54s" fill="freeze" /></circle>
<g mask="url(#tk-m1)" fill="none" stroke="#FFD54A" stroke-linecap="round" stroke-linejoin="round">
<line x1="69.01" y1="151.54" x2="68.13" y2="152.42" stroke-width="9.24" />
<line x1="68.13" y1="152.42" x2="66.44" y2="152.71" stroke-width="7.54" />
<line x1="66.44" y1="152.71" x2="64.76" y2="153" stroke-width="5.2" />
<line x1="64.76" y1="153" x2="63.07" y2="153.3" stroke-width="2.85" />
</g>
</svg>`,

  jiim: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106.1 215.8" width="106.1" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 80 110.48 L 78.66 111.19 L 77.31 111.9 L 75.96 112.61 L 74.09 112.76 L 72.22 112.91 L 70.35 113.06 L 68.47 113.2 L 66.6 113.35 L 64.73 113.5 L 62.86 113.65 L 60.99 113.8 L 59.12 113.95 L 57.25 114.1 L 55.97 114.74 L 55.05 116.15 L 54.13 117.57 L 53.2 118.99 L 51.5 119.84 L 49.8 120.69 L 48.1 121.54 L 46.4 122.39 L 45.12 123.37 L 43.85 124.35 L 42.57 125.33 L 41.29 126.31 L 40.02 127.28 L 38.83 128.69 L 37.64 130.09 L 36.45 131.5 L 35.25 132.9 L 34.06 134.3 L 33.16 136.06 L 32.26 137.81 L 31.35 139.57 L 30.45 141.32 L 30.02 142.95 L 29.6 144.58 L 29.17 146.21 L 29.03 147.56 L 28.89 148.91 L 28.75 150.25 L 28.68 151.81 L 28.6 153.37 L 28.53 154.93 L 28.75 156.63 L 28.96 158.34 L 29.54 159.88 L 30.13 161.42 L 30.71 162.96 L 31.3 164.5 L 32.15 165.64 L 33 166.77 L 33.85 167.91 L 35.39 169.13 L 36.93 170.35 L 38.48 171.58 L 40.02 172.8 L 41.67 173.6 L 43.31 174.39 L 44.96 175.19 L 46.61 175.99 L 48.31 176.34 L 50.01 176.7 L 51.72 177.05 L 53.42 177.41 L 55.12 177.76 L 56.82 178.12 L 58.57 178.27 L 60.33 178.43 L 62.08 178.59 L 63.84 178.75 L 65.67 178.75 L 67.5 178.75 L 69.33 178.75 L 71.16 178.75 L 72.98 178.75 L 74.9 178.39 L 76.81 178.02 L 78.73 177.65 L 80.64 177.28 L 82.55 176.92 L 84.47 176.55 L 86.38 176.18 L 88.3 175.81 L 90.21 175.45 L 92.13 175.08 L 94.04 174.71" fill="none" stroke="#fff" stroke-width="15.09" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="6.95s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 56.4 114.31 L 55.54 113.46 L 54.69 112.61 L 52.78 112.37 L 50.86 112.12 L 48.95 111.88 L 47.04 111.64 L 45.12 111.39 L 43.21 111.15 L 41.29 110.91 L 39.59 111.33 L 37.89 111.76 L 36.19 112.18 L 34.49 112.61 L 33.28 113.89 L 32.08 115.16 L 30.87 116.44" fill="none" stroke="#fff" stroke-width="14.85" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="1.23s" begin="0.81s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="80" y1="110.48" x2="78.66" y2="111.19" stroke-width="5.54" />
<line x1="78.66" y1="111.19" x2="77.31" y2="111.9" stroke-width="6.56" />
<line x1="77.31" y1="111.9" x2="75.96" y2="112.61" stroke-width="7.57" />
<line x1="75.96" y1="112.61" x2="74.09" y2="112.76" stroke-width="8.23" />
<line x1="74.09" y1="112.76" x2="72.22" y2="112.91" stroke-width="8.53" />
<line x1="72.22" y1="112.91" x2="70.35" y2="113.06" stroke-width="8.83" />
<line x1="70.35" y1="113.06" x2="68.47" y2="113.2" stroke-width="9.12" />
<line x1="68.47" y1="113.2" x2="66.6" y2="113.35" stroke-width="9.42" />
<line x1="66.6" y1="113.35" x2="64.73" y2="113.5" stroke-width="9.72" />
<line x1="64.73" y1="113.5" x2="62.86" y2="113.65" stroke-width="10.02" />
<line x1="62.86" y1="113.65" x2="60.99" y2="113.8" stroke-width="10.32" />
<line x1="60.99" y1="113.8" x2="59.12" y2="113.95" stroke-width="10.61" />
<line x1="59.12" y1="113.95" x2="57.25" y2="114.1" stroke-width="10.91" />
<line x1="57.25" y1="114.1" x2="55.97" y2="114.74" stroke-width="11.09" />
<line x1="55.97" y1="114.74" x2="55.05" y2="116.15" stroke-width="10.24" />
<line x1="55.05" y1="116.15" x2="54.13" y2="117.57" stroke-width="8.48" />
<line x1="54.13" y1="117.57" x2="53.2" y2="118.99" stroke-width="6.72" />
<line x1="53.2" y1="118.99" x2="51.5" y2="119.84" stroke-width="5.71" />
<line x1="51.5" y1="119.84" x2="49.8" y2="120.69" stroke-width="5.45" />
<line x1="49.8" y1="120.69" x2="48.1" y2="121.54" stroke-width="5.2" />
<line x1="48.1" y1="121.54" x2="46.4" y2="122.39" stroke-width="4.94" />
<line x1="46.4" y1="122.39" x2="45.12" y2="123.37" stroke-width="4.75" />
<line x1="45.12" y1="123.37" x2="43.85" y2="124.35" stroke-width="4.63" />
<line x1="43.85" y1="124.35" x2="42.57" y2="125.33" stroke-width="4.51" />
<line x1="42.57" y1="125.33" x2="41.29" y2="126.31" stroke-width="4.39" />
<line x1="41.29" y1="126.31" x2="40.02" y2="127.28" stroke-width="4.27" />
<line x1="40.02" y1="127.28" x2="38.83" y2="128.69" stroke-width="4.15" />
<line x1="38.83" y1="128.69" x2="37.64" y2="130.09" stroke-width="4.03" />
<line x1="37.64" y1="130.09" x2="36.45" y2="131.5" stroke-width="3.91" />
<line x1="36.45" y1="131.5" x2="35.25" y2="132.9" stroke-width="3.79" />
<line x1="35.25" y1="132.9" x2="34.06" y2="134.3" stroke-width="3.67" />
<line x1="34.06" y1="134.3" x2="33.16" y2="136.06" stroke-width="3.55" />
<line x1="33.16" y1="136.06" x2="32.26" y2="137.81" stroke-width="3.44" />
<line x1="32.26" y1="137.81" x2="31.35" y2="139.57" stroke-width="3.32" />
<line x1="31.35" y1="139.57" x2="30.45" y2="141.32" stroke-width="3.21" />
<line x1="30.45" y1="141.32" x2="30.02" y2="142.95" stroke-width="3.22" />
<line x1="30.02" y1="142.95" x2="29.6" y2="144.58" stroke-width="3.37" />
<line x1="29.6" y1="144.58" x2="29.17" y2="146.21" stroke-width="3.51" />
<line x1="29.17" y1="146.21" x2="29.03" y2="147.56" stroke-width="3.69" />
<line x1="29.03" y1="147.56" x2="28.89" y2="148.91" stroke-width="3.92" />
<line x1="28.89" y1="148.91" x2="28.75" y2="150.25" stroke-width="4.14" />
<line x1="28.75" y1="150.25" x2="28.68" y2="151.81" stroke-width="4.32" />
<line x1="28.68" y1="151.81" x2="28.6" y2="153.37" stroke-width="4.47" />
<line x1="28.6" y1="153.37" x2="28.53" y2="154.93" stroke-width="4.61" />
<line x1="28.53" y1="154.93" x2="28.75" y2="156.63" stroke-width="4.89" />
<line x1="28.75" y1="156.63" x2="28.96" y2="158.34" stroke-width="5.32" />
<line x1="28.96" y1="158.34" x2="29.54" y2="159.88" stroke-width="5.85" />
<line x1="29.54" y1="159.88" x2="30.13" y2="161.42" stroke-width="6.49" />
<line x1="30.13" y1="161.42" x2="30.71" y2="162.96" stroke-width="7.13" />
<line x1="30.71" y1="162.96" x2="31.3" y2="164.5" stroke-width="7.76" />
<line x1="31.3" y1="164.5" x2="32.15" y2="165.64" stroke-width="8.31" />
<line x1="32.15" y1="165.64" x2="33" y2="166.77" stroke-width="8.77" />
<line x1="33" y1="166.77" x2="33.85" y2="167.91" stroke-width="9.22" />
<line x1="33.85" y1="167.91" x2="35.39" y2="169.13" stroke-width="9.6" />
<line x1="35.39" y1="169.13" x2="36.93" y2="170.35" stroke-width="9.9" />
<line x1="36.93" y1="170.35" x2="38.48" y2="171.58" stroke-width="10.2" />
<line x1="38.48" y1="171.58" x2="40.02" y2="172.8" stroke-width="10.5" />
<line x1="40.02" y1="172.8" x2="41.67" y2="173.6" stroke-width="10.67" />
<line x1="41.67" y1="173.6" x2="43.31" y2="174.39" stroke-width="10.71" />
<line x1="43.31" y1="174.39" x2="44.96" y2="175.19" stroke-width="10.75" />
<line x1="44.96" y1="175.19" x2="46.61" y2="175.99" stroke-width="10.79" />
<line x1="46.61" y1="175.99" x2="48.31" y2="176.34" stroke-width="10.77" />
<line x1="48.31" y1="176.34" x2="50.01" y2="176.7" stroke-width="10.7" />
<line x1="50.01" y1="176.7" x2="51.72" y2="177.05" stroke-width="10.63" />
<line x1="51.72" y1="177.05" x2="53.42" y2="177.41" stroke-width="10.56" />
<line x1="53.42" y1="177.41" x2="55.12" y2="177.76" stroke-width="10.49" />
<line x1="55.12" y1="177.76" x2="56.82" y2="178.12" stroke-width="10.42" />
<line x1="56.82" y1="178.12" x2="58.57" y2="178.27" stroke-width="10.36" />
<line x1="58.57" y1="178.27" x2="60.33" y2="178.43" stroke-width="10.32" />
<line x1="60.33" y1="178.43" x2="62.08" y2="178.59" stroke-width="10.28" />
<line x1="62.08" y1="178.59" x2="63.84" y2="178.75" stroke-width="10.23" />
<line x1="63.84" y1="178.75" x2="65.67" y2="178.75" stroke-width="10.12" />
<line x1="65.67" y1="178.75" x2="67.5" y2="178.75" stroke-width="9.95" />
<line x1="67.5" y1="178.75" x2="69.33" y2="178.75" stroke-width="9.78" />
<line x1="69.33" y1="178.75" x2="71.16" y2="178.75" stroke-width="9.61" />
<line x1="71.16" y1="178.75" x2="72.98" y2="178.75" stroke-width="9.44" />
<line x1="72.98" y1="178.75" x2="74.9" y2="178.39" stroke-width="9.05" />
<line x1="74.9" y1="178.39" x2="76.81" y2="178.02" stroke-width="8.43" />
<line x1="76.81" y1="178.02" x2="78.73" y2="177.65" stroke-width="7.81" />
<line x1="78.73" y1="177.65" x2="80.64" y2="177.28" stroke-width="7.19" />
<line x1="80.64" y1="177.28" x2="82.55" y2="176.92" stroke-width="6.57" />
<line x1="82.55" y1="176.92" x2="84.47" y2="176.55" stroke-width="5.96" />
<line x1="84.47" y1="176.55" x2="86.38" y2="176.18" stroke-width="5.34" />
<line x1="86.38" y1="176.18" x2="88.3" y2="175.81" stroke-width="4.72" />
<line x1="88.3" y1="175.81" x2="90.21" y2="175.45" stroke-width="4.1" />
<line x1="90.21" y1="175.45" x2="92.13" y2="175.08" stroke-width="3.48" />
<line x1="92.13" y1="175.08" x2="94.04" y2="174.71" stroke-width="2.86" />
</g>
<circle cx="59.37" cy="147.7" r="3.7" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.66s" fill="freeze" /></circle>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="56.4" y1="114.31" x2="55.54" y2="113.46" stroke-width="10.85" />
<line x1="55.54" y1="113.46" x2="54.69" y2="112.61" stroke-width="9.57" />
<line x1="54.69" y1="112.61" x2="52.78" y2="112.37" stroke-width="8.93" />
<line x1="52.78" y1="112.37" x2="50.86" y2="112.12" stroke-width="8.93" />
<line x1="50.86" y1="112.12" x2="48.95" y2="111.88" stroke-width="8.93" />
<line x1="48.95" y1="111.88" x2="47.04" y2="111.64" stroke-width="8.93" />
<line x1="47.04" y1="111.64" x2="45.12" y2="111.39" stroke-width="8.93" />
<line x1="45.12" y1="111.39" x2="43.21" y2="111.15" stroke-width="8.93" />
<line x1="43.21" y1="111.15" x2="41.29" y2="110.91" stroke-width="8.93" />
<line x1="41.29" y1="110.91" x2="39.59" y2="111.33" stroke-width="8.72" />
<line x1="39.59" y1="111.33" x2="37.89" y2="111.76" stroke-width="8.29" />
<line x1="37.89" y1="111.76" x2="36.19" y2="112.18" stroke-width="7.87" />
<line x1="36.19" y1="112.18" x2="34.49" y2="112.61" stroke-width="7.44" />
<line x1="34.49" y1="112.61" x2="33.28" y2="113.89" stroke-width="6.44" />
<line x1="33.28" y1="113.89" x2="32.08" y2="115.16" stroke-width="4.86" />
<line x1="32.08" y1="115.16" x2="30.87" y2="116.44" stroke-width="3.27" />
</g>
<circle cx="34.91" cy="168.76" r="3.7" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="1.06s" fill="freeze" /></circle>
</svg>`,

  taa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132.6 215.8" width="132.6" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 101.11 96.5 L 101.19 98.33 L 101.26 100.16 L 101.33 101.99 L 102.07 103.6 L 102.8 105.22 L 103.53 106.83 L 103.75 108.37 L 103.97 109.91 L 104.19 111.45 L 103.97 113.21 L 103.75 114.97 L 102.73 116.07 L 101.7 117.16 L 100.67 118.26 L 99 119.1 L 97.33 119.94 L 95.66 120.77 L 93.99 121.61 L 92.32 122.44 L 90.56 122.97 L 88.8 123.5 L 87.04 124.03 L 85.28 124.55 L 83.52 125.08 L 81.76 125.52 L 80 125.96 L 78.06 126.21 L 76.11 126.46 L 74.16 126.71 L 72.21 126.97 L 70.27 127.22 L 68.32 127.47 L 66.37 127.72 L 64.61 127.75 L 62.85 127.77 L 61.09 127.8 L 59.33 127.83 L 57.57 127.86 L 55.82 127.88 L 54.06 127.91 L 52.3 127.94 L 50.54 127.72 L 48.78 127.5 L 47.02 127.28 L 45.26 127.06 L 43.78 126.62 L 42.29 126.18 L 40.81 125.74 L 39.32 125.3 L 38 124.57 L 36.69 123.83 L 35.37 123.1 L 33.97 121.78 L 32.58 120.46 L 31.19 119.14 L 30.53 117.68 L 29.87 116.21 L 29.21 114.75 L 29.37 113.1 L 29.54 111.45 L 29.7 109.8 L 29.87 108.15 L 30.75 106.66 L 31.63 105.18 L 32.51 103.7 L 33.39 102.21" fill="none" stroke="#fff" stroke-width="14.56" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.32s" begin="0s" fill="freeze" /></path></mask>

</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="101.11" y1="96.5" x2="101.19" y2="98.33" stroke-width="4.05" />
<line x1="101.19" y1="98.33" x2="101.26" y2="100.16" stroke-width="5.42" />
<line x1="101.26" y1="100.16" x2="101.33" y2="101.99" stroke-width="6.79" />
<line x1="101.33" y1="101.99" x2="102.07" y2="103.6" stroke-width="7.11" />
<line x1="102.07" y1="103.6" x2="102.8" y2="105.22" stroke-width="6.38" />
<line x1="102.8" y1="105.22" x2="103.53" y2="106.83" stroke-width="5.64" />
<line x1="103.53" y1="106.83" x2="103.75" y2="108.37" stroke-width="5.06" />
<line x1="103.75" y1="108.37" x2="103.97" y2="109.91" stroke-width="4.62" />
<line x1="103.97" y1="109.91" x2="104.19" y2="111.45" stroke-width="4.18" />
<line x1="104.19" y1="111.45" x2="103.97" y2="113.21" stroke-width="3.96" />
<line x1="103.97" y1="113.21" x2="103.75" y2="114.97" stroke-width="3.96" />
<line x1="103.75" y1="114.97" x2="102.73" y2="116.07" stroke-width="4.54" />
<line x1="102.73" y1="116.07" x2="101.7" y2="117.16" stroke-width="5.71" />
<line x1="101.7" y1="117.16" x2="100.67" y2="118.26" stroke-width="6.88" />
<line x1="100.67" y1="118.26" x2="99" y2="119.1" stroke-width="7.59" />
<line x1="99" y1="119.1" x2="97.33" y2="119.94" stroke-width="7.84" />
<line x1="97.33" y1="119.94" x2="95.66" y2="120.77" stroke-width="8.08" />
<line x1="95.66" y1="120.77" x2="93.99" y2="121.61" stroke-width="8.33" />
<line x1="93.99" y1="121.61" x2="92.32" y2="122.44" stroke-width="8.58" />
<line x1="92.32" y1="122.44" x2="90.56" y2="122.97" stroke-width="8.75" />
<line x1="90.56" y1="122.97" x2="88.8" y2="123.5" stroke-width="8.84" />
<line x1="88.8" y1="123.5" x2="87.04" y2="124.03" stroke-width="8.93" />
<line x1="87.04" y1="124.03" x2="85.28" y2="124.55" stroke-width="9.02" />
<line x1="85.28" y1="124.55" x2="83.52" y2="125.08" stroke-width="9.11" />
<line x1="83.52" y1="125.08" x2="81.76" y2="125.52" stroke-width="9.18" />
<line x1="81.76" y1="125.52" x2="80" y2="125.96" stroke-width="9.22" />
<line x1="80" y1="125.96" x2="78.06" y2="126.21" stroke-width="9.27" />
<line x1="78.06" y1="126.21" x2="76.11" y2="126.46" stroke-width="9.33" />
<line x1="76.11" y1="126.46" x2="74.16" y2="126.71" stroke-width="9.39" />
<line x1="74.16" y1="126.71" x2="72.21" y2="126.97" stroke-width="9.46" />
<line x1="72.21" y1="126.97" x2="70.27" y2="127.22" stroke-width="9.52" />
<line x1="70.27" y1="127.22" x2="68.32" y2="127.47" stroke-width="9.58" />
<line x1="68.32" y1="127.47" x2="66.37" y2="127.72" stroke-width="9.64" />
<line x1="66.37" y1="127.72" x2="64.61" y2="127.75" stroke-width="9.7" />
<line x1="64.61" y1="127.75" x2="62.85" y2="127.77" stroke-width="9.76" />
<line x1="62.85" y1="127.77" x2="61.09" y2="127.8" stroke-width="9.81" />
<line x1="61.09" y1="127.8" x2="59.33" y2="127.83" stroke-width="9.87" />
<line x1="59.33" y1="127.83" x2="57.57" y2="127.86" stroke-width="9.92" />
<line x1="57.57" y1="127.86" x2="55.82" y2="127.88" stroke-width="9.98" />
<line x1="55.82" y1="127.88" x2="54.06" y2="127.91" stroke-width="10.03" />
<line x1="54.06" y1="127.91" x2="52.3" y2="127.94" stroke-width="10.09" />
<line x1="52.3" y1="127.94" x2="50.54" y2="127.72" stroke-width="10.16" />
<line x1="50.54" y1="127.72" x2="48.78" y2="127.5" stroke-width="10.25" />
<line x1="48.78" y1="127.5" x2="47.02" y2="127.28" stroke-width="10.34" />
<line x1="47.02" y1="127.28" x2="45.26" y2="127.06" stroke-width="10.43" />
<line x1="45.26" y1="127.06" x2="43.78" y2="126.62" stroke-width="10.49" />
<line x1="43.78" y1="126.62" x2="42.29" y2="126.18" stroke-width="10.51" />
<line x1="42.29" y1="126.18" x2="40.81" y2="125.74" stroke-width="10.54" />
<line x1="40.81" y1="125.74" x2="39.32" y2="125.3" stroke-width="10.56" />
<line x1="39.32" y1="125.3" x2="38" y2="124.57" stroke-width="10.47" />
<line x1="38" y1="124.57" x2="36.69" y2="123.83" stroke-width="10.26" />
<line x1="36.69" y1="123.83" x2="35.37" y2="123.1" stroke-width="10.05" />
<line x1="35.37" y1="123.1" x2="33.97" y2="121.78" stroke-width="9.74" />
<line x1="33.97" y1="121.78" x2="32.58" y2="120.46" stroke-width="9.33" />
<line x1="32.58" y1="120.46" x2="31.19" y2="119.14" stroke-width="8.91" />
<line x1="31.19" y1="119.14" x2="30.53" y2="117.68" stroke-width="8.28" />
<line x1="30.53" y1="117.68" x2="29.87" y2="116.21" stroke-width="7.43" />
<line x1="29.87" y1="116.21" x2="29.21" y2="114.75" stroke-width="6.58" />
<line x1="29.21" y1="114.75" x2="29.37" y2="113.1" stroke-width="5.82" />
<line x1="29.37" y1="113.1" x2="29.54" y2="111.45" stroke-width="5.14" />
<line x1="29.54" y1="111.45" x2="29.7" y2="109.8" stroke-width="4.46" />
<line x1="29.7" y1="109.8" x2="29.87" y2="108.15" stroke-width="3.78" />
<line x1="29.87" y1="108.15" x2="30.75" y2="106.66" stroke-width="3.3" />
<line x1="30.75" y1="106.66" x2="31.63" y2="105.18" stroke-width="3.02" />
<line x1="31.63" y1="105.18" x2="32.51" y2="103.7" stroke-width="2.73" />
<line x1="32.51" y1="103.7" x2="33.39" y2="102.21" stroke-width="2.45" />
</g>
<!-- Two dots (نقطتين) above the curve for تاء -->
<circle cx="57" cy="82" r="3.82" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.73s" fill="freeze" /></circle>
<circle cx="75" cy="82" r="3.82" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.87s" fill="freeze" /></circle>
</svg>`,

  thaa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132.6 215.8" width="132.6" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 100.89 95.91 L 101.04 97.89 L 101.19 99.87 L 101.33 101.85 L 102.07 103.53 L 102.8 105.22 L 103.53 106.9 L 103.75 108.37 L 103.97 109.84 L 104.19 111.3 L 103.97 113.17 L 103.75 115.04 L 102.73 116.14 L 101.7 117.24 L 100.67 118.34 L 99.35 119.07 L 98.03 119.8 L 96.72 120.54 L 95 121.2 L 93.28 121.86 L 91.57 122.52 L 89.85 123.18 L 88.14 123.84 L 86.38 124.28 L 84.62 124.72 L 82.86 125.16 L 81.1 125.6 L 79.34 126.04 L 77.58 126.25 L 75.83 126.47 L 74.07 126.69 L 72.31 126.91 L 70.55 127.13 L 68.79 127.35 L 67.03 127.57 L 65.27 127.79 L 63.51 127.83 L 61.75 127.86 L 59.99 127.89 L 58.23 127.92 L 56.48 127.95 L 54.72 127.98 L 52.96 128.01 L 51.2 127.79 L 49.44 127.57 L 47.68 127.35 L 45.92 127.13 L 44.33 126.69 L 42.73 126.25 L 41.14 125.81 L 39.54 125.38 L 38.08 124.57 L 36.61 123.76 L 35.15 122.96 L 33.9 121.78 L 32.65 120.61 L 31.41 119.44 L 30.53 118.01 L 29.65 116.58 L 29.43 115.59 L 29.21 114.6 L 29.43 112.84 L 29.65 111.08 L 29.87 109.32 L 30.09 107.56 L 30.75 105.81 L 31.85 104.34 L 32.95 102.87 L 34.05 101.41" fill="none" stroke="#fff" stroke-width="14.56" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.32s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="100.89" y1="95.91" x2="101.04" y2="97.89" stroke-width="3.17" />
<line x1="101.04" y1="97.89" x2="101.19" y2="99.87" stroke-width="4.89" />
<line x1="101.19" y1="99.87" x2="101.33" y2="101.85" stroke-width="6.61" />
<line x1="101.33" y1="101.85" x2="102.07" y2="103.53" stroke-width="7.11" />
<line x1="102.07" y1="103.53" x2="102.8" y2="105.22" stroke-width="6.38" />
<line x1="102.8" y1="105.22" x2="103.53" y2="106.9" stroke-width="5.64" />
<line x1="103.53" y1="106.9" x2="103.75" y2="108.37" stroke-width="5.06" />
<line x1="103.75" y1="108.37" x2="103.97" y2="109.84" stroke-width="4.62" />
<line x1="103.97" y1="109.84" x2="104.19" y2="111.3" stroke-width="4.18" />
<line x1="104.19" y1="111.3" x2="103.97" y2="113.17" stroke-width="3.96" />
<line x1="103.97" y1="113.17" x2="103.75" y2="115.04" stroke-width="3.96" />
<line x1="103.75" y1="115.04" x2="102.73" y2="116.14" stroke-width="4.54" />
<line x1="102.73" y1="116.14" x2="101.7" y2="117.24" stroke-width="5.71" />
<line x1="101.7" y1="117.24" x2="100.67" y2="118.34" stroke-width="6.88" />
<line x1="100.67" y1="118.34" x2="99.35" y2="119.07" stroke-width="7.61" />
<line x1="99.35" y1="119.07" x2="98.03" y2="119.8" stroke-width="7.9" />
<line x1="98.03" y1="119.8" x2="96.72" y2="120.54" stroke-width="8.2" />
<line x1="96.72" y1="120.54" x2="95" y2="121.2" stroke-width="8.42" />
<line x1="95" y1="121.2" x2="93.28" y2="121.86" stroke-width="8.59" />
<line x1="93.28" y1="121.86" x2="91.57" y2="122.52" stroke-width="8.75" />
<line x1="91.57" y1="122.52" x2="89.85" y2="123.18" stroke-width="8.91" />
<line x1="89.85" y1="123.18" x2="88.14" y2="123.84" stroke-width="9.08" />
<line x1="88.14" y1="123.84" x2="86.38" y2="124.28" stroke-width="9.17" />
<line x1="86.38" y1="124.28" x2="84.62" y2="124.72" stroke-width="9.18" />
<line x1="84.62" y1="124.72" x2="82.86" y2="125.16" stroke-width="9.2" />
<line x1="82.86" y1="125.16" x2="81.1" y2="125.6" stroke-width="9.21" />
<line x1="81.1" y1="125.6" x2="79.34" y2="126.04" stroke-width="9.23" />
<line x1="79.34" y1="126.04" x2="77.58" y2="126.25" stroke-width="9.26" />
<line x1="77.58" y1="126.25" x2="75.83" y2="126.47" stroke-width="9.32" />
<line x1="75.83" y1="126.47" x2="74.07" y2="126.69" stroke-width="9.37" />
<line x1="74.07" y1="126.69" x2="72.31" y2="126.91" stroke-width="9.43" />
<line x1="72.31" y1="126.91" x2="70.55" y2="127.13" stroke-width="9.48" />
<line x1="70.55" y1="127.13" x2="68.79" y2="127.35" stroke-width="9.54" />
<line x1="68.79" y1="127.35" x2="67.03" y2="127.57" stroke-width="9.59" />
<line x1="67.03" y1="127.57" x2="65.27" y2="127.79" stroke-width="9.65" />
<line x1="65.27" y1="127.79" x2="63.51" y2="127.83" stroke-width="9.71" />
<line x1="63.51" y1="127.83" x2="61.75" y2="127.86" stroke-width="9.77" />
<line x1="61.75" y1="127.86" x2="59.99" y2="127.89" stroke-width="9.83" />
<line x1="59.99" y1="127.89" x2="58.23" y2="127.92" stroke-width="9.9" />
<line x1="58.23" y1="127.92" x2="56.48" y2="127.95" stroke-width="9.96" />
<line x1="56.48" y1="127.95" x2="54.72" y2="127.98" stroke-width="10.02" />
<line x1="54.72" y1="127.98" x2="52.96" y2="128.01" stroke-width="10.08" />
<line x1="52.96" y1="128.01" x2="51.2" y2="127.79" stroke-width="10.16" />
<line x1="51.2" y1="127.79" x2="49.44" y2="127.57" stroke-width="10.25" />
<line x1="49.44" y1="127.57" x2="47.68" y2="127.35" stroke-width="10.34" />
<line x1="47.68" y1="127.35" x2="45.92" y2="127.13" stroke-width="10.43" />
<line x1="45.92" y1="127.13" x2="44.33" y2="126.69" stroke-width="10.49" />
<line x1="44.33" y1="126.69" x2="42.73" y2="126.25" stroke-width="10.51" />
<line x1="42.73" y1="126.25" x2="41.14" y2="125.81" stroke-width="10.54" />
<line x1="41.14" y1="125.81" x2="39.54" y2="125.38" stroke-width="10.56" />
<line x1="39.54" y1="125.38" x2="38.08" y2="124.57" stroke-width="10.47" />
<line x1="38.08" y1="124.57" x2="36.61" y2="123.76" stroke-width="10.26" />
<line x1="36.61" y1="123.76" x2="35.15" y2="122.96" stroke-width="10.05" />
<line x1="35.15" y1="122.96" x2="33.9" y2="121.78" stroke-width="9.74" />
<line x1="33.9" y1="121.78" x2="32.65" y2="120.61" stroke-width="9.33" />
<line x1="32.65" y1="120.61" x2="31.41" y2="119.44" stroke-width="8.91" />
<line x1="31.41" y1="119.44" x2="30.53" y2="118.01" stroke-width="8.27" />
<line x1="30.53" y1="118.01" x2="29.65" y2="116.58" stroke-width="7.4" />
<line x1="29.65" y1="116.58" x2="29.43" y2="115.59" stroke-width="6.74" />
<line x1="29.43" y1="115.59" x2="29.21" y2="114.6" stroke-width="6.3" />
<line x1="29.21" y1="114.6" x2="29.43" y2="112.84" stroke-width="5.71" />
<line x1="29.43" y1="112.84" x2="29.65" y2="111.08" stroke-width="4.95" />
<line x1="29.65" y1="111.08" x2="29.87" y2="109.32" stroke-width="4.2" />
<line x1="29.87" y1="109.32" x2="30.09" y2="107.56" stroke-width="3.45" />
<line x1="30.09" y1="107.56" x2="30.75" y2="105.81" stroke-width="2.78" />
<line x1="30.75" y1="105.81" x2="31.85" y2="104.34" stroke-width="2.43" />
<line x1="31.85" y1="104.34" x2="32.95" y2="102.87" stroke-width="2.31" />
<line x1="32.95" y1="102.87" x2="34.05" y2="101.41" stroke-width="2.18" />
</g>
<!-- Three dots (ثلاث نقاط) above the curve for ثاء -->
<circle cx="57" cy="88" r="3.9" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.69s" fill="freeze" /></circle>
<circle cx="75" cy="88" r="3.9" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.83s" fill="freeze" /></circle>
<circle cx="66" cy="72" r="3.9" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.97s" fill="freeze" /></circle>
</svg>`,

  ayn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 94 215.8" width="94" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 65.62 100.85 L 64.26 102.3 L 62.89 103.75 L 61.52 105.21 L 59.9 106.1 L 58.28 107 L 56.65 107.9 L 55.03 108.79 L 53.41 109.69 L 51.79 110.59 L 49.86 111.1 L 47.94 111.61 L 46.02 112.12 L 44.1 112.64 L 43.24 114.43 L 42.39 116.22 L 41.54 118.02 L 40.51 118.96 L 39.48 119.9 L 38.46 120.84 L 37.33 122.43 L 36.2 124.01 L 35.08 125.6 L 33.95 127.19 L 32.82 128.78 L 32.18 130.45 L 31.54 132.11 L 30.9 133.78 L 30.26 135.44 L 29.62 137.11 L 28.98 138.78 L 28.72 140.36 L 28.47 141.95 L 28.21 143.54 L 27.95 145.13 L 27.7 146.72 L 27.7 148.32 L 27.7 149.92 L 27.7 151.52 L 27.7 153.13 L 28.14 154.79 L 28.59 156.46 L 29.04 158.12 L 29.49 159.79 L 30.34 161.24 L 31.2 162.69 L 32.05 164.15 L 33.27 165.24 L 34.49 166.32 L 35.7 167.41 L 36.92 168.5 L 38.59 169.53 L 40.25 170.55 L 41.94 171.12 L 43.64 171.68 L 45.33 172.24 L 47.02 172.81 L 48.71 173.37 L 50.33 173.63 L 51.96 173.88 L 53.58 174.14 L 55.4 174.14 L 57.22 174.14 L 59.05 174.14 L 60.87 174.14 L 62.69 174.14 L 64.51 174.14 L 66.34 174.14 L 68.16 174.14 L 69.98 174.14 L 71.83 173.78 L 73.67 173.42 L 75.52 173.06 L 77.36 172.7 L 79.21 172.35 L 80.96 171.72 L 82.72 171.1 L 84.48 170.48 L 86.23 169.86 L 87.99 169.23 L 89.75 168.61 L 91.51 167.99" fill="none" stroke="#fff" stroke-width="13.72" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="6.55s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 53.07 92.14 L 51.53 91.67 L 49.99 91.21 L 48.45 90.75 L 46.92 90.29 L 45.38 89.83 L 43.97 89.96 L 42.56 90.09 L 41.02 91.02 L 39.48 91.96 L 37.95 92.9 L 36.49 94.27 L 35.04 95.64 L 33.59 97 L 32.57 98.54 L 31.54 100.08 L 30.52 101.62 L 30.52 103.41 L 30.52 105.21 L 31.54 106.61 L 32.57 108.02 L 33.97 109.05 L 35.38 110.07 L 37.11 110.59 L 38.84 111.1 L 40.57 111.61 L 42.3 112.12 L 43.59 113.15" fill="none" stroke="#fff" stroke-width="12.46" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.18s" begin="0.63s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="65.62" y1="100.85" x2="64.26" y2="102.3" stroke-width="3.61" />
<line x1="64.26" y1="102.3" x2="62.89" y2="103.75" stroke-width="4.68" />
<line x1="62.89" y1="103.75" x2="61.52" y2="105.21" stroke-width="5.74" />
<line x1="61.52" y1="105.21" x2="59.9" y2="106.1" stroke-width="6.28" />
<line x1="59.9" y1="106.1" x2="58.28" y2="107" stroke-width="6.28" />
<line x1="58.28" y1="107" x2="56.65" y2="107.9" stroke-width="6.29" />
<line x1="56.65" y1="107.9" x2="55.03" y2="108.79" stroke-width="6.3" />
<line x1="55.03" y1="108.79" x2="53.41" y2="109.69" stroke-width="6.3" />
<line x1="53.41" y1="109.69" x2="51.79" y2="110.59" stroke-width="6.31" />
<line x1="51.79" y1="110.59" x2="49.86" y2="111.1" stroke-width="6.55" />
<line x1="49.86" y1="111.1" x2="47.94" y2="111.61" stroke-width="7.02" />
<line x1="47.94" y1="111.61" x2="46.02" y2="112.12" stroke-width="7.49" />
<line x1="46.02" y1="112.12" x2="44.1" y2="112.64" stroke-width="7.96" />
<line x1="44.1" y1="112.64" x2="43.24" y2="114.43" stroke-width="7.77" />
<line x1="43.24" y1="114.43" x2="42.39" y2="116.22" stroke-width="6.89" />
<line x1="42.39" y1="116.22" x2="41.54" y2="118.02" stroke-width="6.02" />
<line x1="41.54" y1="118.02" x2="40.51" y2="118.96" stroke-width="5.47" />
<line x1="40.51" y1="118.96" x2="39.48" y2="119.9" stroke-width="5.22" />
<line x1="39.48" y1="119.9" x2="38.46" y2="120.84" stroke-width="4.98" />
<line x1="38.46" y1="120.84" x2="37.33" y2="122.43" stroke-width="4.74" />
<line x1="37.33" y1="122.43" x2="36.2" y2="124.01" stroke-width="4.49" />
<line x1="36.2" y1="124.01" x2="35.08" y2="125.6" stroke-width="4.24" />
<line x1="35.08" y1="125.6" x2="33.95" y2="127.19" stroke-width="4" />
<line x1="33.95" y1="127.19" x2="32.82" y2="128.78" stroke-width="3.75" />
<line x1="32.82" y1="128.78" x2="32.18" y2="130.45" stroke-width="3.54" />
<line x1="32.18" y1="130.45" x2="31.54" y2="132.11" stroke-width="3.36" />
<line x1="31.54" y1="132.11" x2="30.9" y2="133.78" stroke-width="3.18" />
<line x1="30.9" y1="133.78" x2="30.26" y2="135.44" stroke-width="3.01" />
<line x1="30.26" y1="135.44" x2="29.62" y2="137.11" stroke-width="2.83" />
<line x1="29.62" y1="137.11" x2="28.98" y2="138.78" stroke-width="2.65" />
<line x1="28.98" y1="138.78" x2="28.72" y2="140.36" stroke-width="2.56" />
<line x1="28.72" y1="140.36" x2="28.47" y2="141.95" stroke-width="2.56" />
<line x1="28.47" y1="141.95" x2="28.21" y2="143.54" stroke-width="2.56" />
<line x1="28.21" y1="143.54" x2="27.95" y2="145.13" stroke-width="2.56" />
<line x1="27.95" y1="145.13" x2="27.7" y2="146.72" stroke-width="2.56" />
<line x1="27.7" y1="146.72" x2="27.7" y2="148.32" stroke-width="2.63" />
<line x1="27.7" y1="148.32" x2="27.7" y2="149.92" stroke-width="2.76" />
<line x1="27.7" y1="149.92" x2="27.7" y2="151.52" stroke-width="2.88" />
<line x1="27.7" y1="151.52" x2="27.7" y2="153.13" stroke-width="3.01" />
<line x1="27.7" y1="153.13" x2="28.14" y2="154.79" stroke-width="3.32" />
<line x1="28.14" y1="154.79" x2="28.59" y2="156.46" stroke-width="3.81" />
<line x1="28.59" y1="156.46" x2="29.04" y2="158.12" stroke-width="4.3" />
<line x1="29.04" y1="158.12" x2="29.49" y2="159.79" stroke-width="4.79" />
<line x1="29.49" y1="159.79" x2="30.34" y2="161.24" stroke-width="5.33" />
<line x1="30.34" y1="161.24" x2="31.2" y2="162.69" stroke-width="5.93" />
<line x1="31.2" y1="162.69" x2="32.05" y2="164.15" stroke-width="6.53" />
<line x1="32.05" y1="164.15" x2="33.27" y2="165.24" stroke-width="7.03" />
<line x1="33.27" y1="165.24" x2="34.49" y2="166.32" stroke-width="7.45" />
<line x1="34.49" y1="166.32" x2="35.7" y2="167.41" stroke-width="7.86" />
<line x1="35.7" y1="167.41" x2="36.92" y2="168.5" stroke-width="8.28" />
<line x1="36.92" y1="168.5" x2="38.59" y2="169.53" stroke-width="8.67" />
<line x1="38.59" y1="169.53" x2="40.25" y2="170.55" stroke-width="9.03" />
<line x1="40.25" y1="170.55" x2="41.94" y2="171.12" stroke-width="9.26" />
<line x1="41.94" y1="171.12" x2="43.64" y2="171.68" stroke-width="9.37" />
<line x1="43.64" y1="171.68" x2="45.33" y2="172.24" stroke-width="9.47" />
<line x1="45.33" y1="172.24" x2="47.02" y2="172.81" stroke-width="9.58" />
<line x1="47.02" y1="172.81" x2="48.71" y2="173.37" stroke-width="9.69" />
<line x1="48.71" y1="173.37" x2="50.33" y2="173.63" stroke-width="9.72" />
<line x1="50.33" y1="173.63" x2="51.96" y2="173.88" stroke-width="9.69" />
<line x1="51.96" y1="173.88" x2="53.58" y2="174.14" stroke-width="9.66" />
<line x1="53.58" y1="174.14" x2="55.4" y2="174.14" stroke-width="9.6" />
<line x1="55.4" y1="174.14" x2="57.22" y2="174.14" stroke-width="9.49" />
<line x1="57.22" y1="174.14" x2="59.05" y2="174.14" stroke-width="9.39" />
<line x1="59.05" y1="174.14" x2="60.87" y2="174.14" stroke-width="9.29" />
<line x1="60.87" y1="174.14" x2="62.69" y2="174.14" stroke-width="9.18" />
<line x1="62.69" y1="174.14" x2="64.51" y2="174.14" stroke-width="9.08" />
<line x1="64.51" y1="174.14" x2="66.34" y2="174.14" stroke-width="8.97" />
<line x1="66.34" y1="174.14" x2="68.16" y2="174.14" stroke-width="8.87" />
<line x1="68.16" y1="174.14" x2="69.98" y2="174.14" stroke-width="8.77" />
<line x1="69.98" y1="174.14" x2="71.83" y2="173.78" stroke-width="8.5" />
<line x1="71.83" y1="173.78" x2="73.67" y2="173.42" stroke-width="8.07" />
<line x1="73.67" y1="173.42" x2="75.52" y2="173.06" stroke-width="7.64" />
<line x1="75.52" y1="173.06" x2="77.36" y2="172.7" stroke-width="7.22" />
<line x1="77.36" y1="172.7" x2="79.21" y2="172.35" stroke-width="6.79" />
<line x1="79.21" y1="172.35" x2="80.96" y2="171.72" stroke-width="6.21" />
<line x1="80.96" y1="171.72" x2="82.72" y2="171.1" stroke-width="5.48" />
<line x1="82.72" y1="171.1" x2="84.48" y2="170.48" stroke-width="4.74" />
<line x1="84.48" y1="170.48" x2="86.23" y2="169.86" stroke-width="4.01" />
<line x1="86.23" y1="169.86" x2="87.99" y2="169.23" stroke-width="3.28" />
<line x1="87.99" y1="169.23" x2="89.75" y2="168.61" stroke-width="2.55" />
<line x1="89.75" y1="168.61" x2="91.51" y2="167.99" stroke-width="1.82" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="53.07" y1="92.14" x2="51.53" y2="91.67" stroke-width="2.62" />
<line x1="51.53" y1="91.67" x2="49.99" y2="91.21" stroke-width="3.52" />
<line x1="49.99" y1="91.21" x2="48.45" y2="90.75" stroke-width="4.42" />
<line x1="48.45" y1="90.75" x2="46.92" y2="90.29" stroke-width="5.32" />
<line x1="46.92" y1="90.29" x2="45.38" y2="89.83" stroke-width="6.21" />
<line x1="45.38" y1="89.83" x2="43.97" y2="89.96" stroke-width="6.9" />
<line x1="43.97" y1="89.96" x2="42.56" y2="90.09" stroke-width="7.37" />
<line x1="42.56" y1="90.09" x2="41.02" y2="91.02" stroke-width="7.3" />
<line x1="41.02" y1="91.02" x2="39.48" y2="91.96" stroke-width="6.7" />
<line x1="39.48" y1="91.96" x2="37.95" y2="92.9" stroke-width="6.1" />
<line x1="37.95" y1="92.9" x2="36.49" y2="94.27" stroke-width="5.52" />
<line x1="36.49" y1="94.27" x2="35.04" y2="95.64" stroke-width="4.97" />
<line x1="35.04" y1="95.64" x2="33.59" y2="97" stroke-width="4.41" />
<line x1="33.59" y1="97" x2="32.57" y2="98.54" stroke-width="3.86" />
<line x1="32.57" y1="98.54" x2="31.54" y2="100.08" stroke-width="3.31" />
<line x1="31.54" y1="100.08" x2="30.52" y2="101.62" stroke-width="2.75" />
<line x1="30.52" y1="101.62" x2="30.52" y2="103.41" stroke-width="2.88" />
<line x1="30.52" y1="103.41" x2="30.52" y2="105.21" stroke-width="3.69" />
<line x1="30.52" y1="105.21" x2="31.54" y2="106.61" stroke-width="4.89" />
<line x1="31.54" y1="106.61" x2="32.57" y2="108.02" stroke-width="6.46" />
<line x1="32.57" y1="108.02" x2="33.97" y2="109.05" stroke-width="7.38" />
<line x1="33.97" y1="109.05" x2="35.38" y2="110.07" stroke-width="7.63" />
<line x1="35.38" y1="110.07" x2="37.11" y2="110.59" stroke-width="7.75" />
<line x1="37.11" y1="110.59" x2="38.84" y2="111.1" stroke-width="7.73" />
<line x1="38.84" y1="111.1" x2="40.57" y2="111.61" stroke-width="7.72" />
<line x1="40.57" y1="111.61" x2="42.3" y2="112.12" stroke-width="7.7" />
<line x1="42.3" y1="112.12" x2="43.59" y2="113.15" stroke-width="8.46" />
</g>
<circle cx="32.57" cy="164.4" r="2.95" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.94s" fill="freeze" /></circle>
</svg>`,

  haa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106.1 215.8" width="106.1" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 80 110.48 L 78.66 111.19 L 77.31 111.9 L 75.96 112.61 L 74.09 112.76 L 72.22 112.91 L 70.35 113.06 L 68.47 113.2 L 66.6 113.35 L 64.73 113.5 L 62.86 113.65 L 60.99 113.8 L 59.12 113.95 L 57.25 114.1 L 55.97 114.74 L 55.05 116.15 L 54.13 117.57 L 53.2 118.99 L 51.5 119.84 L 49.8 120.69 L 48.1 121.54 L 46.4 122.39 L 45.12 123.37 L 43.85 124.35 L 42.57 125.33 L 41.29 126.31 L 40.02 127.28 L 38.83 128.69 L 37.64 130.09 L 36.45 131.5 L 35.25 132.9 L 34.06 134.3 L 33.16 136.06 L 32.26 137.81 L 31.35 139.57 L 30.45 141.32 L 30.02 142.95 L 29.6 144.58 L 29.17 146.21 L 29.03 147.56 L 28.89 148.91 L 28.75 150.25 L 28.68 151.81 L 28.6 153.37 L 28.53 154.93 L 28.75 156.63 L 28.96 158.34 L 29.54 159.88 L 30.13 161.42 L 30.71 162.96 L 31.3 164.5 L 32.15 165.64 L 33 166.77 L 33.85 167.91 L 35.39 169.13 L 36.93 170.35 L 38.48 171.58 L 40.02 172.8 L 41.67 173.6 L 43.31 174.39 L 44.96 175.19 L 46.61 175.99 L 48.31 176.34 L 50.01 176.7 L 51.72 177.05 L 53.42 177.41 L 55.12 177.76 L 56.82 178.12 L 58.57 178.27 L 60.33 178.43 L 62.08 178.59 L 63.84 178.75 L 65.67 178.75 L 67.5 178.75 L 69.33 178.75 L 71.16 178.75 L 72.98 178.75 L 74.9 178.39 L 76.81 178.02 L 78.73 177.65 L 80.64 177.28 L 82.55 176.92 L 84.47 176.55 L 86.38 176.18 L 88.3 175.81 L 90.21 175.45 L 92.13 175.08 L 94.04 174.71" fill="none" stroke="#fff" stroke-width="15.09" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="6.95s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 56.4 114.31 L 55.54 113.46 L 54.69 112.61 L 52.78 112.37 L 50.86 112.12 L 48.95 111.88 L 47.04 111.64 L 45.12 111.39 L 43.21 111.15 L 41.29 110.91 L 39.59 111.33 L 37.89 111.76 L 36.19 112.18 L 34.49 112.61 L 33.28 113.89 L 32.08 115.16 L 30.87 116.44" fill="none" stroke="#fff" stroke-width="14.85" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="1.23s" begin="0.66s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="80" y1="110.48" x2="78.66" y2="111.19" stroke-width="5.54" />
<line x1="78.66" y1="111.19" x2="77.31" y2="111.9" stroke-width="6.56" />
<line x1="77.31" y1="111.9" x2="75.96" y2="112.61" stroke-width="7.57" />
<line x1="75.96" y1="112.61" x2="74.09" y2="112.76" stroke-width="8.23" />
<line x1="74.09" y1="112.76" x2="72.22" y2="112.91" stroke-width="8.53" />
<line x1="72.22" y1="112.91" x2="70.35" y2="113.06" stroke-width="8.83" />
<line x1="70.35" y1="113.06" x2="68.47" y2="113.2" stroke-width="9.12" />
<line x1="68.47" y1="113.2" x2="66.6" y2="113.35" stroke-width="9.42" />
<line x1="66.6" y1="113.35" x2="64.73" y2="113.5" stroke-width="9.72" />
<line x1="64.73" y1="113.5" x2="62.86" y2="113.65" stroke-width="10.02" />
<line x1="62.86" y1="113.65" x2="60.99" y2="113.8" stroke-width="10.32" />
<line x1="60.99" y1="113.8" x2="59.12" y2="113.95" stroke-width="10.61" />
<line x1="59.12" y1="113.95" x2="57.25" y2="114.1" stroke-width="10.91" />
<line x1="57.25" y1="114.1" x2="55.97" y2="114.74" stroke-width="11.09" />
<line x1="55.97" y1="114.74" x2="55.05" y2="116.15" stroke-width="10.24" />
<line x1="55.05" y1="116.15" x2="54.13" y2="117.57" stroke-width="8.48" />
<line x1="54.13" y1="117.57" x2="53.2" y2="118.99" stroke-width="6.72" />
<line x1="53.2" y1="118.99" x2="51.5" y2="119.84" stroke-width="5.71" />
<line x1="51.5" y1="119.84" x2="49.8" y2="120.69" stroke-width="5.45" />
<line x1="49.8" y1="120.69" x2="48.1" y2="121.54" stroke-width="5.2" />
<line x1="48.1" y1="121.54" x2="46.4" y2="122.39" stroke-width="4.94" />
<line x1="46.4" y1="122.39" x2="45.12" y2="123.37" stroke-width="4.75" />
<line x1="45.12" y1="123.37" x2="43.85" y2="124.35" stroke-width="4.63" />
<line x1="43.85" y1="124.35" x2="42.57" y2="125.33" stroke-width="4.51" />
<line x1="42.57" y1="125.33" x2="41.29" y2="126.31" stroke-width="4.39" />
<line x1="41.29" y1="126.31" x2="40.02" y2="127.28" stroke-width="4.27" />
<line x1="40.02" y1="127.28" x2="38.83" y2="128.69" stroke-width="4.15" />
<line x1="38.83" y1="128.69" x2="37.64" y2="130.09" stroke-width="4.03" />
<line x1="37.64" y1="130.09" x2="36.45" y2="131.5" stroke-width="3.91" />
<line x1="36.45" y1="131.5" x2="35.25" y2="132.9" stroke-width="3.79" />
<line x1="35.25" y1="132.9" x2="34.06" y2="134.3" stroke-width="3.67" />
<line x1="34.06" y1="134.3" x2="33.16" y2="136.06" stroke-width="3.55" />
<line x1="33.16" y1="136.06" x2="32.26" y2="137.81" stroke-width="3.44" />
<line x1="32.26" y1="137.81" x2="31.35" y2="139.57" stroke-width="3.32" />
<line x1="31.35" y1="139.57" x2="30.45" y2="141.32" stroke-width="3.21" />
<line x1="30.45" y1="141.32" x2="30.02" y2="142.95" stroke-width="3.22" />
<line x1="30.02" y1="142.95" x2="29.6" y2="144.58" stroke-width="3.37" />
<line x1="29.6" y1="144.58" x2="29.17" y2="146.21" stroke-width="3.51" />
<line x1="29.17" y1="146.21" x2="29.03" y2="147.56" stroke-width="3.69" />
<line x1="29.03" y1="147.56" x2="28.89" y2="148.91" stroke-width="3.92" />
<line x1="28.89" y1="148.91" x2="28.75" y2="150.25" stroke-width="4.14" />
<line x1="28.75" y1="150.25" x2="28.68" y2="151.81" stroke-width="4.32" />
<line x1="28.68" y1="151.81" x2="28.6" y2="153.37" stroke-width="4.47" />
<line x1="28.6" y1="153.37" x2="28.53" y2="154.93" stroke-width="4.61" />
<line x1="28.53" y1="154.93" x2="28.75" y2="156.63" stroke-width="4.89" />
<line x1="28.75" y1="156.63" x2="28.96" y2="158.34" stroke-width="5.32" />
<line x1="28.96" y1="158.34" x2="29.54" y2="159.88" stroke-width="5.85" />
<line x1="29.54" y1="159.88" x2="30.13" y2="161.42" stroke-width="6.49" />
<line x1="30.13" y1="161.42" x2="30.71" y2="162.96" stroke-width="7.13" />
<line x1="30.71" y1="162.96" x2="31.3" y2="164.5" stroke-width="7.76" />
<line x1="31.3" y1="164.5" x2="32.15" y2="165.64" stroke-width="8.31" />
<line x1="32.15" y1="165.64" x2="33" y2="166.77" stroke-width="8.77" />
<line x1="33" y1="166.77" x2="33.85" y2="167.91" stroke-width="9.22" />
<line x1="33.85" y1="167.91" x2="35.39" y2="169.13" stroke-width="9.6" />
<line x1="35.39" y1="169.13" x2="36.93" y2="170.35" stroke-width="9.9" />
<line x1="36.93" y1="170.35" x2="38.48" y2="171.58" stroke-width="10.2" />
<line x1="38.48" y1="171.58" x2="40.02" y2="172.8" stroke-width="10.5" />
<line x1="40.02" y1="172.8" x2="41.67" y2="173.6" stroke-width="10.67" />
<line x1="41.67" y1="173.6" x2="43.31" y2="174.39" stroke-width="10.71" />
<line x1="43.31" y1="174.39" x2="44.96" y2="175.19" stroke-width="10.75" />
<line x1="44.96" y1="175.19" x2="46.61" y2="175.99" stroke-width="10.79" />
<line x1="46.61" y1="175.99" x2="48.31" y2="176.34" stroke-width="10.77" />
<line x1="48.31" y1="176.34" x2="50.01" y2="176.7" stroke-width="10.7" />
<line x1="50.01" y1="176.7" x2="51.72" y2="177.05" stroke-width="10.63" />
<line x1="51.72" y1="177.05" x2="53.42" y2="177.41" stroke-width="10.56" />
<line x1="53.42" y1="177.41" x2="55.12" y2="177.76" stroke-width="10.49" />
<line x1="55.12" y1="177.76" x2="56.82" y2="178.12" stroke-width="10.42" />
<line x1="56.82" y1="178.12" x2="58.57" y2="178.27" stroke-width="10.36" />
<line x1="58.57" y1="178.27" x2="60.33" y2="178.43" stroke-width="10.32" />
<line x1="60.33" y1="178.43" x2="62.08" y2="178.59" stroke-width="10.28" />
<line x1="62.08" y1="178.59" x2="63.84" y2="178.75" stroke-width="10.23" />
<line x1="63.84" y1="178.75" x2="65.67" y2="178.75" stroke-width="10.12" />
<line x1="65.67" y1="178.75" x2="67.5" y2="178.75" stroke-width="9.95" />
<line x1="67.5" y1="178.75" x2="69.33" y2="178.75" stroke-width="9.78" />
<line x1="69.33" y1="178.75" x2="71.16" y2="178.75" stroke-width="9.61" />
<line x1="71.16" y1="178.75" x2="72.98" y2="178.75" stroke-width="9.44" />
<line x1="72.98" y1="178.75" x2="74.9" y2="178.39" stroke-width="9.05" />
<line x1="74.9" y1="178.39" x2="76.81" y2="178.02" stroke-width="8.43" />
<line x1="76.81" y1="178.02" x2="78.73" y2="177.65" stroke-width="7.81" />
<line x1="78.73" y1="177.65" x2="80.64" y2="177.28" stroke-width="7.19" />
<line x1="80.64" y1="177.28" x2="82.55" y2="176.92" stroke-width="6.57" />
<line x1="82.55" y1="176.92" x2="84.47" y2="176.55" stroke-width="5.96" />
<line x1="84.47" y1="176.55" x2="86.38" y2="176.18" stroke-width="5.34" />
<line x1="86.38" y1="176.18" x2="88.3" y2="175.81" stroke-width="4.72" />
<line x1="88.3" y1="175.81" x2="90.21" y2="175.45" stroke-width="4.1" />
<line x1="90.21" y1="175.45" x2="92.13" y2="175.08" stroke-width="3.48" />
<line x1="92.13" y1="175.08" x2="94.04" y2="174.71" stroke-width="2.86" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="56.4" y1="114.31" x2="55.54" y2="113.46" stroke-width="10.85" />
<line x1="55.54" y1="113.46" x2="54.69" y2="112.61" stroke-width="9.57" />
<line x1="54.69" y1="112.61" x2="52.78" y2="112.37" stroke-width="8.93" />
<line x1="52.78" y1="112.37" x2="50.86" y2="112.12" stroke-width="8.93" />
<line x1="50.86" y1="112.12" x2="48.95" y2="111.88" stroke-width="8.93" />
<line x1="48.95" y1="111.88" x2="47.04" y2="111.64" stroke-width="8.93" />
<line x1="47.04" y1="111.64" x2="45.12" y2="111.39" stroke-width="8.93" />
<line x1="45.12" y1="111.39" x2="43.21" y2="111.15" stroke-width="8.93" />
<line x1="43.21" y1="111.15" x2="41.29" y2="110.91" stroke-width="8.93" />
<line x1="41.29" y1="110.91" x2="39.59" y2="111.33" stroke-width="8.72" />
<line x1="39.59" y1="111.33" x2="37.89" y2="111.76" stroke-width="8.29" />
<line x1="37.89" y1="111.76" x2="36.19" y2="112.18" stroke-width="7.87" />
<line x1="36.19" y1="112.18" x2="34.49" y2="112.61" stroke-width="7.44" />
<line x1="34.49" y1="112.61" x2="33.28" y2="113.89" stroke-width="6.44" />
<line x1="33.28" y1="113.89" x2="32.08" y2="115.16" stroke-width="4.86" />
<line x1="32.08" y1="115.16" x2="30.87" y2="116.44" stroke-width="3.27" />
</g>
<circle cx="34.91" cy="168.76" r="3.7" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.91s" fill="freeze" /></circle>
</svg>`,

  khaa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106.1 215.8" width="106.1" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 81.64 109.4 L 79.97 110.43 L 78.29 111.45 L 76.62 112.47 L 74.75 112.64 L 72.88 112.81 L 71.01 112.97 L 69.14 113.14 L 67.28 113.31 L 65.41 113.47 L 63.54 113.64 L 61.67 113.81 L 59.8 113.98 L 57.93 114.14 L 55.98 114.14 L 55.28 113.31 L 54.59 112.47 L 52.84 112.19 L 51.1 111.91 L 49.36 111.63 L 47.61 111.36 L 45.73 111.29 L 43.85 111.22 L 41.97 111.15 L 40.08 111.08 L 38.13 111.49 L 36.18 111.91 L 34.78 112.61 L 33.39 113.31 L 32.13 114.84 L 30.88 116.38" fill="none" stroke="#fff" stroke-width="15.39" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.45s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 93.91 174.67 L 92.04 175.06 L 90.17 175.45 L 88.3 175.84 L 86.44 176.23 L 84.57 176.62 L 82.7 177.01 L 80.83 177.4 L 78.96 177.79 L 77.09 178.18 L 75.22 178.57 L 73.62 178.64 L 72.02 178.71 L 70.41 178.78 L 68.81 178.85 L 67.06 178.73 L 65.3 178.61 L 63.55 178.49 L 61.8 178.37 L 60.04 178.25 L 58.29 178.13 L 56.54 178.01 L 54.64 177.62 L 52.74 177.23 L 50.85 176.84 L 48.95 176.45 L 47.06 176.06 L 45.38 175.41 L 43.71 174.76 L 42.04 174.11 L 40.5 173.06 L 38.97 172.02 L 37.43 170.97 L 35.9 169.93 L 34.71 168.53 L 33.53 167.14 L 32.34 165.74 L 31.16 164.35 L 30.53 162.6 L 29.9 160.86 L 29.28 159.12 L 28.65 157.37 L 28.74 155.42 L 28.83 153.47 L 28.93 151.52 L 29.02 149.56 L 29.11 147.61 L 29.21 145.66 L 29.62 144.2 L 30.04 142.73 L 30.46 141.27 L 30.88 139.8 L 31.76 138.36 L 32.65 136.92 L 33.53 135.48 L 34.41 134.04 L 35.29 132.6 L 36.18 131.16 L 37.65 129.88 L 39.13 128.61 L 40.6 127.33 L 42.07 126.06 L 43.55 124.78 L 45.02 123.51 L 46.5 122.23 L 48.1 121.47 L 49.7 120.7 L 51.31 119.93 L 52.91 119.16 L 53.93 117.49 L 54.96 115.82 L 55.98 114.14" fill="none" stroke="#fff" stroke-width="14.83" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.86s" begin="0.33s" fill="freeze" /></path></mask>
<mask id="tk-m2" maskUnits="userSpaceOnUse"><path d="M 54.31 87.93 L 52.91 89.04 L 51.1 89.32 L 49.29 89.6" fill="none" stroke="#fff" stroke-width="12.68" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.27s" begin="0.91s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="81.64" y1="109.4" x2="79.97" y2="110.43" stroke-width="4.01" />
<line x1="79.97" y1="110.43" x2="78.29" y2="111.45" stroke-width="5.53" />
<line x1="78.29" y1="111.45" x2="76.62" y2="112.47" stroke-width="7.05" />
<line x1="76.62" y1="112.47" x2="74.75" y2="112.64" stroke-width="7.98" />
<line x1="74.75" y1="112.64" x2="72.88" y2="112.81" stroke-width="8.31" />
<line x1="72.88" y1="112.81" x2="71.01" y2="112.97" stroke-width="8.65" />
<line x1="71.01" y1="112.97" x2="69.14" y2="113.14" stroke-width="8.98" />
<line x1="69.14" y1="113.14" x2="67.28" y2="113.31" stroke-width="9.32" />
<line x1="67.28" y1="113.31" x2="65.41" y2="113.47" stroke-width="9.65" />
<line x1="65.41" y1="113.47" x2="63.54" y2="113.64" stroke-width="9.98" />
<line x1="63.54" y1="113.64" x2="61.67" y2="113.81" stroke-width="10.32" />
<line x1="61.67" y1="113.81" x2="59.8" y2="113.98" stroke-width="10.65" />
<line x1="59.8" y1="113.98" x2="57.93" y2="114.14" stroke-width="10.99" />
<line x1="57.93" y1="114.14" x2="55.98" y2="114.14" stroke-width="11.39" />
<line x1="55.98" y1="114.14" x2="55.28" y2="113.31" stroke-width="10.92" />
<line x1="55.28" y1="113.31" x2="54.59" y2="112.47" stroke-width="9.53" />
<line x1="54.59" y1="112.47" x2="52.84" y2="112.19" stroke-width="8.84" />
<line x1="52.84" y1="112.19" x2="51.1" y2="111.91" stroke-width="8.87" />
<line x1="51.1" y1="111.91" x2="49.36" y2="111.63" stroke-width="8.89" />
<line x1="49.36" y1="111.63" x2="47.61" y2="111.36" stroke-width="8.91" />
<line x1="47.61" y1="111.36" x2="45.73" y2="111.29" stroke-width="8.93" />
<line x1="45.73" y1="111.29" x2="43.85" y2="111.22" stroke-width="8.93" />
<line x1="43.85" y1="111.22" x2="41.97" y2="111.15" stroke-width="8.93" />
<line x1="41.97" y1="111.15" x2="40.08" y2="111.08" stroke-width="8.93" />
<line x1="40.08" y1="111.08" x2="38.13" y2="111.49" stroke-width="8.65" />
<line x1="38.13" y1="111.49" x2="36.18" y2="111.91" stroke-width="8.09" />
<line x1="36.18" y1="111.91" x2="34.78" y2="112.61" stroke-width="7.39" />
<line x1="34.78" y1="112.61" x2="33.39" y2="113.31" stroke-width="6.55" />
<line x1="33.39" y1="113.31" x2="32.13" y2="114.84" stroke-width="5.22" />
<line x1="32.13" y1="114.84" x2="30.88" y2="116.38" stroke-width="3.38" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="93.91" y1="174.67" x2="92.04" y2="175.06" stroke-width="3" />
<line x1="92.04" y1="175.06" x2="90.17" y2="175.45" stroke-width="3.63" />
<line x1="90.17" y1="175.45" x2="88.3" y2="175.84" stroke-width="4.25" />
<line x1="88.3" y1="175.84" x2="86.44" y2="176.23" stroke-width="4.87" />
<line x1="86.44" y1="176.23" x2="84.57" y2="176.62" stroke-width="5.5" />
<line x1="84.57" y1="176.62" x2="82.7" y2="177.01" stroke-width="6.12" />
<line x1="82.7" y1="177.01" x2="80.83" y2="177.4" stroke-width="6.74" />
<line x1="80.83" y1="177.4" x2="78.96" y2="177.79" stroke-width="7.37" />
<line x1="78.96" y1="177.79" x2="77.09" y2="178.18" stroke-width="7.99" />
<line x1="77.09" y1="178.18" x2="75.22" y2="178.57" stroke-width="8.61" />
<line x1="75.22" y1="178.57" x2="73.62" y2="178.64" stroke-width="9.06" />
<line x1="73.62" y1="178.64" x2="72.02" y2="178.71" stroke-width="9.34" />
<line x1="72.02" y1="178.71" x2="70.41" y2="178.78" stroke-width="9.62" />
<line x1="70.41" y1="178.78" x2="68.81" y2="178.85" stroke-width="9.9" />
<line x1="68.81" y1="178.85" x2="67.06" y2="178.73" stroke-width="10.08" />
<line x1="67.06" y1="178.73" x2="65.3" y2="178.61" stroke-width="10.16" />
<line x1="65.3" y1="178.61" x2="63.55" y2="178.49" stroke-width="10.24" />
<line x1="63.55" y1="178.49" x2="61.8" y2="178.37" stroke-width="10.32" />
<line x1="61.8" y1="178.37" x2="60.04" y2="178.25" stroke-width="10.4" />
<line x1="60.04" y1="178.25" x2="58.29" y2="178.13" stroke-width="10.48" />
<line x1="58.29" y1="178.13" x2="56.54" y2="178.01" stroke-width="10.56" />
<line x1="56.54" y1="178.01" x2="54.64" y2="177.62" stroke-width="10.62" />
<line x1="54.64" y1="177.62" x2="52.74" y2="177.23" stroke-width="10.67" />
<line x1="52.74" y1="177.23" x2="50.85" y2="176.84" stroke-width="10.71" />
<line x1="50.85" y1="176.84" x2="48.95" y2="176.45" stroke-width="10.76" />
<line x1="48.95" y1="176.45" x2="47.06" y2="176.06" stroke-width="10.81" />
<line x1="47.06" y1="176.06" x2="45.38" y2="175.41" stroke-width="10.83" />
<line x1="45.38" y1="175.41" x2="43.71" y2="174.76" stroke-width="10.82" />
<line x1="43.71" y1="174.76" x2="42.04" y2="174.11" stroke-width="10.82" />
<line x1="42.04" y1="174.11" x2="40.5" y2="173.06" stroke-width="10.71" />
<line x1="40.5" y1="173.06" x2="38.97" y2="172.02" stroke-width="10.52" />
<line x1="38.97" y1="172.02" x2="37.43" y2="170.97" stroke-width="10.32" />
<line x1="37.43" y1="170.97" x2="35.9" y2="169.93" stroke-width="10.12" />
<line x1="35.9" y1="169.93" x2="34.71" y2="168.53" stroke-width="9.78" />
<line x1="34.71" y1="168.53" x2="33.53" y2="167.14" stroke-width="9.28" />
<line x1="33.53" y1="167.14" x2="32.34" y2="165.74" stroke-width="8.78" />
<line x1="32.34" y1="165.74" x2="31.16" y2="164.35" stroke-width="8.29" />
<line x1="31.16" y1="164.35" x2="30.53" y2="162.6" stroke-width="7.66" />
<line x1="30.53" y1="162.6" x2="29.9" y2="160.86" stroke-width="6.91" />
<line x1="29.9" y1="160.86" x2="29.28" y2="159.12" stroke-width="6.15" />
<line x1="29.28" y1="159.12" x2="28.65" y2="157.37" stroke-width="5.4" />
<line x1="28.65" y1="157.37" x2="28.74" y2="155.42" stroke-width="4.88" />
<line x1="28.74" y1="155.42" x2="28.83" y2="153.47" stroke-width="4.6" />
<line x1="28.83" y1="153.47" x2="28.93" y2="151.52" stroke-width="4.32" />
<line x1="28.93" y1="151.52" x2="29.02" y2="149.56" stroke-width="4.04" />
<line x1="29.02" y1="149.56" x2="29.11" y2="147.61" stroke-width="3.77" />
<line x1="29.11" y1="147.61" x2="29.21" y2="145.66" stroke-width="3.49" />
<line x1="29.21" y1="145.66" x2="29.62" y2="144.2" stroke-width="3.31" />
<line x1="29.62" y1="144.2" x2="30.04" y2="142.73" stroke-width="3.22" />
<line x1="30.04" y1="142.73" x2="30.46" y2="141.27" stroke-width="3.14" />
<line x1="30.46" y1="141.27" x2="30.88" y2="139.8" stroke-width="3.06" />
<line x1="30.88" y1="139.8" x2="31.76" y2="138.36" stroke-width="3.08" />
<line x1="31.76" y1="138.36" x2="32.65" y2="136.92" stroke-width="3.19" />
<line x1="32.65" y1="136.92" x2="33.53" y2="135.48" stroke-width="3.31" />
<line x1="33.53" y1="135.48" x2="34.41" y2="134.04" stroke-width="3.42" />
<line x1="34.41" y1="134.04" x2="35.29" y2="132.6" stroke-width="3.54" />
<line x1="35.29" y1="132.6" x2="36.18" y2="131.16" stroke-width="3.66" />
<line x1="36.18" y1="131.16" x2="37.65" y2="129.88" stroke-width="3.79" />
<line x1="37.65" y1="129.88" x2="39.13" y2="128.61" stroke-width="3.93" />
<line x1="39.13" y1="128.61" x2="40.6" y2="127.33" stroke-width="4.08" />
<line x1="40.6" y1="127.33" x2="42.07" y2="126.06" stroke-width="4.22" />
<line x1="42.07" y1="126.06" x2="43.55" y2="124.78" stroke-width="4.37" />
<line x1="43.55" y1="124.78" x2="45.02" y2="123.51" stroke-width="4.51" />
<line x1="45.02" y1="123.51" x2="46.5" y2="122.23" stroke-width="4.66" />
<line x1="46.5" y1="122.23" x2="48.1" y2="121.47" stroke-width="4.86" />
<line x1="48.1" y1="121.47" x2="49.7" y2="120.7" stroke-width="5.1" />
<line x1="49.7" y1="120.7" x2="51.31" y2="119.93" stroke-width="5.35" />
<line x1="51.31" y1="119.93" x2="52.91" y2="119.16" stroke-width="5.59" />
<line x1="52.91" y1="119.16" x2="53.93" y2="117.49" stroke-width="6.7" />
<line x1="53.93" y1="117.49" x2="54.96" y2="115.82" stroke-width="8.67" />
<line x1="54.96" y1="115.82" x2="55.98" y2="114.14" stroke-width="10.63" />
</g>
<g mask="url(#tk-m2)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="54.31" y1="87.93" x2="52.91" y2="89.04" stroke-width="8.68" />
<line x1="52.91" y1="89.04" x2="51.1" y2="89.32" stroke-width="6.65" />
<line x1="51.1" y1="89.32" x2="49.29" y2="89.6" stroke-width="4.17" />
</g>
</svg>`,

  daal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 215.8" width="85" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 39.85 99.98 L 40.94 99.55 L 42.03 99.11 L 43.01 99.55 L 44.46 100.55 L 45.9 101.56 L 47.35 102.57 L 48.79 103.58 L 49.95 104.78 L 51.12 105.98 L 52.28 107.18 L 53.1 108.38 L 53.92 109.58 L 54.68 111.27 L 55.44 112.96 L 55.88 114.76 L 56.31 116.56 L 56.31 117.94 L 56.31 119.32 L 56.31 120.7 L 55.37 121.75 L 54.42 122.81 L 53.48 123.86 L 52.06 124.62 L 50.64 125.06 L 49.23 125.5 L 47.81 125.93 L 46.09 126.31 L 44.37 126.7 L 42.66 127.08 L 40.94 127.46 L 39.09 127.62 L 37.23 127.79 L 35.6 127.9 L 34.29 127.51 L 32.98 127.13" fill="none" stroke="#fff" stroke-width="13.54" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.59s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="39.85" y1="99.98" x2="40.94" y2="99.55" stroke-width="6.71" />
<line x1="40.94" y1="99.55" x2="42.03" y2="99.11" stroke-width="8.61" />
<line x1="42.03" y1="99.11" x2="43.01" y2="99.55" stroke-width="9.4" />
<line x1="43.01" y1="99.55" x2="44.46" y2="100.55" stroke-width="9.05" />
<line x1="44.46" y1="100.55" x2="45.9" y2="101.56" stroke-width="8.64" />
<line x1="45.9" y1="101.56" x2="47.35" y2="102.57" stroke-width="8.23" />
<line x1="47.35" y1="102.57" x2="48.79" y2="103.58" stroke-width="7.82" />
<line x1="48.79" y1="103.58" x2="49.95" y2="104.78" stroke-width="7.4" />
<line x1="49.95" y1="104.78" x2="51.12" y2="105.98" stroke-width="6.96" />
<line x1="51.12" y1="105.98" x2="52.28" y2="107.18" stroke-width="6.52" />
<line x1="52.28" y1="107.18" x2="53.1" y2="108.38" stroke-width="6.09" />
<line x1="53.1" y1="108.38" x2="53.92" y2="109.58" stroke-width="5.66" />
<line x1="53.92" y1="109.58" x2="54.68" y2="111.27" stroke-width="5.17" />
<line x1="54.68" y1="111.27" x2="55.44" y2="112.96" stroke-width="4.61" />
<line x1="55.44" y1="112.96" x2="55.88" y2="114.76" stroke-width="4.12" />
<line x1="55.88" y1="114.76" x2="56.31" y2="116.56" stroke-width="3.7" />
<line x1="56.31" y1="116.56" x2="56.31" y2="117.94" stroke-width="3.53" />
<line x1="56.31" y1="117.94" x2="56.31" y2="119.32" stroke-width="3.6" />
<line x1="56.31" y1="119.32" x2="56.31" y2="120.7" stroke-width="3.67" />
<line x1="56.31" y1="120.7" x2="55.37" y2="121.75" stroke-width="4.45" />
<line x1="55.37" y1="121.75" x2="54.42" y2="122.81" stroke-width="5.93" />
<line x1="54.42" y1="122.81" x2="53.48" y2="123.86" stroke-width="7.42" />
<line x1="53.48" y1="123.86" x2="52.06" y2="124.62" stroke-width="8.38" />
<line x1="52.06" y1="124.62" x2="50.64" y2="125.06" stroke-width="8.65" />
<line x1="50.64" y1="125.06" x2="49.23" y2="125.5" stroke-width="8.77" />
<line x1="49.23" y1="125.5" x2="47.81" y2="125.93" stroke-width="8.88" />
<line x1="47.81" y1="125.93" x2="46.09" y2="126.31" stroke-width="9.02" />
<line x1="46.09" y1="126.31" x2="44.37" y2="126.7" stroke-width="9.19" />
<line x1="44.37" y1="126.7" x2="42.66" y2="127.08" stroke-width="9.35" />
<line x1="42.66" y1="127.08" x2="40.94" y2="127.46" stroke-width="9.51" />
<line x1="40.94" y1="127.46" x2="39.09" y2="127.62" stroke-width="9.54" />
<line x1="39.09" y1="127.62" x2="37.23" y2="127.79" stroke-width="9.43" />
<line x1="37.23" y1="127.79" x2="35.6" y2="127.9" stroke-width="9.38" />
<line x1="35.6" y1="127.9" x2="34.29" y2="127.51" stroke-width="9.13" />
<line x1="34.29" y1="127.51" x2="32.98" y2="127.13" stroke-width="8.63" />
	</g>
	</svg>`,

  dhaal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 215.8" width="85" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 42.06 99.09 L 43.68 99.99 L 45.29 100.89 L 46.55 101.91 L 47.81 102.92 L 49.06 103.94 L 50.14 105.11 L 51.22 106.28 L 52.3 107.44 L 53.37 108.61 L 54.15 110.35 L 54.93 112.08 L 55.71 113.82 L 55.98 115.08 L 56.25 116.33 L 56.25 117.71 L 56.25 119.09 L 56.25 120.46 L 55.29 121.6 L 54.33 122.74 L 53.37 123.87 L 51.58 124.59 L 49.78 125.31 L 47.95 125.74 L 46.12 126.17 L 44.29 126.6 L 42.46 127.04 L 40.62 127.47 L 38.83 127.59 L 37.03 127.71 L 35.24 127.83 L 34.16 127.47 L 33.08 127.11" fill="none" stroke="#fff" stroke-width="13.64" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.45s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 50.68 105.38 L 50.14 104.66" fill="none" stroke="#fff" stroke-width="11.04" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.00s" begin="0.33s" fill="freeze" /></path></mask>
<mask id="tk-m2" maskUnits="userSpaceOnUse"><path d="M 40.62 73.41 L 40.27 74.13 L 39.01 74.31 L 37.75 74.49" fill="none" stroke="#fff" stroke-width="13.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.14s" begin="0.48s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="42.06" y1="99.09" x2="43.68" y2="99.99" stroke-width="9.4" />
<line x1="43.68" y1="99.99" x2="45.29" y2="100.89" stroke-width="8.89" />
<line x1="45.29" y1="100.89" x2="46.55" y2="101.91" stroke-width="8.44" />
<line x1="46.55" y1="101.91" x2="47.81" y2="102.92" stroke-width="8.05" />
<line x1="47.81" y1="102.92" x2="49.06" y2="103.94" stroke-width="7.66" />
<line x1="49.06" y1="103.94" x2="50.14" y2="105.11" stroke-width="7.25" />
<line x1="50.14" y1="105.11" x2="51.22" y2="106.28" stroke-width="6.82" />
<line x1="51.22" y1="106.28" x2="52.3" y2="107.44" stroke-width="6.39" />
<line x1="52.3" y1="107.44" x2="53.37" y2="108.61" stroke-width="5.96" />
<line x1="53.37" y1="108.61" x2="54.15" y2="110.35" stroke-width="5.45" />
<line x1="54.15" y1="110.35" x2="54.93" y2="112.08" stroke-width="4.85" />
<line x1="54.93" y1="112.08" x2="55.71" y2="113.82" stroke-width="4.25" />
<line x1="55.71" y1="113.82" x2="55.98" y2="115.08" stroke-width="3.86" />
<line x1="55.98" y1="115.08" x2="56.25" y2="116.33" stroke-width="3.68" />
<line x1="56.25" y1="116.33" x2="56.25" y2="117.71" stroke-width="3.65" />
<line x1="56.25" y1="117.71" x2="56.25" y2="119.09" stroke-width="3.77" />
<line x1="56.25" y1="119.09" x2="56.25" y2="120.46" stroke-width="3.89" />
<line x1="56.25" y1="120.46" x2="55.29" y2="121.6" stroke-width="4.66" />
<line x1="55.29" y1="121.6" x2="54.33" y2="122.74" stroke-width="6.08" />
<line x1="54.33" y1="122.74" x2="53.37" y2="123.87" stroke-width="7.49" />
<line x1="53.37" y1="123.87" x2="51.58" y2="124.59" stroke-width="8.34" />
<line x1="51.58" y1="124.59" x2="49.78" y2="125.31" stroke-width="8.63" />
<line x1="49.78" y1="125.31" x2="47.95" y2="125.74" stroke-width="8.86" />
<line x1="47.95" y1="125.74" x2="46.12" y2="126.17" stroke-width="9.05" />
<line x1="46.12" y1="126.17" x2="44.29" y2="126.6" stroke-width="9.23" />
<line x1="44.29" y1="126.6" x2="42.46" y2="127.04" stroke-width="9.42" />
<line x1="42.46" y1="127.04" x2="40.62" y2="127.47" stroke-width="9.6" />
<line x1="40.62" y1="127.47" x2="38.83" y2="127.59" stroke-width="9.64" />
<line x1="38.83" y1="127.59" x2="37.03" y2="127.71" stroke-width="9.52" />
<line x1="37.03" y1="127.71" x2="35.24" y2="127.83" stroke-width="9.4" />
<line x1="35.24" y1="127.83" x2="34.16" y2="127.47" stroke-width="9.07" />
<line x1="34.16" y1="127.47" x2="33.08" y2="127.11" stroke-width="8.53" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="50.68" y1="105.38" x2="50.14" y2="104.66" stroke-width="7.04" />
</g>
<g mask="url(#tk-m2)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="40.62" y1="73.41" x2="40.27" y2="74.13" stroke-width="9.5" />
<line x1="40.27" y1="74.13" x2="39.01" y2="74.31" stroke-width="8.61" />
<line x1="39.01" y1="74.31" x2="37.75" y2="74.49" stroke-width="6.84" />
</g>
</svg>`,

  raa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79.9 215.8" width="79.9" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 45.18 105.08 L 45.51 106.63 L 45.84 108.19 L 46.17 109.74 L 46.31 111.29 L 46.46 112.85 L 47.23 114.29 L 48.01 115.74 L 48.78 117.19 L 49.56 118.64 L 50.08 120.05 L 50.6 121.46 L 51.11 122.87 L 51.47 124.57 L 51.82 126.26 L 51.73 127.77 L 51.63 129.27 L 51.54 130.78 L 50.69 132.47 L 49.84 134.17 L 49 135.86 L 48.15 137.56 L 47.2 138.72 L 46.24 139.89 L 45.29 141.05 L 44.34 142.22 L 43.02 143.49 L 41.7 144.76 L 40.38 146.03 L 39.02 146.97 L 37.65 147.91 L 36.29 148.85 L 34.78 149.56 L 33.27 150.27 L 31.77 150.97 L 30.43 151.33 L 29.09 151.68 L 27.39 151.54 L 25.7 151.4 L 24 151.26 L 22.12 150.93 L 20.24 150.6 L 18.35 150.27 L 16.91 149.81 L 15.46 149.35 L 14.01 148.89 L 12.56 148.43" fill="none" stroke="#fff" stroke-width="12.11" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="3.41s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="45.18" y1="105.08" x2="45.51" y2="106.63" stroke-width="2.4" />
<line x1="45.51" y1="106.63" x2="45.84" y2="108.19" stroke-width="3.81" />
<line x1="45.84" y1="108.19" x2="46.17" y2="109.74" stroke-width="5.23" />
<line x1="46.17" y1="109.74" x2="46.31" y2="111.29" stroke-width="6.43" />
<line x1="46.31" y1="111.29" x2="46.46" y2="112.85" stroke-width="7.41" />
<line x1="46.46" y1="112.85" x2="47.23" y2="114.29" stroke-width="7.77" />
<line x1="47.23" y1="114.29" x2="48.01" y2="115.74" stroke-width="7.48" />
<line x1="48.01" y1="115.74" x2="48.78" y2="117.19" stroke-width="7.2" />
<line x1="48.78" y1="117.19" x2="49.56" y2="118.64" stroke-width="6.92" />
<line x1="49.56" y1="118.64" x2="50.08" y2="120.05" stroke-width="6.47" />
<line x1="50.08" y1="120.05" x2="50.6" y2="121.46" stroke-width="5.85" />
<line x1="50.6" y1="121.46" x2="51.11" y2="122.87" stroke-width="5.23" />
<line x1="51.11" y1="122.87" x2="51.47" y2="124.57" stroke-width="4.61" />
<line x1="51.47" y1="124.57" x2="51.82" y2="126.26" stroke-width="3.98" />
<line x1="51.82" y1="126.26" x2="51.73" y2="127.77" stroke-width="3.62" />
<line x1="51.73" y1="127.77" x2="51.63" y2="129.27" stroke-width="3.53" />
<line x1="51.63" y1="129.27" x2="51.54" y2="130.78" stroke-width="3.44" />
<line x1="51.54" y1="130.78" x2="50.69" y2="132.47" stroke-width="3.66" />
<line x1="50.69" y1="132.47" x2="49.84" y2="134.17" stroke-width="4.22" />
<line x1="49.84" y1="134.17" x2="49" y2="135.86" stroke-width="4.77" />
<line x1="49" y1="135.86" x2="48.15" y2="137.56" stroke-width="5.32" />
<line x1="48.15" y1="137.56" x2="47.2" y2="138.72" stroke-width="5.74" />
<line x1="47.2" y1="138.72" x2="46.24" y2="139.89" stroke-width="6.04" />
<line x1="46.24" y1="139.89" x2="45.29" y2="141.05" stroke-width="6.34" />
<line x1="45.29" y1="141.05" x2="44.34" y2="142.22" stroke-width="6.64" />
<line x1="44.34" y1="142.22" x2="43.02" y2="143.49" stroke-width="6.97" />
<line x1="43.02" y1="143.49" x2="41.7" y2="144.76" stroke-width="7.33" />
<line x1="41.7" y1="144.76" x2="40.38" y2="146.03" stroke-width="7.69" />
<line x1="40.38" y1="146.03" x2="39.02" y2="146.97" stroke-width="7.92" />
<line x1="39.02" y1="146.97" x2="37.65" y2="147.91" stroke-width="8.01" />
<line x1="37.65" y1="147.91" x2="36.29" y2="148.85" stroke-width="8.11" />
<line x1="36.29" y1="148.85" x2="34.78" y2="149.56" stroke-width="8.09" />
<line x1="34.78" y1="149.56" x2="33.27" y2="150.27" stroke-width="7.95" />
<line x1="33.27" y1="150.27" x2="31.77" y2="150.97" stroke-width="7.81" />
<line x1="31.77" y1="150.97" x2="30.43" y2="151.33" stroke-width="7.64" />
<line x1="30.43" y1="151.33" x2="29.09" y2="151.68" stroke-width="7.44" />
<line x1="29.09" y1="151.68" x2="27.39" y2="151.54" stroke-width="6.87" />
<line x1="27.39" y1="151.54" x2="25.7" y2="151.4" stroke-width="5.93" />
<line x1="25.7" y1="151.4" x2="24" y2="151.26" stroke-width="4.99" />
<line x1="24" y1="151.26" x2="22.12" y2="150.93" stroke-width="4.26" />
<line x1="22.12" y1="150.93" x2="20.24" y2="150.6" stroke-width="3.73" />
<line x1="20.24" y1="150.6" x2="18.35" y2="150.27" stroke-width="3.2" />
<line x1="18.35" y1="150.27" x2="16.91" y2="149.81" stroke-width="2.79" />
<line x1="16.91" y1="149.81" x2="15.46" y2="149.35" stroke-width="2.47" />
<line x1="15.46" y1="149.35" x2="14.01" y2="148.89" stroke-width="2.16" />
<line x1="14.01" y1="148.89" x2="12.56" y2="148.43" stroke-width="1.85" />
</g>
</svg>`,

  zaay: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 79.9 215.8" width="79.9" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 45.18 105.08 L 45.51 106.63 L 45.84 108.19 L 46.17 109.74 L 46.31 111.29 L 46.46 112.85 L 47.23 114.29 L 48.01 115.74 L 48.78 117.19 L 49.56 118.64 L 50.08 120.05 L 50.6 121.46 L 51.11 122.87 L 51.47 124.57 L 51.82 126.26 L 51.73 127.77 L 51.63 129.27 L 51.54 130.78 L 50.69 132.47 L 49.84 134.17 L 49 135.86 L 48.15 137.56 L 47.2 138.72 L 46.24 139.89 L 45.29 141.05 L 44.34 142.22 L 43.02 143.49 L 41.7 144.76 L 40.38 146.03 L 39.02 146.97 L 37.65 147.91 L 36.29 148.85 L 34.78 149.56 L 33.27 150.27 L 31.77 150.97 L 30.43 151.33 L 29.09 151.68 L 27.39 151.54 L 25.7 151.4 L 24 151.26 L 22.12 150.93 L 20.24 150.6 L 18.35 150.27 L 16.91 149.81 L 15.46 149.35 L 14.01 148.89 L 12.56 148.43" fill="none" stroke="#fff" stroke-width="12.11" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="3.41s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="45.18" y1="105.08" x2="45.51" y2="106.63" stroke-width="2.4" />
<line x1="45.51" y1="106.63" x2="45.84" y2="108.19" stroke-width="3.81" />
<line x1="45.84" y1="108.19" x2="46.17" y2="109.74" stroke-width="5.23" />
<line x1="46.17" y1="109.74" x2="46.31" y2="111.29" stroke-width="6.43" />
<line x1="46.31" y1="111.29" x2="46.46" y2="112.85" stroke-width="7.41" />
<line x1="46.46" y1="112.85" x2="47.23" y2="114.29" stroke-width="7.77" />
<line x1="47.23" y1="114.29" x2="48.01" y2="115.74" stroke-width="7.48" />
<line x1="48.01" y1="115.74" x2="48.78" y2="117.19" stroke-width="7.2" />
<line x1="48.78" y1="117.19" x2="49.56" y2="118.64" stroke-width="6.92" />
<line x1="49.56" y1="118.64" x2="50.08" y2="120.05" stroke-width="6.47" />
<line x1="50.08" y1="120.05" x2="50.6" y2="121.46" stroke-width="5.85" />
<line x1="50.6" y1="121.46" x2="51.11" y2="122.87" stroke-width="5.23" />
<line x1="51.11" y1="122.87" x2="51.47" y2="124.57" stroke-width="4.61" />
<line x1="51.47" y1="124.57" x2="51.82" y2="126.26" stroke-width="3.98" />
<line x1="51.82" y1="126.26" x2="51.73" y2="127.77" stroke-width="3.62" />
<line x1="51.73" y1="127.77" x2="51.63" y2="129.27" stroke-width="3.53" />
<line x1="51.63" y1="129.27" x2="51.54" y2="130.78" stroke-width="3.44" />
<line x1="51.54" y1="130.78" x2="50.69" y2="132.47" stroke-width="3.66" />
<line x1="50.69" y1="132.47" x2="49.84" y2="134.17" stroke-width="4.22" />
<line x1="49.84" y1="134.17" x2="49" y2="135.86" stroke-width="4.77" />
<line x1="49" y1="135.86" x2="48.15" y2="137.56" stroke-width="5.32" />
<line x1="48.15" y1="137.56" x2="47.2" y2="138.72" stroke-width="5.74" />
<line x1="47.2" y1="138.72" x2="46.24" y2="139.89" stroke-width="6.04" />
<line x1="46.24" y1="139.89" x2="45.29" y2="141.05" stroke-width="6.34" />
<line x1="45.29" y1="141.05" x2="44.34" y2="142.22" stroke-width="6.64" />
<line x1="44.34" y1="142.22" x2="43.02" y2="143.49" stroke-width="6.97" />
<line x1="43.02" y1="143.49" x2="41.7" y2="144.76" stroke-width="7.33" />
<line x1="41.7" y1="144.76" x2="40.38" y2="146.03" stroke-width="7.69" />
<line x1="40.38" y1="146.03" x2="39.02" y2="146.97" stroke-width="7.92" />
<line x1="39.02" y1="146.97" x2="37.65" y2="147.91" stroke-width="8.01" />
<line x1="37.65" y1="147.91" x2="36.29" y2="148.85" stroke-width="8.11" />
<line x1="36.29" y1="148.85" x2="34.78" y2="149.56" stroke-width="8.09" />
<line x1="34.78" y1="149.56" x2="33.27" y2="150.27" stroke-width="7.95" />
<line x1="33.27" y1="150.27" x2="31.77" y2="150.97" stroke-width="7.81" />
<line x1="31.77" y1="150.97" x2="30.43" y2="151.33" stroke-width="7.64" />
<line x1="30.43" y1="151.33" x2="29.09" y2="151.68" stroke-width="7.44" />
<line x1="29.09" y1="151.68" x2="27.39" y2="151.54" stroke-width="6.87" />
<line x1="27.39" y1="151.54" x2="25.7" y2="151.4" stroke-width="5.93" />
<line x1="25.7" y1="151.4" x2="24" y2="151.26" stroke-width="4.99" />
<line x1="24" y1="151.26" x2="22.12" y2="150.93" stroke-width="4.26" />
<line x1="22.12" y1="150.93" x2="20.24" y2="150.6" stroke-width="3.73" />
<line x1="20.24" y1="150.6" x2="18.35" y2="150.27" stroke-width="3.2" />
<line x1="18.35" y1="150.27" x2="16.91" y2="149.81" stroke-width="2.79" />
<line x1="16.91" y1="149.81" x2="15.46" y2="149.35" stroke-width="2.47" />
<line x1="15.46" y1="149.35" x2="14.01" y2="148.89" stroke-width="2.16" />
<line x1="14.01" y1="148.89" x2="12.56" y2="148.43" stroke-width="1.85" />
</g>
<circle cx="55" cy="92" r="4.5" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.2s" begin="3.6s" fill="freeze" /></circle>
</svg>`,

  siin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139.2 215.8" width="139.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 110.33 96.85 L 110.29 98.63 L 110.25 100.42 L 110.21 102.2 L 110.17 103.99 L 110.13 105.77 L 110.09 107.56 L 108.9 108.51 L 107.71 109.46 L 106.44 110.1 L 105.17 110.73 L 103.9 111.37 L 102.47 111.05 L 101.04 110.73 L 99.61 110.41 L 99.02 109.46 L 98.42 108.51 L 98.07 106.96 L 97.71 105.42 L 98.03 103.51 L 98.34 101.61 L 98.66 99.7" fill="none" stroke="#fff" stroke-width="15.35" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="1.50s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 99.38 110.18 L 98.19 111.13 L 96.68 111.52 L 95.17 111.92 L 93.66 112.32 L 92.55 113.19 L 91.44 114.06 L 90.33 114.94 L 88.66 115.27 L 87 115.6 L 85.33 115.94 L 83.66 116.27 L 82 116.6 L 80.81 115.41 L 79.62 114.22 L 78.43 113.03 L 78.35 111.21 L 78.27 109.38 L 78.19 107.56" fill="none" stroke="#fff" stroke-width="14.75" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="1.36s" begin="0.26s" fill="freeze" /></path></mask>
<mask id="tk-m2" maskUnits="userSpaceOnUse"><path d="M 81.76 116.37 L 80.93 117.56 L 80.09 118.75 L 80.25 120.41 L 80.41 122.08 L 80.57 123.74 L 80.43 125.41 L 80.28 127.08 L 80.14 128.74 L 80 130.41 L 79.86 132.07 L 79.22 133.5 L 78.59 134.93 L 77.95 136.36 L 76.76 137.79 L 75.57 139.22 L 74.38 140.65 L 73.19 141.68 L 72 142.71 L 70.81 143.74 L 69.32 144.51 L 67.84 145.29 L 66.35 146.06 L 64.86 146.83 L 63 147.31 L 61.15 147.79 L 59.29 148.26 L 57.43 148.74 L 55.58 149.21 L 53.85 149.39 L 52.12 149.57 L 50.4 149.75 L 48.67 149.93 L 46.95 149.69 L 45.22 149.45 L 43.5 149.21 L 41.77 148.98 L 40.02 148.26 L 38.28 147.55 L 36.53 146.83 L 35.28 145.76 L 34.03 144.69 L 32.78 143.62 L 31.53 142.55 L 30.82 141.36 L 30.11 140.17 L 29.39 138.98 L 28.92 137.19 L 28.44 135.41 L 28.5 133.44 L 28.56 131.48 L 28.62 129.52 L 28.68 127.55 L 29.23 125.81 L 29.79 124.06 L 30.34 122.32 L 31.06 120.75 L 31.77 119.17 L 32.49 117.6 L 33.2 116.03 L 33.92 114.46" fill="none" stroke="#fff" stroke-width="14.95" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="4.77s" begin="0.51s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="110.33" y1="96.85" x2="110.29" y2="98.63" stroke-width="3.01" />
<line x1="110.29" y1="98.63" x2="110.25" y2="100.42" stroke-width="3.33" />
<line x1="110.25" y1="100.42" x2="110.21" y2="102.2" stroke-width="3.65" />
<line x1="110.21" y1="102.2" x2="110.17" y2="103.99" stroke-width="3.97" />
<line x1="110.17" y1="103.99" x2="110.13" y2="105.77" stroke-width="4.28" />
<line x1="110.13" y1="105.77" x2="110.09" y2="107.56" stroke-width="4.6" />
<line x1="110.09" y1="107.56" x2="108.9" y2="108.51" stroke-width="5.12" />
<line x1="108.9" y1="108.51" x2="107.71" y2="109.46" stroke-width="5.83" />
<line x1="107.71" y1="109.46" x2="106.44" y2="110.1" stroke-width="6.9" />
<line x1="106.44" y1="110.1" x2="105.17" y2="110.73" stroke-width="8.33" />
<line x1="105.17" y1="110.73" x2="103.9" y2="111.37" stroke-width="9.76" />
<line x1="103.9" y1="111.37" x2="102.47" y2="111.05" stroke-width="10.65" />
<line x1="102.47" y1="111.05" x2="101.04" y2="110.73" stroke-width="11" />
<line x1="101.04" y1="110.73" x2="99.61" y2="110.41" stroke-width="11.35" />
<line x1="99.61" y1="110.41" x2="99.02" y2="109.46" stroke-width="10.73" />
<line x1="99.02" y1="109.46" x2="98.42" y2="108.51" stroke-width="9.15" />
<line x1="98.42" y1="108.51" x2="98.07" y2="106.96" stroke-width="7.37" />
<line x1="98.07" y1="106.96" x2="97.71" y2="105.42" stroke-width="5.39" />
<line x1="97.71" y1="105.42" x2="98.03" y2="103.51" stroke-width="4.06" />
<line x1="98.03" y1="103.51" x2="98.34" y2="101.61" stroke-width="3.39" />
<line x1="98.34" y1="101.61" x2="98.66" y2="99.7" stroke-width="2.72" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="99.38" y1="110.18" x2="98.19" y2="111.13" stroke-width="10.16" />
<line x1="98.19" y1="111.13" x2="96.68" y2="111.52" stroke-width="8.52" />
<line x1="96.68" y1="111.52" x2="95.17" y2="111.92" stroke-width="7.73" />
<line x1="95.17" y1="111.92" x2="93.66" y2="112.32" stroke-width="6.93" />
<line x1="93.66" y1="112.32" x2="92.55" y2="113.19" stroke-width="6.89" />
<line x1="92.55" y1="113.19" x2="91.44" y2="114.06" stroke-width="7.61" />
<line x1="91.44" y1="114.06" x2="90.33" y2="114.94" stroke-width="8.33" />
<line x1="90.33" y1="114.94" x2="88.66" y2="115.27" stroke-width="8.91" />
<line x1="88.66" y1="115.27" x2="87" y2="115.6" stroke-width="9.37" />
<line x1="87" y1="115.6" x2="85.33" y2="115.94" stroke-width="9.83" />
<line x1="85.33" y1="115.94" x2="83.66" y2="116.27" stroke-width="10.29" />
<line x1="83.66" y1="116.27" x2="82" y2="116.6" stroke-width="10.75" />
<line x1="82" y1="116.6" x2="80.81" y2="115.41" stroke-width="10.58" />
<line x1="80.81" y1="115.41" x2="79.62" y2="114.22" stroke-width="9.77" />
<line x1="79.62" y1="114.22" x2="78.43" y2="113.03" stroke-width="8.96" />
<line x1="78.43" y1="113.03" x2="78.35" y2="111.21" stroke-width="7.66" />
<line x1="78.35" y1="111.21" x2="78.27" y2="109.38" stroke-width="5.86" />
<line x1="78.27" y1="109.38" x2="78.19" y2="107.56" stroke-width="4.07" />
</g>
<g mask="url(#tk-m2)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="81.76" y1="116.37" x2="80.93" y2="117.56" stroke-width="10.07" />
<line x1="80.93" y1="117.56" x2="80.09" y2="118.75" stroke-width="8.25" />
<line x1="80.09" y1="118.75" x2="80.25" y2="120.41" stroke-width="6.91" />
<line x1="80.25" y1="120.41" x2="80.41" y2="122.08" stroke-width="6.05" />
<line x1="80.41" y1="122.08" x2="80.57" y2="123.74" stroke-width="5.19" />
<line x1="80.57" y1="123.74" x2="80.43" y2="125.41" stroke-width="4.67" />
<line x1="80.43" y1="125.41" x2="80.28" y2="127.08" stroke-width="4.48" />
<line x1="80.28" y1="127.08" x2="80.14" y2="128.74" stroke-width="4.29" />
<line x1="80.14" y1="128.74" x2="80" y2="130.41" stroke-width="4.09" />
<line x1="80" y1="130.41" x2="79.86" y2="132.07" stroke-width="3.9" />
<line x1="79.86" y1="132.07" x2="79.22" y2="133.5" stroke-width="4.03" />
<line x1="79.22" y1="133.5" x2="78.59" y2="134.93" stroke-width="4.48" />
<line x1="78.59" y1="134.93" x2="77.95" y2="136.36" stroke-width="4.93" />
<line x1="77.95" y1="136.36" x2="76.76" y2="137.79" stroke-width="5.42" />
<line x1="76.76" y1="137.79" x2="75.57" y2="139.22" stroke-width="5.94" />
<line x1="75.57" y1="139.22" x2="74.38" y2="140.65" stroke-width="6.47" />
<line x1="74.38" y1="140.65" x2="73.19" y2="141.68" stroke-width="6.89" />
<line x1="73.19" y1="141.68" x2="72" y2="142.71" stroke-width="7.21" />
<line x1="72" y1="142.71" x2="70.81" y2="143.74" stroke-width="7.53" />
<line x1="70.81" y1="143.74" x2="69.32" y2="144.51" stroke-width="7.86" />
<line x1="69.32" y1="144.51" x2="67.84" y2="145.29" stroke-width="8.2" />
<line x1="67.84" y1="145.29" x2="66.35" y2="146.06" stroke-width="8.54" />
<line x1="66.35" y1="146.06" x2="64.86" y2="146.83" stroke-width="8.88" />
<line x1="64.86" y1="146.83" x2="63" y2="147.31" stroke-width="9.11" />
<line x1="63" y1="147.31" x2="61.15" y2="147.79" stroke-width="9.25" />
<line x1="61.15" y1="147.79" x2="59.29" y2="148.26" stroke-width="9.38" />
<line x1="59.29" y1="148.26" x2="57.43" y2="148.74" stroke-width="9.52" />
<line x1="57.43" y1="148.74" x2="55.58" y2="149.21" stroke-width="9.65" />
<line x1="55.58" y1="149.21" x2="53.85" y2="149.39" stroke-width="9.87" />
<line x1="53.85" y1="149.39" x2="52.12" y2="149.57" stroke-width="10.18" />
<line x1="52.12" y1="149.57" x2="50.4" y2="149.75" stroke-width="10.49" />
<line x1="50.4" y1="149.75" x2="48.67" y2="149.93" stroke-width="10.8" />
<line x1="48.67" y1="149.93" x2="46.95" y2="149.69" stroke-width="10.95" />
<line x1="46.95" y1="149.69" x2="45.22" y2="149.45" stroke-width="10.95" />
<line x1="45.22" y1="149.45" x2="43.5" y2="149.21" stroke-width="10.95" />
<line x1="43.5" y1="149.21" x2="41.77" y2="148.98" stroke-width="10.95" />
<line x1="41.77" y1="148.98" x2="40.02" y2="148.26" stroke-width="10.9" />
<line x1="40.02" y1="148.26" x2="38.28" y2="147.55" stroke-width="10.8" />
<line x1="38.28" y1="147.55" x2="36.53" y2="146.83" stroke-width="10.71" />
<line x1="36.53" y1="146.83" x2="35.28" y2="145.76" stroke-width="10.39" />
<line x1="35.28" y1="145.76" x2="34.03" y2="144.69" stroke-width="9.87" />
<line x1="34.03" y1="144.69" x2="32.78" y2="143.62" stroke-width="9.34" />
<line x1="32.78" y1="143.62" x2="31.53" y2="142.55" stroke-width="8.82" />
<line x1="31.53" y1="142.55" x2="30.82" y2="141.36" stroke-width="8.16" />
<line x1="30.82" y1="141.36" x2="30.11" y2="140.17" stroke-width="7.37" />
<line x1="30.11" y1="140.17" x2="29.39" y2="138.98" stroke-width="6.58" />
<line x1="29.39" y1="138.98" x2="28.92" y2="137.19" stroke-width="5.81" />
<line x1="28.92" y1="137.19" x2="28.44" y2="135.41" stroke-width="5.06" />
<line x1="28.44" y1="135.41" x2="28.5" y2="133.44" stroke-width="4.38" />
<line x1="28.5" y1="133.44" x2="28.56" y2="131.48" stroke-width="3.79" />
<line x1="28.56" y1="131.48" x2="28.62" y2="129.52" stroke-width="3.19" />
<line x1="28.62" y1="129.52" x2="28.68" y2="127.55" stroke-width="2.6" />
<line x1="28.68" y1="127.55" x2="29.23" y2="125.81" stroke-width="2.27" />
<line x1="29.23" y1="125.81" x2="29.79" y2="124.06" stroke-width="2.2" />
<line x1="29.79" y1="124.06" x2="30.34" y2="122.32" stroke-width="2.13" />
<line x1="30.34" y1="122.32" x2="31.06" y2="120.75" stroke-width="2.09" />
<line x1="31.06" y1="120.75" x2="31.77" y2="119.17" stroke-width="2.08" />
<line x1="31.77" y1="119.17" x2="32.49" y2="117.6" stroke-width="2.06" />
<line x1="32.49" y1="117.6" x2="33.2" y2="116.03" stroke-width="2.04" />
<line x1="33.2" y1="116.03" x2="33.92" y2="114.46" stroke-width="2.03" />
</g>
<circle cx="75.33" cy="139.93" r="3.59" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="1s" fill="freeze" /></circle>
</svg>`,

  shiin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139.2 215.8" width="139.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 110.33 96.83 L 110.28 98.68 L 110.24 100.53 L 110.2 102.38 L 110.15 104.23 L 110.11 106.08 L 110.07 107.93 L 108.52 108.77 L 106.97 109.61 L 105.42 110.45 L 103.87 111.29 L 102.49 111.03 L 101.12 110.77 L 99.74 110.52 L 98.71 109.23 L 98.19 107.8 L 97.67 106.38 L 97.87 104.71 L 98.06 103.03 L 98.25 101.35 L 98.45 99.67" fill="none" stroke="#fff" stroke-width="15.36" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="1.50s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 99.48 110.26 L 97.87 110.9 L 96.25 111.55 L 94.64 112.19 L 93.03 112.84 L 91.6 113.87 L 90.18 114.91 L 88.58 115.22 L 86.98 115.53 L 85.38 115.84 L 83.78 116.15 L 82.18 116.46 L 80.63 115.68 L 79.6 114.39 L 78.56 113.1 L 78.5 111.48 L 78.44 109.87 L 78.37 108.26 L 78.31 106.64" fill="none" stroke="#fff" stroke-width="14.94" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="1.36s" begin="0.26s" fill="freeze" /></path></mask>
<mask id="tk-m2" maskUnits="userSpaceOnUse"><path d="M 81.92 116.46 L 81.02 117.62 L 80.11 118.78 L 80.16 120.54 L 80.22 122.29 L 80.27 124.05 L 80.32 125.8 L 80.37 127.56 L 80.2 129.19 L 80.03 130.83 L 79.85 132.47 L 78.99 134.01 L 78.13 135.56 L 77.27 137.11 L 76.07 138.58 L 74.86 140.04 L 73.66 141.5 L 72.24 142.47 L 70.82 143.44 L 69.4 144.41 L 67.98 145.38 L 66.36 146.02 L 64.75 146.67 L 63.14 147.31 L 61.52 147.96 L 59.91 148.28 L 58.29 148.6 L 56.68 148.93 L 55.07 149.25 L 53.46 149.35 L 51.86 149.46 L 50.26 149.56 L 48.66 149.66 L 47.06 149.77 L 45.51 149.51 L 43.96 149.25 L 42.41 148.99 L 40.86 148.73 L 39.4 148.13 L 37.94 147.53 L 36.47 146.93 L 35.1 145.72 L 33.72 144.52 L 32.34 143.31 L 31.31 141.76 L 30.28 140.21 L 29.24 138.66 L 28.98 137.11 L 28.73 135.56 L 28.47 134.01 L 28.21 132.47 L 28.38 130.83 L 28.55 129.19 L 28.73 127.56 L 29.18 126.07 L 29.63 124.59 L 30.08 123.1 L 30.53 121.62 L 31.26 120.17 L 31.98 118.73 L 32.7 117.28 L 33.43 115.84 L 34.15 114.39" fill="none" stroke="#fff" stroke-width="15.03" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="4.77s" begin="0.51s" fill="freeze" /></path></mask>
<mask id="tk-m3" maskUnits="userSpaceOnUse"><path d="M 99.74 77.46 L 98.19 78.24 L 96.64 79.01 L 95.26 79.01 L 93.89 79.01 L 92.51 79.01 L 91.48 79.27 L 90.44 79.53 L 89.93 80.3" fill="none" stroke="#fff" stroke-width="13.54" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.55s" begin="1.01s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="110.33" y1="96.83" x2="110.28" y2="98.68" stroke-width="3.14" />
<line x1="110.28" y1="98.68" x2="110.24" y2="100.53" stroke-width="3.4" />
<line x1="110.24" y1="100.53" x2="110.2" y2="102.38" stroke-width="3.66" />
<line x1="110.2" y1="102.38" x2="110.15" y2="104.23" stroke-width="3.91" />
<line x1="110.15" y1="104.23" x2="110.11" y2="106.08" stroke-width="4.17" />
<line x1="110.11" y1="106.08" x2="110.07" y2="107.93" stroke-width="4.43" />
<line x1="110.07" y1="107.93" x2="108.52" y2="108.77" stroke-width="5.28" />
<line x1="108.52" y1="108.77" x2="106.97" y2="109.61" stroke-width="6.72" />
<line x1="106.97" y1="109.61" x2="105.42" y2="110.45" stroke-width="8.17" />
<line x1="105.42" y1="110.45" x2="103.87" y2="111.29" stroke-width="9.61" />
<line x1="103.87" y1="111.29" x2="102.49" y2="111.03" stroke-width="10.53" />
<line x1="102.49" y1="111.03" x2="101.12" y2="110.77" stroke-width="10.95" />
<line x1="101.12" y1="110.77" x2="99.74" y2="110.52" stroke-width="11.36" />
<line x1="99.74" y1="110.52" x2="98.71" y2="109.23" stroke-width="10.57" />
<line x1="98.71" y1="109.23" x2="98.19" y2="107.8" stroke-width="8.48" />
<line x1="98.19" y1="107.8" x2="97.67" y2="106.38" stroke-width="6.27" />
<line x1="97.67" y1="106.38" x2="97.87" y2="104.71" stroke-width="4.83" />
<line x1="97.87" y1="104.71" x2="98.06" y2="103.03" stroke-width="4.16" />
<line x1="98.06" y1="103.03" x2="98.25" y2="101.35" stroke-width="3.5" />
<line x1="98.25" y1="101.35" x2="98.45" y2="99.67" stroke-width="2.83" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="99.48" y1="110.26" x2="97.87" y2="110.9" stroke-width="10.94" />
<line x1="97.87" y1="110.9" x2="96.25" y2="111.55" stroke-width="9.78" />
<line x1="96.25" y1="111.55" x2="94.64" y2="112.19" stroke-width="8.62" />
<line x1="94.64" y1="112.19" x2="93.03" y2="112.84" stroke-width="7.46" />
<line x1="93.03" y1="112.84" x2="91.6" y2="113.87" stroke-width="7.28" />
<line x1="91.6" y1="113.87" x2="90.18" y2="114.91" stroke-width="8.08" />
<line x1="90.18" y1="114.91" x2="88.58" y2="115.22" stroke-width="8.72" />
<line x1="88.58" y1="115.22" x2="86.98" y2="115.53" stroke-width="9.2" />
<line x1="86.98" y1="115.53" x2="85.38" y2="115.84" stroke-width="9.68" />
<line x1="85.38" y1="115.84" x2="83.78" y2="116.15" stroke-width="10.16" />
<line x1="83.78" y1="116.15" x2="82.18" y2="116.46" stroke-width="10.64" />
<line x1="82.18" y1="116.46" x2="80.63" y2="115.68" stroke-width="10.75" />
<line x1="80.63" y1="115.68" x2="79.6" y2="114.39" stroke-width="10.15" />
<line x1="79.6" y1="114.39" x2="78.56" y2="113.1" stroke-width="9.23" />
<line x1="78.56" y1="113.1" x2="78.5" y2="111.48" stroke-width="7.98" />
<line x1="78.5" y1="111.48" x2="78.44" y2="109.87" stroke-width="6.41" />
<line x1="78.44" y1="109.87" x2="78.37" y2="108.26" stroke-width="4.85" />
<line x1="78.37" y1="108.26" x2="78.31" y2="106.64" stroke-width="3.28" />
</g>
<g mask="url(#tk-m2)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="81.92" y1="116.46" x2="81.02" y2="117.62" stroke-width="10.18" />
<line x1="81.02" y1="117.62" x2="80.11" y2="118.78" stroke-width="8.36" />
<line x1="80.11" y1="118.78" x2="80.16" y2="120.54" stroke-width="7.11" />
<line x1="80.16" y1="120.54" x2="80.22" y2="122.29" stroke-width="6.45" />
<line x1="80.22" y1="122.29" x2="80.27" y2="124.05" stroke-width="5.79" />
<line x1="80.27" y1="124.05" x2="80.32" y2="125.8" stroke-width="5.13" />
<line x1="80.32" y1="125.8" x2="80.37" y2="127.56" stroke-width="4.46" />
<line x1="80.37" y1="127.56" x2="80.2" y2="129.19" stroke-width="4.05" />
<line x1="80.2" y1="129.19" x2="80.03" y2="130.83" stroke-width="3.87" />
<line x1="80.03" y1="130.83" x2="79.85" y2="132.47" stroke-width="3.7" />
<line x1="79.85" y1="132.47" x2="78.99" y2="134.01" stroke-width="3.95" />
<line x1="78.99" y1="134.01" x2="78.13" y2="135.56" stroke-width="4.62" />
<line x1="78.13" y1="135.56" x2="77.27" y2="137.11" stroke-width="5.29" />
<line x1="77.27" y1="137.11" x2="76.07" y2="138.58" stroke-width="5.87" />
<line x1="76.07" y1="138.58" x2="74.86" y2="140.04" stroke-width="6.36" />
<line x1="74.86" y1="140.04" x2="73.66" y2="141.5" stroke-width="6.85" />
<line x1="73.66" y1="141.5" x2="72.24" y2="142.47" stroke-width="7.27" />
<line x1="72.24" y1="142.47" x2="70.82" y2="143.44" stroke-width="7.64" />
<line x1="70.82" y1="143.44" x2="69.4" y2="144.41" stroke-width="8" />
<line x1="69.4" y1="144.41" x2="67.98" y2="145.38" stroke-width="8.37" />
<line x1="67.98" y1="145.38" x2="66.36" y2="146.02" stroke-width="8.64" />
<line x1="66.36" y1="146.02" x2="64.75" y2="146.67" stroke-width="8.83" />
<line x1="64.75" y1="146.67" x2="63.14" y2="147.31" stroke-width="9.02" />
<line x1="63.14" y1="147.31" x2="61.52" y2="147.96" stroke-width="9.2" />
<line x1="61.52" y1="147.96" x2="59.91" y2="148.28" stroke-width="9.36" />
<line x1="59.91" y1="148.28" x2="58.29" y2="148.6" stroke-width="9.49" />
<line x1="58.29" y1="148.6" x2="56.68" y2="148.93" stroke-width="9.62" />
<line x1="56.68" y1="148.93" x2="55.07" y2="149.25" stroke-width="9.75" />
<line x1="55.07" y1="149.25" x2="53.46" y2="149.35" stroke-width="9.92" />
<line x1="53.46" y1="149.35" x2="51.86" y2="149.46" stroke-width="10.12" />
<line x1="51.86" y1="149.46" x2="50.26" y2="149.56" stroke-width="10.33" />
<line x1="50.26" y1="149.56" x2="48.66" y2="149.66" stroke-width="10.54" />
<line x1="48.66" y1="149.66" x2="47.06" y2="149.77" stroke-width="10.74" />
<line x1="47.06" y1="149.77" x2="45.51" y2="149.51" stroke-width="10.87" />
<line x1="45.51" y1="149.51" x2="43.96" y2="149.25" stroke-width="10.93" />
<line x1="43.96" y1="149.25" x2="42.41" y2="148.99" stroke-width="10.98" />
<line x1="42.41" y1="148.99" x2="40.86" y2="148.73" stroke-width="11.03" />
<line x1="40.86" y1="148.73" x2="39.4" y2="148.13" stroke-width="11.01" />
<line x1="39.4" y1="148.13" x2="37.94" y2="147.53" stroke-width="10.9" />
<line x1="37.94" y1="147.53" x2="36.47" y2="146.93" stroke-width="10.79" />
<line x1="36.47" y1="146.93" x2="35.1" y2="145.72" stroke-width="10.41" />
<line x1="35.1" y1="145.72" x2="33.72" y2="144.52" stroke-width="9.75" />
<line x1="33.72" y1="144.52" x2="32.34" y2="143.31" stroke-width="9.09" />
<line x1="32.34" y1="143.31" x2="31.31" y2="141.76" stroke-width="8.34" />
<line x1="31.31" y1="141.76" x2="30.28" y2="140.21" stroke-width="7.48" />
<line x1="30.28" y1="140.21" x2="29.24" y2="138.66" stroke-width="6.62" />
<line x1="29.24" y1="138.66" x2="28.98" y2="137.11" stroke-width="5.86" />
<line x1="28.98" y1="137.11" x2="28.73" y2="135.56" stroke-width="5.2" />
<line x1="28.73" y1="135.56" x2="28.47" y2="134.01" stroke-width="4.53" />
<line x1="28.47" y1="134.01" x2="28.21" y2="132.47" stroke-width="3.86" />
<line x1="28.21" y1="132.47" x2="28.38" y2="130.83" stroke-width="3.35" />
<line x1="28.38" y1="130.83" x2="28.55" y2="129.19" stroke-width="3.01" />
<line x1="28.55" y1="129.19" x2="28.73" y2="127.56" stroke-width="2.67" />
<line x1="28.73" y1="127.56" x2="29.18" y2="126.07" stroke-width="2.43" />
<line x1="29.18" y1="126.07" x2="29.63" y2="124.59" stroke-width="2.3" />
<line x1="29.63" y1="124.59" x2="30.08" y2="123.1" stroke-width="2.17" />
<line x1="30.08" y1="123.1" x2="30.53" y2="121.62" stroke-width="2.04" />
<line x1="30.53" y1="121.62" x2="31.26" y2="120.17" stroke-width="1.99" />
<line x1="31.26" y1="120.17" x2="31.98" y2="118.73" stroke-width="2" />
<line x1="31.98" y1="118.73" x2="32.7" y2="117.28" stroke-width="2.02" />
<line x1="32.7" y1="117.28" x2="33.43" y2="115.84" stroke-width="2.04" />
<line x1="33.43" y1="115.84" x2="34.15" y2="114.39" stroke-width="2.06" />
</g>
<g mask="url(#tk-m3)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="99.74" y1="77.46" x2="98.19" y2="78.24" stroke-width="8.78" />
<line x1="98.19" y1="78.24" x2="96.64" y2="79.01" stroke-width="6.74" />
<line x1="96.64" y1="79.01" x2="95.26" y2="79.01" stroke-width="5.79" />
<line x1="95.26" y1="79.01" x2="93.89" y2="79.01" stroke-width="5.93" />
<line x1="93.89" y1="79.01" x2="92.51" y2="79.01" stroke-width="6.07" />
<line x1="92.51" y1="79.01" x2="91.48" y2="79.27" stroke-width="6.93" />
<line x1="91.48" y1="79.27" x2="90.44" y2="79.53" stroke-width="8.5" />
<line x1="90.44" y1="79.53" x2="89.93" y2="80.3" stroke-width="9.54" />
</g>
<circle cx="92.51" cy="67.65" r="3.78" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="1.2s" fill="freeze" /></circle>
</svg>`,

  saad: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 161.2 215.8" width="161.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 80.58 118.37 L 79.98 119.27 L 79.39 120.17 L 79.39 121.96 L 79.39 123.75 L 79.39 125.55 L 79.39 127.34 L 79.39 129.13 L 79.39 130.92 L 79.39 132.72 L 78.64 134.51 L 77.89 136.3 L 77 137.3 L 76.1 138.3 L 75.2 139.29 L 75.2 139.89 L 76.1 139.29 L 75.1 140.19 L 74.11 141.08 L 73.11 141.98 L 71.84 142.8 L 70.57 143.62 L 69.3 144.45 L 68.03 145.27 L 66.24 146.02 L 64.44 146.76 L 62.65 147.51 L 60.86 148.26 L 58.97 148.51 L 57.07 148.75 L 55.18 149 L 53.29 149.25 L 51.4 149.5 L 49.5 149.75 L 47.86 149.68 L 46.22 149.6 L 44.57 149.53 L 42.93 149.45 L 41.44 149.05 L 39.94 148.65 L 38.45 148.26 L 37.1 147.21 L 35.76 146.16 L 34.41 145.12 L 33.07 144.07 L 32.27 142.88 L 31.48 141.68 L 30.68 140.49 L 30.18 138.99 L 29.68 137.5 L 29.18 136 L 29.18 134.51 L 29.18 133.02 L 29.18 131.52 L 29.48 129.73 L 29.78 127.94 L 30.08 126.14 L 30.38 124.35 L 30.68 122.56 L 31.52 120.81 L 32.37 119.07 L 33.22 117.33 L 34.06 115.58 L 34.91 113.84 L 35.76 112.1" fill="none" stroke="#fff" stroke-width="14.95" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="4.77s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 95.52 118.97 L 95.52 117.18 L 95.52 115.39 L 96.12 114.04 L 96.72 112.7 L 98.15 111.63 L 99.57 110.57 L 101 109.51 L 102.43 108.45 L 103.86 107.38 L 105.28 106.32 L 106.71 105.26 L 108.14 104.2 L 109.57 103.13 L 111.06 102.34 L 112.56 101.54 L 114.05 100.74 L 115.96 100.32 L 117.87 99.91 L 119.79 99.49 L 121.7 99.07 L 123.61 98.65 L 125.26 99.25 L 126.9 99.85 L 127.94 100.97 L 128.99 102.09 L 130.04 103.21 L 131.08 104.33 L 130.78 106.02 L 130.48 107.72 L 130.19 109.41 L 128.99 110.9 L 127.7 111.9 L 126.4 112.9 L 125.11 113.89 L 123.61 114.56 L 122.12 115.24 L 120.62 115.91 L 119.13 116.58 L 117.22 117 L 115.3 117.42 L 113.39 117.84 L 111.48 118.25 L 109.57 118.67 L 107.66 118.75 L 105.76 118.82 L 103.85 118.9 L 101.95 118.97 L 100.04 119.05 L 98.14 119.12 L 96.23 119.2 L 94.33 119.27 L 92.49 119.14 L 90.66 119.01 L 88.82 118.89 L 86.98 118.76 L 85.15 118.63 L 83.31 118.5 L 81.48 118.37 L 80.36 117.18 L 79.24 115.98 L 78.12 114.79 L 77 113.59 L 76.92 111.72 L 76.85 109.86 L 76.77 107.99 L 76.7 106.12" fill="none" stroke="#fff" stroke-width="15.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.32s" begin="0.5s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="80.58" y1="118.37" x2="79.98" y2="119.27" stroke-width="10.45" />
<line x1="79.98" y1="119.27" x2="79.39" y2="120.17" stroke-width="8.76" />
<line x1="79.39" y1="120.17" x2="79.39" y2="121.96" stroke-width="7.56" />
<line x1="79.39" y1="121.96" x2="79.39" y2="123.75" stroke-width="6.86" />
<line x1="79.39" y1="123.75" x2="79.39" y2="125.55" stroke-width="6.15" />
<line x1="79.39" y1="125.55" x2="79.39" y2="127.34" stroke-width="5.45" />
<line x1="79.39" y1="127.34" x2="79.39" y2="129.13" stroke-width="4.75" />
<line x1="79.39" y1="129.13" x2="79.39" y2="130.92" stroke-width="4.04" />
<line x1="79.39" y1="130.92" x2="79.39" y2="132.72" stroke-width="3.34" />
<line x1="79.39" y1="132.72" x2="78.64" y2="134.51" stroke-width="3.26" />
<line x1="78.64" y1="134.51" x2="77.89" y2="136.3" stroke-width="3.81" />
<line x1="77.89" y1="136.3" x2="77" y2="137.3" stroke-width="4.2" />
<line x1="77" y1="137.3" x2="76.1" y2="138.3" stroke-width="4.45" />
<line x1="76.1" y1="138.3" x2="75.2" y2="139.29" stroke-width="4.7" />
<line x1="75.2" y1="139.29" x2="75.2" y2="139.89" stroke-width="5.25" />
<line x1="75.2" y1="139.89" x2="76.1" y2="139.29" stroke-width="5.37" />
<line x1="76.1" y1="139.29" x2="75.1" y2="140.19" stroke-width="5.35" />
<line x1="75.1" y1="140.19" x2="74.11" y2="141.08" stroke-width="5.92" />
<line x1="74.11" y1="141.08" x2="73.11" y2="141.98" stroke-width="6.48" />
<line x1="73.11" y1="141.98" x2="71.84" y2="142.8" stroke-width="6.94" />
<line x1="71.84" y1="142.8" x2="70.57" y2="143.62" stroke-width="7.3" />
<line x1="70.57" y1="143.62" x2="69.3" y2="144.45" stroke-width="7.66" />
<line x1="69.3" y1="144.45" x2="68.03" y2="145.27" stroke-width="8.02" />
<line x1="68.03" y1="145.27" x2="66.24" y2="146.02" stroke-width="8.37" />
<line x1="66.24" y1="146.02" x2="64.44" y2="146.76" stroke-width="8.71" />
<line x1="64.44" y1="146.76" x2="62.65" y2="147.51" stroke-width="9.05" />
<line x1="62.65" y1="147.51" x2="60.86" y2="148.26" stroke-width="9.39" />
<line x1="60.86" y1="148.26" x2="58.97" y2="148.51" stroke-width="9.61" />
<line x1="58.97" y1="148.51" x2="57.07" y2="148.75" stroke-width="9.71" />
<line x1="57.07" y1="148.75" x2="55.18" y2="149" stroke-width="9.81" />
<line x1="55.18" y1="149" x2="53.29" y2="149.25" stroke-width="9.91" />
<line x1="53.29" y1="149.25" x2="51.4" y2="149.5" stroke-width="10.01" />
<line x1="51.4" y1="149.5" x2="49.5" y2="149.75" stroke-width="10.11" />
<line x1="49.5" y1="149.75" x2="47.86" y2="149.68" stroke-width="10.23" />
<line x1="47.86" y1="149.68" x2="46.22" y2="149.6" stroke-width="10.38" />
<line x1="46.22" y1="149.6" x2="44.57" y2="149.53" stroke-width="10.53" />
<line x1="44.57" y1="149.53" x2="42.93" y2="149.45" stroke-width="10.68" />
<line x1="42.93" y1="149.45" x2="41.44" y2="149.05" stroke-width="10.8" />
<line x1="41.44" y1="149.05" x2="39.94" y2="148.65" stroke-width="10.87" />
<line x1="39.94" y1="148.65" x2="38.45" y2="148.26" stroke-width="10.95" />
<line x1="38.45" y1="148.26" x2="37.1" y2="147.21" stroke-width="10.85" />
<line x1="37.1" y1="147.21" x2="35.76" y2="146.16" stroke-width="10.58" />
<line x1="35.76" y1="146.16" x2="34.41" y2="145.12" stroke-width="10.3" />
<line x1="34.41" y1="145.12" x2="33.07" y2="144.07" stroke-width="10.03" />
<line x1="33.07" y1="144.07" x2="32.27" y2="142.88" stroke-width="9.64" />
<line x1="32.27" y1="142.88" x2="31.48" y2="141.68" stroke-width="9.13" />
<line x1="31.48" y1="141.68" x2="30.68" y2="140.49" stroke-width="8.62" />
<line x1="30.68" y1="140.49" x2="30.18" y2="138.99" stroke-width="8.07" />
<line x1="30.18" y1="138.99" x2="29.68" y2="137.5" stroke-width="7.47" />
<line x1="29.68" y1="137.5" x2="29.18" y2="136" stroke-width="6.87" />
<line x1="29.18" y1="136" x2="29.18" y2="134.51" stroke-width="6.37" />
<line x1="29.18" y1="134.51" x2="29.18" y2="133.02" stroke-width="5.98" />
<line x1="29.18" y1="133.02" x2="29.18" y2="131.52" stroke-width="5.58" />
<line x1="29.18" y1="131.52" x2="29.48" y2="129.73" stroke-width="5.18" />
<line x1="29.48" y1="129.73" x2="29.78" y2="127.94" stroke-width="4.78" />
<line x1="29.78" y1="127.94" x2="30.08" y2="126.14" stroke-width="4.38" />
<line x1="30.08" y1="126.14" x2="30.38" y2="124.35" stroke-width="3.98" />
<line x1="30.38" y1="124.35" x2="30.68" y2="122.56" stroke-width="3.58" />
<line x1="30.68" y1="122.56" x2="31.52" y2="120.81" stroke-width="3.29" />
<line x1="31.52" y1="120.81" x2="32.37" y2="119.07" stroke-width="3.11" />
<line x1="32.37" y1="119.07" x2="33.22" y2="117.33" stroke-width="2.93" />
<line x1="33.22" y1="117.33" x2="34.06" y2="115.58" stroke-width="2.74" />
<line x1="34.06" y1="115.58" x2="34.91" y2="113.84" stroke-width="2.56" />
<line x1="34.91" y1="113.84" x2="35.76" y2="112.1" stroke-width="2.38" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="95.52" y1="118.97" x2="95.52" y2="117.18" stroke-width="9.69" />
<line x1="95.52" y1="117.18" x2="95.52" y2="115.39" stroke-width="6.68" />
<line x1="95.52" y1="115.39" x2="96.12" y2="114.04" stroke-width="4.73" />
<line x1="96.12" y1="114.04" x2="96.72" y2="112.7" stroke-width="3.83" />
<line x1="96.72" y1="112.7" x2="98.15" y2="111.63" stroke-width="3.52" />
<line x1="98.15" y1="111.63" x2="99.57" y2="110.57" stroke-width="3.8" />
<line x1="99.57" y1="110.57" x2="101" y2="109.51" stroke-width="4.09" />
<line x1="101" y1="109.51" x2="102.43" y2="108.45" stroke-width="4.37" />
<line x1="102.43" y1="108.45" x2="103.86" y2="107.38" stroke-width="4.65" />
<line x1="103.86" y1="107.38" x2="105.28" y2="106.32" stroke-width="4.93" />
<line x1="105.28" y1="106.32" x2="106.71" y2="105.26" stroke-width="5.21" />
<line x1="106.71" y1="105.26" x2="108.14" y2="104.2" stroke-width="5.49" />
<line x1="108.14" y1="104.2" x2="109.57" y2="103.13" stroke-width="5.78" />
<line x1="109.57" y1="103.13" x2="111.06" y2="102.34" stroke-width="6.16" />
<line x1="111.06" y1="102.34" x2="112.56" y2="101.54" stroke-width="6.64" />
<line x1="112.56" y1="101.54" x2="114.05" y2="100.74" stroke-width="7.12" />
<line x1="114.05" y1="100.74" x2="115.96" y2="100.32" stroke-width="7.78" />
<line x1="115.96" y1="100.32" x2="117.87" y2="99.91" stroke-width="8.63" />
<line x1="117.87" y1="99.91" x2="119.79" y2="99.49" stroke-width="9.48" />
<line x1="119.79" y1="99.49" x2="121.7" y2="99.07" stroke-width="10.33" />
<line x1="121.7" y1="99.07" x2="123.61" y2="98.65" stroke-width="11.18" />
<line x1="123.61" y1="98.65" x2="125.26" y2="99.25" stroke-width="11.6" />
<line x1="125.26" y1="99.25" x2="126.9" y2="99.85" stroke-width="11.59" />
<line x1="126.9" y1="99.85" x2="127.94" y2="100.97" stroke-width="11.06" />
<line x1="127.94" y1="100.97" x2="128.99" y2="102.09" stroke-width="10.02" />
<line x1="128.99" y1="102.09" x2="130.04" y2="103.21" stroke-width="8.98" />
<line x1="130.04" y1="103.21" x2="131.08" y2="104.33" stroke-width="7.94" />
<line x1="131.08" y1="104.33" x2="130.78" y2="106.02" stroke-width="6.99" />
<line x1="130.78" y1="106.02" x2="130.48" y2="107.72" stroke-width="6.12" />
<line x1="130.48" y1="107.72" x2="130.19" y2="109.41" stroke-width="5.26" />
<line x1="130.19" y1="109.41" x2="128.99" y2="110.9" stroke-width="5.25" />
<line x1="128.99" y1="110.9" x2="127.7" y2="111.9" stroke-width="5.95" />
<line x1="127.7" y1="111.9" x2="126.4" y2="112.9" stroke-width="6.51" />
<line x1="126.4" y1="112.9" x2="125.11" y2="113.89" stroke-width="7.08" />
<line x1="125.11" y1="113.89" x2="123.61" y2="114.56" stroke-width="7.49" />
<line x1="123.61" y1="114.56" x2="122.12" y2="115.24" stroke-width="7.74" />
<line x1="122.12" y1="115.24" x2="120.62" y2="115.91" stroke-width="7.99" />
<line x1="120.62" y1="115.91" x2="119.13" y2="116.58" stroke-width="8.24" />
<line x1="119.13" y1="116.58" x2="117.22" y2="117" stroke-width="8.43" />
<line x1="117.22" y1="117" x2="115.3" y2="117.42" stroke-width="8.55" />
<line x1="115.3" y1="117.42" x2="113.39" y2="117.84" stroke-width="8.67" />
<line x1="113.39" y1="117.84" x2="111.48" y2="118.25" stroke-width="8.79" />
<line x1="111.48" y1="118.25" x2="109.57" y2="118.67" stroke-width="8.91" />
<line x1="109.57" y1="118.67" x2="107.66" y2="118.75" stroke-width="9.08" />
<line x1="107.66" y1="118.75" x2="105.76" y2="118.82" stroke-width="9.3" />
<line x1="105.76" y1="118.82" x2="103.85" y2="118.9" stroke-width="9.53" />
<line x1="103.85" y1="118.9" x2="101.95" y2="118.97" stroke-width="9.75" />
<line x1="101.95" y1="118.97" x2="100.04" y2="119.05" stroke-width="9.97" />
<line x1="100.04" y1="119.05" x2="98.14" y2="119.12" stroke-width="10.2" />
<line x1="98.14" y1="119.12" x2="96.23" y2="119.2" stroke-width="10.42" />
<line x1="96.23" y1="119.2" x2="94.33" y2="119.27" stroke-width="10.65" />
<line x1="94.33" y1="119.27" x2="92.49" y2="119.14" stroke-width="10.74" />
<line x1="92.49" y1="119.14" x2="90.66" y2="119.01" stroke-width="10.71" />
<line x1="90.66" y1="119.01" x2="88.82" y2="118.89" stroke-width="10.68" />
<line x1="88.82" y1="118.89" x2="86.98" y2="118.76" stroke-width="10.66" />
<line x1="86.98" y1="118.76" x2="85.15" y2="118.63" stroke-width="10.63" />
<line x1="85.15" y1="118.63" x2="83.31" y2="118.5" stroke-width="10.6" />
<line x1="83.31" y1="118.5" x2="81.48" y2="118.37" stroke-width="10.57" />
<line x1="81.48" y1="118.37" x2="80.36" y2="117.18" stroke-width="10.28" />
<line x1="80.36" y1="117.18" x2="79.24" y2="115.98" stroke-width="9.73" />
<line x1="79.24" y1="115.98" x2="78.12" y2="114.79" stroke-width="9.19" />
<line x1="78.12" y1="114.79" x2="77" y2="113.59" stroke-width="8.64" />
<line x1="77" y1="113.59" x2="76.92" y2="111.72" stroke-width="7.58" />
<line x1="76.92" y1="111.72" x2="76.85" y2="109.86" stroke-width="5.99" />
<line x1="76.85" y1="109.86" x2="76.77" y2="107.99" stroke-width="4.41" />
<line x1="76.77" y1="107.99" x2="76.7" y2="106.12" stroke-width="2.83" />
</g>
<circle cx="129.29" cy="101.64" r="3.68" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="1.05s" fill="freeze" /></circle>
</svg>`,

  daad: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 161.2 215.8" width="161.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 95.22 118.74 L 95.37 117.09 L 95.52 115.45 L 96.12 114.1 L 96.72 112.76 L 98.03 111.68 L 99.35 110.61 L 100.66 109.53 L 101.98 108.46 L 103.29 107.38 L 104.74 106.43 L 106.18 105.49 L 107.63 104.54 L 109.07 103.59 L 110.51 102.65 L 111.96 101.7 L 113.62 101.28 L 115.29 100.85 L 116.95 100.42 L 118.62 99.99 L 120.28 99.57 L 121.95 99.14 L 123.61 98.71 L 125.26 99.31 L 126.9 99.91 L 128.19 101.11 L 129.49 102.3 L 130.78 103.5 L 131.08 105.29 L 130.78 106.68 L 130.48 108.08 L 130.19 109.47 L 128.92 110.59 L 127.65 111.71 L 126.38 112.83 L 125.11 113.95 L 123.51 114.75 L 121.92 115.55 L 120.33 116.35 L 118.53 116.74 L 116.74 117.14 L 114.95 117.54 L 113.15 117.94 L 111.36 118.34 L 109.57 118.74 L 107.65 118.82 L 105.73 118.91 L 103.8 118.99 L 101.88 119.08 L 99.96 119.16 L 98.04 119.25 L 96.12 119.33 L 94.25 119.18 L 92.38 119.03 L 90.52 118.88 L 88.65 118.74 L 86.78 118.59 L 84.91 118.44 L 83.05 118.29 L 81.18 118.14 L 80.13 117.02 L 79.09 115.9 L 78.04 114.78 L 77 113.66 L 76.92 111.94 L 76.85 110.22 L 76.77 108.5 L 76.7 106.78" fill="none" stroke="#fff" stroke-width="15.78" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.32s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 81.18 118.14 L 80.28 119.18 L 79.39 120.23 L 79.44 122.02 L 79.49 123.82 L 79.54 125.61 L 79.59 127.4 L 79.64 129.19 L 79.69 130.99 L 79.39 132.33 L 79.09 133.68 L 78.29 135.17 L 77.49 136.66 L 76.7 138.16 L 75.5 139.45 L 74.31 140.75 L 73.11 142.04 L 71.47 142.94 L 69.82 143.84 L 68.18 144.73 L 66.54 145.63 L 64.89 146.53 L 63.25 147.42 L 61.51 147.77 L 59.76 148.12 L 58.02 148.47 L 56.28 148.82 L 54.53 149.17 L 52.79 149.51 L 50.88 149.51 L 48.97 149.51 L 47.05 149.51 L 45.14 149.51 L 43.23 149.51 L 41.59 148.92 L 39.94 148.32 L 38.3 147.72 L 36.65 147.12 L 35.56 146.23 L 34.46 145.33 L 33.37 144.43 L 32.57 143.34 L 31.77 142.24 L 30.98 141.15 L 30.38 139.45 L 29.78 137.76 L 29.18 136.07 L 29.18 134.47 L 29.18 132.88 L 29.18 131.29 L 29.48 129.55 L 29.78 127.82 L 30.08 126.09 L 30.38 124.35 L 30.68 122.62 L 31.28 121.13 L 31.87 119.63 L 32.47 118.14 L 33.07 116.64 L 34.07 115.05 L 35.06 113.46 L 36.06 111.86" fill="none" stroke="#fff" stroke-width="14.96" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="4.77s" begin="0.54s" fill="freeze" /></path></mask>
<mask id="tk-m2" maskUnits="userSpaceOnUse"><path d="M 102.1 78.1 L 100.3 78.54 L 98.51 78.99" fill="none" stroke="#fff" stroke-width="12.63" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.14s" begin="1.19s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="95.22" y1="118.74" x2="95.37" y2="117.09" stroke-width="9.5" />
<line x1="95.37" y1="117.09" x2="95.52" y2="115.45" stroke-width="6.62" />
<line x1="95.52" y1="115.45" x2="96.12" y2="114.1" stroke-width="4.73" />
<line x1="96.12" y1="114.1" x2="96.72" y2="112.76" stroke-width="3.83" />
<line x1="96.72" y1="112.76" x2="98.03" y2="111.68" stroke-width="3.53" />
<line x1="98.03" y1="111.68" x2="99.35" y2="110.61" stroke-width="3.81" />
<line x1="99.35" y1="110.61" x2="100.66" y2="109.53" stroke-width="4.1" />
<line x1="100.66" y1="109.53" x2="101.98" y2="108.46" stroke-width="4.39" />
<line x1="101.98" y1="108.46" x2="103.29" y2="107.38" stroke-width="4.68" />
<line x1="103.29" y1="107.38" x2="104.74" y2="106.43" stroke-width="4.96" />
<line x1="104.74" y1="106.43" x2="106.18" y2="105.49" stroke-width="5.25" />
<line x1="106.18" y1="105.49" x2="107.63" y2="104.54" stroke-width="5.53" />
<line x1="107.63" y1="104.54" x2="109.07" y2="103.59" stroke-width="5.81" />
<line x1="109.07" y1="103.59" x2="110.51" y2="102.65" stroke-width="6.09" />
<line x1="110.51" y1="102.65" x2="111.96" y2="101.7" stroke-width="6.37" />
<line x1="111.96" y1="101.7" x2="113.62" y2="101.28" stroke-width="6.88" />
<line x1="113.62" y1="101.28" x2="115.29" y2="100.85" stroke-width="7.6" />
<line x1="115.29" y1="100.85" x2="116.95" y2="100.42" stroke-width="8.33" />
<line x1="116.95" y1="100.42" x2="118.62" y2="99.99" stroke-width="9.06" />
<line x1="118.62" y1="99.99" x2="120.28" y2="99.57" stroke-width="9.79" />
<line x1="120.28" y1="99.57" x2="121.95" y2="99.14" stroke-width="10.51" />
<line x1="121.95" y1="99.14" x2="123.61" y2="98.71" stroke-width="11.24" />
<line x1="123.61" y1="98.71" x2="125.26" y2="99.31" stroke-width="11.66" />
<line x1="125.26" y1="99.31" x2="126.9" y2="99.91" stroke-width="11.78" />
<line x1="126.9" y1="99.91" x2="128.19" y2="101.11" stroke-width="11.26" />
<line x1="128.19" y1="101.11" x2="129.49" y2="102.3" stroke-width="10.1" />
<line x1="129.49" y1="102.3" x2="130.78" y2="103.5" stroke-width="8.94" />
<line x1="130.78" y1="103.5" x2="131.08" y2="105.29" stroke-width="7.72" />
<line x1="131.08" y1="105.29" x2="130.78" y2="106.68" stroke-width="6.69" />
<line x1="130.78" y1="106.68" x2="130.48" y2="108.08" stroke-width="5.95" />
<line x1="130.48" y1="108.08" x2="130.19" y2="109.47" stroke-width="5.2" />
<line x1="130.19" y1="109.47" x2="128.92" y2="110.59" stroke-width="5.14" />
<line x1="128.92" y1="110.59" x2="127.65" y2="111.71" stroke-width="5.77" />
<line x1="127.65" y1="111.71" x2="126.38" y2="112.83" stroke-width="6.41" />
<line x1="126.38" y1="112.83" x2="125.11" y2="113.95" stroke-width="7.04" />
<line x1="125.11" y1="113.95" x2="123.51" y2="114.75" stroke-width="7.53" />
<line x1="123.51" y1="114.75" x2="121.92" y2="115.55" stroke-width="7.88" />
<line x1="121.92" y1="115.55" x2="120.33" y2="116.35" stroke-width="8.23" />
<line x1="120.33" y1="116.35" x2="118.53" y2="116.74" stroke-width="8.46" />
<line x1="118.53" y1="116.74" x2="116.74" y2="117.14" stroke-width="8.55" />
<line x1="116.74" y1="117.14" x2="114.95" y2="117.54" stroke-width="8.64" />
<line x1="114.95" y1="117.54" x2="113.15" y2="117.94" stroke-width="8.73" />
<line x1="113.15" y1="117.94" x2="111.36" y2="118.34" stroke-width="8.83" />
<line x1="111.36" y1="118.34" x2="109.57" y2="118.74" stroke-width="8.92" />
<line x1="109.57" y1="118.74" x2="107.65" y2="118.82" stroke-width="9.05" />
<line x1="107.65" y1="118.82" x2="105.73" y2="118.91" stroke-width="9.22" />
<line x1="105.73" y1="118.91" x2="103.8" y2="118.99" stroke-width="9.39" />
<line x1="103.8" y1="118.99" x2="101.88" y2="119.08" stroke-width="9.56" />
<line x1="101.88" y1="119.08" x2="99.96" y2="119.16" stroke-width="9.73" />
<line x1="99.96" y1="119.16" x2="98.04" y2="119.25" stroke-width="9.9" />
<line x1="98.04" y1="119.25" x2="96.12" y2="119.33" stroke-width="10.07" />
<line x1="96.12" y1="119.33" x2="94.25" y2="119.18" stroke-width="10.24" />
<line x1="94.25" y1="119.18" x2="92.38" y2="119.03" stroke-width="10.39" />
<line x1="92.38" y1="119.03" x2="90.52" y2="118.88" stroke-width="10.55" />
<line x1="90.52" y1="118.88" x2="88.65" y2="118.74" stroke-width="10.7" />
<line x1="88.65" y1="118.74" x2="86.78" y2="118.59" stroke-width="10.86" />
<line x1="86.78" y1="118.59" x2="84.91" y2="118.44" stroke-width="11.01" />
<line x1="84.91" y1="118.44" x2="83.05" y2="118.29" stroke-width="11.17" />
<line x1="83.05" y1="118.29" x2="81.18" y2="118.14" stroke-width="11.32" />
<line x1="81.18" y1="118.14" x2="80.13" y2="117.02" stroke-width="11.02" />
<line x1="80.13" y1="117.02" x2="79.09" y2="115.9" stroke-width="10.26" />
<line x1="79.09" y1="115.9" x2="78.04" y2="114.78" stroke-width="9.5" />
<line x1="78.04" y1="114.78" x2="77" y2="113.66" stroke-width="8.75" />
<line x1="77" y1="113.66" x2="76.92" y2="111.94" stroke-width="7.64" />
<line x1="76.92" y1="111.94" x2="76.85" y2="110.22" stroke-width="6.18" />
<line x1="76.85" y1="110.22" x2="76.77" y2="108.5" stroke-width="4.72" />
<line x1="76.77" y1="108.5" x2="76.7" y2="106.78" stroke-width="3.26" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="81.18" y1="118.14" x2="80.28" y2="119.18" stroke-width="10.49" />
<line x1="80.28" y1="119.18" x2="79.39" y2="120.23" stroke-width="8.68" />
<line x1="79.39" y1="120.23" x2="79.44" y2="122.02" stroke-width="7.37" />
<line x1="79.44" y1="122.02" x2="79.49" y2="123.82" stroke-width="6.57" />
<line x1="79.49" y1="123.82" x2="79.54" y2="125.61" stroke-width="5.78" />
<line x1="79.54" y1="125.61" x2="79.59" y2="127.4" stroke-width="4.98" />
<line x1="79.59" y1="127.4" x2="79.64" y2="129.19" stroke-width="4.18" />
<line x1="79.64" y1="129.19" x2="79.69" y2="130.99" stroke-width="3.39" />
<line x1="79.69" y1="130.99" x2="79.39" y2="132.33" stroke-width="3.05" />
<line x1="79.39" y1="132.33" x2="79.09" y2="133.68" stroke-width="3.17" />
<line x1="79.09" y1="133.68" x2="78.29" y2="135.17" stroke-width="3.5" />
<line x1="78.29" y1="135.17" x2="77.49" y2="136.66" stroke-width="4.03" />
<line x1="77.49" y1="136.66" x2="76.7" y2="138.16" stroke-width="4.56" />
<line x1="76.7" y1="138.16" x2="75.5" y2="139.45" stroke-width="5.15" />
<line x1="75.5" y1="139.45" x2="74.31" y2="140.75" stroke-width="5.79" />
<line x1="74.31" y1="140.75" x2="73.11" y2="142.04" stroke-width="6.44" />
<line x1="73.11" y1="142.04" x2="71.47" y2="142.94" stroke-width="6.97" />
<line x1="71.47" y1="142.94" x2="69.82" y2="143.84" stroke-width="7.4" />
<line x1="69.82" y1="143.84" x2="68.18" y2="144.73" stroke-width="7.82" />
<line x1="68.18" y1="144.73" x2="66.54" y2="145.63" stroke-width="8.24" />
<line x1="66.54" y1="145.63" x2="64.89" y2="146.53" stroke-width="8.66" />
<line x1="64.89" y1="146.53" x2="63.25" y2="147.42" stroke-width="9.09" />
<line x1="63.25" y1="147.42" x2="61.51" y2="147.77" stroke-width="9.32" />
<line x1="61.51" y1="147.77" x2="59.76" y2="148.12" stroke-width="9.36" />
<line x1="59.76" y1="148.12" x2="58.02" y2="148.47" stroke-width="9.41" />
<line x1="58.02" y1="148.47" x2="56.28" y2="148.82" stroke-width="9.45" />
<line x1="56.28" y1="148.82" x2="54.53" y2="149.17" stroke-width="9.5" />
<line x1="54.53" y1="149.17" x2="52.79" y2="149.51" stroke-width="9.54" />
<line x1="52.79" y1="149.51" x2="50.88" y2="149.51" stroke-width="9.68" />
<line x1="50.88" y1="149.51" x2="48.97" y2="149.51" stroke-width="9.92" />
<line x1="48.97" y1="149.51" x2="47.05" y2="149.51" stroke-width="10.16" />
<line x1="47.05" y1="149.51" x2="45.14" y2="149.51" stroke-width="10.4" />
<line x1="45.14" y1="149.51" x2="43.23" y2="149.51" stroke-width="10.64" />
<line x1="43.23" y1="149.51" x2="41.59" y2="148.92" stroke-width="10.79" />
<line x1="41.59" y1="148.92" x2="39.94" y2="148.32" stroke-width="10.84" />
<line x1="39.94" y1="148.32" x2="38.3" y2="147.72" stroke-width="10.9" />
<line x1="38.3" y1="147.72" x2="36.65" y2="147.12" stroke-width="10.96" />
<line x1="36.65" y1="147.12" x2="35.56" y2="146.23" stroke-width="10.81" />
<line x1="35.56" y1="146.23" x2="34.46" y2="145.33" stroke-width="10.44" />
<line x1="34.46" y1="145.33" x2="33.37" y2="144.43" stroke-width="10.08" />
<line x1="33.37" y1="144.43" x2="32.57" y2="143.34" stroke-width="9.68" />
<line x1="32.57" y1="143.34" x2="31.77" y2="142.24" stroke-width="9.26" />
<line x1="31.77" y1="142.24" x2="30.98" y2="141.15" stroke-width="8.83" />
<line x1="30.98" y1="141.15" x2="30.38" y2="139.45" stroke-width="8.27" />
<line x1="30.38" y1="139.45" x2="29.78" y2="137.76" stroke-width="7.59" />
<line x1="29.78" y1="137.76" x2="29.18" y2="136.07" stroke-width="6.91" />
<line x1="29.18" y1="136.07" x2="29.18" y2="134.47" stroke-width="6.37" />
<line x1="29.18" y1="134.47" x2="29.18" y2="132.88" stroke-width="5.98" />
<line x1="29.18" y1="132.88" x2="29.18" y2="131.29" stroke-width="5.58" />
<line x1="29.18" y1="131.29" x2="29.48" y2="129.55" stroke-width="5.18" />
<line x1="29.48" y1="129.55" x2="29.78" y2="127.82" stroke-width="4.78" />
<line x1="29.78" y1="127.82" x2="30.08" y2="126.09" stroke-width="4.38" />
<line x1="30.08" y1="126.09" x2="30.38" y2="124.35" stroke-width="3.98" />
<line x1="30.38" y1="124.35" x2="30.68" y2="122.62" stroke-width="3.58" />
<line x1="30.68" y1="122.62" x2="31.28" y2="121.13" stroke-width="3.28" />
<line x1="31.28" y1="121.13" x2="31.87" y2="119.63" stroke-width="3.06" />
<line x1="31.87" y1="119.63" x2="32.47" y2="118.14" stroke-width="2.85" />
<line x1="32.47" y1="118.14" x2="33.07" y2="116.64" stroke-width="2.64" />
<line x1="33.07" y1="116.64" x2="34.07" y2="115.05" stroke-width="2.49" />
<line x1="34.07" y1="115.05" x2="35.06" y2="113.46" stroke-width="2.41" />
<line x1="35.06" y1="113.46" x2="36.06" y2="111.86" stroke-width="2.33" />
</g>
<circle cx="128.99" cy="110.97" r="3.66" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="1.04s" fill="freeze" /></circle>
<g mask="url(#tk-m2)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="102.1" y1="78.1" x2="100.3" y2="78.54" stroke-width="8.63" />
<line x1="100.3" y1="78.54" x2="98.51" y2="78.99" stroke-width="6.09" />
</g>
</svg>`,

  taa_emphatic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.2 215.8" width="119.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 51.92 61.02 L 51.85 62.75 L 51.78 64.48 L 51.71 66.22 L 52.12 67.46 L 52.54 68.71 L 52.33 70.06 L 52.12 71.41 L 52.23 73.28 L 52.33 75.16 L 52.52 77.04 L 52.71 78.93 L 52.9 80.82 L 53.09 82.71 L 53.28 84.6 L 53.48 86.49 L 53.67 88.37 L 53.86 90.26 L 54.05 92.15 L 54.24 94.04 L 54.43 95.93 L 54.62 97.82 L 54.58 99.65 L 54.54 101.48 L 54.49 103.3 L 54.45 105.13 L 54.41 106.96 L 54.37 108.79 L 54.33 110.62 L 54.29 112.45 L 54.24 114.28 L 54.2 116.11 L 55.03 116.53 L 55.66 115.9 L 55.03 116.53 L 54.83 116.11 L 55.24 115.49 L 55.14 116.53 L 55.03 117.57 L 54.62 116.74" fill="none" stroke="#fff" stroke-width="10.86" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.86s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 51.71 128.58 L 50.77 127.65 L 49.84 126.71 L 49.84 125.67 L 50.46 124.01 L 51.08 122.35 L 52.12 121.38 L 53.16 120.41 L 54.2 119.44 L 54.62 118.5 L 55.03 117.57 L 56.07 117.25 L 57.11 116.94 L 58.73 115.82 L 60.36 114.7 L 61.98 113.57 L 63.6 112.45 L 65.22 111.33 L 66.57 110.65 L 67.92 109.98 L 69.28 109.3 L 70.63 108.63 L 72.19 108.11 L 73.75 107.59 L 75.45 107.3 L 77.15 107.01 L 78.86 106.71 L 80.56 106.42 L 82.27 106.13 L 83.83 106.76 L 85.39 107.38 L 86.74 108.83 L 88.09 110.29 L 87.83 111.9 L 87.57 113.51 L 87.31 115.12 L 87.05 116.74 L 86.08 117.71 L 85.11 118.68 L 84.14 119.65 L 82.53 120.48 L 80.92 121.31 L 79.31 122.14 L 77.7 122.97 L 76.03 123.46 L 74.37 123.94 L 72.71 124.43 L 71.04 124.91 L 69.38 125.4 L 67.72 125.88 L 66.01 126.26 L 64.31 126.63 L 62.6 127 L 60.9 127.38 L 59.19 127.75 L 57.32 127.99 L 55.45 128.22 L 53.58 128.45 L 51.71 128.69 L 49.84 128.92 L 47.97 129.16 L 46.1 129.39 L 44.22 129.63 L 42.46 129.52 L 40.69 129.42 L 38.82 129 L 36.95 128.58 L 35.08 128.17 L 33.21 127.75 L 31.75 127.13 L 30.29 126.51 L 28.84 125.88 L 27.38 125.26" fill="none" stroke="#fff" stroke-width="15.21" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.45s" begin="0.36s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="51.92" y1="61.02" x2="51.85" y2="62.75" stroke-width="3" />
<line x1="51.85" y1="62.75" x2="51.78" y2="64.48" stroke-width="4.29" />
<line x1="51.78" y1="64.48" x2="51.71" y2="66.22" stroke-width="5.59" />
<line x1="51.71" y1="66.22" x2="52.12" y2="67.46" stroke-width="6.44" />
<line x1="52.12" y1="67.46" x2="52.54" y2="68.71" stroke-width="6.86" />
<line x1="52.54" y1="68.71" x2="52.33" y2="70.06" stroke-width="6.65" />
<line x1="52.33" y1="70.06" x2="52.12" y2="71.41" stroke-width="5.82" />
<line x1="52.12" y1="71.41" x2="52.23" y2="73.28" stroke-width="5.3" />
<line x1="52.23" y1="73.28" x2="52.33" y2="75.16" stroke-width="5.09" />
<line x1="52.33" y1="75.16" x2="52.52" y2="77.04" stroke-width="4.96" />
<line x1="52.52" y1="77.04" x2="52.71" y2="78.93" stroke-width="4.89" />
<line x1="52.71" y1="78.93" x2="52.9" y2="80.82" stroke-width="4.82" />
<line x1="52.9" y1="80.82" x2="53.09" y2="82.71" stroke-width="4.75" />
<line x1="53.09" y1="82.71" x2="53.28" y2="84.6" stroke-width="4.68" />
<line x1="53.28" y1="84.6" x2="53.48" y2="86.49" stroke-width="4.61" />
<line x1="53.48" y1="86.49" x2="53.67" y2="88.37" stroke-width="4.54" />
<line x1="53.67" y1="88.37" x2="53.86" y2="90.26" stroke-width="4.47" />
<line x1="53.86" y1="90.26" x2="54.05" y2="92.15" stroke-width="4.4" />
<line x1="54.05" y1="92.15" x2="54.24" y2="94.04" stroke-width="4.33" />
<line x1="54.24" y1="94.04" x2="54.43" y2="95.93" stroke-width="4.26" />
<line x1="54.43" y1="95.93" x2="54.62" y2="97.82" stroke-width="4.19" />
<line x1="54.62" y1="97.82" x2="54.58" y2="99.65" stroke-width="4.1" />
<line x1="54.58" y1="99.65" x2="54.54" y2="101.48" stroke-width="3.97" />
<line x1="54.54" y1="101.48" x2="54.49" y2="103.3" stroke-width="3.85" />
<line x1="54.49" y1="103.3" x2="54.45" y2="105.13" stroke-width="3.72" />
<line x1="54.45" y1="105.13" x2="54.41" y2="106.96" stroke-width="3.6" />
<line x1="54.41" y1="106.96" x2="54.37" y2="108.79" stroke-width="3.47" />
<line x1="54.37" y1="108.79" x2="54.33" y2="110.62" stroke-width="3.35" />
<line x1="54.33" y1="110.62" x2="54.29" y2="112.45" stroke-width="3.22" />
<line x1="54.29" y1="112.45" x2="54.24" y2="114.28" stroke-width="3.1" />
<line x1="54.24" y1="114.28" x2="54.2" y2="116.11" stroke-width="2.97" />
<line x1="54.2" y1="116.11" x2="55.03" y2="116.53" stroke-width="2.75" />
<line x1="55.03" y1="116.53" x2="55.66" y2="115.9" stroke-width="1.71" />
<line x1="55.66" y1="115.9" x2="55.03" y2="116.53" stroke-width="1.71" />
<line x1="55.03" y1="116.53" x2="54.83" y2="116.11" stroke-width="2.39" />
<line x1="54.83" y1="116.11" x2="55.24" y2="115.49" stroke-width="1.51" />
<line x1="55.24" y1="115.49" x2="55.14" y2="116.53" stroke-width="1.77" />
<line x1="55.14" y1="116.53" x2="55.03" y2="117.57" stroke-width="3.64" />
<line x1="55.03" y1="117.57" x2="54.62" y2="116.74" stroke-width="3.97" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="51.71" y1="128.58" x2="50.77" y2="127.65" stroke-width="9.95" />
<line x1="50.77" y1="127.65" x2="49.84" y2="126.71" stroke-width="8.85" />
<line x1="49.84" y1="126.71" x2="49.84" y2="125.67" stroke-width="7.51" />
<line x1="49.84" y1="125.67" x2="50.46" y2="124.01" stroke-width="5.92" />
<line x1="50.46" y1="124.01" x2="51.08" y2="122.35" stroke-width="4.32" />
<line x1="51.08" y1="122.35" x2="52.12" y2="121.38" stroke-width="3.63" />
<line x1="52.12" y1="121.38" x2="53.16" y2="120.41" stroke-width="3.82" />
<line x1="53.16" y1="120.41" x2="54.2" y2="119.44" stroke-width="4.02" />
<line x1="54.2" y1="119.44" x2="54.62" y2="118.5" stroke-width="4.23" />
<line x1="54.62" y1="118.5" x2="55.03" y2="117.57" stroke-width="4.46" />
<line x1="55.03" y1="117.57" x2="56.07" y2="117.25" stroke-width="4.46" />
<line x1="56.07" y1="117.25" x2="57.11" y2="116.94" stroke-width="4.23" />
<line x1="57.11" y1="116.94" x2="58.73" y2="115.82" stroke-width="4.2" />
<line x1="58.73" y1="115.82" x2="60.36" y2="114.7" stroke-width="4.37" />
<line x1="60.36" y1="114.7" x2="61.98" y2="113.57" stroke-width="4.53" />
<line x1="61.98" y1="113.57" x2="63.6" y2="112.45" stroke-width="4.7" />
<line x1="63.6" y1="112.45" x2="65.22" y2="111.33" stroke-width="4.86" />
<line x1="65.22" y1="111.33" x2="66.57" y2="110.65" stroke-width="5.13" />
<line x1="66.57" y1="110.65" x2="67.92" y2="109.98" stroke-width="5.5" />
<line x1="67.92" y1="109.98" x2="69.28" y2="109.3" stroke-width="5.86" />
<line x1="69.28" y1="109.3" x2="70.63" y2="108.63" stroke-width="6.23" />
<line x1="70.63" y1="108.63" x2="72.19" y2="108.11" stroke-width="6.57" />
<line x1="72.19" y1="108.11" x2="73.75" y2="107.59" stroke-width="6.9" />
<line x1="73.75" y1="107.59" x2="75.45" y2="107.3" stroke-width="7.48" />
<line x1="75.45" y1="107.3" x2="77.15" y2="107.01" stroke-width="8.32" />
<line x1="77.15" y1="107.01" x2="78.86" y2="106.71" stroke-width="9.15" />
<line x1="78.86" y1="106.71" x2="80.56" y2="106.42" stroke-width="9.98" />
<line x1="80.56" y1="106.42" x2="82.27" y2="106.13" stroke-width="10.81" />
<line x1="82.27" y1="106.13" x2="83.83" y2="106.76" stroke-width="11.21" />
<line x1="83.83" y1="106.76" x2="85.39" y2="107.38" stroke-width="11.19" />
<line x1="85.39" y1="107.38" x2="86.74" y2="108.83" stroke-width="10.75" />
<line x1="86.74" y1="108.83" x2="88.09" y2="110.29" stroke-width="9.91" />
<line x1="88.09" y1="110.29" x2="87.83" y2="111.9" stroke-width="9.05" />
<line x1="87.83" y1="111.9" x2="87.57" y2="113.51" stroke-width="8.16" />
<line x1="87.57" y1="113.51" x2="87.31" y2="115.12" stroke-width="7.28" />
<line x1="87.31" y1="115.12" x2="87.05" y2="116.74" stroke-width="6.39" />
<line x1="87.05" y1="116.74" x2="86.08" y2="117.71" stroke-width="6.3" />
<line x1="86.08" y1="117.71" x2="85.11" y2="118.68" stroke-width="7.01" />
<line x1="85.11" y1="118.68" x2="84.14" y2="119.65" stroke-width="7.71" />
<line x1="84.14" y1="119.65" x2="82.53" y2="120.48" stroke-width="8.22" />
<line x1="82.53" y1="120.48" x2="80.92" y2="121.31" stroke-width="8.53" />
<line x1="80.92" y1="121.31" x2="79.31" y2="122.14" stroke-width="8.85" />
<line x1="79.31" y1="122.14" x2="77.7" y2="122.97" stroke-width="9.16" />
<line x1="77.7" y1="122.97" x2="76.03" y2="123.46" stroke-width="9.34" />
<line x1="76.03" y1="123.46" x2="74.37" y2="123.94" stroke-width="9.38" />
<line x1="74.37" y1="123.94" x2="72.71" y2="124.43" stroke-width="9.42" />
<line x1="72.71" y1="124.43" x2="71.04" y2="124.91" stroke-width="9.46" />
<line x1="71.04" y1="124.91" x2="69.38" y2="125.4" stroke-width="9.5" />
<line x1="69.38" y1="125.4" x2="67.72" y2="125.88" stroke-width="9.54" />
<line x1="67.72" y1="125.88" x2="66.01" y2="126.26" stroke-width="9.6" />
<line x1="66.01" y1="126.26" x2="64.31" y2="126.63" stroke-width="9.69" />
<line x1="64.31" y1="126.63" x2="62.6" y2="127" stroke-width="9.77" />
<line x1="62.6" y1="127" x2="60.9" y2="127.38" stroke-width="9.85" />
<line x1="60.9" y1="127.38" x2="59.19" y2="127.75" stroke-width="9.94" />
<line x1="59.19" y1="127.75" x2="57.32" y2="127.99" stroke-width="10" />
<line x1="57.32" y1="127.99" x2="55.45" y2="128.22" stroke-width="10.04" />
<line x1="55.45" y1="128.22" x2="53.58" y2="128.45" stroke-width="10.09" />
<line x1="53.58" y1="128.45" x2="51.71" y2="128.69" stroke-width="10.13" />
<line x1="51.71" y1="128.69" x2="49.84" y2="128.92" stroke-width="10.17" />
<line x1="49.84" y1="128.92" x2="47.97" y2="129.16" stroke-width="10.22" />
<line x1="47.97" y1="129.16" x2="46.1" y2="129.39" stroke-width="10.26" />
<line x1="46.1" y1="129.39" x2="44.22" y2="129.63" stroke-width="10.3" />
<line x1="44.22" y1="129.63" x2="42.46" y2="129.52" stroke-width="10.13" />
<line x1="42.46" y1="129.52" x2="40.69" y2="129.42" stroke-width="9.75" />
<line x1="40.69" y1="129.42" x2="38.82" y2="129" stroke-width="9.15" />
<line x1="38.82" y1="129" x2="36.95" y2="128.58" stroke-width="8.32" />
<line x1="36.95" y1="128.58" x2="35.08" y2="128.17" stroke-width="7.48" />
<line x1="35.08" y1="128.17" x2="33.21" y2="127.75" stroke-width="6.65" />
<line x1="33.21" y1="127.75" x2="31.75" y2="127.13" stroke-width="5.72" />
<line x1="31.75" y1="127.13" x2="30.29" y2="126.51" stroke-width="4.68" />
<line x1="30.29" y1="126.51" x2="28.84" y2="125.88" stroke-width="3.64" />
<line x1="28.84" y1="125.88" x2="27.38" y2="125.26" stroke-width="2.6" />
</g>
</svg>`,

  zaa_emphatic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.2 215.8" width="119.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 51.92 61.02 L 51.85 62.75 L 51.78 64.48 L 51.71 66.22 L 52.12 67.46 L 52.54 68.71 L 52.33 70.06 L 52.12 71.41 L 52.23 73.28 L 52.33 75.16 L 52.52 77.04 L 52.71 78.93 L 52.9 80.82 L 53.09 82.71 L 53.28 84.6 L 53.48 86.49 L 53.67 88.37 L 53.86 90.26 L 54.05 92.15 L 54.24 94.04 L 54.43 95.93 L 54.62 97.82 L 54.58 99.65 L 54.54 101.48 L 54.49 103.3 L 54.45 105.13 L 54.41 106.96 L 54.37 108.79 L 54.33 110.62 L 54.29 112.45 L 54.24 114.28 L 54.2 116.11 L 55.03 116.53 L 55.66 115.9 L 55.03 116.53 L 54.83 116.11 L 55.24 115.49 L 55.14 116.53 L 55.03 117.57 L 54.62 116.74" fill="none" stroke="#fff" stroke-width="10.86" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.86s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 51.71 128.58 L 50.77 127.65 L 49.84 126.71 L 49.84 125.67 L 50.46 124.01 L 51.08 122.35 L 52.12 121.38 L 53.16 120.41 L 54.2 119.44 L 54.62 118.5 L 55.03 117.57 L 56.07 117.25 L 57.11 116.94 L 58.73 115.82 L 60.36 114.7 L 61.98 113.57 L 63.6 112.45 L 65.22 111.33 L 66.57 110.65 L 67.92 109.98 L 69.28 109.3 L 70.63 108.63 L 72.19 108.11 L 73.75 107.59 L 75.45 107.3 L 77.15 107.01 L 78.86 106.71 L 80.56 106.42 L 82.27 106.13 L 83.83 106.76 L 85.39 107.38 L 86.74 108.83 L 88.09 110.29 L 87.83 111.9 L 87.57 113.51 L 87.31 115.12 L 87.05 116.74 L 86.08 117.71 L 85.11 118.68 L 84.14 119.65 L 82.53 120.48 L 80.92 121.31 L 79.31 122.14 L 77.7 122.97 L 76.03 123.46 L 74.37 123.94 L 72.71 124.43 L 71.04 124.91 L 69.38 125.4 L 67.72 125.88 L 66.01 126.26 L 64.31 126.63 L 62.6 127 L 60.9 127.38 L 59.19 127.75 L 57.32 127.99 L 55.45 128.22 L 53.58 128.45 L 51.71 128.69 L 49.84 128.92 L 47.97 129.16 L 46.1 129.39 L 44.22 129.63 L 42.46 129.52 L 40.69 129.42 L 38.82 129 L 36.95 128.58 L 35.08 128.17 L 33.21 127.75 L 31.75 127.13 L 30.29 126.51 L 28.84 125.88 L 27.38 125.26" fill="none" stroke="#fff" stroke-width="15.21" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.45s" begin="0.36s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="51.92" y1="61.02" x2="51.85" y2="62.75" stroke-width="3" />
<line x1="51.85" y1="62.75" x2="51.78" y2="64.48" stroke-width="4.29" />
<line x1="51.78" y1="64.48" x2="51.71" y2="66.22" stroke-width="5.59" />
<line x1="51.71" y1="66.22" x2="52.12" y2="67.46" stroke-width="6.44" />
<line x1="52.12" y1="67.46" x2="52.54" y2="68.71" stroke-width="6.86" />
<line x1="52.54" y1="68.71" x2="52.33" y2="70.06" stroke-width="6.65" />
<line x1="52.33" y1="70.06" x2="52.12" y2="71.41" stroke-width="5.82" />
<line x1="52.12" y1="71.41" x2="52.23" y2="73.28" stroke-width="5.3" />
<line x1="52.23" y1="73.28" x2="52.33" y2="75.16" stroke-width="5.09" />
<line x1="52.33" y1="75.16" x2="52.52" y2="77.04" stroke-width="4.96" />
<line x1="52.52" y1="77.04" x2="52.71" y2="78.93" stroke-width="4.89" />
<line x1="52.71" y1="78.93" x2="52.9" y2="80.82" stroke-width="4.82" />
<line x1="52.9" y1="80.82" x2="53.09" y2="82.71" stroke-width="4.75" />
<line x1="53.09" y1="82.71" x2="53.28" y2="84.6" stroke-width="4.68" />
<line x1="53.28" y1="84.6" x2="53.48" y2="86.49" stroke-width="4.61" />
<line x1="53.48" y1="86.49" x2="53.67" y2="88.37" stroke-width="4.54" />
<line x1="53.67" y1="88.37" x2="53.86" y2="90.26" stroke-width="4.47" />
<line x1="53.86" y1="90.26" x2="54.05" y2="92.15" stroke-width="4.4" />
<line x1="54.05" y1="92.15" x2="54.24" y2="94.04" stroke-width="4.33" />
<line x1="54.24" y1="94.04" x2="54.43" y2="95.93" stroke-width="4.26" />
<line x1="54.43" y1="95.93" x2="54.62" y2="97.82" stroke-width="4.19" />
<line x1="54.62" y1="97.82" x2="54.58" y2="99.65" stroke-width="4.1" />
<line x1="54.58" y1="99.65" x2="54.54" y2="101.48" stroke-width="3.97" />
<line x1="54.54" y1="101.48" x2="54.49" y2="103.3" stroke-width="3.85" />
<line x1="54.49" y1="103.3" x2="54.45" y2="105.13" stroke-width="3.72" />
<line x1="54.45" y1="105.13" x2="54.41" y2="106.96" stroke-width="3.6" />
<line x1="54.41" y1="106.96" x2="54.37" y2="108.79" stroke-width="3.47" />
<line x1="54.37" y1="108.79" x2="54.33" y2="110.62" stroke-width="3.35" />
<line x1="54.33" y1="110.62" x2="54.29" y2="112.45" stroke-width="3.22" />
<line x1="54.29" y1="112.45" x2="54.24" y2="114.28" stroke-width="3.1" />
<line x1="54.24" y1="114.28" x2="54.2" y2="116.11" stroke-width="2.97" />
<line x1="54.2" y1="116.11" x2="55.03" y2="116.53" stroke-width="2.75" />
<line x1="55.03" y1="116.53" x2="55.66" y2="115.9" stroke-width="1.71" />
<line x1="55.66" y1="115.9" x2="55.03" y2="116.53" stroke-width="1.71" />
<line x1="55.03" y1="116.53" x2="54.83" y2="116.11" stroke-width="2.39" />
<line x1="54.83" y1="116.11" x2="55.24" y2="115.49" stroke-width="1.51" />
<line x1="55.24" y1="115.49" x2="55.14" y2="116.53" stroke-width="1.77" />
<line x1="55.14" y1="116.53" x2="55.03" y2="117.57" stroke-width="3.64" />
<line x1="55.03" y1="117.57" x2="54.62" y2="116.74" stroke-width="3.97" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="51.71" y1="128.58" x2="50.77" y2="127.65" stroke-width="9.95" />
<line x1="50.77" y1="127.65" x2="49.84" y2="126.71" stroke-width="8.85" />
<line x1="49.84" y1="126.71" x2="49.84" y2="125.67" stroke-width="7.51" />
<line x1="49.84" y1="125.67" x2="50.46" y2="124.01" stroke-width="5.92" />
<line x1="50.46" y1="124.01" x2="51.08" y2="122.35" stroke-width="4.32" />
<line x1="51.08" y1="122.35" x2="52.12" y2="121.38" stroke-width="3.63" />
<line x1="52.12" y1="121.38" x2="53.16" y2="120.41" stroke-width="3.82" />
<line x1="53.16" y1="120.41" x2="54.2" y2="119.44" stroke-width="4.02" />
<line x1="54.2" y1="119.44" x2="54.62" y2="118.5" stroke-width="4.23" />
<line x1="54.62" y1="118.5" x2="55.03" y2="117.57" stroke-width="4.46" />
<line x1="55.03" y1="117.57" x2="56.07" y2="117.25" stroke-width="4.46" />
<line x1="56.07" y1="117.25" x2="57.11" y2="116.94" stroke-width="4.23" />
<line x1="57.11" y1="116.94" x2="58.73" y2="115.82" stroke-width="4.2" />
<line x1="58.73" y1="115.82" x2="60.36" y2="114.7" stroke-width="4.37" />
<line x1="60.36" y1="114.7" x2="61.98" y2="113.57" stroke-width="4.53" />
<line x1="61.98" y1="113.57" x2="63.6" y2="112.45" stroke-width="4.7" />
<line x1="63.6" y1="112.45" x2="65.22" y2="111.33" stroke-width="4.86" />
<line x1="65.22" y1="111.33" x2="66.57" y2="110.65" stroke-width="5.13" />
<line x1="66.57" y1="110.65" x2="67.92" y2="109.98" stroke-width="5.5" />
<line x1="67.92" y1="109.98" x2="69.28" y2="109.3" stroke-width="5.86" />
<line x1="69.28" y1="109.3" x2="70.63" y2="108.63" stroke-width="6.23" />
<line x1="70.63" y1="108.63" x2="72.19" y2="108.11" stroke-width="6.57" />
<line x1="72.19" y1="108.11" x2="73.75" y2="107.59" stroke-width="6.9" />
<line x1="73.75" y1="107.59" x2="75.45" y2="107.3" stroke-width="7.48" />
<line x1="75.45" y1="107.3" x2="77.15" y2="107.01" stroke-width="8.32" />
<line x1="77.15" y1="107.01" x2="78.86" y2="106.71" stroke-width="9.15" />
<line x1="78.86" y1="106.71" x2="80.56" y2="106.42" stroke-width="9.98" />
<line x1="80.56" y1="106.42" x2="82.27" y2="106.13" stroke-width="10.81" />
<line x1="82.27" y1="106.13" x2="83.83" y2="106.76" stroke-width="11.21" />
<line x1="83.83" y1="106.76" x2="85.39" y2="107.38" stroke-width="11.19" />
<line x1="85.39" y1="107.38" x2="86.74" y2="108.83" stroke-width="10.75" />
<line x1="86.74" y1="108.83" x2="88.09" y2="110.29" stroke-width="9.91" />
<line x1="88.09" y1="110.29" x2="87.83" y2="111.9" stroke-width="9.05" />
<line x1="87.83" y1="111.9" x2="87.57" y2="113.51" stroke-width="8.16" />
<line x1="87.57" y1="113.51" x2="87.31" y2="115.12" stroke-width="7.28" />
<line x1="87.31" y1="115.12" x2="87.05" y2="116.74" stroke-width="6.39" />
<line x1="87.05" y1="116.74" x2="86.08" y2="117.71" stroke-width="6.3" />
<line x1="86.08" y1="117.71" x2="85.11" y2="118.68" stroke-width="7.01" />
<line x1="85.11" y1="118.68" x2="84.14" y2="119.65" stroke-width="7.71" />
<line x1="84.14" y1="119.65" x2="82.53" y2="120.48" stroke-width="8.22" />
<line x1="82.53" y1="120.48" x2="80.92" y2="121.31" stroke-width="8.53" />
<line x1="80.92" y1="121.31" x2="79.31" y2="122.14" stroke-width="8.85" />
<line x1="79.31" y1="122.14" x2="77.7" y2="122.97" stroke-width="9.16" />
<line x1="77.7" y1="122.97" x2="76.03" y2="123.46" stroke-width="9.34" />
<line x1="76.03" y1="123.46" x2="74.37" y2="123.94" stroke-width="9.38" />
<line x1="74.37" y1="123.94" x2="72.71" y2="124.43" stroke-width="9.42" />
<line x1="72.71" y1="124.43" x2="71.04" y2="124.91" stroke-width="9.46" />
<line x1="71.04" y1="124.91" x2="69.38" y2="125.4" stroke-width="9.5" />
<line x1="69.38" y1="125.4" x2="67.72" y2="125.88" stroke-width="9.54" />
	<line x1="67.72" y1="125.88" x2="66.01" y2="126.26" stroke-width="9.6" />
	<line x1="66.01" y1="126.26" x2="64.31" y2="126.63" stroke-width="9.69" />
	<line x1="64.31" y1="126.63" x2="62.6" y2="127" stroke-width="9.77" />
	<line x1="62.6" y1="127" x2="60.9" y2="127.38" stroke-width="9.85" />
	<line x1="60.9" y1="127.38" x2="59.19" y2="127.75" stroke-width="9.94" />
	<line x1="59.19" y1="127.75" x2="57.32" y2="127.99" stroke-width="10" />
	<line x1="57.32" y1="127.99" x2="55.45" y2="128.22" stroke-width="10.04" />
	<line x1="55.45" y1="128.22" x2="53.58" y2="128.45" stroke-width="10.09" />
	<line x1="53.58" y1="128.45" x2="51.71" y2="128.69" stroke-width="10.13" />
	<line x1="51.71" y1="128.69" x2="49.84" y2="128.92" stroke-width="10.17" />
	<line x1="49.84" y1="128.92" x2="47.97" y2="129.16" stroke-width="10.22" />
	<line x1="47.97" y1="129.16" x2="46.1" y2="129.39" stroke-width="10.26" />
	<line x1="46.1" y1="129.39" x2="44.22" y2="129.63" stroke-width="10.3" />
	<line x1="44.22" y1="129.63" x2="42.46" y2="129.52" stroke-width="10.13" />
	<line x1="42.46" y1="129.52" x2="40.69" y2="129.42" stroke-width="9.75" />
	<line x1="40.69" y1="129.42" x2="38.82" y2="129" stroke-width="9.15" />
	<line x1="38.82" y1="129" x2="36.95" y2="128.58" stroke-width="8.32" />
	<line x1="36.95" y1="128.58" x2="35.08" y2="128.17" stroke-width="7.48" />
	<line x1="35.08" y1="128.17" x2="33.21" y2="127.75" stroke-width="6.65" />
	<line x1="33.21" y1="127.75" x2="31.75" y2="127.13" stroke-width="5.72" />
	<line x1="31.75" y1="127.13" x2="30.29" y2="126.51" stroke-width="4.68" />
	<line x1="30.29" y1="126.51" x2="28.84" y2="125.88" stroke-width="3.64" />
	<line x1="28.84" y1="125.88" x2="27.38" y2="125.26" stroke-width="2.6" />
	</g>
	<circle cx="85" cy="45" r="4.5" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.2s" begin="6.0s" fill="freeze" /></circle>
	</svg>`,



  ghayn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 94 215.8" width="94" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 62.21 104.75 L 63.22 103.43 L 64.23 102.11 L 65.24 100.79 L 66.25 99.47 L 65.13 100.71 L 64.01 101.95 L 62.89 103.2 L 61.78 104.44 L 60.66 105.68 L 59.05 106.56 L 57.45 107.44 L 55.84 108.32 L 54.24 109.2 L 52.64 110.08 L 51.03 110.96 L 49.32 111.35 L 47.61 111.74 L 45.91 112.12 L 44.2 112.51 L 43.37 114.27 L 42.54 116.03 L 41.72 117.79 L 40.32 119.03 L 38.92 120.28 L 37.86 121.64 L 36.81 123.01 L 35.75 124.37 L 34.7 125.74 L 33.64 127.11 L 32.79 128.89 L 31.93 130.68 L 31.08 132.46 L 30.23 134.25 L 29.79 136.11 L 29.36 137.98 L 28.92 139.84 L 28.49 141.7 L 28.05 143.57 L 28 145.27 L 27.95 146.98 L 27.9 148.69 L 27.84 150.4 L 27.79 152.1 L 27.74 153.81 L 28.05 155.16 L 28.36 156.5 L 28.67 157.85 L 29.4 159.4 L 30.12 160.95 L 30.85 162.51 L 32.09 163.75 L 33.33 164.99 L 34.57 166.23 L 35.82 167.48 L 37.06 168.72 L 38.53 169.49 L 40.01 170.27 L 41.48 171.05 L 42.96 171.82 L 44.61 172.19 L 46.27 172.55 L 47.93 172.91 L 49.58 173.27 L 51.24 173.63 L 52.89 174 L 54.8 174.03 L 56.7 174.07 L 58.6 174.11 L 60.5 174.15 L 62.4 174.19 L 64.31 174.23 L 66.21 174.27 L 68.11 174.31 L 69.77 174.1 L 71.42 173.89 L 73.08 173.69 L 74.88 173.13 L 76.68 172.57 L 78.48 172.01 L 80.28 171.45 L 82.08 170.89 L 83.88 170.33 L 85.69 169.77 L 87.49 169.21 L 89.29 168.66 L 91.09 168.1" fill="none" stroke="#fff" stroke-width="13.81" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="6.95s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 53.83 92.64 L 52.38 92.02 L 50.93 91.4 L 49.48 90.78 L 47.85 90.54 L 46.22 90.31 L 44.59 90.08 L 42.96 89.84 L 41.59 90.71 L 40.22 91.58 L 38.86 92.45 L 37.49 93.32 L 36.13 94.19 L 35.01 95.62 L 33.89 97.05 L 32.77 98.48 L 31.65 99.9 L 30.54 101.33 L 30.64 102.99 L 30.74 104.65 L 30.85 106.3 L 32.09 107.54 L 33.33 108.4 L 34.57 109.25 L 35.82 110.11 L 37.06 110.96 L 38.92 111.37 L 40.78 111.79 L 42.65 112.2 L 43.58 113.13" fill="none" stroke="#fff" stroke-width="12.69" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.18s" begin="0.66s" fill="freeze" /></path></mask>
<mask id="tk-m2" maskUnits="userSpaceOnUse"><path d="M 37.99 72.14 L 36.44 72.77" fill="none" stroke="#fff" stroke-width="12.65" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.14s" begin="0.97s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="62.21" y1="104.75" x2="63.22" y2="103.43" stroke-width="5.6" />
<line x1="63.22" y1="103.43" x2="64.23" y2="102.11" stroke-width="4.5" />
<line x1="64.23" y1="102.11" x2="65.24" y2="100.79" stroke-width="3.4" />
<line x1="65.24" y1="100.79" x2="66.25" y2="99.47" stroke-width="2.31" />
<line x1="66.25" y1="99.47" x2="65.13" y2="100.71" stroke-width="2.2" />
<line x1="65.13" y1="100.71" x2="64.01" y2="101.95" stroke-width="3.07" />
<line x1="64.01" y1="101.95" x2="62.89" y2="103.2" stroke-width="3.95" />
<line x1="62.89" y1="103.2" x2="61.78" y2="104.44" stroke-width="4.83" />
<line x1="61.78" y1="104.44" x2="60.66" y2="105.68" stroke-width="5.71" />
<line x1="60.66" y1="105.68" x2="59.05" y2="106.56" stroke-width="6.18" />
<line x1="59.05" y1="106.56" x2="57.45" y2="107.44" stroke-width="6.24" />
<line x1="57.45" y1="107.44" x2="55.84" y2="108.32" stroke-width="6.3" />
<line x1="55.84" y1="108.32" x2="54.24" y2="109.2" stroke-width="6.36" />
<line x1="54.24" y1="109.2" x2="52.64" y2="110.08" stroke-width="6.42" />
<line x1="52.64" y1="110.08" x2="51.03" y2="110.96" stroke-width="6.48" />
<line x1="51.03" y1="110.96" x2="49.32" y2="111.35" stroke-width="6.71" />
<line x1="49.32" y1="111.35" x2="47.61" y2="111.74" stroke-width="7.1" />
<line x1="47.61" y1="111.74" x2="45.91" y2="112.12" stroke-width="7.49" />
<line x1="45.91" y1="112.12" x2="44.2" y2="112.51" stroke-width="7.88" />
<line x1="44.2" y1="112.51" x2="43.37" y2="114.27" stroke-width="7.67" />
<line x1="43.37" y1="114.27" x2="42.54" y2="116.03" stroke-width="6.85" />
<line x1="42.54" y1="116.03" x2="41.72" y2="117.79" stroke-width="6.04" />
<line x1="41.72" y1="117.79" x2="40.32" y2="119.03" stroke-width="5.41" />
<line x1="40.32" y1="119.03" x2="38.92" y2="120.28" stroke-width="4.97" />
<line x1="38.92" y1="120.28" x2="37.86" y2="121.64" stroke-width="4.67" />
<line x1="37.86" y1="121.64" x2="36.81" y2="123.01" stroke-width="4.49" />
<line x1="36.81" y1="123.01" x2="35.75" y2="124.37" stroke-width="4.32" />
<line x1="35.75" y1="124.37" x2="34.7" y2="125.74" stroke-width="4.14" />
<line x1="34.7" y1="125.74" x2="33.64" y2="127.11" stroke-width="3.96" />
<line x1="33.64" y1="127.11" x2="32.79" y2="128.89" stroke-width="3.77" />
<line x1="32.79" y1="128.89" x2="31.93" y2="130.68" stroke-width="3.55" />
<line x1="31.93" y1="130.68" x2="31.08" y2="132.46" stroke-width="3.33" />
<line x1="31.08" y1="132.46" x2="30.23" y2="134.25" stroke-width="3.11" />
<line x1="30.23" y1="134.25" x2="29.79" y2="136.11" stroke-width="2.95" />
<line x1="29.79" y1="136.11" x2="29.36" y2="137.98" stroke-width="2.84" />
<line x1="29.36" y1="137.98" x2="28.92" y2="139.84" stroke-width="2.74" />
<line x1="28.92" y1="139.84" x2="28.49" y2="141.7" stroke-width="2.64" />
<line x1="28.49" y1="141.7" x2="28.05" y2="143.57" stroke-width="2.54" />
<line x1="28.05" y1="143.57" x2="28" y2="145.27" stroke-width="2.54" />
<line x1="28" y1="145.27" x2="27.95" y2="146.98" stroke-width="2.64" />
<line x1="27.95" y1="146.98" x2="27.9" y2="148.69" stroke-width="2.74" />
<line x1="27.9" y1="148.69" x2="27.84" y2="150.4" stroke-width="2.85" />
<line x1="27.84" y1="150.4" x2="27.79" y2="152.1" stroke-width="2.95" />
<line x1="27.79" y1="152.1" x2="27.74" y2="153.81" stroke-width="3.05" />
<line x1="27.74" y1="153.81" x2="28.05" y2="155.16" stroke-width="3.31" />
<line x1="28.05" y1="155.16" x2="28.36" y2="156.5" stroke-width="3.73" />
<line x1="28.36" y1="156.5" x2="28.67" y2="157.85" stroke-width="4.14" />
<line x1="28.67" y1="157.85" x2="29.4" y2="159.4" stroke-width="4.64" />
<line x1="29.4" y1="159.4" x2="30.12" y2="160.95" stroke-width="5.23" />
<line x1="30.12" y1="160.95" x2="30.85" y2="162.51" stroke-width="5.81" />
<line x1="30.85" y1="162.51" x2="32.09" y2="163.75" stroke-width="6.35" />
<line x1="32.09" y1="163.75" x2="33.33" y2="164.99" stroke-width="6.83" />
<line x1="33.33" y1="164.99" x2="34.57" y2="166.23" stroke-width="7.32" />
<line x1="34.57" y1="166.23" x2="35.82" y2="167.48" stroke-width="7.8" />
<line x1="35.82" y1="167.48" x2="37.06" y2="168.72" stroke-width="8.28" />
<line x1="37.06" y1="168.72" x2="38.53" y2="169.49" stroke-width="8.66" />
<line x1="38.53" y1="169.49" x2="40.01" y2="170.27" stroke-width="8.92" />
<line x1="40.01" y1="170.27" x2="41.48" y2="171.05" stroke-width="9.18" />
<line x1="41.48" y1="171.05" x2="42.96" y2="171.82" stroke-width="9.44" />
<line x1="42.96" y1="171.82" x2="44.61" y2="172.19" stroke-width="9.59" />
<line x1="44.61" y1="172.19" x2="46.27" y2="172.55" stroke-width="9.64" />
<line x1="46.27" y1="172.55" x2="47.93" y2="172.91" stroke-width="9.68" />
<line x1="47.93" y1="172.91" x2="49.58" y2="173.27" stroke-width="9.72" />
<line x1="49.58" y1="173.27" x2="51.24" y2="173.63" stroke-width="9.77" />
<line x1="51.24" y1="173.63" x2="52.89" y2="174" stroke-width="9.81" />
<line x1="52.89" y1="174" x2="54.8" y2="174.03" stroke-width="9.76" />
<line x1="54.8" y1="174.03" x2="56.7" y2="174.07" stroke-width="9.62" />
<line x1="56.7" y1="174.07" x2="58.6" y2="174.11" stroke-width="9.48" />
<line x1="58.6" y1="174.11" x2="60.5" y2="174.15" stroke-width="9.33" />
<line x1="60.5" y1="174.15" x2="62.4" y2="174.19" stroke-width="9.19" />
<line x1="62.4" y1="174.19" x2="64.31" y2="174.23" stroke-width="9.05" />
<line x1="64.31" y1="174.23" x2="66.21" y2="174.27" stroke-width="8.91" />
<line x1="66.21" y1="174.27" x2="68.11" y2="174.31" stroke-width="8.77" />
<line x1="68.11" y1="174.31" x2="69.77" y2="174.1" stroke-width="8.59" />
<line x1="69.77" y1="174.1" x2="71.42" y2="173.89" stroke-width="8.38" />
<line x1="71.42" y1="173.89" x2="73.08" y2="173.69" stroke-width="8.18" />
<line x1="73.08" y1="173.69" x2="74.88" y2="173.13" stroke-width="7.75" />
<line x1="74.88" y1="173.13" x2="76.68" y2="172.57" stroke-width="7.09" />
<line x1="76.68" y1="172.57" x2="78.48" y2="172.01" stroke-width="6.43" />
<line x1="78.48" y1="172.01" x2="80.28" y2="171.45" stroke-width="5.77" />
<line x1="80.28" y1="171.45" x2="82.08" y2="170.89" stroke-width="5.12" />
<line x1="82.08" y1="170.89" x2="83.88" y2="170.33" stroke-width="4.46" />
<line x1="83.88" y1="170.33" x2="85.69" y2="169.77" stroke-width="3.8" />
<line x1="85.69" y1="169.77" x2="87.49" y2="169.21" stroke-width="3.14" />
<line x1="87.49" y1="169.21" x2="89.29" y2="168.66" stroke-width="2.49" />
<line x1="89.29" y1="168.66" x2="91.09" y2="168.1" stroke-width="1.83" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="53.83" y1="92.64" x2="52.38" y2="92.02" stroke-width="2.19" />
<line x1="52.38" y1="92.02" x2="50.93" y2="91.4" stroke-width="3.05" />
<line x1="50.93" y1="91.4" x2="49.48" y2="90.78" stroke-width="3.92" />
<line x1="49.48" y1="90.78" x2="47.85" y2="90.54" stroke-width="4.79" />
<line x1="47.85" y1="90.54" x2="46.22" y2="90.31" stroke-width="5.68" />
<line x1="46.22" y1="90.31" x2="44.59" y2="90.08" stroke-width="6.57" />
<line x1="44.59" y1="90.08" x2="42.96" y2="89.84" stroke-width="7.46" />
<line x1="42.96" y1="89.84" x2="41.59" y2="90.71" stroke-width="7.64" />
<line x1="41.59" y1="90.71" x2="40.22" y2="91.58" stroke-width="7.11" />
<line x1="40.22" y1="91.58" x2="38.86" y2="92.45" stroke-width="6.59" />
<line x1="38.86" y1="92.45" x2="37.49" y2="93.32" stroke-width="6.06" />
<line x1="37.49" y1="93.32" x2="36.13" y2="94.19" stroke-width="5.53" />
<line x1="36.13" y1="94.19" x2="35.01" y2="95.62" stroke-width="4.98" />
<line x1="35.01" y1="95.62" x2="33.89" y2="97.05" stroke-width="4.4" />
<line x1="33.89" y1="97.05" x2="32.77" y2="98.48" stroke-width="3.82" />
<line x1="32.77" y1="98.48" x2="31.65" y2="99.9" stroke-width="3.25" />
<line x1="31.65" y1="99.9" x2="30.54" y2="101.33" stroke-width="2.67" />
<line x1="30.54" y1="101.33" x2="30.64" y2="102.99" stroke-width="2.81" />
<line x1="30.64" y1="102.99" x2="30.74" y2="104.65" stroke-width="3.67" />
<line x1="30.74" y1="104.65" x2="30.85" y2="106.3" stroke-width="4.54" />
<line x1="30.85" y1="106.3" x2="32.09" y2="107.54" stroke-width="6" />
<line x1="32.09" y1="107.54" x2="33.33" y2="108.4" stroke-width="7.14" />
<line x1="33.33" y1="108.4" x2="34.57" y2="109.25" stroke-width="7.36" />
<line x1="34.57" y1="109.25" x2="35.82" y2="110.11" stroke-width="7.58" />
<line x1="35.82" y1="110.11" x2="37.06" y2="110.96" stroke-width="7.8" />
<line x1="37.06" y1="110.96" x2="38.92" y2="111.37" stroke-width="7.93" />
<line x1="38.92" y1="111.37" x2="40.78" y2="111.79" stroke-width="7.99" />
<line x1="40.78" y1="111.79" x2="42.65" y2="112.2" stroke-width="8.05" />
<line x1="42.65" y1="112.2" x2="43.58" y2="113.13" stroke-width="8.69" />
</g>
<g mask="url(#tk-m2)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="37.99" y1="72.14" x2="36.44" y2="72.77" stroke-width="8.65" />
</g>
</svg>`,

  faa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 138.3 215.8" width="138.3" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 105.5 96.13 L 104.24 97.47 L 102.98 98.8 L 101.73 100.14 L 100.47 100.61 L 99.21 101.08 L 97.95 101.55 L 96.07 101.08 L 94.18 100.61 L 93.36 99.78 L 92.53 98.96 L 92.3 98.02 L 92.53 96.6 L 92.77 95.19 L 93 93.77 L 93.95 92.36 L 94.89 90.94 L 96.62 90.16 L 98.35 89.37 L 100.08 88.59 L 101.49 88.59 L 102.43 89.29 L 103.38 90 L 104.08 91.06 L 104.79 92.12 L 105.11 93.62 L 105.42 95.11 L 105.73 96.6 L 106.83 97.39 L 107.93 98.17 L 109.03 98.96 L 109.51 100.53 L 109.98 102.1 L 110.45 103.67 L 110.29 105.17 L 110.13 106.66 L 109.98 108.15 L 109.03 109.33 L 108.09 110.51 L 107.15 111.69 L 106.21 112.87 L 105.11 113.65 L 104.01 114.44 L 102.91 115.22 L 101.41 116.01 L 99.92 116.8 L 98.43 117.58 L 96.93 118.37 L 95.44 119.15 L 93.95 119.94 L 92.2 120.55 L 90.44 121.15 L 88.69 121.76 L 86.94 122.36 L 85.19 122.97 L 83.44 123.58 L 81.69 124.18 L 79.8 124.57 L 77.92 124.95 L 76.03 125.33 L 74.14 125.72 L 72.26 126.1 L 70.37 126.48 L 68.49 126.86 L 66.6 127.25 L 65 127.39 L 63.39 127.53 L 61.79 127.67 L 60.19 127.81 L 58.59 127.96 L 56.86 127.96 L 55.13 127.96 L 53.4 127.96 L 51.67 127.96 L 49.94 127.96 L 48.21 127.96 L 46.44 127.66 L 44.68 127.37 L 42.91 127.07 L 41.14 126.78 L 39.73 126.25 L 38.31 125.72 L 36.9 125.18 L 35.48 124.65 L 34.24 123.65 L 33.01 122.65 L 31.77 121.65 L 30.53 120.65 L 29.75 119.23 L 28.96 117.82 L 28.17 116.4 L 28.1 115.07 L 28.02 113.73 L 27.94 112.4 L 28.25 110.59 L 28.57 108.78 L 28.88 106.97 L 29.65 105.44 L 30.41 103.91 L 31.18 102.38 L 31.95 100.84" fill="none" stroke="#fff" stroke-width="15.09" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="7.36s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="105.5" y1="96.13" x2="104.24" y2="97.47" stroke-width="9.53" />
<line x1="104.24" y1="97.47" x2="102.98" y2="98.8" stroke-width="9.11" />
<line x1="102.98" y1="98.8" x2="101.73" y2="100.14" stroke-width="8.68" />
<line x1="101.73" y1="100.14" x2="100.47" y2="100.61" stroke-width="8.51" />
<line x1="100.47" y1="100.61" x2="99.21" y2="101.08" stroke-width="8.58" />
<line x1="99.21" y1="101.08" x2="97.95" y2="101.55" stroke-width="8.65" />
<line x1="97.95" y1="101.55" x2="96.07" y2="101.08" stroke-width="8.75" />
<line x1="96.07" y1="101.08" x2="94.18" y2="100.61" stroke-width="8.89" />
<line x1="94.18" y1="100.61" x2="93.36" y2="99.78" stroke-width="8.25" />
<line x1="93.36" y1="99.78" x2="92.53" y2="98.96" stroke-width="6.84" />
<line x1="92.53" y1="98.96" x2="92.3" y2="98.02" stroke-width="5.85" />
<line x1="92.3" y1="98.02" x2="92.53" y2="96.6" stroke-width="5.39" />
<line x1="92.53" y1="96.6" x2="92.77" y2="95.19" stroke-width="5.01" />
<line x1="92.77" y1="95.19" x2="93" y2="93.77" stroke-width="4.63" />
<line x1="93" y1="93.77" x2="93.95" y2="92.36" stroke-width="4.66" />
<line x1="93.95" y1="92.36" x2="94.89" y2="90.94" stroke-width="5.11" />
<line x1="94.89" y1="90.94" x2="96.62" y2="90.16" stroke-width="6.13" />
<line x1="96.62" y1="90.16" x2="98.35" y2="89.37" stroke-width="7.73" />
<line x1="98.35" y1="89.37" x2="100.08" y2="88.59" stroke-width="9.33" />
<line x1="100.08" y1="88.59" x2="101.49" y2="88.59" stroke-width="10.72" />
<line x1="101.49" y1="88.59" x2="102.43" y2="89.29" stroke-width="11.09" />
<line x1="102.43" y1="89.29" x2="103.38" y2="90" stroke-width="10.68" />
<line x1="103.38" y1="90" x2="104.08" y2="91.06" stroke-width="10.38" />
<line x1="104.08" y1="91.06" x2="104.79" y2="92.12" stroke-width="10.18" />
<line x1="104.79" y1="92.12" x2="105.11" y2="93.62" stroke-width="9.84" />
<line x1="105.11" y1="93.62" x2="105.42" y2="95.11" stroke-width="9.34" />
<line x1="105.42" y1="95.11" x2="105.73" y2="96.6" stroke-width="8.85" />
<line x1="105.73" y1="96.6" x2="106.83" y2="97.39" stroke-width="7.95" />
<line x1="106.83" y1="97.39" x2="107.93" y2="98.17" stroke-width="6.66" />
<line x1="107.93" y1="98.17" x2="109.03" y2="98.96" stroke-width="5.36" />
<line x1="109.03" y1="98.96" x2="109.51" y2="100.53" stroke-width="4.4" />
<line x1="109.51" y1="100.53" x2="109.98" y2="102.1" stroke-width="3.77" />
<line x1="109.98" y1="102.1" x2="110.45" y2="103.67" stroke-width="3.14" />
<line x1="110.45" y1="103.67" x2="110.29" y2="105.17" stroke-width="2.99" />
<line x1="110.29" y1="105.17" x2="110.13" y2="106.66" stroke-width="3.3" />
<line x1="110.13" y1="106.66" x2="109.98" y2="108.15" stroke-width="3.61" />
<line x1="109.98" y1="108.15" x2="109.03" y2="109.33" stroke-width="4.11" />
<line x1="109.03" y1="109.33" x2="108.09" y2="110.51" stroke-width="4.78" />
<line x1="108.09" y1="110.51" x2="107.15" y2="111.69" stroke-width="5.46" />
<line x1="107.15" y1="111.69" x2="106.21" y2="112.87" stroke-width="6.14" />
<line x1="106.21" y1="112.87" x2="105.11" y2="113.65" stroke-width="6.7" />
<line x1="105.11" y1="113.65" x2="104.01" y2="114.44" stroke-width="7.14" />
<line x1="104.01" y1="114.44" x2="102.91" y2="115.22" stroke-width="7.58" />
<line x1="102.91" y1="115.22" x2="101.41" y2="116.01" stroke-width="7.92" />
<line x1="101.41" y1="116.01" x2="99.92" y2="116.8" stroke-width="8.14" />
<line x1="99.92" y1="116.8" x2="98.43" y2="117.58" stroke-width="8.36" />
<line x1="98.43" y1="117.58" x2="96.93" y2="118.37" stroke-width="8.58" />
<line x1="96.93" y1="118.37" x2="95.44" y2="119.15" stroke-width="8.81" />
<line x1="95.44" y1="119.15" x2="93.95" y2="119.94" stroke-width="9.03" />
<line x1="93.95" y1="119.94" x2="92.2" y2="120.55" stroke-width="9.16" />
<line x1="92.2" y1="120.55" x2="90.44" y2="121.15" stroke-width="9.2" />
<line x1="90.44" y1="121.15" x2="88.69" y2="121.76" stroke-width="9.24" />
<line x1="88.69" y1="121.76" x2="86.94" y2="122.36" stroke-width="9.29" />
<line x1="86.94" y1="122.36" x2="85.19" y2="122.97" stroke-width="9.33" />
<line x1="85.19" y1="122.97" x2="83.44" y2="123.58" stroke-width="9.37" />
<line x1="83.44" y1="123.58" x2="81.69" y2="124.18" stroke-width="9.41" />
<line x1="81.69" y1="124.18" x2="79.8" y2="124.57" stroke-width="9.43" />
<line x1="79.8" y1="124.57" x2="77.92" y2="124.95" stroke-width="9.43" />
<line x1="77.92" y1="124.95" x2="76.03" y2="125.33" stroke-width="9.43" />
<line x1="76.03" y1="125.33" x2="74.14" y2="125.72" stroke-width="9.43" />
<line x1="74.14" y1="125.72" x2="72.26" y2="126.1" stroke-width="9.43" />
<line x1="72.26" y1="126.1" x2="70.37" y2="126.48" stroke-width="9.43" />
<line x1="70.37" y1="126.48" x2="68.49" y2="126.86" stroke-width="9.43" />
<line x1="68.49" y1="126.86" x2="66.6" y2="127.25" stroke-width="9.43" />
<line x1="66.6" y1="127.25" x2="65" y2="127.39" stroke-width="9.43" />
<line x1="65" y1="127.39" x2="63.39" y2="127.53" stroke-width="9.43" />
<line x1="63.39" y1="127.53" x2="61.79" y2="127.67" stroke-width="9.43" />
<line x1="61.79" y1="127.67" x2="60.19" y2="127.81" stroke-width="9.43" />
<line x1="60.19" y1="127.81" x2="58.59" y2="127.96" stroke-width="9.43" />
<line x1="58.59" y1="127.96" x2="56.86" y2="127.96" stroke-width="9.47" />
<line x1="56.86" y1="127.96" x2="55.13" y2="127.96" stroke-width="9.55" />
<line x1="55.13" y1="127.96" x2="53.4" y2="127.96" stroke-width="9.63" />
<line x1="53.4" y1="127.96" x2="51.67" y2="127.96" stroke-width="9.7" />
<line x1="51.67" y1="127.96" x2="49.94" y2="127.96" stroke-width="9.78" />
<line x1="49.94" y1="127.96" x2="48.21" y2="127.96" stroke-width="9.86" />
<line x1="48.21" y1="127.96" x2="46.44" y2="127.66" stroke-width="9.96" />
<line x1="46.44" y1="127.66" x2="44.68" y2="127.37" stroke-width="10.08" />
<line x1="44.68" y1="127.37" x2="42.91" y2="127.07" stroke-width="10.2" />
<line x1="42.91" y1="127.07" x2="41.14" y2="126.78" stroke-width="10.31" />
<line x1="41.14" y1="126.78" x2="39.73" y2="126.25" stroke-width="10.3" />
<line x1="39.73" y1="126.25" x2="38.31" y2="125.72" stroke-width="10.16" />
<line x1="38.31" y1="125.72" x2="36.9" y2="125.18" stroke-width="10.02" />
<line x1="36.9" y1="125.18" x2="35.48" y2="124.65" stroke-width="9.88" />
<line x1="35.48" y1="124.65" x2="34.24" y2="123.65" stroke-width="9.5" />
<line x1="34.24" y1="123.65" x2="33.01" y2="122.65" stroke-width="8.88" />
<line x1="33.01" y1="122.65" x2="31.77" y2="121.65" stroke-width="8.26" />
<line x1="31.77" y1="121.65" x2="30.53" y2="120.65" stroke-width="7.64" />
<line x1="30.53" y1="120.65" x2="29.75" y2="119.23" stroke-width="6.82" />
<line x1="29.75" y1="119.23" x2="28.96" y2="117.82" stroke-width="5.79" />
<line x1="28.96" y1="117.82" x2="28.17" y2="116.4" stroke-width="4.76" />
<line x1="28.17" y1="116.4" x2="28.1" y2="115.07" stroke-width="4.04" />
<line x1="28.1" y1="115.07" x2="28.02" y2="113.73" stroke-width="3.63" />
<line x1="28.02" y1="113.73" x2="27.94" y2="112.4" stroke-width="3.23" />
<line x1="27.94" y1="112.4" x2="28.25" y2="110.59" stroke-width="2.93" />
<line x1="28.25" y1="110.59" x2="28.57" y2="108.78" stroke-width="2.75" />
<line x1="28.57" y1="108.78" x2="28.88" y2="106.97" stroke-width="2.56" />
<line x1="28.88" y1="106.97" x2="29.65" y2="105.44" stroke-width="2.45" />
<line x1="29.65" y1="105.44" x2="30.41" y2="103.91" stroke-width="2.4" />
<line x1="30.41" y1="103.91" x2="31.18" y2="102.38" stroke-width="2.35" />
<line x1="31.18" y1="102.38" x2="31.95" y2="100.84" stroke-width="2.3" />
</g>
<circle cx="106.91" cy="111.92" r="3.67" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.69s" fill="freeze" /></circle>
<circle cx="31" cy="120.88" r="3.67" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.84s" fill="freeze" /></circle>
<circle cx="83.57" cy="66.19" r="3.67" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.99s" fill="freeze" /></circle>
</svg>`,

  qaaf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108.7 215.8" width="108.7" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 75.52 110.26 L 74.66 111.12 L 73.04 111.66 L 71.42 112.2 L 69.91 112.49 L 68.4 112.77 L 66.89 113.06 L 65.82 112.74 L 64.74 112.41 L 63.77 111.77 L 62.8 111.12 L 62.15 109.4 L 62.44 107.67 L 62.73 105.94 L 63.01 104.22 L 63.98 103.03 L 64.95 101.85 L 66.75 101.2 L 68.55 100.55 L 70.35 99.91 L 72.07 100.77 L 73.04 101.74 L 74.01 102.71 L 74.39 104.6 L 74.77 106.48 L 75.14 108.37 L 75.52 110.26 L 76.81 111.26 L 78.11 112.27 L 79.4 113.28 L 79.94 114.68 L 80.48 116.08 L 80.7 117.59 L 80.91 119.1 L 80.77 120.61 L 80.62 122.12 L 80.48 123.63 L 80.05 124.92 L 79.62 126.22 L 78.61 127.65 L 77.61 129.09 L 76.6 130.53 L 75.43 131.65 L 74.27 132.77 L 73.11 133.89 L 71.94 135.01 L 70.78 136.14 L 69.31 136.96 L 67.84 137.77 L 66.38 138.59 L 64.91 139.41 L 63.44 140.23 L 61.81 140.71 L 60.17 141.18 L 58.53 141.66 L 56.89 142.13 L 55.25 142.61 L 53.31 142.82 L 51.37 143.04 L 49.43 143.25 L 48.06 143.18 L 46.69 143.11 L 45.33 143.04 L 43.96 142.82 L 42.6 142.61 L 41.23 142.39 L 39.83 141.74 L 38.43 141.1 L 37.03 140.45 L 35.62 139.8 L 34.4 138.72 L 33.18 137.65 L 31.96 136.57 L 31.02 134.84 L 30.09 133.12 L 29.16 131.39 L 29.08 129.52 L 29.01 127.65 L 28.94 125.78 L 29.21 124.06 L 29.48 122.33 L 29.75 120.61 L 30.02 118.88 L 30.61 117.43 L 31.2 115.97 L 31.8 114.52 L 32.39 113.06 L 33.25 111.64 L 34.11 110.21 L 34.98 108.79 L 35.84 107.37 L 36.7 105.94" fill="none" stroke="#fff" stroke-width="14.87" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="6.82s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 72.72 75.97 L 72.07 76.83 L 70.45 77.15 L 68.84 77.48 L 67.33 77.59 L 65.82 77.69 L 64.31 77.8 L 62.8 77.91 L 61.93 78.99" fill="none" stroke="#fff" stroke-width="13.58" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.55s" begin="0.8s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="75.52" y1="110.26" x2="74.66" y2="111.12" stroke-width="10.49" />
<line x1="74.66" y1="111.12" x2="73.04" y2="111.66" stroke-width="10.15" />
<line x1="73.04" y1="111.66" x2="71.42" y2="112.2" stroke-width="10.49" />
<line x1="71.42" y1="112.2" x2="69.91" y2="112.49" stroke-width="10.67" />
<line x1="69.91" y1="112.49" x2="68.4" y2="112.77" stroke-width="10.69" />
<line x1="68.4" y1="112.77" x2="66.89" y2="113.06" stroke-width="10.7" />
<line x1="66.89" y1="113.06" x2="65.82" y2="112.74" stroke-width="10.76" />
<line x1="65.82" y1="112.74" x2="64.74" y2="112.41" stroke-width="10.87" />
<line x1="64.74" y1="112.41" x2="63.77" y2="111.77" stroke-width="10.22" />
<line x1="63.77" y1="111.77" x2="62.8" y2="111.12" stroke-width="8.82" />
<line x1="62.8" y1="111.12" x2="62.15" y2="109.4" stroke-width="7.17" />
<line x1="62.15" y1="109.4" x2="62.44" y2="107.67" stroke-width="5.99" />
<line x1="62.44" y1="107.67" x2="62.73" y2="105.94" stroke-width="5.53" />
<line x1="62.73" y1="105.94" x2="63.01" y2="104.22" stroke-width="5.08" />
<line x1="63.01" y1="104.22" x2="63.98" y2="103.03" stroke-width="5.27" />
<line x1="63.98" y1="103.03" x2="64.95" y2="101.85" stroke-width="6.11" />
<line x1="64.95" y1="101.85" x2="66.75" y2="101.2" stroke-width="7.25" />
<line x1="66.75" y1="101.2" x2="68.55" y2="100.55" stroke-width="8.69" />
<line x1="68.55" y1="100.55" x2="70.35" y2="99.91" stroke-width="10.13" />
<line x1="70.35" y1="99.91" x2="72.07" y2="100.77" stroke-width="10.73" />
<line x1="72.07" y1="100.77" x2="73.04" y2="101.74" stroke-width="10.36" />
<line x1="73.04" y1="101.74" x2="74.01" y2="102.71" stroke-width="9.84" />
<line x1="74.01" y1="102.71" x2="74.39" y2="104.6" stroke-width="9.76" />
<line x1="74.39" y1="104.6" x2="74.77" y2="106.48" stroke-width="10.11" />
<line x1="74.77" y1="106.48" x2="75.14" y2="108.37" stroke-width="10.46" />
<line x1="75.14" y1="108.37" x2="75.52" y2="110.26" stroke-width="10.82" />
<line x1="75.52" y1="110.26" x2="76.81" y2="111.26" stroke-width="10.01" />
<line x1="76.81" y1="111.26" x2="78.11" y2="112.27" stroke-width="8.05" />
<line x1="78.11" y1="112.27" x2="79.4" y2="113.28" stroke-width="6.08" />
<line x1="79.4" y1="113.28" x2="79.94" y2="114.68" stroke-width="4.69" />
<line x1="79.94" y1="114.68" x2="80.48" y2="116.08" stroke-width="3.86" />
<line x1="80.48" y1="116.08" x2="80.7" y2="117.59" stroke-width="3.34" />
<line x1="80.7" y1="117.59" x2="80.91" y2="119.1" stroke-width="3.13" />
<line x1="80.91" y1="119.1" x2="80.77" y2="120.61" stroke-width="3.02" />
<line x1="80.77" y1="120.61" x2="80.62" y2="122.12" stroke-width="3.02" />
<line x1="80.62" y1="122.12" x2="80.48" y2="123.63" stroke-width="3.02" />
<line x1="80.48" y1="123.63" x2="80.05" y2="124.92" stroke-width="3.17" />
<line x1="80.05" y1="124.92" x2="79.62" y2="126.22" stroke-width="3.48" />
<line x1="79.62" y1="126.22" x2="78.61" y2="127.65" stroke-width="4.01" />
<line x1="78.61" y1="127.65" x2="77.61" y2="129.09" stroke-width="4.78" />
<line x1="77.61" y1="129.09" x2="76.6" y2="130.53" stroke-width="5.54" />
<line x1="76.6" y1="130.53" x2="75.43" y2="131.65" stroke-width="6.17" />
<line x1="75.43" y1="131.65" x2="74.27" y2="132.77" stroke-width="6.65" />
<line x1="74.27" y1="132.77" x2="73.11" y2="133.89" stroke-width="7.14" />
<line x1="73.11" y1="133.89" x2="71.94" y2="135.01" stroke-width="7.63" />
<line x1="71.94" y1="135.01" x2="70.78" y2="136.14" stroke-width="8.12" />
<line x1="70.78" y1="136.14" x2="69.31" y2="136.96" stroke-width="8.52" />
<line x1="69.31" y1="136.96" x2="67.84" y2="137.77" stroke-width="8.83" />
<line x1="67.84" y1="137.77" x2="66.38" y2="138.59" stroke-width="9.14" />
<line x1="66.38" y1="138.59" x2="64.91" y2="139.41" stroke-width="9.45" />
<line x1="64.91" y1="139.41" x2="63.44" y2="140.23" stroke-width="9.76" />
<line x1="63.44" y1="140.23" x2="61.81" y2="140.71" stroke-width="9.94" />
<line x1="61.81" y1="140.71" x2="60.17" y2="141.18" stroke-width="9.97" />
<line x1="60.17" y1="141.18" x2="58.53" y2="141.66" stroke-width="10.01" />
<line x1="58.53" y1="141.66" x2="56.89" y2="142.13" stroke-width="10.05" />
<line x1="56.89" y1="142.13" x2="55.25" y2="142.61" stroke-width="10.08" />
<line x1="55.25" y1="142.61" x2="53.31" y2="142.82" stroke-width="10.14" />
<line x1="53.31" y1="142.82" x2="51.37" y2="143.04" stroke-width="10.23" />
<line x1="51.37" y1="143.04" x2="49.43" y2="143.25" stroke-width="10.31" />
<line x1="49.43" y1="143.25" x2="48.06" y2="143.18" stroke-width="10.35" />
<line x1="48.06" y1="143.18" x2="46.69" y2="143.11" stroke-width="10.35" />
<line x1="46.69" y1="143.11" x2="45.33" y2="143.04" stroke-width="10.35" />
<line x1="45.33" y1="143.04" x2="43.96" y2="142.82" stroke-width="10.41" />
<line x1="43.96" y1="142.82" x2="42.6" y2="142.61" stroke-width="10.53" />
<line x1="42.6" y1="142.61" x2="41.23" y2="142.39" stroke-width="10.65" />
<line x1="41.23" y1="142.39" x2="39.83" y2="141.74" stroke-width="10.64" />
<line x1="39.83" y1="141.74" x2="38.43" y2="141.1" stroke-width="10.51" />
<line x1="38.43" y1="141.1" x2="37.03" y2="140.45" stroke-width="10.39" />
<line x1="37.03" y1="140.45" x2="35.62" y2="139.8" stroke-width="10.26" />
<line x1="35.62" y1="139.8" x2="34.4" y2="138.72" stroke-width="9.99" />
<line x1="34.4" y1="138.72" x2="33.18" y2="137.65" stroke-width="9.58" />
<line x1="33.18" y1="137.65" x2="31.96" y2="136.57" stroke-width="9.17" />
<line x1="31.96" y1="136.57" x2="31.02" y2="134.84" stroke-width="8.48" />
<line x1="31.02" y1="134.84" x2="30.09" y2="133.12" stroke-width="7.5" />
<line x1="30.09" y1="133.12" x2="29.16" y2="131.39" stroke-width="6.53" />
<line x1="29.16" y1="131.39" x2="29.08" y2="129.52" stroke-width="5.75" />
<line x1="29.08" y1="129.52" x2="29.01" y2="127.65" stroke-width="5.18" />
<line x1="29.01" y1="127.65" x2="28.94" y2="125.78" stroke-width="4.6" />
<line x1="28.94" y1="125.78" x2="29.21" y2="124.06" stroke-width="4.11" />
<line x1="29.21" y1="124.06" x2="29.48" y2="122.33" stroke-width="3.71" />
<line x1="29.48" y1="122.33" x2="29.75" y2="120.61" stroke-width="3.3" />
<line x1="29.75" y1="120.61" x2="30.02" y2="118.88" stroke-width="2.9" />
<line x1="30.02" y1="118.88" x2="30.61" y2="117.43" stroke-width="2.64" />
<line x1="30.61" y1="117.43" x2="31.2" y2="115.97" stroke-width="2.53" />
<line x1="31.2" y1="115.97" x2="31.8" y2="114.52" stroke-width="2.42" />
<line x1="31.8" y1="114.52" x2="32.39" y2="113.06" stroke-width="2.32" />
<line x1="32.39" y1="113.06" x2="33.25" y2="111.64" stroke-width="2.28" />
<line x1="33.25" y1="111.64" x2="34.11" y2="110.21" stroke-width="2.31" />
<line x1="34.11" y1="110.21" x2="34.98" y2="108.79" stroke-width="2.35" />
<line x1="34.98" y1="108.79" x2="35.84" y2="107.37" stroke-width="2.39" />
<line x1="35.84" y1="107.37" x2="36.7" y2="105.94" stroke-width="2.42" />
</g>
<circle cx="32.39" cy="137.21" r="4.02" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.65s" fill="freeze" /></circle>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="72.72" y1="75.97" x2="72.07" y2="76.83" stroke-width="9.58" />
<line x1="72.07" y1="76.83" x2="70.45" y2="77.15" stroke-width="8.27" />
<line x1="70.45" y1="77.15" x2="68.84" y2="77.48" stroke-width="6.01" />
<line x1="68.84" y1="77.48" x2="67.33" y2="77.59" stroke-width="5.39" />
<line x1="67.33" y1="77.59" x2="65.82" y2="77.69" stroke-width="6.41" />
<line x1="65.82" y1="77.69" x2="64.31" y2="77.8" stroke-width="7.44" />
<line x1="64.31" y1="77.8" x2="62.8" y2="77.91" stroke-width="8.46" />
<line x1="62.8" y1="77.91" x2="61.93" y2="78.99" stroke-width="9.28" />
</g>
</svg>`,

  kaaf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105.7 215.8" width="105.7" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 48.71 75.9 L 47.73 77.1 L 46.76 78.29 L 45.78 79.49 L 44.8 80.69 L 43.27 81.89 L 41.75 83.08 L 41.31 84.5 L 40.88 85.91 L 40.88 87 L 40.88 88.09 L 41.75 89.83 L 43.27 90.7 L 44.9 91.03 L 46.54 91.35 L 47.84 92.22 L 48.06 93.2 L 48.28 94.18 L 47.73 96.03 L 47.19 97.88 L 45.56 98.75 L 43.93 99.63 L 42.31 99.67 L 40.7 99.71 L 39.09 99.76 L 37.48 99.8 L 35.87 99.84 L 33.91 99.63 L 31.95 99.41 L 29.99 99.19" fill="none" stroke="#fff" stroke-width="12.82" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="2.18s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 68.31 55 L 68.38 56.74 L 68.45 58.48 L 68.52 60.23 L 69.18 61.42 L 69.83 62.62 L 69.88 64.36 L 69.94 66.1 L 69.99 67.84 L 70.05 69.59 L 70.42 71.49 L 70.8 73.39 L 71.17 75.29 L 71.55 77.18 L 71.93 79.08 L 72.3 80.98 L 72.68 82.88 L 73.05 84.78 L 73.43 86.68 L 73.81 88.58 L 74.18 90.48 L 74.49 92.42 L 74.79 94.36 L 75.1 96.29 L 75.4 98.23 L 75.71 100.17 L 76.01 102.11 L 76.31 104.04 L 76.62 105.98 L 76.92 107.92 L 77.23 109.86 L 77.19 111.6 L 77.16 113.34 L 77.12 115.08 L 77.08 116.82 L 77.05 118.56 L 77.01 120.3 L 75.92 121.47 L 74.83 122.63 L 73.75 123.79 L 72.55 124.55 L 71.35 125.31 L 69.54 125.75 L 67.72 126.18 L 65.91 126.62 L 64.02 126.83 L 62.14 127.05 L 60.25 127.27 L 58.4 127.29 L 56.55 127.31 L 54.7 127.34 L 52.85 127.36 L 51 127.38 L 49.15 127.4 L 47.3 127.42 L 45.45 127.44 L 43.6 127.47 L 41.75 127.49 L 40.01 127.4 L 38.27 127.31 L 36.52 127.23 L 34.78 127.14 L 33.04 127.05 L 31.63 126.73 L 30.21 126.4 L 29.34 125.31 L 28.47 124.22" fill="none" stroke="#fff" stroke-width="13.58" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.32s" begin="0.31s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="48.71" y1="75.9" x2="47.73" y2="77.1" stroke-width="2.33" />
<line x1="47.73" y1="77.1" x2="46.76" y2="78.29" stroke-width="3.13" />
<line x1="46.76" y1="78.29" x2="45.78" y2="79.49" stroke-width="3.94" />
<line x1="45.78" y1="79.49" x2="44.8" y2="80.69" stroke-width="4.75" />
<line x1="44.8" y1="80.69" x2="43.27" y2="81.89" stroke-width="4.7" />
<line x1="43.27" y1="81.89" x2="41.75" y2="83.08" stroke-width="3.79" />
<line x1="41.75" y1="83.08" x2="41.31" y2="84.5" stroke-width="3.44" />
<line x1="41.31" y1="84.5" x2="40.88" y2="85.91" stroke-width="3.66" />
<line x1="40.88" y1="85.91" x2="40.88" y2="87" stroke-width="4.18" />
<line x1="40.88" y1="87" x2="40.88" y2="88.09" stroke-width="5" />
<line x1="40.88" y1="88.09" x2="41.75" y2="89.83" stroke-width="6.8" />
<line x1="41.75" y1="89.83" x2="43.27" y2="90.7" stroke-width="8.54" />
<line x1="43.27" y1="90.7" x2="44.9" y2="91.03" stroke-width="8.82" />
<line x1="44.9" y1="91.03" x2="46.54" y2="91.35" stroke-width="8.7" />
<line x1="46.54" y1="91.35" x2="47.84" y2="92.22" stroke-width="8.63" />
<line x1="47.84" y1="92.22" x2="48.06" y2="93.2" stroke-width="7.96" />
<line x1="48.06" y1="93.2" x2="48.28" y2="94.18" stroke-width="6.64" />
<line x1="48.28" y1="94.18" x2="47.73" y2="96.03" stroke-width="5.36" />
<line x1="47.73" y1="96.03" x2="47.19" y2="97.88" stroke-width="4.13" />
<line x1="47.19" y1="97.88" x2="45.56" y2="98.75" stroke-width="3.81" />
<line x1="45.56" y1="98.75" x2="43.93" y2="99.63" stroke-width="4.41" />
<line x1="43.93" y1="99.63" x2="42.31" y2="99.67" stroke-width="4.63" />
<line x1="42.31" y1="99.67" x2="40.7" y2="99.71" stroke-width="4.48" />
<line x1="40.7" y1="99.71" x2="39.09" y2="99.76" stroke-width="4.32" />
<line x1="39.09" y1="99.76" x2="37.48" y2="99.8" stroke-width="4.16" />
<line x1="37.48" y1="99.8" x2="35.87" y2="99.84" stroke-width="4" />
<line x1="35.87" y1="99.84" x2="33.91" y2="99.63" stroke-width="3.63" />
<line x1="33.91" y1="99.63" x2="31.95" y2="99.41" stroke-width="3.05" />
<line x1="31.95" y1="99.41" x2="29.99" y2="99.19" stroke-width="2.47" />
</g>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="68.31" y1="55" x2="68.38" y2="56.74" stroke-width="3.13" />
<line x1="68.38" y1="56.74" x2="68.45" y2="58.48" stroke-width="4.46" />
<line x1="68.45" y1="58.48" x2="68.52" y2="60.23" stroke-width="5.79" />
<line x1="68.52" y1="60.23" x2="69.18" y2="61.42" stroke-width="6.78" />
<line x1="69.18" y1="61.42" x2="69.83" y2="62.62" stroke-width="7.44" />
<line x1="69.83" y1="62.62" x2="69.88" y2="64.36" stroke-width="7.44" />
<line x1="69.88" y1="64.36" x2="69.94" y2="66.1" stroke-width="6.78" />
<line x1="69.94" y1="66.1" x2="69.99" y2="67.84" stroke-width="6.13" />
<line x1="69.99" y1="67.84" x2="70.05" y2="69.59" stroke-width="5.48" />
<line x1="70.05" y1="69.59" x2="70.42" y2="71.49" stroke-width="5.15" />
<line x1="70.42" y1="71.49" x2="70.8" y2="73.39" stroke-width="5.16" />
<line x1="70.8" y1="73.39" x2="71.17" y2="75.29" stroke-width="5.17" />
<line x1="71.17" y1="75.29" x2="71.55" y2="77.18" stroke-width="5.17" />
<line x1="71.55" y1="77.18" x2="71.93" y2="79.08" stroke-width="5.18" />
<line x1="71.93" y1="79.08" x2="72.3" y2="80.98" stroke-width="5.19" />
<line x1="72.3" y1="80.98" x2="72.68" y2="82.88" stroke-width="5.19" />
<line x1="72.68" y1="82.88" x2="73.05" y2="84.78" stroke-width="5.2" />
<line x1="73.05" y1="84.78" x2="73.43" y2="86.68" stroke-width="5.21" />
<line x1="73.43" y1="86.68" x2="73.81" y2="88.58" stroke-width="5.21" />
<line x1="73.81" y1="88.58" x2="74.18" y2="90.48" stroke-width="5.22" />
<line x1="74.18" y1="90.48" x2="74.49" y2="92.42" stroke-width="5.18" />
<line x1="74.49" y1="92.42" x2="74.79" y2="94.36" stroke-width="5.09" />
<line x1="74.79" y1="94.36" x2="75.1" y2="96.29" stroke-width="5.01" />
<line x1="75.1" y1="96.29" x2="75.4" y2="98.23" stroke-width="4.92" />
<line x1="75.4" y1="98.23" x2="75.71" y2="100.17" stroke-width="4.83" />
<line x1="75.71" y1="100.17" x2="76.01" y2="102.11" stroke-width="4.75" />
<line x1="76.01" y1="102.11" x2="76.31" y2="104.04" stroke-width="4.66" />
<line x1="76.31" y1="104.04" x2="76.62" y2="105.98" stroke-width="4.57" />
<line x1="76.62" y1="105.98" x2="76.92" y2="107.92" stroke-width="4.48" />
<line x1="76.92" y1="107.92" x2="77.23" y2="109.86" stroke-width="4.4" />
<line x1="77.23" y1="109.86" x2="77.19" y2="111.6" stroke-width="4.28" />
<line x1="77.19" y1="111.6" x2="77.16" y2="113.34" stroke-width="4.14" />
<line x1="77.16" y1="113.34" x2="77.12" y2="115.08" stroke-width="3.99" />
<line x1="77.12" y1="115.08" x2="77.08" y2="116.82" stroke-width="3.85" />
<line x1="77.08" y1="116.82" x2="77.05" y2="118.56" stroke-width="3.7" />
<line x1="77.05" y1="118.56" x2="77.01" y2="120.3" stroke-width="3.56" />
<line x1="77.01" y1="120.3" x2="75.92" y2="121.47" stroke-width="4.17" />
<line x1="75.92" y1="121.47" x2="74.83" y2="122.63" stroke-width="5.53" />
<line x1="74.83" y1="122.63" x2="73.75" y2="123.79" stroke-width="6.9" />
<line x1="73.75" y1="123.79" x2="72.55" y2="124.55" stroke-width="7.97" />
<line x1="72.55" y1="124.55" x2="71.35" y2="125.31" stroke-width="8.75" />
<line x1="71.35" y1="125.31" x2="69.54" y2="125.75" stroke-width="9.21" />
<line x1="69.54" y1="125.75" x2="67.72" y2="126.18" stroke-width="9.36" />
<line x1="67.72" y1="126.18" x2="65.91" y2="126.62" stroke-width="9.51" />
<line x1="65.91" y1="126.62" x2="64.02" y2="126.83" stroke-width="9.58" />
<line x1="64.02" y1="126.83" x2="62.14" y2="127.05" stroke-width="9.58" />
<line x1="62.14" y1="127.05" x2="60.25" y2="127.27" stroke-width="9.58" />
<line x1="60.25" y1="127.27" x2="58.4" y2="127.29" stroke-width="9.58" />
<line x1="58.4" y1="127.29" x2="56.55" y2="127.31" stroke-width="9.58" />
<line x1="56.55" y1="127.31" x2="54.7" y2="127.34" stroke-width="9.58" />
<line x1="54.7" y1="127.34" x2="52.85" y2="127.36" stroke-width="9.58" />
<line x1="52.85" y1="127.36" x2="51" y2="127.38" stroke-width="9.58" />
<line x1="51" y1="127.38" x2="49.15" y2="127.4" stroke-width="9.58" />
<line x1="49.15" y1="127.4" x2="47.3" y2="127.42" stroke-width="9.58" />
<line x1="47.3" y1="127.42" x2="45.45" y2="127.44" stroke-width="9.58" />
<line x1="45.45" y1="127.44" x2="43.6" y2="127.47" stroke-width="9.58" />
<line x1="43.6" y1="127.47" x2="41.75" y2="127.49" stroke-width="9.58" />
<line x1="41.75" y1="127.49" x2="40.01" y2="127.4" stroke-width="9.58" />
<line x1="40.01" y1="127.4" x2="38.27" y2="127.31" stroke-width="9.58" />
<line x1="38.27" y1="127.31" x2="36.52" y2="127.23" stroke-width="9.58" />
<line x1="36.52" y1="127.23" x2="34.78" y2="127.14" stroke-width="9.58" />
<line x1="34.78" y1="127.14" x2="33.04" y2="127.05" stroke-width="9.58" />
<line x1="33.04" y1="127.05" x2="31.63" y2="126.73" stroke-width="9.19" />
<line x1="31.63" y1="126.73" x2="30.21" y2="126.4" stroke-width="8.41" />
<line x1="30.21" y1="126.4" x2="29.34" y2="125.31" stroke-width="7.21" />
<line x1="29.34" y1="125.31" x2="28.47" y2="124.22" stroke-width="5.6" />
</g>
<circle cx="43.05" cy="81.99" r="3.04" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.85s" fill="freeze" /></circle>
</svg>`,

  laam: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100.3 215.8" width="100.3" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 67.17 58.16 L 67.2 60.06 L 67.23 61.97 L 67.25 63.87 L 67.28 65.78 L 67.31 67.68 L 67.34 69.59 L 67.37 71.49 L 67.39 73.4 L 67.61 75.3 L 67.82 77.21 L 68.03 79.11 L 68.25 81.02 L 68.46 82.92 L 68.67 84.83 L 68.88 86.73 L 69.1 88.64 L 69.31 90.54 L 69.52 92.45 L 69.74 94.35 L 69.95 96.26 L 70.16 98.16 L 70.37 100.07 L 70.59 101.97 L 70.8 103.88 L 71.01 105.78 L 71.23 107.69 L 71.44 109.59 L 71.65 111.5 L 71.56 113.25 L 71.47 114.99 L 71.38 116.74 L 71.29 118.49 L 71.2 120.24 L 70.42 121.92 L 69.64 123.6 L 68.42 124.68 L 67.21 125.75 L 66 126.83 L 64.79 127.9 L 63.58 128.98 L 62.01 129.6 L 60.45 130.21 L 58.88 130.83 L 57.31 131.45 L 55.52 131.82 L 53.72 132.19 L 51.93 132.57 L 49.99 132.79 L 48.04 133.01 L 46.1 133.24 L 44.53 133.13 L 42.96 133.01 L 41.1 132.64 L 39.23 132.27 L 37.36 131.89 L 36.02 131.22 L 34.67 130.55 L 33.55 129.43 L 32.43 128.31 L 31.31 127.19 L 30.19 126.07 L 29.67 124.57 L 29.14 123.08 L 28.62 121.58 L 28.62 119.94 L 28.62 118.3 L 28.62 116.65 L 28.96 115.08 L 29.29 113.51 L 29.63 111.95 L 29.97 110.38 L 30.64 108.98 L 31.31 107.58 L 31.98 106.17 L 32.65 104.77 L 33.66 103.32 L 34.67 101.86" fill="none" stroke="#fff" stroke-width="15.11" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="6.14s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="67.17" y1="58.16" x2="67.2" y2="60.06" stroke-width="2.36" />
<line x1="67.2" y1="60.06" x2="67.23" y2="61.97" stroke-width="2.75" />
<line x1="67.23" y1="61.97" x2="67.25" y2="63.87" stroke-width="3.14" />
<line x1="67.25" y1="63.87" x2="67.28" y2="65.78" stroke-width="3.54" />
<line x1="67.28" y1="65.78" x2="67.31" y2="67.68" stroke-width="3.93" />
<line x1="67.31" y1="67.68" x2="67.34" y2="69.59" stroke-width="4.32" />
<line x1="67.34" y1="69.59" x2="67.37" y2="71.49" stroke-width="4.71" />
<line x1="67.37" y1="71.49" x2="67.39" y2="73.4" stroke-width="5.11" />
<line x1="67.39" y1="73.4" x2="67.61" y2="75.3" stroke-width="5.29" />
<line x1="67.61" y1="75.3" x2="67.82" y2="77.21" stroke-width="5.27" />
<line x1="67.82" y1="77.21" x2="68.03" y2="79.11" stroke-width="5.26" />
<line x1="68.03" y1="79.11" x2="68.25" y2="81.02" stroke-width="5.24" />
<line x1="68.25" y1="81.02" x2="68.46" y2="82.92" stroke-width="5.22" />
<line x1="68.46" y1="82.92" x2="68.67" y2="84.83" stroke-width="5.2" />
<line x1="68.67" y1="84.83" x2="68.88" y2="86.73" stroke-width="5.18" />
<line x1="68.88" y1="86.73" x2="69.1" y2="88.64" stroke-width="5.16" />
<line x1="69.1" y1="88.64" x2="69.31" y2="90.54" stroke-width="5.14" />
<line x1="69.31" y1="90.54" x2="69.52" y2="92.45" stroke-width="5.13" />
<line x1="69.52" y1="92.45" x2="69.74" y2="94.35" stroke-width="5.11" />
<line x1="69.74" y1="94.35" x2="69.95" y2="96.26" stroke-width="5.09" />
<line x1="69.95" y1="96.26" x2="70.16" y2="98.16" stroke-width="5.07" />
<line x1="70.16" y1="98.16" x2="70.37" y2="100.07" stroke-width="5.05" />
<line x1="70.37" y1="100.07" x2="70.59" y2="101.97" stroke-width="5.03" />
<line x1="70.59" y1="101.97" x2="70.8" y2="103.88" stroke-width="5.01" />
<line x1="70.8" y1="103.88" x2="71.01" y2="105.78" stroke-width="5" />
<line x1="71.01" y1="105.78" x2="71.23" y2="107.69" stroke-width="4.98" />
<line x1="71.23" y1="107.69" x2="71.44" y2="109.59" stroke-width="4.96" />
<line x1="71.44" y1="109.59" x2="71.65" y2="111.5" stroke-width="4.94" />
<line x1="71.65" y1="111.5" x2="71.56" y2="113.25" stroke-width="4.83" />
<line x1="71.56" y1="113.25" x2="71.47" y2="114.99" stroke-width="4.62" />
<line x1="71.47" y1="114.99" x2="71.38" y2="116.74" stroke-width="4.41" />
<line x1="71.38" y1="116.74" x2="71.29" y2="118.49" stroke-width="4.2" />
<line x1="71.29" y1="118.49" x2="71.2" y2="120.24" stroke-width="3.99" />
<line x1="71.2" y1="120.24" x2="70.42" y2="121.92" stroke-width="4.19" />
<line x1="70.42" y1="121.92" x2="69.64" y2="123.6" stroke-width="4.81" />
<line x1="69.64" y1="123.6" x2="68.42" y2="124.68" stroke-width="5.45" />
<line x1="68.42" y1="124.68" x2="67.21" y2="125.75" stroke-width="6.13" />
<line x1="67.21" y1="125.75" x2="66" y2="126.83" stroke-width="6.81" />
<line x1="66" y1="126.83" x2="64.79" y2="127.9" stroke-width="7.49" />
<line x1="64.79" y1="127.9" x2="63.58" y2="128.98" stroke-width="8.17" />
<line x1="63.58" y1="128.98" x2="62.01" y2="129.6" stroke-width="8.58" />
<line x1="62.01" y1="129.6" x2="60.45" y2="130.21" stroke-width="8.75" />
<line x1="60.45" y1="130.21" x2="58.88" y2="130.83" stroke-width="8.91" />
<line x1="58.88" y1="130.83" x2="57.31" y2="131.45" stroke-width="9.07" />
<line x1="57.31" y1="131.45" x2="55.52" y2="131.82" stroke-width="9.19" />
<line x1="55.52" y1="131.82" x2="53.72" y2="132.19" stroke-width="9.28" />
<line x1="53.72" y1="132.19" x2="51.93" y2="132.57" stroke-width="9.37" />
<line x1="51.93" y1="132.57" x2="49.99" y2="132.79" stroke-width="9.56" />
<line x1="49.99" y1="132.79" x2="48.04" y2="133.01" stroke-width="9.86" />
<line x1="48.04" y1="133.01" x2="46.1" y2="133.24" stroke-width="10.16" />
<line x1="46.1" y1="133.24" x2="44.53" y2="133.13" stroke-width="10.36" />
<line x1="44.53" y1="133.13" x2="42.96" y2="133.01" stroke-width="10.45" />
<line x1="42.96" y1="133.01" x2="41.1" y2="132.64" stroke-width="10.62" />
<line x1="41.1" y1="132.64" x2="39.23" y2="132.27" stroke-width="10.87" />
<line x1="39.23" y1="132.27" x2="37.36" y2="131.89" stroke-width="11.11" />
<line x1="37.36" y1="131.89" x2="36.02" y2="131.22" stroke-width="11.08" />
<line x1="36.02" y1="131.22" x2="34.67" y2="130.55" stroke-width="10.75" />
<line x1="34.67" y1="130.55" x2="33.55" y2="129.43" stroke-width="10.19" />
<line x1="33.55" y1="129.43" x2="32.43" y2="128.31" stroke-width="9.38" />
<line x1="32.43" y1="128.31" x2="31.31" y2="127.19" stroke-width="8.57" />
<line x1="31.31" y1="127.19" x2="30.19" y2="126.07" stroke-width="7.76" />
<line x1="30.19" y1="126.07" x2="29.67" y2="124.57" stroke-width="6.95" />
<line x1="29.67" y1="124.57" x2="29.14" y2="123.08" stroke-width="6.14" />
<line x1="29.14" y1="123.08" x2="28.62" y2="121.58" stroke-width="5.34" />
<line x1="28.62" y1="121.58" x2="28.62" y2="119.94" stroke-width="4.78" />
<line x1="28.62" y1="119.94" x2="28.62" y2="118.3" stroke-width="4.48" />
<line x1="28.62" y1="118.3" x2="28.62" y2="116.65" stroke-width="4.18" />
<line x1="28.62" y1="116.65" x2="28.96" y2="115.08" stroke-width="3.93" />
<line x1="28.96" y1="115.08" x2="29.29" y2="113.51" stroke-width="3.71" />
<line x1="29.29" y1="113.51" x2="29.63" y2="111.95" stroke-width="3.49" />
<line x1="29.63" y1="111.95" x2="29.97" y2="110.38" stroke-width="3.28" />
<line x1="29.97" y1="110.38" x2="30.64" y2="108.98" stroke-width="3.12" />
<line x1="30.64" y1="108.98" x2="31.31" y2="107.58" stroke-width="3.03" />
<line x1="31.31" y1="107.58" x2="31.98" y2="106.17" stroke-width="2.94" />
<line x1="31.98" y1="106.17" x2="32.65" y2="104.77" stroke-width="2.84" />
<line x1="32.65" y1="104.77" x2="33.66" y2="103.32" stroke-width="2.64" />
<line x1="33.66" y1="103.32" x2="34.67" y2="101.86" stroke-width="2.32" />
</g>
<circle cx="32.21" cy="128.76" r="3.21" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.6s" fill="freeze" /></circle>
</svg>`,

  miim: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85.2 215.8" width="85.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 34.94 119.96 L 34.13 119.15 L 33.32 118.34 L 33.43 116.37 L 33.55 114.4 L 34.24 112.67 L 34.94 110.93 L 35.75 109.89 L 36.56 108.85 L 38.18 108.21 L 39.8 107.58 L 41.41 106.94 L 43.03 106.31 L 44.31 106.77 L 45.58 107.23 L 46.74 108.16 L 47.89 109.08 L 48.53 110.76 L 49.17 112.44 L 49.8 114.11 L 50.44 115.79 L 49.28 116.95 L 48.12 118.1 L 46.27 118.34 L 44.42 118.57 L 42.57 118.8 L 40.72 119.03 L 38.87 119.26 L 37.02 119.49 L 35.17 119.72 L 34.07 120.94 L 32.97 122.15 L 31.87 123.37 L 30.77 124.58 L 30 125.82 L 29.23 127.05 L 28.46 128.28 L 28.3 129.98 L 28.15 131.68 L 28 133.37 L 28.41 135.22 L 28.82 137.08 L 29.24 138.93 L 29.65 140.78 L 30.07 142.63 L 30.48 144.48 L 30.89 146.33 L 31.31 148.18 L 31.72 150.03 L 32.14 151.88 L 32.55 153.73 L 32.55 155.58 L 32.96 155.58 L 33.38 157.44 L 33.79 159.29 L 34.21 161.14 L 34.62 162.99 L 35.03 164.84 L 35.45 166.69 L 35.86 168.54 L 36.09 170.35 L 36.32 172.17 L 36.56 173.98 L 36.79 175.79 L 37.02 177.6 L 37.25 179.42 L 37.13 180.69 L 37.02 181.96" fill="none" stroke="#fff" stroke-width="18.08" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="5.18s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="34.94" y1="119.96" x2="34.13" y2="119.15" stroke-width="8.11" />
<line x1="34.13" y1="119.15" x2="33.32" y2="118.34" stroke-width="6.53" />
<line x1="33.32" y1="118.34" x2="33.43" y2="116.37" stroke-width="5.45" />
<line x1="33.43" y1="116.37" x2="33.55" y2="114.4" stroke-width="4.85" />
<line x1="33.55" y1="114.4" x2="34.24" y2="112.67" stroke-width="4.67" />
<line x1="34.24" y1="112.67" x2="34.94" y2="110.93" stroke-width="4.92" />
<line x1="34.94" y1="110.93" x2="35.75" y2="109.89" stroke-width="5.42" />
<line x1="35.75" y1="109.89" x2="36.56" y2="108.85" stroke-width="6.17" />
<line x1="36.56" y1="108.85" x2="38.18" y2="108.21" stroke-width="7.27" />
<line x1="38.18" y1="108.21" x2="39.8" y2="107.58" stroke-width="8.73" />
<line x1="39.8" y1="107.58" x2="41.41" y2="106.94" stroke-width="10.18" />
<line x1="41.41" y1="106.94" x2="43.03" y2="106.31" stroke-width="11.64" />
<line x1="43.03" y1="106.31" x2="44.31" y2="106.77" stroke-width="12.38" />
<line x1="44.31" y1="106.77" x2="45.58" y2="107.23" stroke-width="12.42" />
<line x1="45.58" y1="107.23" x2="46.74" y2="108.16" stroke-width="12.42" />
<line x1="46.74" y1="108.16" x2="47.89" y2="109.08" stroke-width="12.29" />
<line x1="47.89" y1="109.08" x2="48.53" y2="110.76" stroke-width="12.5" />
<line x1="48.53" y1="110.76" x2="49.17" y2="112.44" stroke-width="13.03" />
<line x1="49.17" y1="112.44" x2="49.8" y2="114.11" stroke-width="13.56" />
<line x1="49.8" y1="114.11" x2="50.44" y2="115.79" stroke-width="14.08" />
<line x1="50.44" y1="115.79" x2="49.28" y2="116.95" stroke-width="13.07" />
<line x1="49.28" y1="116.95" x2="48.12" y2="118.1" stroke-width="10.53" />
<line x1="48.12" y1="118.1" x2="46.27" y2="118.34" stroke-width="9.18" />
<line x1="46.27" y1="118.34" x2="44.42" y2="118.57" stroke-width="9.04" />
<line x1="44.42" y1="118.57" x2="42.57" y2="118.8" stroke-width="8.9" />
<line x1="42.57" y1="118.8" x2="40.72" y2="119.03" stroke-width="8.75" />
<line x1="40.72" y1="119.03" x2="38.87" y2="119.26" stroke-width="8.61" />
<line x1="38.87" y1="119.26" x2="37.02" y2="119.49" stroke-width="8.47" />
<line x1="37.02" y1="119.49" x2="35.17" y2="119.72" stroke-width="8.32" />
<line x1="35.17" y1="119.72" x2="34.07" y2="120.94" stroke-width="8.01" />
<line x1="34.07" y1="120.94" x2="32.97" y2="122.15" stroke-width="7.53" />
<line x1="32.97" y1="122.15" x2="31.87" y2="123.37" stroke-width="7.04" />
<line x1="31.87" y1="123.37" x2="30.77" y2="124.58" stroke-width="6.56" />
<line x1="30.77" y1="124.58" x2="30" y2="125.82" stroke-width="5.88" />
<line x1="30" y1="125.82" x2="29.23" y2="127.05" stroke-width="5.01" />
<line x1="29.23" y1="127.05" x2="28.46" y2="128.28" stroke-width="4.14" />
<line x1="28.46" y1="128.28" x2="28.3" y2="129.98" stroke-width="3.7" />
<line x1="28.3" y1="129.98" x2="28.15" y2="131.68" stroke-width="3.7" />
<line x1="28.15" y1="131.68" x2="28" y2="133.37" stroke-width="3.7" />
<line x1="28" y="133.37" x2="28.41" y2="135.22" stroke-width="3.71" />
<line x1="28.41" y1="135.22" x2="28.82" y2="137.08" stroke-width="3.74" />
<line x1="28.82" y1="137.08" x2="29.24" y2="138.93" stroke-width="3.76" />
<line x1="29.24" y1="138.93" x2="29.65" y2="140.78" stroke-width="3.79" />
<line x1="29.65" y1="140.78" x2="30.07" y2="142.63" stroke-width="3.81" />
<line x1="30.07" y1="142.63" x2="30.48" y2="144.48" stroke-width="3.84" />
<line x1="30.48" y1="144.48" x2="30.89" y2="146.33" stroke-width="3.86" />
<line x1="30.89" y1="146.33" x2="31.31" y2="148.18" stroke-width="3.88" />
<line x1="31.31" y1="148.18" x2="31.72" y2="150.03" stroke-width="3.91" />
<line x1="31.72" y1="150.03" x2="32.14" y2="151.88" stroke-width="3.93" />
<line x1="32.14" y1="151.88" x2="32.55" y2="153.73" stroke-width="3.96" />
<line x1="32.55" y1="153.73" x2="32.96" y2="155.58" stroke-width="3.98" />
<line x1="32.96" y1="155.58" x2="33.38" y2="157.44" stroke-width="4.01" />
<line x1="33.38" y1="157.44" x2="33.79" y2="159.29" stroke-width="4.03" />
<line x1="33.79" y1="159.29" x2="34.21" y2="161.14" stroke-width="4.05" />
<line x1="34.21" y1="161.14" x2="34.62" y2="162.99" stroke-width="4.08" />
<line x1="34.62" y1="162.99" x2="35.03" y2="164.84" stroke-width="4.1" />
<line x1="35.03" y1="164.84" x2="35.45" y2="166.69" stroke-width="4.13" />
<line x1="35.45" y1="166.69" x2="35.86" y2="168.54" stroke-width="4.15" />
<line x1="35.86" y1="168.54" x2="36.09" y2="170.35" stroke-width="4.09" />
<line x1="36.09" y1="170.35" x2="36.32" y2="172.17" stroke-width="3.93" />
<line x1="36.32" y1="172.17" x2="36.56" y2="173.98" stroke-width="3.78" />
<line x1="36.56" y1="173.98" x2="36.79" y2="175.79" stroke-width="3.62" />
<line x1="36.79" y1="175.79" x2="37.02" y2="177.6" stroke-width="3.47" />
<line x1="37.02" y1="177.6" x2="37.25" y2="179.42" stroke-width="3.32" />
<line x1="37.25" y1="179.42" x2="37.13" y2="180.69" stroke-width="3.1" />
<line x1="37.13" y1="180.69" x2="37.02" y2="181.96" stroke-width="2.83" />
</g>
</svg>`,

  nuun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 97.2 215.8" width="97.2" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 62.92 87 L 62.92 88.59 L 62.92 90.17 L 62.92 91.76 L 62.92 93.34 L 63.72 95.08 L 64.53 96.82 L 65.34 98.56 L 65.9 100.28 L 66.46 102 L 67.02 103.73 L 67.58 105.45 L 67.95 107.17 L 68.32 108.9 L 68.69 110.62 L 69.07 112.34 L 69.13 113.83 L 69.19 115.33 L 69.25 116.82 L 69.07 118.24 L 68.88 119.67 L 68.69 121.1 L 67.89 122.28 L 67.08 123.46 L 66.27 124.64 L 65.06 125.95 L 63.85 127.25 L 62.36 128.37 L 60.87 129.49 L 59.33 130.14 L 57.79 130.79 L 56.26 131.44 L 54.72 132.1 L 52.86 132.36 L 50.99 132.62 L 49.13 132.88 L 47.27 133.14 L 45.4 133.4 L 43.41 133.21 L 41.43 133.03 L 39.44 132.84 L 37.76 132.28 L 36.09 131.72 L 34.78 130.88 L 33.48 130.05 L 32.08 128.74 L 30.68 127.44 L 30.12 126.5 L 29.57 125.57 L 29.13 124.02 L 28.7 122.47 L 28.26 120.92 L 28.4 119.1 L 28.54 117.28 L 28.68 115.46 L 28.82 113.65 L 29.38 111.97 L 29.94 110.29 L 30.78 108.76 L 31.61 107.22 L 32.45 105.68 L 33.29 104.15" fill="none" stroke="#fff" stroke-width="14.45" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="4.77s" begin="0s" fill="freeze" /></path></mask>
<mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 47.27 76.76 L 46.52 77.5" fill="none" stroke="#fff" stroke-width="13.41" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.25s" begin="0.65s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="62.92" y1="87" x2="62.92" y2="88.59" stroke-width="2.88" />
<line x1="62.92" y1="88.59" x2="62.92" y2="90.17" stroke-width="4.17" />
<line x1="62.92" y1="90.17" x2="62.92" y2="91.76" stroke-width="5.46" />
<line x1="62.92" y1="91.76" x2="62.92" y2="93.34" stroke-width="6.74" />
<line x1="62.92" y1="93.34" x2="63.72" y2="95.08" stroke-width="7.26" />
<line x1="63.72" y1="95.08" x2="64.53" y2="96.82" stroke-width="7.02" />
<line x1="64.53" y1="96.82" x2="65.34" y2="98.56" stroke-width="6.77" />
<line x1="65.34" y1="98.56" x2="65.9" y2="100.28" stroke-width="6.47" />
<line x1="65.9" y1="100.28" x2="66.46" y2="102" stroke-width="6.11" />
<line x1="66.46" y1="102" x2="67.02" y2="103.73" stroke-width="5.75" />
<line x1="67.02" y1="103.73" x2="67.58" y2="105.45" stroke-width="5.4" />
<line x1="67.58" y1="105.45" x2="67.95" y2="107.17" stroke-width="5.03" />
<line x1="67.95" y1="107.17" x2="68.32" y2="108.9" stroke-width="4.66" />
<line x1="68.32" y1="108.9" x2="68.69" y2="110.62" stroke-width="4.29" />
<line x1="68.69" y1="110.62" x2="69.07" y2="112.34" stroke-width="3.91" />
<line x1="69.07" y1="112.34" x2="69.13" y2="113.83" stroke-width="3.6" />
<line x1="69.13" y1="113.83" x2="69.19" y2="115.33" stroke-width="3.35" />
<line x1="69.19" y1="115.33" x2="69.25" y2="116.82" stroke-width="3.11" />
<line x1="69.25" y1="116.82" x2="69.07" y2="118.24" stroke-width="2.98" />
<line x1="69.07" y1="118.24" x2="68.88" y2="119.67" stroke-width="2.98" />
<line x1="68.88" y1="119.67" x2="68.69" y2="121.1" stroke-width="2.98" />
<line x1="68.69" y1="121.1" x2="67.89" y2="122.28" stroke-width="3.42" />
<line x1="68.69" y1="121.1" x2="67.08" y2="123.46" stroke-width="4.3" />
<line x1="67.08" y1="123.46" x2="66.27" y2="124.64" stroke-width="5.18" />
<line x1="66.27" y1="124.64" x2="65.06" y2="125.95" stroke-width="5.92" />
<line x1="65.06" y1="125.95" x2="63.85" y2="127.25" stroke-width="6.54" />
<line x1="63.85" y1="127.25" x2="62.36" y2="128.37" stroke-width="7.21" />
<line x1="62.36" y1="128.37" x2="60.87" y2="129.49" stroke-width="7.92" />
<line x1="60.87" y1="129.49" x2="59.33" y2="130.14" stroke-width="8.43" />
<line x1="59.33" y1="130.14" x2="57.79" y2="130.79" stroke-width="8.73" />
<line x1="57.79" y1="130.79" x2="56.26" y2="131.44" stroke-width="9.02" />
<line x1="56.26" y1="131.44" x2="54.72" y2="132.1" stroke-width="9.32" />
<line x1="54.72" y1="132.1" x2="52.86" y2="132.36" stroke-width="9.53" />
<line x1="52.86" y1="132.36" x2="50.99" y2="132.62" stroke-width="9.65" />
<line x1="50.99" y1="132.62" x2="49.13" y2="132.88" stroke-width="9.77" />
<line x1="49.13" y1="132.88" x2="47.27" y2="133.14" stroke-width="9.88" />
<line x1="47.27" y1="133.14" x2="45.4" y2="133.4" stroke-width="10" />
<line x1="45.4" y1="133.4" x2="43.41" y2="133.21" stroke-width="10.12" />
<line x1="43.41" y1="133.21" x2="41.43" y2="133.03" stroke-width="10.25" />
<line x1="41.43" y1="133.03" x2="39.44" y2="132.84" stroke-width="10.37" />
<line x1="39.44" y1="132.84" x2="37.76" y2="132.28" stroke-width="10.44" />
<line x1="37.76" y1="132.28" x2="36.09" y2="131.72" stroke-width="10.45" />
<line x1="36.09" y1="131.72" x2="34.78" y2="130.88" stroke-width="10.18" />
<line x1="34.78" y1="130.88" x2="33.48" y2="130.05" stroke-width="9.61" />
<line x1="33.48" y1="130.05" x2="32.08" y2="128.74" stroke-width="8.86" />
<line x1="32.08" y1="128.74" x2="30.68" y2="127.44" stroke-width="7.92" />
<line x1="30.68" y1="127.44" x2="30.12" y2="126.5" stroke-width="7.08" />
<line x1="30.12" y1="126.5" x2="29.57" y2="125.57" stroke-width="6.33" />
<line x1="29.57" y1="125.57" x2="29.13" y2="124.02" stroke-width="5.65" />
<line x1="29.13" y1="124.02" x2="28.7" y2="122.47" stroke-width="5.03" />
<line x1="28.7" y1="122.47" x2="28.26" y2="120.92" stroke-width="4.41" />
<line x1="28.26" y1="120.92" x2="28.4" y2="119.1" stroke-width="3.93" />
<line x1="28.4" y1="119.1" x2="28.54" y2="117.28" stroke-width="3.6" />
<line x1="28.54" y1="117.28" x2="28.68" y2="115.46" stroke-width="3.26" />
<line x1="28.68" y1="115.46" x2="28.82" y2="113.65" stroke-width="2.93" />
<line x1="28.82" y1="113.65" x2="29.38" y2="111.97" stroke-width="2.69" />
<line x1="29.38" y1="111.97" x2="29.94" y2="110.29" stroke-width="2.55" />
<line x1="29.94" y1="110.29" x2="30.78" y2="108.76" stroke-width="2.42" />
<line x1="30.78" y1="108.76" x2="31.61" y2="107.22" stroke-width="2.28" />
<line x1="31.61" y1="107.22" x2="32.45" y2="105.68" stroke-width="2.15" />
<line x1="32.45" y1="105.68" x2="33.29" y2="104.15" stroke-width="2.02" />
</g>
<circle cx="64.78" cy="126.13" r="3.86" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.5s" fill="freeze" /></circle>
<g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="47.27" y1="76.76" x2="46.52" y2="77.5" stroke-width="9.41" />
</g>
</svg>`,

  haa_soft: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76.9 215.8" width="76.9" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 38.23 103.99 L 38.67 105.06 L 39.11 106.14 L 39.3 107.8 L 40.42 108.23 L 41.55 108.67 L 42.47 109.36 L 43.4 110.04 L 44.33 111.06 L 45.25 112.09 L 46.03 113.21 L 46.81 114.33 L 47.45 115.84 L 48.08 117.36 L 47.92 119.11 L 47.76 120.87 L 47.59 122.62 L 46.91 123.55 L 46.23 124.48 L 45.15 125.36 L 44.08 126.23 L 42.72 127.01 L 41.45 127.45 L 40.18 127.89 L 38.28 128.33 L 36.37 128.77 L 34.88 128.35 L 33.38 127.92 L 31.89 127.5 L 30.91 126.57 L 29.94 125.65 L 29.06 123.99 L 28.86 122.43 L 28.96 120.67 L 29.2 118.82 L 29.45 116.97 L 29.79 115.94 L 30.13 114.92 L 30.76 113.65 L 31.4 112.38 L 32.18 111.31 L 33.01 110.67 L 33.84 110.04 L 35.66 109.29 L 37.48 108.54 L 39.3 107.8" fill="none" stroke="#fff" stroke-width="15.41" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="3.00s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="38.23" y1="103.99" x2="38.67" y2="105.06" stroke-width="8.5" />
<line x1="38.67" y1="105.06" x2="39.11" y2="106.14" stroke-width="10.27" />
<line x1="39.11" y1="106.14" x2="39.3" y2="107.8" stroke-width="11.24" />
<line x1="39.3" y1="107.8" x2="40.42" y2="108.23" stroke-width="11.36" />
<line x1="40.42" y1="108.23" x2="41.55" y2="108.67" stroke-width="11.41" />
<line x1="41.55" y1="108.67" x2="42.47" y2="109.36" stroke-width="11.18" />
<line x1="42.47" y1="109.36" x2="43.4" y2="110.04" stroke-width="10.66" />
<line x1="43.4" y1="110.04" x2="44.33" y2="111.06" stroke-width="10.13" />
<line x1="44.33" y1="111.06" x2="45.25" y2="112.09" stroke-width="9.58" />
<line x1="45.25" y1="112.09" x2="46.03" y2="113.21" stroke-width="8.82" />
<line x1="46.03" y1="113.21" x2="46.81" y2="114.33" stroke-width="7.86" />
<line x1="46.81" y1="114.33" x2="47.45" y2="115.84" stroke-width="6.9" />
<line x1="47.45" y1="115.84" x2="48.08" y2="117.36" stroke-width="5.94" />
<line x1="48.08" y1="117.36" x2="47.92" y2="119.11" stroke-width="5.38" />
<line x1="47.92" y1="119.11" x2="47.76" y2="120.87" stroke-width="5.21" />
<line x1="47.76" y1="120.87" x2="47.59" y2="122.62" stroke-width="5.04" />
<line x1="47.59" y1="122.62" x2="46.91" y2="123.55" stroke-width="5.35" />
<line x1="46.91" y1="123.55" x2="46.23" y2="124.48" stroke-width="6.14" />
<line x1="46.23" y1="124.48" x2="45.15" y2="125.36" stroke-width="6.96" />
<line x1="45.15" y1="125.36" x2="44.08" y2="126.23" stroke-width="7.82" />
<line x1="44.08" y1="126.23" x2="42.72" y2="127.01" stroke-width="8.48" />
<line x1="42.72" y1="127.01" x2="41.45" y2="127.45" stroke-width="8.78" />
<line x1="41.45" y1="127.45" x2="40.18" y2="127.89" stroke-width="8.91" />
<line x1="40.18" y1="127.89" x2="38.28" y2="128.33" stroke-width="9.27" />
<line x1="38.28" y1="128.33" x2="36.37" y2="128.77" stroke-width="9.85" />
<line x1="36.37" y1="128.77" x2="34.88" y2="128.35" stroke-width="10.16" />
<line x1="34.88" y1="128.35" x2="33.38" y2="127.92" stroke-width="10.17" />
<line x1="33.38" y1="127.92" x2="31.89" y2="127.5" stroke-width="10.19" />
<line x1="31.89" y1="127.5" x2="30.91" y2="126.57" stroke-width="9.46" />
<line x1="30.91" y1="126.57" x2="29.94" y2="125.65" stroke-width="7.96" />
<line x1="29.94" y1="125.65" x2="29.06" y2="123.99" stroke-width="6.34" />
<line x1="29.06" y1="123.99" x2="28.86" y2="122.43" stroke-width="5.27" />
<line x1="28.86" y1="122.43" x2="28.96" y2="120.67" stroke-width="4.92" />
<line x1="28.96" y1="120.67" x2="29.2" y2="118.82" stroke-width="4.62" />
<line x1="29.2" y1="118.82" x2="29.45" y2="116.97" stroke-width="4.32" />
<line x1="29.45" y1="116.97" x2="29.79" y2="115.94" stroke-width="4.22" />
<line x1="29.79" y1="115.94" x2="30.13" y2="114.92" stroke-width="4.3" />
<line x1="30.13" y1="114.92" x2="30.76" y2="113.65" stroke-width="4.48" />
<line x1="30.76" y1="113.65" x2="31.4" y2="112.38" stroke-width="4.75" />
<line x1="31.4" y1="112.38" x2="32.18" y2="111.31" stroke-width="5.12" />
<line x1="32.18" y1="111.31" x2="33.01" y2="110.67" stroke-width="5.63" />
<line x1="33.01" y1="110.67" x2="33.84" y2="110.04" stroke-width="6.19" />
<line x1="33.84" y1="110.04" x2="35.66" y2="109.29" stroke-width="7.28" />
<line x1="35.66" y1="109.29" x2="37.48" y2="108.54" stroke-width="8.9" />
<line x1="37.48" y1="108.54" x2="39.3" y2="107.8" stroke-width="10.52" />
</g>
</svg>`,

  waaw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 215.8" width="80" height="215.8">
<defs>
<mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 49.37 120.66 L 48.32 120.94 L 47.27 121.23 L 46 121.23 L 44.74 121.23 L 43.54 121.72 L 42.35 122.21 L 41.22 121.93 L 40.1 121.65 L 38.55 120.66 L 37.99 119.26 L 37.71 118.13 L 37.92 116.52 L 38.13 114.9 L 39.11 113.49 L 40.1 112.09 L 41.5 111.43 L 42.91 110.78 L 44.31 110.12 L 45.16 109.98 L 46.56 110.54 L 47.83 111.67 L 48.39 112.58 L 48.95 113.5 L 49.23 115.04 L 49.44 117.01 L 49.65 118.98 L 49.37 120.8 L 50.08 121.58 L 50.78 122.35 L 50.92 123.05 L 50.92 124.74 L 50.92 126.43 L 50.92 128.11 L 50.57 129.8 L 50.22 131.49 L 49.33 133.17 L 48.44 134.86 L 47.55 136.55 L 46.33 138.09 L 45.11 139.64 L 43.89 141.19 L 42.84 142.27 L 41.78 143.36 L 40.73 144.45 L 39.67 145.54 L 38.6 146.48 L 37.52 147.42 L 36.44 148.35 L 35.22 149.15 L 34.01 149.95 L 32.79 150.74 L 31.17 151.23 L 29.55 151.73 L 27.66 151.73 L 25.76 151.73 L 23.86 151.73 L 21.96 151.73 L 20.35 151.55 L 18.73 151.38 L 17.11 151.2 L 15.5 151.02 L 14.16 150.67 L 12.83 150.32" fill="none" stroke="#fff" stroke-width="14.13" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="4.36s" begin="0s" fill="freeze" /></path></mask>
</defs>
<g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
<line x1="49.37" y1="120.66" x2="48.32" y2="120.94" stroke-width="8.53" />
<line x1="48.32" y1="120.94" x2="47.27" y2="121.23" stroke-width="8.15" />
<line x1="47.27" y1="121.23" x2="46" y2="121.23" stroke-width="7.96" />
<line x1="46" y1="121.23" x2="44.74" y2="121.23" stroke-width="7.95" />
<line x1="44.74" y1="121.23" x2="43.54" y2="121.72" stroke-width="8.23" />
<line x1="43.54" y1="121.72" x2="42.35" y2="122.21" stroke-width="8.82" />
<line x1="42.35" y1="122.21" x2="41.22" y2="121.93" stroke-width="9.22" />
<line x1="41.22" y1="121.93" x2="40.1" y2="121.65" stroke-width="9.43" />
<line x1="40.1" y1="121.65" x2="38.55" y2="120.66" stroke-width="8.28" />
<line x1="38.55" y1="120.66" x2="37.99" y2="119.26" stroke-width="6.33" />
<line x1="37.99" y1="119.26" x2="37.71" y2="118.13" stroke-width="5.18" />
<line x1="37.71" y1="118.13" x2="37.92" y2="116.52" stroke-width="4.53" />
<line x1="37.92" y1="116.52" x2="38.13" y2="114.9" stroke-width="4.13" />
<line x1="38.13" y1="114.9" x2="39.11" y2="113.49" stroke-width="4.43" />
<line x1="39.11" y1="113.49" x2="40.1" y2="112.09" stroke-width="5.41" />
<line x1="40.1" y1="112.09" x2="41.5" y2="111.43" stroke-width="6.44" />
<line x1="41.5" y1="111.43" x2="42.91" y2="110.78" stroke-width="7.52" />
<line x1="42.91" y1="110.78" x2="44.31" y2="110.12" stroke-width="8.59" />
<line x1="44.31" y1="110.12" x2="45.16" y2="109.98" stroke-width="9.62" />
<line x1="45.16" y1="109.98" x2="46.56" y2="110.54" stroke-width="10.13" />
<line x1="46.56" y1="110.54" x2="47.83" y2="111.67" stroke-width="9.65" />
<line x1="47.83" y1="111.67" x2="48.39" y2="112.58" stroke-width="8.9" />
<line x1="48.39" y1="112.58" x2="48.95" y2="113.5" stroke-width="8.4" />
<line x1="48.95" y1="113.5" x2="49.23" y2="115.04" stroke-width="8.09" />
<line x1="49.23" y1="115.04" x2="49.44" y2="117.01" stroke-width="8.12" />
<line x1="49.44" y1="117.01" x2="49.65" y2="118.98" stroke-width="8.3" />
<line x1="49.65" y1="118.98" x2="49.37" y2="120.8" stroke-width="8.54" />
<line x1="49.37" y1="120.8" x2="50.08" y2="121.58" stroke-width="7.92" />
<line x1="50.08" y1="121.58" x2="50.78" y2="122.35" stroke-width="6.39" />
<line x1="50.78" y1="122.35" x2="50.92" y2="123.05" stroke-width="5.34" />
<line x1="50.92" y1="123.05" x2="50.92" y2="124.74" stroke-width="4.73" />
<line x1="50.92" y1="124.74" x2="50.92" y2="126.43" stroke-width="4.08" />
<line x1="50.92" y1="126.43" x2="50.92" y2="128.11" stroke-width="3.42" />
<line x1="50.92" y1="128.11" x2="50.57" y2="129.8" stroke-width="3.05" />
<line x1="50.57" y1="129.8" x2="50.22" y2="131.49" stroke-width="2.97" />
<line x1="50.22" y1="131.49" x2="49.33" y2="133.17" stroke-width="3.15" />
<line x1="49.33" y1="133.17" x2="48.44" y2="134.86" stroke-width="3.59" />
<line x1="48.44" y1="134.86" x2="47.55" y2="136.55" stroke-width="4.04" />
<line x1="47.55" y1="136.55" x2="46.33" y2="138.09" stroke-width="4.48" />
<line x1="46.33" y1="138.09" x2="45.11" y2="139.64" stroke-width="4.91" />
<line x1="45.11" y1="139.64" x2="43.89" y2="141.19" stroke-width="5.35" />
<line x1="43.89" y1="141.19" x2="42.84" y2="142.27" stroke-width="5.7" />
<line x1="42.84" y1="142.27" x2="41.78" y2="143.36" stroke-width="5.97" />
<line x1="41.78" y1="143.36" x2="40.73" y2="144.45" stroke-width="6.24" />
<line x1="40.73" y1="144.45" x2="39.67" y2="145.54" stroke-width="6.51" />
<line x1="39.67" y1="145.54" x2="38.6" y2="146.48" stroke-width="6.73" />
<line x1="38.6" y1="146.48" x2="37.52" y2="147.42" stroke-width="6.9" />
<line x1="37.52" y1="147.42" x2="36.44" y2="148.35" stroke-width="7.07" />
<line x1="36.44" y1="148.35" x2="35.22" y2="149.15" stroke-width="7.18" />
<line x1="35.22" y1="149.15" x2="34.01" y2="149.95" stroke-width="7.23" />
<line x1="34.01" y1="149.95" x2="32.79" y2="150.74" stroke-width="7.28" />
<line x1="32.79" y1="150.74" x2="31.17" y2="151.23" stroke-width="6.89" />
<line x1="31.17" y1="151.23" x2="29.55" y2="151.73" stroke-width="6.04" />
<line x1="29.55" y1="151.73" x2="27.66" y2="151.73" stroke-width="5.41" />
<line x1="27.66" y1="151.73" x2="25.76" y2="151.73" stroke-width="4.99" />
<line x1="25.76" y1="151.73" x2="23.86" y2="151.73" stroke-width="4.57" />
<line x1="23.86" y1="151.73" x2="21.96" y2="151.73" stroke-width="4.15" />
<line x1="21.96" y1="151.73" x2="20.35" y2="151.55" stroke-width="3.76" />
<line x1="20.35" y1="151.55" x2="18.73" y2="151.38" stroke-width="3.41" />
<line x1="18.73" y1="151.38" x2="17.11" y2="151.2" stroke-width="3.06" />
<line x1="17.11" y1="151.2" x2="15.5" y2="151.02" stroke-width="2.71" />
<line x1="15.5" y1="151.02" x2="14.16" y2="150.67" stroke-width="2.32" />
<line x1="14.16" y1="150.67" x2="12.83" y2="150.32" stroke-width="1.9" />
</g>
</svg>`,

  yaa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116.4 215.8" width="116.4" height="215.8"><defs><mask id="tk-m0" maskUnits="userSpaceOnUse"><path d="M 84.39 98.04 L 82.67 98.15 L 80.94 98.27 L 79.39 98.79 L 77.84 99.3 L 76.29 99.82 L 74.74 100.34 L 73.36 101.14 L 71.98 101.95 L 70.6 103.15 L 69.22 104.36 L 67.85 105.56 L 66.47 106.77 L 65.32 108.26 L 64.17 109.76 L 63.4 111.29 L 62.64 112.82 L 61.87 114.35 L 61.76 115.91 L 61.64 117.46 L 61.53 119.01 L 61.41 120.56 L 61.87 121.48 L 62.33 122.4 L 63.25 123.32 L 64.17 124.24 L 65.78 124.92 L 67.39 125.61 L 69.31 125.9 L 71.24 126.19 L 73.16 126.48 L 75.08 126.76 L 77.01 127.05 L 78.93 127.34 L 80.86 127.62 L 82.78 127.91 L 83.93 128.72 L 85.08 129.52 L 84.93 131.13 L 84.77 132.74 L 84.62 134.35 L 83.47 135.49 L 82.32 136.64 L 81.17 137.79 L 79.75 138.67 L 78.32 139.54 L 76.9 140.41 L 75.47 141.28 L 74.05 142.16 L 72.29 142.85 L 70.53 143.54 L 68.77 144.23 L 66.97 144.69 L 65.18 145.15 L 63.39 145.6 L 61.6 146.06 L 59.8 146.52 L 58.15 146.71 L 56.49 146.89 L 54.84 147.08 L 53.19 147.26 L 51.53 147.44 L 49.78 147.35 L 48.04 147.26 L 46.29 147.17 L 44.55 147.08 L 42.8 146.98 L 41.19 146.52 L 39.58 146.06 L 37.97 145.61 L 36.82 144.92 L 35.67 144.23 L 34.53 143.08 L 33.38 141.93 L 32.23 140.78 L 31.08 139.63 L 30.39 138.37 L 29.7 137.1 L 29.32 135.65 L 28.94 134.19 L 28.55 132.74 L 28.67 130.78 L 28.78 128.83 L 28.9 126.88 L 29.01 124.92 L 29.53 123.32 L 30.05 121.71 L 30.56 120.1 L 31.08 118.49 L 32 116.73 L 32.92 114.97 L 33.84 113.21 L 34.99 111.6 L 36.14 109.99 L 37.28 108.38" fill="none" stroke="#fff" stroke-width="14.38" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="7.23s" begin="0s" fill="freeze" /></path></mask><mask id="tk-m1" maskUnits="userSpaceOnUse"><path d="M 60.95 166.75 L 59.8 167.67 L 57.97 168.12 L 56.24 168.24 L 54.52 168.35 L 52.79 168.47 L 51.07 168.58 L 50.15 169.73" fill="none" stroke="#fff" stroke-width="13.33" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0" keyTimes="0;1" calcMode="spline" keySplines="0.33 0 0.15 1" dur="0.55s" begin="0.99s" fill="freeze" /></path></mask></defs><g mask="url(#tk-m0)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round"><path d="M 84.39 98.04 L 82.67 98.15 L 80.94 98.27 L 79.39 98.79 L 77.84 99.3 L 76.29 99.82 L 74.74 100.34 L 73.36 101.14 L 71.98 101.95 L 70.6 103.15 L 69.22 104.36 L 67.85 105.56 L 66.47 106.77 L 65.32 108.26 L 64.17 109.76 L 63.4 111.29 L 62.64 112.82 L 61.87 114.35 L 61.76 115.91 L 61.64 117.46 L 61.53 119.01 L 61.41 120.56 L 61.87 121.48 L 62.33 122.4 L 63.25 123.32 L 64.17 124.24 L 65.78 124.92 L 67.39 125.61 L 69.31 125.9 L 71.24 126.19 L 73.16 126.48 L 75.08 126.76 L 77.01 127.05 L 78.93 127.34 L 80.86 127.62 L 82.78 127.91 L 83.93 128.72 L 85.08 129.52 L 84.93 131.13 L 84.77 132.74 L 84.62 134.35 L 83.47 135.49 L 82.32 136.64 L 81.17 137.79 L 79.75 138.67 L 78.32 139.54 L 76.9 140.41 L 75.47 141.28 L 74.05 142.16 L 72.29 142.85 L 70.53 143.54 L 68.77 144.23 L 66.97 144.69 L 65.18 145.15 L 63.39 145.6 L 61.6 146.06 L 59.8 146.52 L 58.15 146.71 L 56.49 146.89 L 54.84 147.08 L 53.19 147.26 L 51.53 147.44 L 49.78 147.35 L 48.04 147.26 L 46.29 147.17 L 44.55 147.08 L 42.8 146.98 L 41.19 146.52 L 39.58 146.06 L 37.97 145.61 L 36.82 144.92 L 35.67 144.23 L 34.53 143.08 L 33.38 141.93 L 32.23 140.78 L 31.08 139.63 L 30.39 138.37 L 29.7 137.1 L 29.32 135.65 L 28.94 134.19 L 28.55 132.74 L 28.67 130.78 L 28.78 128.83 L 28.9 126.88 L 29.01 124.92 L 29.53 123.32 L 30.05 121.71 L 30.56 120.1 L 31.08 118.49 L 32 116.73 L 32.92 114.97 L 33.84 113.21 L 34.99 111.6 L 36.14 109.99 L 37.28 108.38" stroke-width="7" /></g><circle cx="67.85" cy="105.16" r="3.75" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.68s" fill="freeze" /></circle><circle cx="63.25" cy="123.55" r="3.75" fill="#1a1a1a" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.14s" begin="0.84s" fill="freeze" /></circle><g mask="url(#tk-m1)" fill="none" stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round"><line x1="60.95" y1="166.75" x2="59.8" y2="167.67" stroke-width="9.1" /><line x1="59.8" y1="167.67" x2="57.97" y2="168.12" stroke-width="7.15" /><line x1="57.97" y1="168.12" x2="56.24" y2="168.24" stroke-width="6.23" /><line x1="56.24" y1="168.24" x2="54.52" y2="168.35" stroke-width="7" /><line x1="54.52" y1="168.35" x2="52.79" y2="168.47" stroke-width="7.76" /><line x1="52.79" y1="168.47" x2="51.07" y2="168.58" stroke-width="8.53" /><line x1="51.07" y1="168.58" x2="50.15" y2="169.73" stroke-width="9.33" /></g></svg>`,
};
