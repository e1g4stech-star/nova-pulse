"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Navbar from "@/components/Navbar";

const NODE_TYPES = {
  input: { label: "Input Ide", color: "#3b82f6" },
  ai: { label: "AI Generate", color: "#a855f7" },
  output: { label: "Output", color: "#22c55e" },
};

const initialNodes: Node[] = [
  { id: "1", position: { x: 100, y: 100 }, data: { label: "Input Ide" }, style: { background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: 10 } },
  { id: "2", position: { x: 400, y: 100 }, data: { label: "Generate Naskah" }, style: { background: "#a855f7", color: "white", border: "none", borderRadius: 8, padding: 10 } },
  { id: "3", position: { x: 700, y: 100 }, data: { label: "Hasil Akhir" }, style: { background: "#22c55e", color: "white", border: "none", borderRadius: 8, padding: 10 } },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

export default function AiWorkflowPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [workflowName, setWorkflowName] = useState("Workflow Saya");
  const [saving, setSaving] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  async function saveWorkflow() {
    setSaving(true);
    try {
      const res = await fetch("/api/studio/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, nodes, edges }),
      });
      if (res.ok) {
        alert("✅ Workflow berhasil disimpan!");
      } else {
        const d = await res.json();
        alert("❌ Gagal menyimpan: " + (d.error || "Unknown"));
      }
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function addNode(type: keyof typeof NODE_TYPES) {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 200 },
      data: { label: NODE_TYPES[type].label },
      style: { background: NODE_TYPES[type].color, color: "white", border: "none", borderRadius: 8, padding: 10 },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  return (
    <>
      <Navbar />
      <div style={{ height: "calc(100vh - 64px)", display: "flex" }}>
        <aside style={{ width: 240, padding: 16, borderRight: "1px solid var(--theme-border)", background: "var(--theme-bg-secondary)" }}>
          <h3 className="font-bold mb-4 text-sm">Tambah Node</h3>
          {(Object.keys(NODE_TYPES) as (keyof typeof NODE_TYPES)[]).map((key) => (
            <button
              key={key}
              onClick={() => addNode(key)}
              className="w-full text-left px-3 py-2 rounded-lg mb-2 text-xs font-semibold"
              style={{ background: NODE_TYPES[key].color, color: "white" }}
            >
              + {NODE_TYPES[key].label}
            </button>
          ))}

          <hr className="my-4" style={{ borderColor: "var(--theme-border)" }} />

          <label className="block mb-2">
            <span className="text-xs font-semibold" style={{ color: "var(--theme-text-muted)" }}>Nama Workflow</span>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full mt-1 px-2 py-1.5 rounded border text-sm"
              style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}
            />
          </label>

          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="w-full py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 mt-2"
            style={{ background: "var(--accent-color)" }}
          >
            {saving ? "Menyimpan..." : "Simpan Workflow"}
          </button>

          <p className="text-xs mt-4" style={{ color: "var(--theme-text-muted)" }}>
            Tip: Tarik garis dari titik kanan node ke titik kiri node lain.
          </p>
        </aside>

        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </>
  );
}