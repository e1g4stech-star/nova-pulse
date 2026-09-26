"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

interface Post {
  id: string;
  title: string;
  desc: string;
  platform: string;
  status: string;
  hashtags: string[];
  likes: number;
  createdAt: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function fetchPosts() {
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      if (json.success) setPosts(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus postingan ini?")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPosts(posts.filter((p) => p.id !== id));
      } else {
        alert("Gagal hapus: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2">
                Semua Postingan
              </h1>
              <p className="text-slate-400">
                {posts.length} postingan milik kamu
              </p>
            </div>
            <a
              href="/ai-studio"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              + Buat Baru
            </a>
          </div>

          <div className="flex gap-2 mb-6">
            {["all", "draft", "scheduled", "published"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  filter === f
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-20">Loading...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-12 text-center border border-cyan-500/20">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-slate-300 text-lg mb-2 font-semibold">
                {filter === "all"
                  ? "Kamu belum punya postingan"
                  : `Belum ada postingan dengan status "${filter}"`}
              </p>
              <p className="text-slate-500 mb-6 text-sm">
                {filter === "all"
                  ? "Mulai generate konten dengan AI dan simpan di sini!"
                  : "Coba filter lain atau buat postingan baru."}
              </p>
              <a
                href="/ai-studio"
                className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
              >
                ✦ Generate dengan AI
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-500/50 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        post.status === "published"
                          ? "bg-green-500/20 text-green-300"
                          : post.status === "scheduled"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-slate-600/40 text-slate-300"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="text-xs text-slate-400 uppercase">
                      {post.platform}
                    </span>
                  </div>

                  <h3 className="text-white font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-slate-400 text-sm mb-3 line-clamp-3">
                    {post.desc}
                  </p>

                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.hashtags.slice(0, 4).map((h, i) => (
                        <span
                          key={i}
                          className="text-cyan-300 text-xs bg-cyan-500/10 px-2 py-0.5 rounded"
                        >
                          {h}
                        </span>
                      ))}
                      {post.hashtags.length > 4 && (
                        <span className="text-slate-500 text-xs px-2 py-0.5">
                          +{post.hashtags.length - 4} lagi
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                    <span className="text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold transition"
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}