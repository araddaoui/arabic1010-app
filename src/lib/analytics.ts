declare global {
  interface Window {
    clarity?: (command: string, ...args: unknown[]) => void;
  }
}

export function track(event: string) {
  try {
    window.clarity?.("event", event);
  } catch {
    // analytics unavailable — never block the UI
  }
}
