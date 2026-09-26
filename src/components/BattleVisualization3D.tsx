"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function BattleVisualization3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const soldiersRef = useRef<THREE.Mesh[]>([]);
  const animFrameRef = useRef<number | undefined>(undefined);
  const clockRef = useRef(new THREE.Clock());

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1410);
    scene.fog = new THREE.Fog(0x1a1410, 20, 80);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 25, 35);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffd700, 1.2);
    sun.position.set(20, 30, 10);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4a90e2, 0.3);
    fill.position.set(-20, 10, -10);
    scene.add(fill);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a15,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Grid helper
    const grid = new THREE.GridHelper(100, 50, 0xd4af37, 0x3a2a15);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Sumur Badar
    const wellGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
    const wellMat = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      emissive: 0x4a90e2,
      emissiveIntensity: 0.4,
    });
    const well = new THREE.Mesh(wellGeo, wellMat);
    well.position.set(0, 0.25, 0);
    scene.add(well);

    // Ring sumur
    const ringGeo = new THREE.RingGeometry(1.8, 2.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // Create soldiers
    soldiersRef.current = [];

    // Muslim (100 dots)
    const muslimGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const muslimMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      emissive: 0x2ecc71,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const mesh = new THREE.Mesh(muslimGeo, muslimMat);
      mesh.position.set(-15 + col * 0.9, 0.3, -5 + row * 0.9);
      mesh.userData = {
        team: "muslim",
        originalX: -15 + col * 0.9,
        originalZ: -5 + row * 0.9,
        row,
        col,
      };
      scene.add(mesh);
      soldiersRef.current.push(mesh);
    }

    // Quraisy (100 dots)
    const quraisyGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const quraisyMat = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      emissive: 0xe74c3c,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const mesh = new THREE.Mesh(quraisyGeo, quraisyMat);
      mesh.position.set(15 - col * 0.9, 0.3, -5 + row * 0.9);
      mesh.userData = {
        team: "quraisy",
        originalX: 15 - col * 0.9,
        originalZ: -5 + row * 0.9,
        row,
        col,
      };
      scene.add(mesh);
      soldiersRef.current.push(mesh);
    }

    // Stars/particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = Math.random() * 50 + 10;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Animation
    let phaseTime = 0;
    let phase = 0;
    const PHASE_DURATION = 3;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      if (isPlaying) {
        phaseTime += delta * speed;

        if (phaseTime >= PHASE_DURATION) {
          phaseTime = 0;
          phase = (phase + 1) % 6;
        }

        // Update soldiers
        soldiersRef.current.forEach((s) => {
          const data = s.userData;
          const row = data.row;
          const col = data.col;

          if (data.team === "muslim") {
            if (phase >= 2 && phase <= 3) {
              // Maju ke sumur
              const tx = -5 + col * 0.9;
              const tz = -5 + row * 0.9;
              s.position.x += (tx - s.position.x) * 0.03;
              s.position.z += (tz - s.position.z) * 0.03;
            } else if (phase === 4) {
              const tx = -2 + col * 0.9;
              const tz = -5 + row * 0.9;
              s.position.x += (tx - s.position.x) * 0.05;
              s.position.z += (tz - s.position.z) * 0.05;
            } else if (phase === 5) {
              const tx = 5 + col * 0.9;
              const tz = -5 + row * 0.9;
              s.position.x += (tx - s.position.x) * 0.04;
              s.position.z += (tz - s.position.z) * 0.04;
            }
          } else {
            if (phase >= 3) {
              const tx = 5 - col * 0.9;
              const tz = -5 + row * 0.9;
              s.position.x += (tx - s.position.x) * 0.03;
              s.position.z += (tz - s.position.z) * 0.03;
            }
          }

          // Pulse effect
          const scale = 1 + Math.sin(Date.now() * 0.003 + data.row) * 0.15;
          s.scale.setScalar(scale);
        });

        // Rotate stars
        stars.rotation.y += delta * 0.05;

        // Pulse well
        const wellScale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
        well.scale.set(wellScale, 1, wellScale);
        ring.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.2);
      }

      // Camera rotation from user input
      const r = rotation * Math.PI / 180;
      camera.position.x = Math.sin(r) * 35;
      camera.position.z = Math.cos(r) * 35;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [isPlaying, speed, rotation]);

  async function startRecording() {
    if (!rendererRef.current) return;
    try {
      const canvas = rendererRef.current.domElement;
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `battle-badar-3d-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };

      mediaRecorder.start();
      setRecording(true);
      setIsPlaying(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsPlaying(false);
        }
      }, 18500);
    } catch (err) {
      console.error(err);
      alert("Recording gagal. Pakai Chrome/Edge.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsPlaying(false);
    setRecording(false);
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-purple-500/20">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-purple-400 font-bold text-lg">Visualisasi 3D (Three.js)</h3>
          <p className="text-slate-400 text-sm">Drag slider untuk rotate kamera</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={recording}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition text-sm"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            disabled={recording}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 text-sm"
          >
            ⏩ {speed}x
          </button>
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 transition text-sm"
            >
              🎥 Record 3D
            </button>
          ) : (
            <button onClick={stopRecording} className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg animate-pulse text-sm">
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-lg border border-purple-500/30 overflow-hidden"
        style={{ height: "500px" }}
      />

      <div className="mt-4">
        <label className="text-slate-400 text-sm mb-2 block">
          🎥 Rotasi Kamera: {rotation}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>
    </div>
  );
}