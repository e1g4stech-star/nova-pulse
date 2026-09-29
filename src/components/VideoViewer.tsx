"use client";

import { useRef, useState } from "react";

interface Props {
  src: string;
  fileName: string;
}

export default function VideoViewer({ src, fileName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full max-h-[600px]"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}