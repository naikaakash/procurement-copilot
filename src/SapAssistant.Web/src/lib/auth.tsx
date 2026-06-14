import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiGet, Unauthorized, type MeResponse } from "./api";

interface AuthState {
  user: MeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const me = await apiGet<MeResponse>("/api/me");
      setUser(me);
    } catch (err) {
      if (err instanceof Unauthorized) {
        setUser(null);
      } else {
        console.error("auth refresh failed", err);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return <AuthCtx.Provider value={{ user, loading, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
