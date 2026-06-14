import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/useAuth";
import { startSignIn } from "@/lib/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      startSignIn(window.location.pathname + window.location.search);
    }
  }, [loading, user]);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  if (!user) {
    // useEffect above has kicked off the hard navigation to /signin.
    // Render a placeholder; do NOT also <Navigate> — two competing
    // navigations cause the SPA to flash through "/" first.
    return <div className="p-8 text-slate-500">Redirecting to sign in…</div>;
  }
  return <>{children}</>;
}
