import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GraphEngine, GNode, GEdge } from "../components/graph/GraphEngine";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

const CAT_COLORS: Record<string, string> = {
  work: "#d4a853",
  personal: "#7eb8e8",
  health: "#6fcf8a",
  focus: "#b48ee8",
  ideas: "#f0a0a0",
  journal: "#a0d0c0",
};

/**
 * Renders an interactive graph of application tasks and notes with selectable nodes and detail navigation.
 */
export default function Graph() {
  const { tasks, notes } = useApp();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GraphEngine | null>(null);

  // Initialize engine once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const engine = new GraphEngine(canvasRef.current);
    engine.onSelect = (id) => setSelectedId(id);
    engineRef.current = engine;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      engine.resize(width, height, window.devicePixelRatio || 1);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      engine.destroy();
    };
  }, []);

  // Update data when tasks/notes change
  useEffect(() => {
    if (!engineRef.current) return;

    const nodes: GNode[] = [];
    const edges: GEdge[] = [];
    
    // 1. Dynamic Categories (Hubs)
    const uniqueCats = new Set<string>();
    tasks.forEach(t => uniqueCats.add(t.category));
    notes.forEach(n => {
      const catKey = n.category === "ideas" || n.category === "journal" ? "personal" : n.category;
      uniqueCats.add(catKey);
    });
    
    uniqueCats.forEach((cat) => {
      nodes.push({
        id: `cat-${cat}`, type: "category",
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        category: cat, color: CAT_COLORS[cat] || "#888",
        r: 14,
      });
    });
    
    // 2. Tasks
    tasks.forEach((task) => {
      nodes.push({
        id: `task-${task.id}`, type: "task",
        label: task.text.length > 28 ? task.text.slice(0, 26) + "..." : task.text,
        sublabel: task.time, category: task.category,
        color: "#d4a853", // Task warm gold
        r: task.priority === "high" ? 9 : 7,
        completed: task.completed, originalId: task.id,
      });
      edges.push({ id: `et-${task.id}`, source: `task-${task.id}`, target: `cat-${task.category}`, kind: "cat" });
      
      if (task.linkedNoteId) {
        edges.push({ id: `el-${task.id}`, source: `task-${task.id}`, target: `note-${task.linkedNoteId}`, kind: "linked" });
      }
    });
    
    // 3. Notes
    notes.forEach((note) => {
      nodes.push({
        id: `note-${note.id}`, type: "note",
        label: note.title.length > 22 ? note.title.slice(0, 20) + "..." : note.title,
        category: note.category, color: "#9b8cc4", // Note violet
        r: 7, pinned: note.pinned, originalId: note.id,
      });
      // Map ideas/journal to personal for graph clustering
      const catKey = note.category === "ideas" || note.category === "journal" ? "personal" : note.category;
      edges.push({ id: `en-${note.id}`, source: `note-${note.id}`, target: `cat-${catKey}`, kind: "cat" });
    });

    engineRef.current.setData(nodes, edges);
    
    // Pass external selection back to engine in case it was cleared by UI
    if (engineRef.current.selectedId !== selectedId) {
      engineRef.current.selectedId = selectedId;
    }
    
    // Pass theme to engine and draw
    engineRef.current.setTheme(theme);
  }, [tasks, notes, selectedId, theme]);

  // Derived selected details
  const selectedNode = selectedId ? engineRef.current?.getNodes().find(n => n.id === selectedId) : null;
  const taskDetails = selectedNode?.type === "task" ? tasks.find(t => t.id === selectedNode.originalId) : null;
  const noteDetails = selectedNode?.type === "note" ? notes.find(n => n.id === selectedNode.originalId) : null;

  return (
    <div className="flex h-full w-full" style={{ background: "var(--background)" }}>
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ display: "block", outline: "none", touchAction: "none" }}
        />
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
           <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
             Graph
           </p>
           <button 
             onClick={() => engineRef.current?.fitToView()}
             className="w-fit font-mono-data text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 hover:bg-white/5"
             style={{ background: "color-mix(in srgb, var(--foreground) 6%, transparent)", color: "var(--muted)", border: "1px solid var(--card-border)" }}
           >
             Reset view
           </button>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence initial={false}>
        {selectedNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="flex-shrink-0 overflow-y-auto"
            style={{ background: "var(--card)", borderLeft: "1px solid var(--card-border)" }}
          >
            <div className="p-5" style={{ width: "260px" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                  {selectedNode.type}
                </p>
                <button onClick={() => setSelectedId(null)} style={{ color: "var(--muted)" }}>
                  X
                </button>
              </div>

              <div className="flex items-start gap-3 mb-5">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                  style={{ background: selectedNode.color, boxShadow: `0 0 8px ${selectedNode.color}60` }}
                />
                <p className="font-display text-lg leading-snug" style={{ color: "var(--foreground)" }}>
                  {selectedNode.label}
                </p>
              </div>

              <div className="mb-4">
                <p className="font-mono-data text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Category</p>
                <span className="font-mono-data text-xs px-2 py-1 rounded-full" style={{ background: `${CAT_COLORS[selectedNode.category] ?? "#888"}18`, color: CAT_COLORS[selectedNode.category] ?? "#888", border: `1px solid ${CAT_COLORS[selectedNode.category] ?? "#888"}30` }}>
                  {selectedNode.category}
                </span>
              </div>

              {taskDetails && (
                <div className="mt-8">
                   <button
                    onClick={() => navigate("/dashboard/todos")}
                    className="w-full py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-80"
                    style={{ background: "rgba(212,168,83,0.1)", color: "var(--accent)", border: "1px solid rgba(212,168,83,0.2)" }}
                  >
                    Open in Tasks -&gt;
                  </button>
                </div>
              )}
              {noteDetails && (
                <div className="mt-8">
                  <div className="mb-4">
                    <p className="font-mono-data text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Preview</p>
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--muted)" }}>
                      {(() => {
                        const content = noteDetails.content;
                        if (!content) return "Empty note";
                        if (typeof content === "string") {
                          if (content.trim().startsWith("{")) {
                            try {
                              const parsed = JSON.parse(content);
                              const extract = (node: any): string => {
                                if (!node) return "";
                                if (node.type === "text") return node.text || "";
                                if (Array.isArray(node.content)) return node.content.map(extract).join(" ");
                                return "";
                              };
                              return extract(parsed).slice(0, 100) || "Rich content note";
                            } catch {
                              return content.slice(0, 100);
                            }
                          }
                          return content.slice(0, 100) || "Empty note";
                        }
                        const extract = (node: any): string => {
                          if (!node) return "";
                          if (node.type === "text") return node.text || "";
                          if (Array.isArray(node.content)) return node.content.map(extract).join(" ");
                          return "";
                        };
                        return extract(content).slice(0, 100) || "Rich content note";
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard/notes")}
                    className="w-full py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-80"
                    style={{ background: "rgba(155,140,196,0.1)", color: "#9b8cc4", border: "1px solid rgba(155,140,196,0.2)" }}
                  >
                    Open in Notes -&gt;
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
