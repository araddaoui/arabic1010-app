/**
 * Glyph path provider for HandwritingCanvas.
 *
 * The font-parsing approach (opentype.js → real glyph outline → pen tip
 * traced along the outline) proved unreliable: font-CDN fetches could fail,
 * and glyph outlines are closed contours rather than handwriting strokes, so
 * the traced pen never matched how a letter is actually written.
 *
 * This module now intentionally returns no path. HandwritingCanvas treats a
 * null result as its signal to use the clip-reveal animation, which renders
 * the real letter with the app's own webfont and reveals it directionally
 * (right-to-left, or top-down for ا أ إ آ ل ك). That always shows the correct
 * letter shape and has no network dependency.
 *
 * The async signature is kept so HandwritingCanvas needs no changes.
 */

export type GlyphResult = {
  d: string;
  width: number;
  height: number;
};

/**
 * Always resolves to null, so the canvas uses the clip-reveal animation.
 */
export async function getGlyphPath(_char: string): Promise<GlyphResult | null> {
  return null;
}

/** No-op: no font is fetched or parsed. */
export function preloadFont() {
  /* intentionally empty */
}
