import { useEffect, useState, Suspense } from "react";
import { AppProvider, useApp } from "./lib/store";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { Spinner } from "./components/ui";
import Auth from "./pages/Auth";
import Sample from "./pages/Sample";
import Dashboard from "./pages/Dashboard";
import Cognates from "./pages/Cognates";
import Letters from "./pages/Letters";
import Numbers from "./pages/Numbers";
import Vocabulary from "./pages/Vocabulary";
import Typing from "./pages/Typing";
import Conversation from "./pages/Conversation";
import { Module6Map as MapModule } from "./pages/Module6Map";
import Badges from "./pages/Badges";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

function useHashRoute(): [string, (p: string) => void] {
  const [path, setPath] = useState(() => window.location.hash.replace(/^#/, "") || "/");
  useEffect(() => {
    const onHash = () => setPath(window.location.hash.replace(/^#/, "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (p: string) => {
    window.location.hash = p;
    setPath(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return [path, navigate];
}

/**
 * Dev-only crash trigger for exercising the error boundaries. It is statically
 * removed from production builds (`import.meta.env.DEV` is false there).
 *   ?boom=1    → page boundary
 *   ?boom=app  → app boundary
 */
function devCrash(scope: "page" | "app") {
  if (!import.meta.env.DEV) return;
  const mode = new URLSearchParams(window.location.search).get("boom");
  if (mode === scope || (scope === "page" && mode === "1")) {
    throw new Error(
      `Dev-only boundary test (${scope}). Remove ?boom=${mode} from the URL to recover.`,
    );
  }
}

function DevCrash({ scope }: { scope: "page" | "app" }) {
  devCrash(scope);
  return null;
}

function Shell() {
  const { user } = useApp();
  const [path, navigate] = useHashRoute();
  const [booting, setBooting] = useState(true);

  useEffect(() => { const t = setTimeout(() => setBooting(false), 500); return () => clearTimeout(t); }, []);

  devCrash("app");

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="ar-c text-6xl text-gold">ع</div>
          <div className="mt-2 text-sm tracking-[0.35em] text-sand/50">ARABIC1010</div>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!user) {
    if (path === "/sample") return <Sample navigate={navigate} />;
    return <Auth navigate={navigate} initialMode={path === "/signup" ? "up" : "in"} />;
  }

  const page = () => {
    switch (path) {
      case "/cognates": return <Cognates />;
      case "/letters": return <Letters />;
      case "/numbers": return <Numbers />;
      case "/vocab": return <Vocabulary />;
      case "/typing": return <Typing />;
      case "/dialogue": return <Conversation />;
      case "/map": return <MapModule />;
      case "/badges": return <Badges />;
      case "/review": return <Review navigate={navigate} />;
      case "/settings": return <Settings />;
      case "/admin": return <Admin />;
      default: return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <Layout path={path} navigate={navigate}>
      <ErrorBoundary scope="page" resetKey={path}>
        <DevCrash scope="page" />
        <Suspense fallback={<Spinner label="Loading module…" />}>{page()}</Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary scope="app">
      <AppProvider>
        <Shell />
      </AppProvider>
    </ErrorBoundary>
  );
}
