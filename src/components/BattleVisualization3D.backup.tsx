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
  hp: number;
  maxHp: number;
}

interface Phase {
  name: string;
  desc: string;
  duration: number;
  stats: string[];
}

const PHASES: Phase[] = [
  {
    name: "Fase 1: Persiapan Muslim",
    desc: "Rasulullah SAW memimpin 313 pasukan — 82 Muhajirin, 231 Anshar. Hanya 2 kuda dan 70 unta untuk seluruh pasukan.",
    duration: 4,
    stats: ["313 Pasukan", "2 Kuda", "70 Unta", "8 Pedang Lengkap"],
  },
  {
    name: "Fase 2: Mobilisasi Quraisy",
    desc: "Abu Jahal memimpin 1000 pasukan Mekah — dengan 700 unta, 300 kuda, dan persenjataan lengkap.",
    duration: 4,
    stats: ["1000 Pasukan", "300 Kuda", "700 Unta", "Armor Lengkap"],
  },
  {
    name: "Fase 3: Perjalanan ke Badar",
    desc: "Pasukan Muslim tiba lebih dulu di lembah Badar. Mereka bergerak cepat menuju sumber air.",
    duration: 4,
    stats: ["Jarak 130 km", "7 Hari Perjalanan", "Strategi Cepat"],
  },
  {
    name: "Fase 4: Kontrol Sumur Badar",
    desc: "Muslim menguasai sumur air strategis. Quraisy terpaksa mengambil air dari tempat yang lebih jauh.",
    duration: 4,
    stats: ["Sumur Dikuasai", "Muslim: 313", "Quraisy: 1000"],
  },
  {
    name: "Fase 5: Formasi Perang",
    desc: "Kedua pasukan bersiap. Muslim membentuk barisan rapat. Quraisy menyusun formasi dengan kavaleri di sayap.",
    duration: 4,
    stats: ["Barisan Muslim", "Kavaleri Quraisy", "Pemanah Siap"],
  },
  {
    name: "Fase 6: Pertempuran",
    desc: "Pertempuran meletus! Panah terbang, pedang beradu, duel antar kesatria. Ali, Hamzah, dan Ubaidah maju sebagai juara.",
    duration: 6,
    stats: ["Panah Terbang", "Duel Juara", "Pertempuran Sengit"],
  },
  {
    name: "Fase 7: Kemenangan Muslim",
    desc: "Dengan izin Allah, 313 Muslim mengalahkan 1000 Quraisy. 70 Quraisy tewas, 70 tertawan. 14 Muslim syuhada.",
    duration: 5,
    stats: ["Muslim Menang!", "70 Quraisy Tewas", "14 Muslim Syahid", "Malaikat Membantu"],
  },
];

