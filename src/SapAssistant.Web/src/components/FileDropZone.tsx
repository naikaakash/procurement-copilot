import { useCallback, useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  acceptDescription?: string;
}

/**
 * Minimal, dependency-free drag-and-drop zone + click-to-browse fallback.
 * Tailwind only; no extra UI library.
 */
export function FileDropZone({ onFile, disabled, acceptDescription }: Props) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file || disabled) return;
      onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onDragEnter={e => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragOver={e => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={e => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={[
        "border-2 border-dashed rounded-2xl px-8 py-12 text-center transition-colors cursor-pointer select-none",
        over ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-slate-400",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <p className="text-slate-700 font-medium">Drop an Excel file here</p>
      <p className="mt-1 text-sm text-slate-500">
        or click to choose ({acceptDescription ?? ".xlsx, up to 10 MB"})
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
