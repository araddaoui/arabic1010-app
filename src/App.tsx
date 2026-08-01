import { useEffect, useState, Suspense } from "react";
import { AppProvider, useApp } from "./lib/store";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import Auth from "./pages/Auth";
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

function Shell() {
  const { user } = useApp();
  const [path, navigate] = useHashRoute();
  const [booting, setBooting] = useState(true);

  useEffect(() => { const t = setTimeout(() => setBooting(false), 500); return () => clearTimeout(t); }, []);

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

  if (!user) return <Auth />;

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
      <Suspense fallback={<Spinner label="Loading module…" />}>{page()}</Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