export default function BattleVisualization3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const unitsRef = useRef<Unit[]>([]);
  const projectilesRef = useRef<THREE.Mesh[]>([]);
  const arrowsRef = useRef<THREE.ArrowHelper[]>([]);
  const animFrameRef = useRef<number | undefined>(undefined);
  const clockRef = useRef(new THREE.Clock());
  const wellRef = useRef<THREE.Mesh | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [rotation, setRotation] = useState(45);
  const [recording, setRecording] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [zoom, setZoom] = useState(40);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Buat mesh untuk berbagai unit
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
        mat = new THREE.MeshStandardMaterial({
          color: color.main,
          emissive: color.main,
          emissiveIntensity: 0.3,
        });
        break;
      case "archer":
        geo = new THREE.ConeGeometry(0.35, 1.2, 6);
        mat = new THREE.MeshStandardMaterial({
          color: color.accent,
          emissive: color.accent,
          emissiveIntensity: 0.4,
        });
        break;
      case "cavalry":
        geo = new THREE.BoxGeometry(0.6, 1.4, 0.8);
        mat = new THREE.MeshStandardMaterial({
          color: 0x8b6914,
          emissive: color.main,
          emissiveIntensity: 0.5,
        });
        break;
      case "camel":
        geo = new THREE.BoxGeometry(0.7, 1.8, 0.9);
        mat = new THREE.MeshStandardMaterial({
          color: 0xb8860b,
          emissive: 0xdaa520,
          emissiveIntensity: 0.2,
        });
        break;
      default:
        geo = new THREE.BoxGeometry(0.4, 1, 0.4);
        mat = new THREE.MeshStandardMaterial({ color: color.main });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  // Buat bendera
  function createBanner(color: number): THREE.Group {
    const group = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3a1a });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.5;
    group.add(pole);

    const flagGeo = new THREE.PlaneGeometry(1, 0.6);
    const flagMat = new THREE.MeshStandardMaterial({
      color: color,
      side: THREE.DoubleSide,
      emissive: color,
      emissiveIntensity: 0.4,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.5, 2.5, 0);
    group.add(flag);

    return group;
  }

  // Buat panah
  function createArrow(from: THREE.Vector3, direction: THREE.Vector3, color: number): THREE.ArrowHelper {
    const arrow = new THREE.ArrowHelper(
      direction.normalize(),
      from,
      1,
      color,
      0.3,
      0.2
    );
    return arrow;
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0605);
    scene.fog = new THREE.Fog(0x0a0605, 30, 120);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 25, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffd700, 1.5);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4a90e2, 0.4);
    fill.position.set(-20, 15, -20);
    scene.add(fill);

    // Ground dengan warna pasir
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid subtle
    const grid = new THREE.GridHelper(200, 100, 0xd4af37, 0x5a4a2a);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.15;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Sumur Badar (lebih detail)
    const wellGroup = new THREE.Group();

    // Base batu
    const wellBaseGeo = new THREE.CylinderGeometry(2, 2.2, 1, 16);
    const wellBaseMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a1a,
      roughness: 0.8,
    });
    const wellBase = new THREE.Mesh(wellBaseGeo, wellBaseMat);
    wellBase.position.y = 0.5;
    wellBase.castShadow = true;
    wellBase.receiveShadow = true;
    wellGroup.add(wellBase);

    // Air
    const wellWaterGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16);
    const wellWaterMat = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      emissive: 0x4a90e2,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const wellWater = new THREE.Mesh(wellWaterGeo, wellWaterMat);
    wellWater.position.y = 1.05;
    wellGroup.add(wellWater);

    wellGroup.position.set(0, 0, 0);
    scene.add(wellGroup);
    wellRef.current = wellBase;

    // Ring
    const ringGeo = new THREE.RingGeometry(2.5, 3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    scene.add(ring);

    // Palm trees (kurma)
    function createPalm(x: number, z: number) {
      const group = new THREE.Group();

      const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 4, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a1a });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2;
      trunk.castShadow = true;
      group.add(trunk);

      for (let i = 0; i < 5; i++) {
        const leafGeo = new THREE.PlaneGeometry(0.5, 2);
        const leafMat = new THREE.MeshStandardMaterial({
          color: 0x2d5016,
          side: THREE.DoubleSide,
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
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

    // Beberapa pohon kurma di sekitar
    createPalm(-25, -15);
    createPalm(25, -15);
    createPalm(-25, 15);
    createPalm(25, 15);
    createPalm(-15, 25);
    createPalm(15, 25);

    // ==== BUAT UNIT ====

    // MUSLIM (KIRI)
    // 60 infantry
    for (let i = 0; i < 60; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const mesh = createUnitMesh("infantry", "muslim");
      const x = -20 + col * 1.2;
      const z = -6 + row * 1.2;
      mesh.position.set(x, 0.5, z);
      mesh.castShadow = true;
      mesh.userData = { type: "infantry", team: "muslim", row, col, originalX: x, originalZ: z };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "infantry",
        team: "muslim",
        row,
        col,
        originalX: x,
        originalZ: z,
        speed: 0.02,
        hp: 100,
        maxHp: 100,
      });
    }

    // 15 archer (di belakang)
    for (let i = 0; i < 15; i++) {
      const mesh = createUnitMesh("archer", "muslim");
      const x = -22 + i * 0.8;
      const z = -10;
      mesh.position.set(x, 0.6, z);
      mesh.castShadow = true;
      mesh.userData = { type: "archer", team: "muslim" };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "archer",
        team: "muslim",
        row: 0,
        col: i,
        originalX: x,
        originalZ: z,
        speed: 0.01,
        hp: 80,
        maxHp: 80,
      });
    }

    // 2 cavalry (kuda)
    for (let i = 0; i < 2; i++) {
      const mesh = createUnitMesh("cavalry", "muslim");
      const x = -18;
      const z = 5 + i * 2;
      mesh.position.set(x, 0.7, z);
      mesh.castShadow = true;
      mesh.userData = { type: "cavalry", team: "muslim" };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "cavalry",
        team: "muslim",
        row: 0,
        col: i,
        originalX: x,
        originalZ: z,
        speed: 0.04,
        hp: 150,
        maxHp: 150,
      });
    }

    // 25 camel (unta)
    for (let i = 0; i < 25; i++) {
      const mesh = createUnitMesh("camel", "muslim");
      const x = -24;
      const z = -8 + i * 0.8;
      mesh.position.set(x, 0.9, z);
      mesh.castShadow = true;
      mesh.userData = { type: "camel", team: "muslim" };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "camel",
        team: "muslim",
        row: 0,
        col: i,
        originalX: x,
        originalZ: z,
        speed: 0.02,
        hp: 120,
        maxHp: 120,
      });
    }

    // Banner Muslim
    const muslimBanner = createBanner(0x2ecc71);
    muslimBanner.position.set(-18, 0, -12);
    scene.add(muslimBanner);

    // QURAISY (KANAN)
    // 70 infantry
    for (let i = 0; i < 70; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const mesh = createUnitMesh("infantry", "quraisy");
      const x = 20 - col * 1.2;
      const z = -6 + row * 1.2;
      mesh.position.set(x, 0.5, z);
      mesh.castShadow = true;
      mesh.userData = { type: "infantry", team: "quraisy", row, col, originalX: x, originalZ: z };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "infantry",
        team: "quraisy",
        row,
        col,
        originalX: x,
        originalZ: z,
        speed: 0.02,
        hp: 100,
        maxHp: 100,
      });
    }

    // 20 archer Quraisy
    for (let i = 0; i < 20; i++) {
      const mesh = createUnitMesh("archer", "quraisy");
      const x = 22 - i * 0.8;
      const z = -10;
      mesh.position.set(x, 0.6, z);
      mesh.castShadow = true;
      mesh.userData = { type: "archer", team: "quraisy" };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "archer",
        team: "quraisy",
        row: 0,
        col: i,
        originalX: x,
        originalZ: z,
        speed: 0.01,
        hp: 80,
        maxHp: 80,
      });
    }

    // 10 cavalry Quraisy (300 asli, kita representasi)
    for (let i = 0; i < 10; i++) {
      const mesh = createUnitMesh("cavalry", "quraisy");
      const x = 22;
      const z = 3 + i * 1.5;
      mesh.position.set(x, 0.7, z);
      mesh.castShadow = true;
      mesh.userData = { type: "cavalry", team: "quraisy" };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "cavalry",
        team: "quraisy",
        row: 0,
        col: i,
        originalX: x,
        originalZ: z,
        speed: 0.04,
        hp: 150,
        maxHp: 150,
      });
    }

    // 15 camel Quraisy
    for (let i = 0; i < 15; i++) {
      const mesh = createUnitMesh("camel", "quraisy");
      const x = 25;
      const z = -8 + i * 0.9;
      mesh.position.set(x, 0.9, z);
      mesh.castShadow = true;
      mesh.userData = { type: "camel", team: "quraisy" };
      scene.add(mesh);
      unitsRef.current.push({
        mesh,
        type: "camel",
        team: "quraisy",
        row: 0,
        col: i,
        originalX: x,
        originalZ: z,
        speed: 0.02,
        hp: 120,
        maxHp: 120,
      });
    }

    // Banner Quraisy
    const quraisyBanner = createBanner(0xe74c3c);
    quraisyBanner.position.set(18, 0, -12);
    scene.add(quraisyBanner);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = Math.random() * 80 + 20;
      positions[i + 2] = (Math.random() - 0.5) * 300;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.2,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Animation
    let phaseTime = 0;
    let localPhase = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      if (isPlaying) {
        phaseTime += delta * speed;
        const currentPhaseData = PHASES[localPhase];

        if (phaseTime >= currentPhaseData.duration) {
          phaseTime = 0;
          localPhase = (localPhase + 1) % PHASES.length;
          setCurrentPhase(localPhase);
        }

        // Update units berdasarkan fase
        unitsRef.current.forEach((u) => {
          const mesh = u.mesh;
          const data = mesh.userData;

          if (u.team === "muslim") {
            if (localPhase === 2 || localPhase === 3) {
              // Maju ke sumur
              const tx = -5 + data.col * 0.8;
              const tz = -6 + data.row * 0.9;
              mesh.position.x += (tx - mesh.position.x) * u.speed;
              mesh.position.z += (tz - mesh.position.z) * u.speed;
            } else if (localPhase === 4) {
              // Formasi
              const tx = -10 + data.col * 0.8;
              const tz = -6 + data.row * 0.9;
              mesh.position.x += (tx - mesh.position.x) * u.speed;
              mesh.position.z += (tz - mesh.position.z) * u.speed;
            } else if (localPhase === 5) {
              // Pertempuran - maju ke tengah
              const tx = -2 + data.col * 0.8;
              const tz = -6 + data.row * 0.9;
              mesh.position.x += (tx - mesh.position.x) * u.speed * 1.5;
              mesh.position.z += (tz - mesh.position.z) * u.speed * 1.5;
            } else if (localPhase === 6) {
              // Menang - maju terus
              const tx = 5 + data.col * 0.8;
              const tz = -6 + data.row * 0.9;
              mesh.position.x += (tx - mesh.position.x) * u.speed;
              mesh.position.z += (tz - mesh.position.z) * u.speed;
            }
          } else {
            // Quraisy
            if (localPhase >= 4) {
              const tx = 10 - data.col * 0.8;
              const tz = -6 + data.row * 0.9;
              mesh.position.x += (tx - mesh.position.x) * u.speed;
              mesh.position.z += (tz - mesh.position.z) * u.speed;
            }
          }

          // Pulse
          if (localPhase === 5) {
            const scale = 1 + Math.sin(Date.now() * 0.008 + data.row * 0.5) * 0.2;
            mesh.scale.setScalar(scale);
          } else {
            mesh.scale.setScalar(1);
          }
        });

        // Spawn arrows during battle phase
        if (localPhase === 5 && Math.random() > 0.85) {
          const side = Math.random() > 0.5 ? "muslim" : "quraisy";
          const fromX = side === "muslim" ? -15 + Math.random() * 5 : 15 - Math.random() * 5;
          const fromZ = -8 + Math.random() * 20;
          const from = new THREE.Vector3(fromX, 2, fromZ);
          const dir = new THREE.Vector3(side === "muslim" ? 1 : -1, 0.3, 0);
          const color = side === "muslim" ? 0xffd700 : 0xff4444;

          const arrow = createArrow(from, dir, color);
          scene.add(arrow);
          arrowsRef.current.push(arrow);

          // Remove setelah 1 detik
          setTimeout(() => {
            scene.remove(arrow);
            arrowsRef.current = arrowsRef.current.filter((a) => a !== arrow);
          }, 1000);
        }

        // Rotate well ring
        if (wellRef.current) {
          const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.15;
          wellRef.current.scale.set(pulse, 1, pulse);
        }

        // Stars rotate
        stars.rotation.y += delta * 0.03;
      }

      // Camera rotation
      const r = (rotation * Math.PI) / 180;
      camera.position.x = Math.sin(r) * zoom;
      camera.position.z = Math.cos(r) * zoom;
      camera.position.y = zoom * 0.6;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, rotation, zoom]);

  // Re-render when phase changes
  useEffect(() => {
    // Phase change trigger re-render
  }, [currentPhase]);

  // Recording
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
        a.download = `perang-badar-3d-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };

      mediaRecorder.start();
      setRecording(true);
      setIsPlaying(true);

      // Total durasi: 31 detik (4+4+4+4+4+6+5)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsPlaying(false);
        }
      }, 32000);
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

  const currentPhaseData = PHASES[currentPhase];

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-purple-500/20">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-purple-400 font-bold text-lg">
            🌐 Visualisasi 3D — Perang Badar
          </h3>
          <p className="text-slate-400 text-sm">
            {currentPhaseData.name}
          </p>
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
            onClick={() => {
              setIsPlaying(false);
              setCurrentPhase(0);
              window.location.reload();
            }}
            disabled={recording}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 text-sm"
          >
            ↺ Reset
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
              🎥 Record Video
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg animate-pulse text-sm"
            >
              ⏹ Stop ({Math.floor(31)}s)
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-lg border border-purple-500/30 overflow-hidden"
        style={{ height: "550px" }}
      />

      {/* Info Panel */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-purple-400 text-xs font-bold mb-1">PLOT SEJARAH</p>
          <p className="text-slate-200 text-sm leading-relaxed">
            {currentPhaseData.desc}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-4">
          <p className="text-cyan-400 text-xs font-bold mb-2">STATISTIK FASE</p>
          <div className="flex flex-wrap gap-1">
            {currentPhaseData.stats.map((s, i) => (
              <span
                key={i}
                className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
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
        <div>
          <label className="text-slate-400 text-sm mb-2 block">
            🔍 Zoom: {zoom}
          </label>
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

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-slate-300">Muslim Infantry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-700 rounded" />
          <span className="text-slate-300">Muslim Archer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-700 rounded" />
          <span className="text-slate-300">Kavaleri (Kuda)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-600 rounded" />
          <span className="text-slate-300">Unta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-slate-300">Quraisy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-slate-300">Sumur Badar</span>
        </div>
      </div>
    </div>
  );
}