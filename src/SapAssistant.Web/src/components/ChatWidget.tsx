import { useState } from "react";
import { apiPost, type ChatRequestBody, type ChatResponseBody } from "@/lib/api";

interface Msg { role: "user" | "assistant"; content: string }

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const resp = await apiPost<ChatRequestBody, ChatResponseBody>("/api/chat", {
        history: msgs.map(m => ({ role: m.role, content: m.content })),
        message: text,
      });
      setMsgs([...next, { role: "assistant", content: resp.reply }]);
    } catch (err) {
      setMsgs([...next, { role: "assistant", content: "Sorry — something went wrong." }]);
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg hover:bg-blue-700 text-2xl"
        aria-label="Open chat"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-[28rem] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <span className="font-medium text-sm">Assistant (stub)</span>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {msgs.length === 0 && (
          <p className="text-slate-400 text-center mt-8">Say hi — I'll improvise a response.</p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] bg-blue-600 text-white rounded-lg px-3 py-2"
                : "mr-auto max-w-[80%] bg-slate-100 text-slate-800 rounded-lg px-3 py-2"
            }
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="text-slate-400 text-xs">…thinking</div>}
      </div>
      <div className="border-t border-slate-200 p-2 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") void send(); }}
          className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
          placeholder="Type a message"
          disabled={busy}
        />
        <button
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          className="bg-blue-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
