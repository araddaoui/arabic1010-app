import { Component, type ErrorInfo, type ReactNode } from "react";

const DB_KEY = "arabic1010.v1";

type Props = {
  children: ReactNode;
  /** Changing this clears a caught error (used to recover on navigation). */
  resetKey?: string;
  scope?: "app" | "page";
};

type State = { error: Error | null };

/**
 * Catches render-time errors so one broken module cannot blank the whole app
 * (the production bundle is a single inlined HTML file, so without this a
 * single throw leaves the learner on a white screen with no way back).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ui] render error", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reload = () => window.location.reload();

  private clearData = () => {
    const ok = window.confirm(
      "This clears saved progress on this device (streaks, XP, badges) and reloads. Continue?",
    );
    if (!ok) return;
    try {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem("arabic1010.supabase.session");
    } catch {
      /* storage may be unavailable — reloading still helps */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isPage = this.props.scope === "page";
    return (
      <div
        role="alert"
        className={
          isPage
            ? "mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/30 p-6 text-center"
            : "grid min-h-screen place-items-center p-6"
        }
      >
        <div className={isPage ? "" : "w-full max-w-xl rounded-2xl border border-white/10 bg-black/30 p-8 text-center"}>
          <div className="ar-c text-5xl text-gold">ع</div>
          <h1 className="mt-3 text-xl font-extrabold text-sand">
            {isPage ? "This page hit a problem" : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-sand/60">
            Your saved progress is safe. Reload to try again, or clear local data if the problem repeats.
          </p>
          <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-left text-[11px] text-sand/50">
            {this.state.error.message || String(this.state.error)}
          </pre>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={this.reload}
              className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.clearData}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-sand/70 transition hover:bg-white/5"
            >
              Clear local data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
