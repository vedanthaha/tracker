import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { nanoid } from "nanoid";
import { LayoutSpec, LayoutNode } from "../../lib/design/LayoutSpec";
import { ensureNodeIds, removeNode, insertNode, updateNode, findNode, pruneEmptyContainers, findParent } from "./layoutOperations";

interface LayoutEditorState {
  isEditing: boolean;
  spec: LayoutSpec | null;
  history: LayoutSpec[];
  historyIndex: number;
  selectedNodeId: string | null;
}

interface LayoutEditorContextType extends LayoutEditorState {
  startEditing: (spec: LayoutSpec) => void;
  commitChanges: (newRoot: LayoutNode) => void;
  undo: () => void;
  redo: () => void;
  reset: (defaultSpec: LayoutSpec) => void;
  discard: () => void;
  finishEditing: () => LayoutSpec | null;
  
  selectNode: (id: string | null) => void;
  updateNodeProps: (id: string, updates: Partial<LayoutNode>) => void;
  removeNodeById: (id: string) => void;
  moveNode: (sourceId: string, targetParentId: string, targetIndex?: number | "before" | "after" | "inside") => void;
  addNode: (widgetId: string) => void;
  
  // Drag state
  draggedNodeId: string | null;
  setDraggedNodeId: (id: string | null) => void;
  dropTargetId: string | null;
  setDropTargetId: (id: string | null) => void;
  dropPosition: "before" | "after" | "inside" | null;
  setDropPosition: (pos: "before" | "after" | "inside" | null) => void;

  placeNode: (id: string, placement: { column: number; row: number; columnSpan: number; rowSpan: number }) => void;
  dragPreviewPlacement: { column: number; row: number; columnSpan: number; rowSpan: number } | null;
  setDragPreviewPlacement: (placement: { column: number; row: number; columnSpan: number; rowSpan: number } | null) => void;
}

const LayoutEditorContext = createContext<LayoutEditorContextType | null>(null);

/**
 * Provides layout editing state and operations to descendant components through React context.
 *
 * @param children - Components that access the layout editor context
 */
export function LayoutEditorProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [spec, setSpec] = useState<LayoutSpec | null>(null);
  
  const [history, setHistory] = useState<LayoutSpec[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);

  const startEditing = useCallback((initialSpec: LayoutSpec) => {
    const initializedSpec = {
      ...initialSpec,
      root: ensureNodeIds(initialSpec.root)
    };
    setSpec(initializedSpec);
    setHistory([initializedSpec]);
    setHistoryIndex(0);
    setIsEditing(true);
    setSelectedNodeId(null);
  }, []);

  const commitChanges = useCallback((newRoot: LayoutNode) => {
    if (!spec) return;
    
    // Prune empty arrays (except root) to keep things clean
    let cleanedRoot = pruneEmptyContainers(newRoot);
    if (!cleanedRoot) cleanedRoot = newRoot;

    const newSpec = { ...spec, root: cleanedRoot };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newSpec);
      // Keep max 50 history states
      if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    setSpec(newSpec);
  }, [spec, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setSpec(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setSpec(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const reset = useCallback((defaultSpec: LayoutSpec) => {
    const initializedSpec = {
      ...defaultSpec,
      root: ensureNodeIds(defaultSpec.root)
    };
    commitChanges(initializedSpec.root);
  }, [commitChanges]);

  const discard = useCallback(() => {
    setIsEditing(false);
    setSpec(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedNodeId(null);
  }, []);

  const finishEditing = useCallback(() => {
    const finalSpec = spec;
    setIsEditing(false);
    setSpec(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedNodeId(null);
    return finalSpec;
  }, [spec]);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const updateNodeProps = useCallback((id: string, updates: Partial<LayoutNode>) => {
    if (!spec) return;
    const newRoot = updateNode(spec.root, id, updates);
    commitChanges(newRoot);
  }, [spec, commitChanges]);

  const removeNodeById = useCallback((id: string) => {
    if (!spec) return;
    const newRoot = removeNode(spec.root, id);
    if (newRoot) commitChanges(newRoot);
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [spec, commitChanges, selectedNodeId]);

  const moveNode = useCallback((sourceId: string, targetId: string, position: number | "before" | "after" | "inside" = "inside") => {
    if (!spec) return;
    if (sourceId === targetId) return;

    const sourceNode = findNode(spec.root, sourceId);
    if (!sourceNode) return;

    // Prevent dragging a node into its own descendant
    let current = findNode(spec.root, targetId);
    while (current) {
      if (current.id === sourceId) return; // Invalid move
      const parent = findParent(spec.root, current.id!);
      current = parent;
    }

    // Remove source node
    let newRoot = removeNode(spec.root, sourceId);
    if (!newRoot) return;

    if (position === "inside") {
      const targetNode = findNode(newRoot, targetId);
      if (targetNode?.type === "grid" || targetNode?.type === "stack") {
        newRoot = insertNode(newRoot, targetId, sourceNode);
      }
    } else {
      const parent = findParent(newRoot, targetId);
      if (parent) {
        const targetIndex = parent.children.findIndex(c => c.id === targetId);
        const insertIdx = position === "before" ? targetIndex : targetIndex + 1;
        newRoot = insertNode(newRoot, parent.id!, sourceNode, insertIdx);
      }
    }

    if (newRoot) {
      commitChanges(newRoot);
    }
  }, [spec, commitChanges]);

  const addNode = useCallback((widgetId: string) => {
    if (!spec) return;
    // Add to the top of the root container by default
    const newNode: LayoutNode = { id: nanoid(), type: "widget", widgetId };
    if (spec.root.type === "grid" || spec.root.type === "stack") {
       const newRoot = insertNode(spec.root, spec.root.id!, newNode, 0);
       commitChanges(newRoot);
    }
  }, [spec, commitChanges]);

  const [dragPreviewPlacement, setDragPreviewPlacement] = useState<{ column: number; row: number; columnSpan: number; rowSpan: number } | null>(null);

  const placeNode = useCallback((id: string, placement: { column: number; row: number; columnSpan: number; rowSpan: number }) => {
    if (!spec) return;
    const newRoot = updateNode(spec.root, id, { placement });
    commitChanges(newRoot);
  }, [spec, commitChanges]);

  return (
    <LayoutEditorContext.Provider value={{
      isEditing, spec, history, historyIndex, selectedNodeId,
      startEditing, commitChanges, undo, redo, reset, discard, finishEditing,
      selectNode, updateNodeProps, removeNodeById, moveNode, addNode,
      draggedNodeId, setDraggedNodeId, dropTargetId, setDropTargetId, dropPosition, setDropPosition,
      placeNode, dragPreviewPlacement, setDragPreviewPlacement
    }}>
      {children}
    </LayoutEditorContext.Provider>
  );
}

/**
 * Provides access to the layout editor context.
 *
 * @returns The current layout editor context
 * @throws If called outside a `LayoutEditorProvider`
 */
export function useLayoutEditor() {
  const ctx = useContext(LayoutEditorContext);
  if (!ctx) throw new Error("useLayoutEditor must be used within LayoutEditorProvider");
  return ctx;
}
