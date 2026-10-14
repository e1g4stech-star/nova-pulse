"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface AIChat {
  id: string;
  title: string;
  model: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export default function AIChatPage() {
  const [chats, setChats] = useState<AIChat[]>([]);
  const [activeChat, setActiveChat] = useState<AIChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load list chat
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-chat", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load chat list");
      const data = await res.json();
      setChats(data.data || []);
    } catch (err) {
      console.error("Load chats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages dari chat aktif
  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/ai-chat/${chatId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load messages");
      const data = await res.json();
      setMessages(data.data?.messages || []);
    } catch (err) {
      console.error("Load messages error:", err);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat, fetchMessages]);

  // Buat chat baru
  async function handleNewChat() {
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat Baru" }),
      });
      if (!res.ok) throw new Error("Gagal buat chat");
      const data = await res.json();
      setChats([data.data, ...chats]);
      setActiveChat(data.data);
      setMessages([]);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Kirim pesan — DENGAN ERROR HANDLER
  async function handleSend() {
    if (!input.trim() || !activeChat || sending) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Optimistic UI — tampil user message dulu
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await fetch(`/api/ai-chat/${activeChat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      // ⭐ HANDLE NON-JSON RESPONSE (504/503/500)
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[AI Chat] API error ${res.status}:`, errText.substring(0, 300));

        // Status-specific error messages
        if (res.status === 504) {
          throw new Error(
            "⏱️ Server timeout — Google AI sedang overload. Mohon tunggu 2-3 menit lalu coba lagi."
          );
        }
        if (res.status === 503) {
          throw new Error(
            "🚦 Server AI sedang ramai. Mohon tunggu 1-2 menit lalu coba lagi."
          );
        }
        if (res.status === 429) {
          throw new Error(
            "⏸️ Terlalu banyak request. Mohon tunggu 1 menit lalu coba lagi."
          );
        }
        if (res.status === 401) {
          throw new Error("🔐 Session expired. Silakan login ulang.");
        }
        if (res.status >= 500) {
          throw new Error(
            "🚨 Server error. Tim kami sedang memperbaiki. Coba lagi sebentar."
          );
        }

        throw new Error(`Error ${res.status}: ${errText.substring(0, 100)}`);
      }

      // ⭐ SAFE JSON PARSE
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          "Server mengirim response tidak valid. Coba lagi."
        );
      }

      const data = await res.json();

      // Hapus temp user message, ganti dengan yang dari server
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        const serverMsgs = data.data?.messages || [];
        return serverMsgs.length > 0 ? serverMsgs : [...filtered, tempUserMsg];
      });

      // Refresh chat list untuk update title/timestamp
      fetchChats();
    } catch (err: any) {
      console.error("Send message error:", err);

      // Set error message
      setError(err.message || "Gagal mengirim pesan. Coba lagi.");

      // Hapus temp user message kalau gagal (opsional — biarkan supaya user tahu)
      // setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  // Enter untuk kirim (Shift+Enter untuk new line)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen flex"
        style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}
      >
        {/* Sidebar — Chat List */}
        <aside
          className="w-72 border-r flex flex-col hidden md:flex"
          style={{ borderColor: "var(--theme-border)", background: "var(--theme-bg-secondary)" }}
        >
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full py-3 rounded-xl font-bold text-sm transition hover:scale-[1.02]"
              style={{
                background: "linear-gradient(to right, var(--accent-color), #a855f7)",
                color: "white",
              }}
            >
              + Chat Baru
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {loading ? (
              <div className="text-xs p-4" style={{ color: "var(--theme-text-muted)" }}>
                Memuat...
              </div>
            ) : chats.length === 0 ? (
              <div className="text-xs p-4" style={{ color: "var(--theme-text-muted)" }}>
                Belum ada chat. Klik "Chat Baru" untuk mulai.
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className="w-full text-left p-3 rounded-lg mb-1 transition text-sm"
                  style={{
                    background:
                      activeChat?.id === chat.id ? "var(--accent-soft)" : "transparent",
                    color:
                      activeChat?.id === chat.id
                        ? "var(--accent-color)"
                        : "var(--theme-text-secondary)",
                  }}
                >
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
                    {new Date(chat.createdAt).toLocaleDateString("id-ID")}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div
            className="border-b px-6 py-4"
            style={{ borderColor: "var(--theme-border)" }}
          >
            <h1 className="font-bold text-lg">Nova Pulse AI</h1>
            <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
              Powered by Google Gemini · Model: gemini-3.8-flash
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {!activeChat ? (
              <div className="text-center py-20 max-w-2xl mx-auto">
                <div className="text-5xl mb-4">💬</div>
                <h2 className="text-2xl font-bold mb-2">Selamat datang di Nova Pulse AI</h2>
                <p className="mb-8" style={{ color: "var(--theme-text-muted)" }}>
                  Pilih chat dari sidebar atau klik "Chat Baru" untuk mulai.
                </p>
                <button
                  onClick={handleNewChat}
                  className="px-6 py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: "linear-gradient(to right, var(--accent-color), #a855f7)",
                    color: "white",
                  }}
                >
                  + Mulai Chat Baru
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 max-w-2xl mx-auto">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-2xl font-bold mb-2">Mulai Percakapan</h2>
                <p className="mb-6" style={{ color: "var(--theme-text-muted)" }}>
                  Kirim pesan di bawah untuk memulai.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(to right, var(--accent-color), #a855f7)"
                          : "var(--theme-card-bg)",
                      color: msg.role === "user" ? "white" : "var(--theme-text-primary)",
                      border:
                        msg.role === "assistant"
                          ? "1px solid var(--theme-border)"
                          : "none",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl p-4"
                  style={{ background: "var(--theme-card-bg)" }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-6 pb-2">
              <div
                className="text-sm px-4 py-3 rounded-xl flex items-start gap-2"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                }}
              >
                <span>❌</span>
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-xs opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4" style={{ borderColor: "var(--theme-border)" }}>
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeChat
                    ? "Tanya apa saja tentang content creation..."
                    : "Pilih chat dulu untuk mengirim pesan"
                }
                disabled={!activeChat || sending}
                rows={1}
                className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none disabled:opacity-50"
                style={{
                  background: "var(--theme-bg-tertiary)",
                  border: "1px solid var(--theme-border)",
                  color: "var(--theme-text-primary)",
                  maxHeight: "150px",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!activeChat || !input.trim() || sending}
                className="px-6 py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(to right, var(--accent-color), #a855f7)",
                  color: "white",
                }}
              >
                {sending ? "..." : "Kirim"}
              </button>
            </div>
            <p
              className="text-xs mt-2 text-center"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Nova Pulse AI bisa membuat kesalahan. Verifikasi info penting.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}