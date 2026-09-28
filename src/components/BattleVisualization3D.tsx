"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type UnitType = "infantry" | "archer" | "cavalry" | "camel";
type Team = "muslim" | "quraisy";

interface Unit {
  mesh: THREE.Mesh;
  type: UnitType;
  team: Team;
  row: number;
  col: number;
  originalX: number;
  originalZ: number;
  speed: number;
}

const PHASES = [
  { name: "Fase 1: Persiapan Muslim", desc: "313 Muslim bersiap — 82 Muhajirin, 231 Anshar. Hanya 2 kuda dan 70 unta untuk seluruh pasukan.", duration: 8, stats: ["313 Pasukan", "2 Kuda", "70 Unta", "8 Pedang Lengkap"] },
  { name: "Fase 2: Mobilisasi Quraisy", desc: "Abu Jahal memimpin 1000 pasukan Mekah dengan 700 unta, 300 kuda, dan persenjataan lengkap.", duration: 8, stats: ["1000 Pasukan", "300 Kuda", "700 Unta", "Armor Lengkap"] },
  { name: "Fase 3: Perjalanan ke Badar", desc: "Pasukan Muslim tiba lebih dulu di lembah Badar. Mereka bergerak cepat menuju sumber air.", duration: 8, stats: ["Jarak 130 km", "7 Hari Perjalanan", "Strategi Cepat"] },
  { name: "Fase 4: Kontrol Sumur Badar", desc: "Muslim menguasai sumur air strategis. Quraisy terpaksa mengambil air dari tempat yang lebih jauh.", duration: 8, stats: ["Sumur Dikuasai", "Muslim: 313", "Quraisy: 1000"] },
  { name: "Fase 5: Formasi Perang", desc: "Kedua pasukan bersiap. Muslim membentuk barisan rapat. Quraisy menyusun formasi dengan kavaleri di sayap.", duration: 8, stats: ["Barisan Muslim", "Kavaleri Quraisy", "Pemanah Siap"] },
  { name: "Fase 6: Pertempuran", desc: "Pertempuran meletus! Panah terbang, pedang beradu, duel antar kesatria. Ali, Hamzah, dan Ubaidah maju sebagai juara.", duration: 10, stats: ["Panah Terbang", "Duel Juara", "Pertempuran Sengit"] },
  { name: "Fase 7: Kemenangan Muslim", desc: "Dengan izin Allah, 313 Muslim mengalahkan 1000 Quraisy. 70 Quraisy tewas, 70 tertawan. 14 Muslim syuhada.", duration: 8, stats: ["Muslim Menang!", "70 Quraisy Tewas", "14 Muslim Syahid", "Malaikat Membantu"] },
];

