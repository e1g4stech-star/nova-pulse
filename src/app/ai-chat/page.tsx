"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";

interface Chat {
  id: string;
  title: string;
  model: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}

export default function AIChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chats list
  async function fetchChats() {
    try {
      const res = await fetch("/api/ai-chat");
      const json = await res.json();
      if (json.success) setChats(json.data);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch single chat messages
  async function fetchChat(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-chat/${id}`);
      const json = await res.json();
      if (json.success) {
        setActiveChat(json.data);
        setMessages(json.data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChats();
  }, []);

  // Auto-scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create new chat
  async function createNewChat() {
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat Baru" }),
      });
      const json = await res.json();
      if (json.success) {
        setChats([json.data, ...chats]);
        setActiveChat(json.data);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Send message
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    if (!activeChat) {
      // Auto-create chat dulu
      await createNewChat();
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setError("");
    setSending(true);

    // Optimistic update
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/ai-chat/${activeChat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const json = await res.json();

      if (json.success) {
        // Refresh messages
        await fetchChat(activeChat.id);
        // Refresh chat list (buat update title)
        await fetchChats();
      } else {
        setError(json.error || "Gagal kirim pesan");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      }
    } catch (err: any) {
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  async function deleteChat(id: string) {
    if (!confirm("Hapus chat ini?")) return;
    try {
      const res = await fetch(`/api/ai-chat/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setChats(chats.filter((c) => c.id !== id));
        if (activeChat?.id === id) {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function togglePin(chat: Chat) {
    try {
      const res = await fetch(`/api/ai-chat/${chat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !chat.isPinned }),
      });
      const json = await res.json();
      if (json.success) fetchChats();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Navbar />
      <main className="h-[calc(100vh-65px)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
        {/* SIDEBAR — Chat List */}
        <aside className="w-72 bg-slate-900/80 backdrop-blur border-r border-cyan-500/20 flex flex-col">
          <div className="p-4 border-b border-cyan-500/20">
            <button
              onClick={createNewChat}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
            >
              + Chat Baru
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {chats.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8 px-4">
                Belum ada chat. Klik "Chat Baru" untuk mulai.
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => fetchChat(chat.id)}
                  className={`group p-3 rounded-lg cursor-pointer transition mb-1 ${
                    activeChat?.id === chat.id
                      ? "bg-cyan-500/20 border border-cyan-500/40"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 text-lg flex-shrink-0">
                      💬
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {chat.title}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(chat);
                        }}
                        className={`text-sm ${
                          chat.isPinned ? "text-yellow-400" : "text-slate-500 hover:text-yellow-400"
                        }`}
                      >
                        📌
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MAIN — Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">🤖</span>
              {activeChat?.title || "Nova Pulse AI"}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Powered by Google Gemini · Model: {activeChat?.model || "gemini-3.5-flash"}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!activeChat ? (
              <div className="text-center py-20">
                <div className="text-8xl mb-6">✨</div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Selamat datang di Nova Pulse AI
                </h2>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                  Tanyakan apapun tentang content creation, marketing, atau strategi media sosial.
                  AI akan bantu kamu dengan saran konkret.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {[
                    "Buat 5 caption untuk skincare premium",
                    "Ide konten viral TikTok untuk Gen Z",
                    "Strategi posting Instagram untuk engagement",
                    "Analisa: kenapa postingan saya kurang viral?",
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q);
                        if (!activeChat) createNewChat();
                      }}
                      className="text-left p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-500/40 transition text-sm text-slate-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-20">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-slate-400">Loading...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-slate-400">
                  Mulai percakapan dengan mengirim pesan di bawah.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "model" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-sm">
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                        : "bg-slate-800/80 border border-cyan-500/20 text-slate-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <div
                      className={`text-[10px] mt-2 ${
                        msg.role === "user"
                          ? "text-white/60"
                          : "text-slate-500"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 text-sm">
                      👤
                    </div>
                  )}
                </div>
              ))
            )}

            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="bg-slate-800/80 border border-cyan-500/20 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl text-sm">
                ❌ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-cyan-500/20 bg-slate-900/60 backdrop-blur">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya apa saja tentang content creation..."
                disabled={sending}
                className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-cyan-500 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                {sending ? "⏳" : "Kirim"}
              </button>
            </form>
            <p className="text-slate-500 text-xs mt-2 text-center">
              Nova Pulse AI bisa membuat kesalahan. Verifikasi info penting.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}