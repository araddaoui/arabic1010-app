declare module "opentype.js" {
  interface Path {
    commands: any[];
    toPathData(precision?: number): string;
    getBoundingBox(): { x1: number; y1: number; x2: number; y2: number };
    toDOMElement(): SVGPathElement;
  }
  interface Font {
    getPath(text: string, x: number, y: number, fontSize: number, options?: any): Path;
    charToGlyph(char: string): any;
    numGlyphs: number;
    glyphs: { get(index: number): any };
    unitsPerEm: number;
    ascender: number;
    descender: number;
  }
  function parse(buffer: ArrayBuffer): Font;
  function load(url: string, callback: (err: any, font: Font) => void): void;
  export default { parse, load };
  export { Font, Path };
}
