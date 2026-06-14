import { useState } from "react";
import { apiPost, type ContestResponse } from "@/lib/api";

export function Contest() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ContestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiPost<undefined, ContestResponse>("/api/contest");
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-xl mx-auto px-6 py-16 text-center">
      <h2 className="text-3xl font-bold tracking-tight">The Contest</h2>
      <p className="mt-3 text-slate-600">
        One click could change your life. Probably not. But maybe.
      </p>

      <button
        onClick={() => void enter()}
        disabled={busy}
        className="mt-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-lg font-medium px-8 py-4 rounded-xl shadow"
      >
        {busy ? "Submitting…" : "Click to Enter the Contest"}
      </button>

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {result && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setResult(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-2xl">🎉</p>
            <p className="mt-4 text-slate-800">{result.message}</p>
            <p className="mt-2 text-xs text-slate-400">
              Recorded at {new Date(result.recordedAt).toLocaleString()}
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-6 bg-slate-900 text-white px-5 py-2 rounded"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
