/// <reference types="vite/client" />

/**
 * Typed environment variables.
 *
 * `tsconfig.json` sets `"types": ["node"]`, which suppresses Vite's automatic
 * client typings — so the triple-slash reference above is required for
 * `import.meta.env` to exist at all. The interface below then narrows it from
 * a loose index signature to the specific keys this app reads, so a typo like
 * `VITE_AUDIO_CND` fails at compile time instead of silently returning
 * `undefined` at runtime.
 *
 * All keys are optional: Vite only injects variables that are actually
 * defined in the active `.env` file.
 */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_AUDIO_CDN?: string;
  readonly VITE_DEV_UNLOCK_ALL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
