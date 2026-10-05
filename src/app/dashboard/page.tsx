"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';

import Navbar from "@/components/Navbar";
import Link from "next/link";

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

export default function DashboardPage() {
  const { user: session } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchPosts();
  }, []);

  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);

  // Sample data untuk chart (karena belum ada tracking real)
  const chartData = [
    { day: "Sen", value: 42 },
    { day: "Sel", value: 58 },
    { day: "Rab", value: 35 },
    { day: "Kam", value: 72 },
    { day: "Jum", value: 88 },
    { day: "Sab", value: 95 },
    { day: "Min", value: 68 },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value));

  const platformColors: Record<string, string> = {
    instagram: "from-pink-500 to-purple-500",
    tiktok: "from-cyan-400 to-pink-400",
    youtube: "from-red-500 to-red-600",
    facebook: "from-blue-500 to-blue-600",
    pinterest: "from-red-400 to-pink-500",
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-10">
            <p className="text-cyan-400 text-sm font-bold tracking-widest mb-2">
              DASHBOARD
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Halo,{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {session?.email?.split("@")[0] || "Creator"}
              </span>
            </h1>
            <p className="text-slate-400">
              Ini ringkasan aktivitas konten kamu hari ini.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 text-sm">Total Posts</span>
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">
                {loading ? "—" : totalPosts}
              </div>
              <p className="text-xs text-slate-500">
                Semua konten tersimpan
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-green-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 text-sm">Published</span>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {loading ? "—" : publishedCount}
              </div>
              <p className="text-xs text-slate-500">
                Konten yang sudah tayang
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 text-sm">Draft</span>
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {loading ? "—" : draftCount}
              </div>
              <p className="text-xs text-slate-500">
                Menunggu dipublish
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-pink-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 text-sm">Total Likes</span>
                <span className="text-2xl">❤️</span>
              </div>
              <div className="text-4xl font-bold text-pink-400 mb-2">
                {loading ? "—" : totalLikes.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500">
                Engagement keseluruhan
              </p>
            </div>
          </div>

          {/* Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-cyan-400 text-xs font-bold tracking-widest mb-1">
                    TRAFFIC OVERVIEW
                  </p>
                  <h3 className="text-xl font-bold">Aktivitas 7 Hari Terakhir</h3>
                </div>
                <span className="text-xs text-slate-500">
                  Data contoh
                </span>
              </div>

              <div className="relative h-64">
                <div className="absolute inset-0 flex items-end justify-between gap-2">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                        style={{
                          height: `${(d.value / maxValue) * 100}%`,
                          minHeight: "20px",
                        }}
                        title={`${d.value} visitors`}
                      />
                      <span className="text-xs text-slate-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <span className="text-xs text-slate-500">
                  Total: {chartData.reduce((s, d) => s + d.value, 0)} visitors
                </span>
                <span className="text-xs text-green-400">
                  +18.6% vs minggu lalu
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              <p className="text-cyan-400 text-xs font-bold tracking-widest mb-4">
                QUICK ACTIONS
              </p>

              <div className="space-y-3">
                <Link
                  href="/ai-studio"
                  className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 rounded-xl p-4 transition"
                >
                  <span className="text-2xl">✦</span>
                  <div>
                    <p className="font-bold text-white">Generate AI</p>
                    <p className="text-xs text-slate-400">Buat konten baru</p>
                  </div>
                </Link>

                <Link
                  href="/posts"
                  className="flex items-center gap-3 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 rounded-xl p-4 transition"
                >
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-bold text-white">Kelola Posts</p>
                    <p className="text-xs text-slate-400">{totalPosts} postingan</p>
                  </div>
                </Link>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 opacity-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-bold text-white">Analytics</p>
                      <p className="text-xs text-slate-400">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-cyan-400 text-xs font-bold tracking-widest mb-1">
                  RECENT POSTS
                </p>
                <h3 className="text-xl font-bold">Postingan Terbaru</h3>
              </div>
              <Link
                href="/posts"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
              >
                Lihat Semua →
              </Link>
            </div>

            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading...</p>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">Belum ada postingan</p>
                <Link
                  href="/ai-studio"
                  className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 transition"
                >
                  Generate Pertama
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 bg-slate-900/50 rounded-xl p-4 hover:bg-slate-900/70 transition"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        platformColors[post.platform] || "from-cyan-500 to-purple-500"
                      } flex items-center justify-center text-xl font-bold text-white flex-shrink-0`}
                    >
                      {post.platform.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">
                        {post.title}
                      </h4>
                      <p className="text-sm text-slate-400 truncate">
                        {post.desc}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                        post.status === "published"
                          ? "bg-green-500/20 text-green-300"
                          : post.status === "scheduled"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-slate-600/40 text-slate-300"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
