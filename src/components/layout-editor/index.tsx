import React, { useState, useRef } from "react";
import { LayoutSpec, WidgetNode, LayoutNode, CanvasContainer } from "../../lib/design/LayoutSpec";
import { useLayoutEditor, LayoutEditorProvider } from "./LayoutEditorContext";
import { EditorToolbar } from "./EditorToolbar";
import { WidgetPicker } from "./WidgetPicker";
import { EditableNodeRenderer } from "./EditableNodeRenderer";
import { LayoutRenderer } from "../layout/LayoutRenderer";
import { findNode } from "./layoutOperations";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface LayoutEditorProps {
  spec: LayoutSpec;
  defaultSpec: LayoutSpec;
  onSave: (spec: LayoutSpec) => Promise<void>;
  children?: React.ReactNode;
}

export function LayoutEditor(props: LayoutEditorProps) {
  // Wrap with provider to ensure state doesn't leak across different pages/surfaces
  return (
    <LayoutEditorProvider>
      <LayoutEditorInner {...props} />
    </LayoutEditorProvider>
  );
}

function LayoutEditorInner({ spec, defaultSpec, onSave }: LayoutEditorProps) {
  const { isEditing, spec: editedSpec, startEditing, placeNode, dragPreviewPlacement, setDragPreviewPlacement } = useLayoutEditor();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeRect, setActiveRect] = useState<{ width: number, height: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentSpec = isEditing && editedSpec ? editedSpec : spec;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (event.active.rect.current.initial) {
      setActiveRect({
        width: event.active.rect.current.initial.width,
        height: event.active.rect.current.initial.height
      });
    }
    const node = findNode(currentSpec.root, event.active.id as string);
    if (node && node.type === "widget" && node.placement) {
      setDragPreviewPlacement(node.placement);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!canvasRef.current || !activeId) return;
    
    const node = findNode(currentSpec.root, activeId) as WidgetNode;
    if (!node || node.type !== "widget" || !node.placement) return;

    const { delta } = event;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const columns = currentSpec.root.type === "canvas" ? currentSpec.root.columns : 12;
    const rowHeight = currentSpec.root.type === "canvas" ? currentSpec.root.rowHeight : 120;
    
    const pxPerCol = canvasRect.width / columns;
    
    const deltaCols = Math.round(delta.x / pxPerCol);
    const deltaRows = Math.round(delta.y / rowHeight);
    
    const initialPlacement = node.placement;
    const newCol = Math.max(1, Math.min(columns - initialPlacement.columnSpan + 1, initialPlacement.column + deltaCols));
    const newRow = Math.max(1, initialPlacement.row + deltaRows);
    
    setDragPreviewPlacement({
      ...initialPlacement,
      column: newCol,
      row: newRow
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (activeId && dragPreviewPlacement) {
      placeNode(activeId, dragPreviewPlacement);
    }
    setActiveId(null);
    setActiveRect(null);
    setDragPreviewPlacement(null);
  };

  if (!isEditing) {
    return (
      <div className="relative group/editor h-full w-full">
        <LayoutRenderer spec={spec} />
        <div className="absolute top-4 right-4 opacity-0 group-hover/editor:opacity-100 transition-opacity z-50">
          <button
            onClick={() => startEditing(spec)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-medium text-sm shadow-md hover:brightness-110 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit Layout
          </button>
        </div>
      </div>
    );
  }

  const activeNode = activeId ? findNode(currentSpec.root, activeId) : null;
  const isCanvas = currentSpec.root.type === "canvas";
  const canvasRoot = currentSpec.root as CanvasContainer;
  const columns = isCanvas ? canvasRoot.columns : 12;
  const rowHeight = isCanvas ? canvasRoot.rowHeight : 40;
  const gap = isCanvas ? (canvasRoot.gap || 16) : 16;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="relative h-full w-full flex flex-col bg-[var(--background)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <EditorToolbar defaultSpec={defaultSpec} onSave={onSave} />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/5">
          <div 
            ref={canvasRef}
            className="w-full relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridAutoRows: `${rowHeight}px`,
              gap: `${gap}px`,
              // Full 2D background grid
              backgroundSize: `calc((100% - ${(columns - 1) * gap}px) / ${columns} + ${gap}px) ${rowHeight + gap}px`,
              backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
              backgroundPosition: `0 0, 0 0`
            }}
          >
            {isCanvas && currentSpec.root.type === "canvas" && currentSpec.root.children.map((child: LayoutNode, i: number) => (
               <React.Fragment key={child.id || i}>
                  <EditableNodeRenderer node={child} />
               </React.Fragment>
            ))}
            
            {/* 2D Drag Preview Placeholder highlight */}
            {dragPreviewPlacement && activeId && (
               <div 
                 className="bg-[var(--accent)] opacity-20 rounded-xl border-2 border-[var(--accent)] border-dashed z-0 pointer-events-none transition-all duration-100"
                 style={{
                   gridColumn: `${dragPreviewPlacement.column} / span ${dragPreviewPlacement.columnSpan}`,
                   gridRow: `${dragPreviewPlacement.row} / span ${dragPreviewPlacement.rowSpan}`
                 }}
               />
            )}
          </div>
          
          <div className="mt-8 border-t border-[var(--border)] pt-8">
             <WidgetPicker />
          </div>
        </div>

        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) as any}>
          {activeNode && activeRect ? (
            <div style={{ width: activeRect.width, height: activeRect.height }}>
              <EditableNodeRenderer node={activeNode} isOverlay={true} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
