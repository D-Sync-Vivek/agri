import { FormEvent, useEffect, useRef, useState } from "react";
import { getChatHistory, sendChatMessage } from "../api/chat";
import { ChatMessage } from "../types";

export default function ChatPanel({ deviceId }: { deviceId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getChatHistory(deviceId)
      .then((data) => {
        if (!Array.isArray(data)) {
          console.warn("Chat history is not an array:", data);
          setMessages([]);
          return;
        }
        const valid = data.filter((m) => m && m.role && m.content);
        setMessages(valid);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load chat history"))
      .finally(() => setIsLoading(false));
  }, [deviceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setIsSending(true);
    const optimisticUser: ChatMessage = {
      id: -Date.now(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    try {
      const reply = await sendChatMessage(deviceId, trimmed);
      const assistantMessage: ChatMessage = {
        id: -Date.now() - 1,
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        optimisticUser,
        assistantMessage,
      ]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not get a response");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  const suggestions = ["Should I irrigate today?", "Will it rain soon?", "Is today good for spraying?"];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Ask GridSphere</span>
      </div>
      <div className="p-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {isLoading ? (
          <div className="text-center text-ink-dim py-6">Loading conversation…</div>
        ) : (
          <div className="chat-scroll">
            {messages.length === 0 && (
              <p className="text-ink-dim text-sm text-center py-3">
                Ask anything about this device's current conditions - irrigation, spraying, forecast, whatever's on
                your mind.
              </p>
            )}
            {messages.filter((m) => m && m.role).map((m) => (
              <div key={m.id} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {isSending && <div className="chat-bubble assistant">Thinking…</div>}
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestions.map((s) => (
              <button key={s} className="bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-95 transition" onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <input
            placeholder="Ask a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            maxLength={2000}
            className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
          />
          <button type="submit" disabled={isSending || !input.trim()} className="bg-brand-600 text-white font-bold px-5 py-2.5 rounded-full hover:brightness-105 transition disabled:opacity-60">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}