"use client";

import { useEffect, useRef, useState } from "react";

interface Soldier {
  id: number;
  team: "muslim" | "quraisy";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  alive: boolean;
  hp: number;
}

export default function BattleVisualization2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [recording, setRecording] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("Siap");
  const soldiersRef = useRef<Soldier[]>([]);
  const phaseRef = useRef(0);
  const progressRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);   
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const CANVAS_W = 1000;
  const CANVAS_H = 560;
  const TOTAL_PHASES = 6;

  // Inisialisasi pasukan
  function initSoldiers() {
    const soldiers: Soldier[] = [];

    // 100 Muslim (representasi 313)
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      soldiers.push({
        id: i,
        team: "muslim",
        x: 80 + col * 12,
        y: 100 + row * 14,
        targetX: 0,
        targetY: 0,
        vx: 0,
        vy: 0,
        alive: true,
        hp: 100,
      });
    }

    // 100 Quraisy (representasi 1000)
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      soldiers.push({
        id: 100 + i,
        team: "quraisy",
        x: CANVAS_W - 80 - col * 12,
        y: 100 + row * 14,
        targetX: 0,
        targetY: 0,
        vx: 0,
        vy: 0,
        alive: true,
        hp: 100,
      });
    }

    soldiersRef.current = soldiers;
  }

  // Update posisi pasukan berdasarkan fase
  function updateSoldiers(phase: number, progress: number) {
    const soldiers = soldiersRef.current;

    soldiers.forEach((s) => {
      if (!s.alive) return;

      if (s.team === "muslim") {
        // Fase 0-1: diam di posisi
        // Fase 2: maju ke sumur (x=450)
        // Fase 3: formasi dekat sumur
        // Fase 4: clash di tengah
        // Fase 5: menang

        let baseX = s.x;
        if (phase >= 2 && phase <= 3) {
          s.targetX = 350 + (s.id % 10) * 12;
          s.targetY = 100 + Math.floor((s.id % 100) / 10) * 14;
        } else if (phase === 4) {
          s.targetX = 420 + (s.id % 10) * 12;
          s.targetY = 100 + Math.floor((s.id % 100) / 10) * 14;
        } else if (phase === 5) {
          s.targetX = 500 + (s.id % 10) * 12;
          s.targetY = 100 + Math.floor((s.id % 100) / 10) * 14;
        } else {
          s.targetX = s.x;
          s.targetY = s.y;
        }
      } else {
        // Quraisy
        let targetX = s.x;
        if (phase >= 3) {
          s.targetX = 580 - (s.id % 10) * 12;
          s.targetY = 100 + Math.floor((s.id % 100) / 10) * 14;
        } else {
          s.targetX = s.x;
          s.targetY = s.y;
        }
      }

      // Smooth movement
      const dx = s.targetX - s.x;
      const dy = s.targetY - s.y;
      s.x += dx * 0.05;
      s.y += dy * 0.05;
    });
  }

  function getPhaseLabel(phase: number): string {
    const labels = [
      "Fase 1: Mobilisasi Pasukan",
      "Fase 2: Perjalanan ke Badar",
      "Fase 3: Kontrol Sumur Badar",
      "Fase 4: Penyusunan Barisan",
      "Fase 5: Pertempuran",
      "Fase 6: Kemenangan Muslim",
    ];
    return labels[phase] || "Selesai";
  }

  // Draw frame
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, 0,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W / 2
    );
    bgGrad.addColorStop(0, "#2a1f10");
    bgGrad.addColorStop(0.5, "#1a1410");
    bgGrad.addColorStop(1, "#050302");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = "rgba(212, 175, 55, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Sumur Badar
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 20, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(74, 144, 226, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "#4a90e2";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#4a90e2";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SUMUR BADAR", CANVAS_W / 2, CANVAS_H / 2 + 40);

    // Draw soldiers
    const soldiers = soldiersRef.current;
    soldiers.forEach((s) => {
      if (!s.alive) return;

      // Trail/glow
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      const color = s.team === "muslim" ? "46, 204, 113" : "231, 76, 60";
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
      glow.addColorStop(0, `rgba(${color}, 0.8)`);
      glow.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = glow;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = s.team === "muslim" ? "#2ecc71" : "#e74c3c";
      ctx.fill();
    });

    // Arrows for phase 4
    if (phaseRef.current === 4) {
      const arrowOpacity = Math.min(1, progressRef.current * 2);

      // Muslim arrows (right)
      ctx.strokeStyle = `rgba(255, 215, 0, ${arrowOpacity})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const y = 180 + i * 80;
        ctx.beginPath();
        ctx.moveTo(380, y);
        ctx.lineTo(480, y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(480, y);
        ctx.lineTo(470, y - 5);
        ctx.lineTo(470, y + 5);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 215, 0, ${arrowOpacity})`;
        ctx.fill();
      }
    }

    // Labels
    ctx.fillStyle = "#2ecc71";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("PASUKAN MUSLIM: 313", 30, 30);

    ctx.fillStyle = "#e74c3c";
    ctx.textAlign = "right";
    ctx.fillText("PASUKAN QURAISY: 1000", CANVAS_W - 30, 30);

    // Phase label
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(getPhaseLabel(phaseRef.current), CANVAS_W / 2, CANVAS_H - 30);
  }

  // Animation loop
  useEffect(() => {
    initSoldiers();
    draw();

    let lastTime = performance.now();
    let phaseProgress = 0;
    const PHASE_DURATION = 3000; // 3 detik per fase

    const loop = (now: number) => {
      if (!isPlaying) {
        draw();
        return;
      }

      const delta = now - lastTime;
      lastTime = now;
      phaseProgress += delta * speed;

      progressRef.current = (phaseProgress % PHASE_DURATION) / PHASE_DURATION;

      if (phaseProgress >= PHASE_DURATION) {
        phaseProgress = 0;
        phaseRef.current = (phaseRef.current + 1) % TOTAL_PHASES;
        setCurrentPhase(getPhaseLabel(phaseRef.current));
      }

      updateSoldiers(phaseRef.current, progressRef.current);
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speed]);

  // Recording
  async function startRecording() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `battle-badar-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };

      mediaRecorder.start();
      setRecording(true);

      // Reset & play
      phaseRef.current = 0;
      setIsPlaying(true);

      // Stop after full cycle (6 phases x 3s = 18s)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsPlaying(false);
        }
      }, 18500);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Recording gagal. Coba browser Chrome/Edge.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsPlaying(false);
    setRecording(false);
  }

  function reset() {
    phaseRef.current = 0;
    progressRef.current = 0;
    setCurrentPhase("Siap");
    setIsPlaying(false);
    initSoldiers();
    draw();
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-cyan-400 font-bold text-lg">Visualisasi 2D</h3>
          <p className="text-slate-400 text-sm">{currentPhase}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={recording}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition text-sm"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={reset}
            disabled={recording}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition text-sm"
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            disabled={recording}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition text-sm"
          >
            ⏩ {speed}x
          </button>
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 transition text-sm"
            >
              🎥 Record MP4
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg animate-pulse text-sm"
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full rounded-lg border border-cyan-500/30"
      />

      <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
          <p className="text-green-400 font-bold">313</p>
          <p className="text-slate-400">Muslim</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
          <p className="text-red-400 font-bold">1000</p>
          <p className="text-slate-400">Quraisy</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
          <p className="text-yellow-400 font-bold">1:3</p>
          <p className="text-slate-400">Rasio</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-center">
          <p className="text-cyan-400 font-bold">6</p>
          <p className="text-slate-400">Fase</p>
        </div>
      </div>
    </div>
  );
}