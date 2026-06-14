import { useEffect, useState, type ReactNode } from "react";
import { apiGet, Unauthorized, type MeResponse } from "./api";
import { AuthCtx } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh is called both on mount (initial /api/me probe) and after
  // sign-in/sign-out (callers can read it from useAuth). Keeping it as a
  // function on the context lets the SPA invalidate the cached "me" without
  // a full reload.
  async function refresh() {
    setLoading(true);
    try {
      const me = await apiGet<MeResponse>("/api/me");
      setUser(me);
    } catch (err) {
      if (!(err instanceof Unauthorized)) {
        console.error("auth refresh failed", err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Inline the initial probe (rather than calling refresh() directly) so
  // we can guard against the React strict-mode double-mount setting state
  // on an unmounted component, and so eslint's set-state-in-effect rule
  // doesn't fire on a synchronous setLoading(true).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGet<MeResponse>("/api/me");
        if (!cancelled) setUser(me);
      } catch (err) {
        if (!(err instanceof Unauthorized)) {
          console.error("auth refresh failed", err);
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthCtx.Provider value={{ user, loading, refresh }}>{children}</AuthCtx.Provider>;
}
