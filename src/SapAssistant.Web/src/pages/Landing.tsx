import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { startSignIn } from "@/lib/api";

export function Landing() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  if (user) {
    return <Navigate to="/contest" replace />;
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">SAP Assistant</h1>
      <p className="mt-3 text-slate-600">
        A friendly companion for your SAP workflows. Sign in to enter the contest
        and chat with the assistant.
      </p>

      <div className="mt-10 space-y-3 max-w-xs mx-auto">
        <button
          onClick={() => startSignIn("/contest")}
          className="w-full bg-[#2F2F2F] text-white py-2.5 rounded hover:bg-black flex items-center justify-center gap-2"
        >
          <MicrosoftMark />
          Sign in with Microsoft
        </button>
        <button
          disabled
          className="w-full bg-slate-100 text-slate-400 py-2.5 rounded cursor-not-allowed"
          title="Coming soon"
        >
          Sign in with GitHub (coming soon)
        </button>
        <button
          disabled
          className="w-full bg-slate-100 text-slate-400 py-2.5 rounded cursor-not-allowed"
          title="Coming soon"
        >
          Sign in with Google (coming soon)
        </button>
      </div>
    </section>
  );
}

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
