"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow as ReactFlowRaw,
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

const ReactFlow = ReactFlowRaw as any;

const NODE_TYPES = {
  input: { label: "Input Ide", color: "#3b82f6" },
  ai: { label: "AI Generate", color: "#a855f7" },
  output: { label: "Output", color: "#22c55e" },
};

const initialNodes: Node[] = [
  { id: "1", position: { x: 100, y: 100 }, data: { label: "Input Ide", text: "" }, style: { background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: 10 } },
  { id: "2", position: { x: 400, y: 100 }, data: { label: "Generate Naskah", text: "" }, style: { background: "#a855f7", color: "white", border: "none", borderRadius: 8, padding: 10 } },
  { id: "3", position: { x: 700, y: 100 }, data: { label: "Hasil Akhir", text: "" }, style: { background: "#22c55e", color: "white", border: "none", borderRadius: 8, padding: 10 } },
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
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState("");
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editText, setEditText] = useState("");

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

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/workflow");
      if (res.ok) {
        const d = await res.json();
        setSavedWorkflows(d.workflows || []);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEditText((node.data.text as string) || "");
  }, []);

  function saveNodeEdit() {
    if (!selectedNode) return;

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...n.data, text: editText } };
        }
        return n;
      })
    );

    setSelectedNode(null);
    setEditText("");
    setToast("✅ Teks node diperbarui!");
    setTimeout(() => setToast(""), 3000);
  }

  async function saveWorkflow() {
    setSaving(true);
    try {
      const res = await fetch("/api/studio/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, nodes, edges }),
      });
      if (res.ok) {
        setToast("✅ Workflow berhasil disimpan!");
        setTimeout(() => setToast(""), 3000);
        loadWorkflows();
      } else {
        const d = await res.json();
        setToast("❌ Gagal: " + (d.error || "Unknown"));
        setTimeout(() => setToast(""), 3000);
      }
    } catch (e: any) {
      setToast("❌ Error: " + e.message);
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function runWorkflow() {
    setRunning(true);
    setToast("⏳ Menjalankan AI...");
    try {
      const res = await fetch("/api/studio/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      const d = await res.json();
      if (!res.ok) {
        setToast("❌ " + (d.error || "Gagal"));
        setTimeout(() => setToast(""), 5000);
        return;
      }

      // Update node output
      if (d.outputNodeId) {
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === d.outputNodeId ? { ...n, data: { ...n.data, text: d.result } } : n
          )
        );
      } else {
        // Kalau tidak ada node output, tambahkan node baru
        const newNode: Node = {
          id: `output-${Date.now()}`,
          position: { x: 700, y: 300 },
          data: { label: "Output", text: d.result },
          style: { background: "#22c55e", color: "white", border: "none", borderRadius: 8, padding: 10 },
        };
        setNodes((nds) => [...nds, newNode]);
      }

      setToast(`✅ Workflow selesai! (via ${d.provider})`);
      setTimeout(() => setToast(""), 4000);
    } catch (e: any) {
      setToast("❌ Error: " + e.message);
      setTimeout(() => setToast(""), 4000);
    } finally {
      setRunning(false);
    }
  }

  function loadWorkflow(wf: any) {
    if (wf.nodes) setNodes(wf.nodes);
    if (wf.edges) setEdges(wf.edges);
    setWorkflowName(wf.name);
    setToast("✅ Workflow dimuat!");
    setTimeout(() => setToast(""), 3000);
  }

  function addNode(type: keyof typeof NODE_TYPES) {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 200 },
      data: { label: NODE_TYPES[type].label, text: "" },
      style: { background: NODE_TYPES[type].color, color: "white", border: "none", borderRadius: 8, padding: 10 },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  return (
    <>
      <Navbar />
      <div style={{ height: "calc(100vh - 64px)", display: "flex" }}>
        <aside style={{ width: 260, padding: 16, borderRight: "1px solid var(--theme-border)", background: "var(--theme-bg-secondary)", overflowY: "auto" }}>
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

          <button
            onClick={runWorkflow}
            disabled={running}
            className="w-full py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 mt-2"
            style={{ background: "#a855f7" }}
          >
            {running ? "⏳ Menjalankan..." : "▶ Jalankan AI"}
          </button>

          <hr className="my-4" style={{ borderColor: "var(--theme-border)" }} />

          <h3 className="font-bold mb-2 text-sm">Workflow Tersimpan</h3>
          {savedWorkflows.length === 0 && (
            <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Belum ada.</p>
          )}
          {savedWorkflows.map((wf) => (
  <div key={wf.id} className="flex items-center gap-1 mb-1">
    <button
      onClick={() => loadWorkflow(wf)}
      className="flex-1 text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 truncate"
      style={{ color: "var(--theme-text-primary)" }}
    >
      {wf.name}
    </button>
    <button
      onClick={async () => {
        if (!confirm(`Hapus "${wf.name}"?`)) return;
        await fetch(`/api/studio/workflow/${wf.id}`, { method: "DELETE" });
        loadWorkflows();
      }}
      className="text-xs px-1.5 py-1 rounded hover:bg-red-500/20"
      style={{ color: "#fca5a5" }}
    >
      x
    </button>
  </div>
))}

          <p className="text-xs mt-4" style={{ color: "var(--theme-text-muted)" }}>
            Tip: Klik node untuk mengedit isinya. Klik "Jalankan AI" untuk memproses.
          </p>
        </aside>

        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-xl border p-5" style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)" }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Edit Node: {selectedNode.data.label as string}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-xl">x</button>
            </div>
            <label className="block mb-3">
              <span className="text-xs font-semibold" style={{ color: "var(--theme-text-muted)" }}>
                Isi / Instruksi
              </span>
              <textarea
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Ketik ide, instruksi AI, atau teks output di sini..."
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--theme-border)" }}
              >
                Batal
              </button>
              <button
                onClick={saveNodeEdit}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: "var(--accent-color)" }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg" style={{ background: "#22c55e", color: "white", maxWidth: 400 }}>
          {toast}
        </div>
      )}
    </>
  );
}