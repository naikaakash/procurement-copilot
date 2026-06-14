import { useCallback, useEffect, useState } from "react";
import {
  Unauthorized,
  apiDelete,
  apiGet,
  apiUpload,
  type FileInfo,
} from "@/lib/api";
import { FileDropZone } from "@/components/FileDropZone";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function Files() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await apiGet<FileInfo[]>("/api/files");
      setFiles(list);
      return null;
    } catch (err) {
      if (err instanceof Unauthorized) {
        window.location.href = "/signin?returnUrl=/files";
        return null;
      }
      return (err as Error).message;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiGet<FileInfo[]>("/api/files");
        if (cancelled) return;
        setFiles(list);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Unauthorized) {
          window.location.href = "/signin?returnUrl=/files";
          return;
        }
        setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      await apiUpload<FileInfo>("/api/files", file, setProgress);
      const errMsg = await reload();
      if (errMsg) setError(errMsg);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiDelete(`/api/files/${id}`);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Your SAP exports</h2>
        <p className="mt-2 text-slate-600">
          Upload an Excel export from SAP and chat about it. Files are private
          to your account and capped at 10 MB.
        </p>
      </header>

      <FileDropZone onFile={handleUpload} disabled={uploading} />

      {uploading && (
        <div className="mt-4">
          <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${Math.max(5, Math.round(progress * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Uploading… {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-3">Uploaded files</h3>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : files.length === 0 ? (
          <p className="text-slate-500">No files yet. Drop one above to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {files.map(f => (
              <li key={f.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={f.fileName}>
                    {f.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(f.sizeBytes)} ·{" "}
                    {new Date(f.uploadedAtUtc).toLocaleString()}
                  </p>
                </div>
                <a
                  href={`/api/files/${f.id}/download`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Download
                </a>
                <button
                  onClick={() => void handleDelete(f.id)}
                  disabled={busyId === f.id}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  {busyId === f.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
