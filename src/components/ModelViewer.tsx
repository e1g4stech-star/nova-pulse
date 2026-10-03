"use client";

interface Props {
  src: string;
}

export default function ModelViewer({ src }: Props) {
  return (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl flex flex-col items-center justify-center text-center p-6">
      <div className="text-6xl mb-4">🎮</div>
      <p className="text-white font-bold mb-2">3D Model Viewer</p>
      <p className="text-slate-400 text-sm mb-4">
        Preview 3D model akan tersedia di versi berikutnya.
      </p>
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg text-sm hover:bg-cyan-500/30 transition"
      >
        ⇩ Download Model (.glb)
      </a>
    </div>
  );
}