export default function BattleVisualization3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const unitsRef = useRef<Unit[]>([]);
  const animFrameRef = useRef<number | undefined>(undefined);
  const wellRef = useRef<THREE.Mesh | null>(null);

  // State refs
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const rotationRef = useRef(45);
  const zoomRef = useRef(30);
  const phaseRef = useRef(0);
  const phaseTimeRef = useRef(0);

  // React states
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [rotation, setRotation] = useState(45);
  const [zoom, setZoom] = useState(30);
  const [recording, setRecording] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Sync state ke ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  function createUnitMesh(type: UnitType, team: Team): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    let mat: THREE.MeshStandardMaterial;
    const color =
      team === "muslim"
        ? { main: 0x2ecc71, accent: 0x27ae60 }
        : { main: 0xe74c3c, accent: 0xc0392b };

    switch (type) {
      case "infantry":
        geo = new THREE.BoxGeometry(0.4, 1, 0.4);
        mat = new THREE.MeshStandardMaterial({ color: color.main, emissive: color.main, emissiveIntensity: 0.3 });
        break;
      case "archer":
        geo = new THREE.ConeGeometry(0.35, 1.2, 6);
        mat = new THREE.MeshStandardMaterial({ color: color.accent, emissive: color.accent, emissiveIntensity: 0.4 });
        break;
      case "cavalry":
        geo = new THREE.BoxGeometry(0.6, 1.4, 0.8);
        mat = new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: color.main, emissiveIntensity: 0.5 });
        break;
      case "camel":
        geo = new THREE.BoxGeometry(0.7, 1.8, 0.9);
        mat = new THREE.MeshStandardMaterial({ color: 0xb8860b, emissive: 0xdaa520, emissiveIntensity: 0.2 });
        break;
      default:
        geo = new THREE.BoxGeometry(0.4, 1, 0.4);
        mat = new THREE.MeshStandardMaterial({ color: color.main });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  function createBanner(color: number): THREE.Group {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), new THREE.MeshStandardMaterial({ color: 0x4a3a1a }));
    pole.position.y = 1.5;
    group.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.6),
      new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.4 })
    );
    flag.position.set(0.5, 2.5, 0);
    group.add(flag);
    return group;
  }

  function createPalm(scene: THREE.Scene, x: number, z: number) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 4, 8), new THREE.MeshStandardMaterial({ color: 0x4a3a1a }));
    trunk.position.y = 2;
    group.add(trunk);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 2),
        new THREE.MeshStandardMaterial({ color: 0x2d5016, side: THREE.DoubleSide })
      );
      leaf.position.y = 4;
      leaf.rotation.z = (Math.PI * 2 * i) / 5;
      leaf.rotation.x = -Math.PI / 3;
      leaf.position.x = Math.cos((Math.PI * 2 * i) / 5) * 0.8;
      leaf.position.z = Math.sin((Math.PI * 2 * i) / 5) * 0.8;
      group.add(leaf);
    }
    group.position.set(x, 0, z);
    scene.add(group);
  }

  // ============ MAIN SETUP (RUN ONCE) ============
  useEffect(() => {
    if (!containerRef.current) return;
    console.log(">>> Setup scene START");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0605);
    scene.fog = new THREE.Fog(0x0a0605, 40, 140);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 25, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffd700, 1.5);
    sun.position.set(20, 40, 20);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4a90e2, 0.4);
    fill.position.set(-20, 15, -20);
    scene.add(fill);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(200, 100, 0xd4af37, 0x5a4a2a);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.15;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Sumur
    const wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.2, 1, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a3a1a })
    );
    wellBase.position.y = 0.5;
    scene.add(wellBase);
    wellRef.current = wellBase;

    const wellWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a90e2, emissive: 0x4a90e2, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 })
    );
    wellWater.position.y = 1.05;
    scene.add(wellWater);

    // Pohon
    createPalm(scene, -25, -15);
    createPalm(scene, 25, -15);
    createPalm(scene, -25, 15);
    createPalm(scene, 25, 15);

    // Banner
    const mBanner = createBanner(0x2ecc71);
    mBanner.position.set(-18, 0, -12);
    scene.add(mBanner);
    const qBanner = createBanner(0xe74c3c);
    qBanner.position.set(18, 0, -12);
    scene.add(qBanner);

    // ============ UNITS ============
    unitsRef.current = [];

    // Muslim infantry (60) - speed 0.5
    for (let i = 0; i < 60; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const mesh = createUnitMesh("infantry", "muslim");
      const x = -20 + col * 1.2;
      const z = -6 + row * 1.2;
      mesh.position.set(x, 0.5, z);
      mesh.userData = { row, col };
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "infantry", team: "muslim", row, col, originalX: x, originalZ: z, speed: 0.5 });
    }

    // Muslim archer (15) - speed 0.3
    for (let i = 0; i < 15; i++) {
      const mesh = createUnitMesh("archer", "muslim");
      const x = -22 + i * 0.8;
      mesh.position.set(x, 0.6, -10);
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "archer", team: "muslim", row: 0, col: i, originalX: x, originalZ: -10, speed: 0.3 });
    }

    // Muslim cavalry (2) - speed 0.6
    for (let i = 0; i < 2; i++) {
      const mesh = createUnitMesh("cavalry", "muslim");
      mesh.position.set(-18, 0.7, 5 + i * 2);
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "cavalry", team: "muslim", row: 0, col: i, originalX: -18, originalZ: 5 + i * 2, speed: 0.6 });
    }

    // Muslim camel (25) - speed 0.4
    for (let i = 0; i < 25; i++) {
      const mesh = createUnitMesh("camel", "muslim");
      mesh.position.set(-24, 0.9, -8 + i * 0.8);
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "camel", team: "muslim", row: 0, col: i, originalX: -24, originalZ: -8 + i * 0.8, speed: 0.4 });
    }

    // Quraisy infantry (70) - speed 0.5
    for (let i = 0; i < 70; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const mesh = createUnitMesh("infantry", "quraisy");
      const x = 20 - col * 1.2;
      const z = -6 + row * 1.2;
      mesh.position.set(x, 0.5, z);
      mesh.userData = { row, col };
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "infantry", team: "quraisy", row, col, originalX: x, originalZ: z, speed: 0.5 });
    }

    // Quraisy archer (20) - speed 0.3
    for (let i = 0; i < 20; i++) {
      const mesh = createUnitMesh("archer", "quraisy");
      const x = 22 - i * 0.8;
      mesh.position.set(x, 0.6, -10);
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "archer", team: "quraisy", row: 0, col: i, originalX: x, originalZ: -10, speed: 0.3 });
    }

    // Quraisy cavalry (10) - speed 0.6
    for (let i = 0; i < 10; i++) {
      const mesh = createUnitMesh("cavalry", "quraisy");
      mesh.position.set(22, 0.7, 3 + i * 1.5);
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "cavalry", team: "quraisy", row: 0, col: i, originalX: 22, originalZ: 3 + i * 1.5, speed: 0.6 });
    }

    // Quraisy camel (15) - speed 0.4
    for (let i = 0; i < 15; i++) {
      const mesh = createUnitMesh("camel", "quraisy");
      mesh.position.set(25, 0.9, -8 + i * 0.9);
      scene.add(mesh);
      unitsRef.current.push({ mesh, type: "camel", team: "quraisy", row: 0, col: i, originalX: 25, originalZ: -8 + i * 0.9, speed: 0.4 });
    }

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(800 * 3);
    for (let i = 0; i < 800 * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = Math.random() * 80 + 20;
      positions[i + 2] = (Math.random() - 0.5) * 300;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffd700, size: 0.2, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    console.log(">>> Units created:", unitsRef.current.length);

    // ============ ANIMATION LOOP ============
    const clock = new THREE.Clock();
    let lastPhase = -1;
    let logCounter = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      logCounter++;
      if (logCounter % 60 === 0) {
        console.log(">>> animate tick:", { playing: isPlayingRef.current, phase: phaseRef.current, time: phaseTimeRef.current.toFixed(2) });
      }

      if (isPlayingRef.current) {
        phaseTimeRef.current += delta * speedRef.current;

        const currentDur = PHASES[phaseRef.current].duration;
        if (phaseTimeRef.current >= currentDur) {
          phaseTimeRef.current = 0;
          phaseRef.current = (phaseRef.current + 1) % PHASES.length;
        }

        if (lastPhase !== phaseRef.current) {
          lastPhase = phaseRef.current;
          setCurrentPhase(phaseRef.current);
        }

        const phase = phaseRef.current;

        // Move units — diperbesar gerakan
        unitsRef.current.forEach((u, idx) => {
          const mesh = u.mesh;
          const row = u.row;
          const col = u.col;

          if (u.team === "muslim") {
            let tx = mesh.position.x;
            let tz = mesh.position.z;

            if (phase === 2 || phase === 3) {
              tx = -8 + col * 0.8;
              tz = -12 + row * 1.5;
            } else if (phase === 4) {
              tx = -5 + col * 0.8;
              tz = -8 + row * 1.5;
            } else if (phase === 5) {
              tx = 0 + col * 0.8;
              tz = -4 + row * 1.5;
            } else if (phase === 6) {
              tx = 8 + col * 0.8;
              tz = -2 + row * 1.5;
            }

            if (idx === 0) {
              console.log(">>> Unit0 pos:", mesh.position.x.toFixed(2), mesh.position.z.toFixed(2), "target:", tx.toFixed(2), tz.toFixed(2), "phase:", phase);
            }

            mesh.position.x += (tx - mesh.position.x) * u.speed;
            mesh.position.z += (tz - mesh.position.z) * u.speed;
          } else {
            if (phase >= 4) {
              const tx = 5 - col * 0.8;
              const tz = -4 + row * 1.5;
              mesh.position.x += (tx - mesh.position.x) * u.speed;
              mesh.position.z += (tz - mesh.position.z) * u.speed;
            }
          }
        });

        // Pulse well
        if (wellRef.current) {
          const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.15;
          wellRef.current.scale.set(pulse, 1, pulse);
        }

        stars.rotation.y += delta * 0.03;
      }

      // Camera
      const r = (rotationRef.current * Math.PI) / 180;
      camera.position.x = Math.sin(r) * zoomRef.current;
      camera.position.z = Math.cos(r) * zoomRef.current;
      camera.position.y = zoomRef.current * 0.6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();
    console.log(">>> Animation loop started");

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
  }, []);

  async function startRecording() {
    if (!rendererRef.current) return;
    try {
      const canvas = rendererRef.current.domElement;
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `perang-badar-3d-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };
      mediaRecorder.start();
      setRecording(true);
      phaseRef.current = 0;
      phaseTimeRef.current = 0;
      setCurrentPhase(0);
      setIsPlaying(true);
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsPlaying(false);
        }
      }, 58000);
    } catch (err) {
      console.error(err);
      alert("Recording gagal.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setIsPlaying(false);
    setRecording(false);
  }

  function resetAnimation() {
    phaseRef.current = 0;
    phaseTimeRef.current = 0;
    setCurrentPhase(0);
    setIsPlaying(false);
    unitsRef.current.forEach((u) => {
      u.mesh.position.set(u.originalX, u.mesh.position.y, u.originalZ);
    });
  }

  const currentPhaseData = PHASES[currentPhase];

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-purple-500/20">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-purple-400 font-bold text-lg">Visualisasi 3D - Perang Badar</h3>
          <p className="text-slate-400 text-sm">{currentPhaseData.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={recording}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={resetAnimation}
            disabled={recording}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm"
          >
            Reset
          </button>
          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            disabled={recording}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm"
          >
            {speed}x Speed
          </button>
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-4 py-2 rounded-lg text-sm"
            >
              Record Video
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg animate-pulse text-sm"
            >
              Stop Recording
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-lg border border-purple-500/30 overflow-hidden"
        style={{ height: "550px" }}
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-purple-400 text-xs font-bold mb-1">PLOT SEJARAH</p>
          <p className="text-slate-200 text-sm">{currentPhaseData.desc}</p>
        </div>
        <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-4">
          <p className="text-cyan-400 text-xs font-bold mb-2">STATISTIK</p>
          <div className="flex flex-wrap gap-1">
            {currentPhaseData.stats.map((s, i) => (
              <span key={i} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Rotasi: {rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Zoom: {zoom}</label>
          <input
            type="range"
            min="20"
            max="80"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}