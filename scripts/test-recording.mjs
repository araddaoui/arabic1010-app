/**
 * Regression test for the microphone fallback in AudioPlayer.
 *
 * Bundles the component in isolation with tiny stubs for React, framer-motion
 * and the audio layer, then drives its Record button through three scenarios:
 *   1. a recognizer that exists but fails at runtime (iOS/Safari, Android Chrome)
 *   2. no recognizer at all
 *   3. a working recognizer
 *
 * The important assertion is case 1: it must capture and acoustically score a
 * clip instead of ending on "Let's try that again".
 */
import path from "node:path";
import { build } from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT = '{"hasSpeech":true,"recognition":{"transcript":"","score":0,"error":"service-not-allowed"}}';
const scenario = JSON.parse(process.env.SCENARIO || process.argv[2] || DEFAULT);

const reactStub = `
  export function createElement(type, props, ...children) {
    return { type, props: { ...(props || {}), children } };
  }
  export function useState(initial) {
    const i = globalThis.__cursor++;
    globalThis.__states[i] = initial;
    return [globalThis.__states[i], (v) => {
      globalThis.__states[i] = typeof v === "function" ? v(globalThis.__states[i]) : v;
    }];
  }
  export function useRef(initial) { return { current: initial }; }
  export function useEffect() { /* no effects in this harness */ }
`;

const audioStub = `
  globalThis.__calls = { recognition: 0, micOpen: 0, recordClip: 0, assessed: 0 };
  const scenario = ${JSON.stringify(scenario)};
  export const audioPath = (f, k) => "/audio/" + f + "/" + k + ".mp3";
  export const unlockAudio = () => {};
  export const play = async () => {};
  export const stopAll = () => {};
  export function listen() {
    globalThis.__calls.recognition++;
    return Promise.resolve(scenario.recognition || { transcript: "", score: 0, error: "service-not-allowed" });
  }
  export const speechSupported = () => !!scenario.hasSpeech;
  export const canRecordAudio = () => scenario.micAvailable !== false;
  export async function openMic() {
    globalThis.__calls.micOpen++;
    return { getTracks: () => [{ stop() {} }] };
  }
  export function createAnalyzer() { return { stop() {} }; }
  export function recordClip() {
    globalThis.__calls.recordClip++;
    return { stop() {}, done: Promise.resolve(new Blob(["audio"], { type: "audio/webm" })) };
  }
  export async function loadReference() { return { duration: 0.8 }; }
  export async function assessAgainstReference() {
    globalThis.__calls.assessed++;
    return { score: 82, method: "reference", qualityOk: true, metrics: {} };
  }
  export async function assessLetter() { return { score: 0, method: "estimate", qualityOk: false }; }
  export const assessDebugEnabled = () => false;
  export const describeRecognitionError = (e) => e ? "Speech recognition is blocked by the browser or network. Please use Chrome on desktop or Android." : "Speech recognition didn't work on this device.";
  export const normalizeArabic = (s) => s;
  export const PASS_SCORE = 70;
  export const scoreBand = () => "good";
  export const bandMessage = () => "Good";
`;

const jsxStub = `
  export const jsx = (type, props) => ({ type, props: { ...(props || {}) } });
  export const jsxs = jsx;
  export const Fragment = "Fragment";
`;

const stubs = {
  react: reactStub,
  "react/jsx-runtime": jsxStub,
  "react/jsx-dev-runtime": jsxStub,
  "framer-motion": "export const motion = new Proxy({}, { get: () => (p) => p });",
  "@/components/ui": "export const Button = (p) => p; export const Card = (p) => p; export const Chip = (p) => p;",
  "@/lib/audio": audioStub,
  "@/lib/contrast": "export const contrastKeys = () => []; export const letterScoringKeys = () => [];",
  "@/utils/cn": "export const cn = (...a) => a.filter(Boolean).join(' ');",
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const plugin = {
  name: "stubs",
  setup(build) {
    for (const [name, contents] of Object.entries(stubs)) {
      build.onResolve({ filter: new RegExp(`^${escape(name)}$`) }, () => ({ path: name, namespace: "stub" }));
      build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({ contents: stubs[args.path], loader: "js" }));
    }
  },
};

const out = await build({
  entryPoints: [path.join(ROOT, "src/components/AudioPlayer.tsx")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  alias: { "@": path.join(ROOT, "src") },
  define: { "import.meta.env": JSON.stringify({ DEV: false, PROD: true, MODE: "production" }) },
  plugins: [plugin],
  logLevel: "error",
});

const mod = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));

globalThis.__states = [];
globalThis.__cursor = 0;
globalThis.window = { setInterval, clearInterval };
const tree = mod.default({ folder: "cognates", fileKey: "sugar", text: "سُكّر", strategy: "recognition" });

const candidates = [];
const visit = (node) => {
  if (!node || typeof node !== "object") return;
  const kids = node.props?.children;
  if (typeof node.props?.onClick === "function") candidates.push({ label: String(kids), onClick: node.props.onClick });
  (Array.isArray(kids) ? kids : kids == null ? [] : [kids]).forEach(visit);
};
visit(tree);
const record = candidates.find((c) => c.label.includes("Record"))?.onClick;
if (!record) throw new Error("Could not find the Record button. Candidates: " + JSON.stringify(candidates.map((c) => c.label)));

await record();

// useState order in AudioPlayer: playing, rate, recording, listening, levels,
// score, heard, notice, quality, metrics, recogInfo, progressIdx.
console.log(JSON.stringify({
  scenario,
  calls: globalThis.__calls,
  score: globalThis.__states[5],
  notice: globalThis.__states[7],
}));
