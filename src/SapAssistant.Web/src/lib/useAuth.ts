import { createContext, useContext } from "react";
import type { MeResponse } from "./api";

export interface AuthState {
  user: MeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
});

/**
 * Hook for accessing the current auth state anywhere in the tree.
 * Returns { user, loading, refresh }.
 *
 * Co-located with AuthCtx in this `.ts` file (NOT in auth.tsx) because
 * the React Fast Refresh ESLint rule (`react-refresh/only-export-components`)
 * requires `.tsx` files to export only components. AuthProvider lives in
 * auth.tsx; everything else (context, hook, types) lives here.
 */
export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
