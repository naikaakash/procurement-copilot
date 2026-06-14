import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { startSignIn } from "@/lib/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  if (!user) {
    startSignIn();
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
