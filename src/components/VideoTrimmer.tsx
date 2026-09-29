"use client";

import { useState, useRef } from "react";

interface Props {
  src: string;
  fileName: string;
}

export default function VideoTrimmer({ src, fileName }: Props) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function handleTrim() {
    if (!videoRef.current) return;
    setProcessing(true);
    setProgress(0);

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress: p }) =>
        setProgress(Math.round(p * 100))
      );

      await ffmpeg.load({
        coreURL:
          "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
        wasmURL:
          "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
      });

      await ffmpeg.writeFile("input.mp4", await fetchFile(src));

      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-ss",
        String(startTime),
        "-to",
        String(endTime),
        "-c",
        "copy",
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([data as any], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `trimmed-${fileName}`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Trim gagal: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full rounded-xl max-h-[400px]"
      />

      <div className="bg-slate-800 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-cyan-300 text-sm font-semibold block mb-1">
            Start: {startTime}s
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(60, endTime - 1)}
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div>
          <label className="text-cyan-300 text-sm font-semibold block mb-1">
            End: {endTime}s
          </label>
          <input
            type="range"
            min={startTime + 1}
            max={Math.max(60, endTime + 30)}
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <button
          onClick={handleTrim}
          disabled={processing}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
        >
          {processing ? `Memproses... ${progress}%` : "✂️ Trim & Download"}
        </button>
      </div>
    </div>
  );
}