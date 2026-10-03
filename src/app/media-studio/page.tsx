"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";

interface Media {
  id: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileType: "image" | "video" | "3d";
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

const TABS = [
  { id: "all", label: "Semua", icon: "📁" },
  { id: "image", label: "Gambar", icon: "🖼️" },
  { id: "video", label: "Video", icon: "🎬" },
  { id: "3d", label: "3D Model", icon: "🎮" },
];

export default function MediaStudioPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewItem, setPreviewItem] = useState<Media | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchMedia() {
    try {
      const res = await fetch(`/api/media?type=${activeTab}`);
      const json = await res.json();
      if (json.success) setMedia(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchMedia();
  }, [activeTab]);

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.response));
          } else {
            try {
              reject(new Error(JSON.parse(xhr.responseText).error || "Upload gagal"));
            } catch {
              reject(new Error("Upload gagal"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", "/api/media");
        xhr.send(formData);
      });

      setSuccess(`✅ "${file.name}" berhasil diupload!`);
      fetchMedia();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload gagal";
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`Hapus "${fileName}"?`)) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setMedia(media.filter((m) => m.id !== id));
        setSuccess("✅ Media dihapus");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function closePreview() {
    setPreviewItem(null);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="text-cyan-400 text-sm font-bold tracking-widest mb-2">
              MEDIA STUDIO
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Kelola Media Kamu
            </h1>
            <p className="text-slate-400">
              Upload, preview, dan kelola gambar, video, dan 3D model.
            </p>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-slate-800/60 backdrop-blur rounded-2xl p-8 mb-6 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,.glb,.gltf"
              className="hidden"
            />
            <div className="text-center">
              <div className="text-6xl mb-4">📤</div>
              <p className="text-white font-bold text-lg mb-2">
                {uploading ? "Mengupload..." : "Klik atau drag file untuk upload"}
              </p>
              <p className="text-slate-400 text-sm">
                Gambar, Video, atau 3D Model (.glb, .gltf) — Max 50 MB
              </p>

              {uploading && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-cyan-400 text-sm mt-2">{uploadProgress}%</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-xl mb-6">
              {success}
            </div>
          )}

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-20">Loading...</div>
          ) : media.length === 0 ? (
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-12 text-center border border-cyan-500/20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-300 font-semibold mb-2">Belum ada media</p>
              <p className="text-slate-500 text-sm">
                Upload file pertama kamu di area di atas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/60 backdrop-blur rounded-2xl overflow-hidden border border-cyan-500/20 hover:border-cyan-500/50 transition group"
                >
                  <div
                    className="aspect-square bg-slate-900 relative overflow-hidden cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    {item.fileType === "image" && (
                      <img
                        src={item.fileUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    )}
                    {item.fileType === "video" && (
                      <video
                        src={item.fileUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    {item.fileType === "3d" && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-5xl gap-2">
                        <span>🎮</span>
                        <span className="text-xs text-slate-500">3D Model</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-1 bg-slate-900/80 text-cyan-300 text-xs rounded font-bold">
                      {item.fileType.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-semibold truncate">
                      {item.fileName}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {formatSize(item.fileSize)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="flex-1 text-center bg-cyan-500/20 text-cyan-300 text-xs py-1.5 rounded hover:bg-cyan-500/30 transition"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.fileName)}
                        className="flex-1 bg-red-500/20 text-red-300 text-xs py-1.5 rounded hover:bg-red-500/30 transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {previewItem && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <div
              className="bg-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold truncate">
                  {previewItem.fileName}
                </h3>
                <button
                  onClick={closePreview}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {previewItem.fileType === "image" && (
                <img
                  src={previewItem.fileUrl}
                  alt={previewItem.fileName}
                  className="w-full rounded-xl"
                />
              )}

              {previewItem.fileType === "video" && (
                <video
                  src={previewItem.fileUrl}
                  controls
                  className="w-full rounded-xl max-h-[600px]"
                />
              )}

              {previewItem.fileType === "3d" && (
                <div className="w-full h-[400px] bg-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6">
                  <div className="text-6xl mb-4">🎮</div>
                  <p className="text-white font-bold mb-2">
                    {previewItem.fileName}
                  </p>
                  <p className="text-slate-400 text-sm mb-4">
                    3D Model Viewer akan segera hadir.
                  </p>
                  <a
                    href={previewItem.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg text-sm hover:bg-cyan-500/30 transition"
                  >
                    ⇩ Download Model (.glb)
                  </a>
                </div>
              )}

              <div className="mt-4 text-slate-500 text-xs">
                {formatSize(previewItem.fileSize)} • Uploaded{" "}
                {new Date(previewItem.createdAt).toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}