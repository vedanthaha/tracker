import React from "react";
import { LayoutNode } from "../../lib/design/LayoutSpec";
import { useLayoutEditor } from "./LayoutEditorContext";
import { ComponentManifest, WidgetRegistry } from "../../lib/design/ComponentManifest";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

/**
 * Provides a pointer control for adjusting a widget's column span.
 *
 * @param node - The widget node whose span is resized
 */
function WidgetResizeHandle({ node }: { node: LayoutNode }) {
  const { updateNodeProps } = useLayoutEditor();
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const initialSpan = node.type === "widget" && node.span ? node.span : 1;
    let newSpan = initialSpan;
    
    // Approximate column width (could be dynamic, but 80px works for threshold)
    const pxPerCol = 80; 
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const spanDelta = Math.round(deltaX / pxPerCol);
      const computedSpan = Math.max(1, Math.min(12, initialSpan + spanDelta));
      
      if (computedSpan !== newSpan) {
        newSpan = computedSpan;
        updateNodeProps(node.id!, { span: newSpan });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "nwse-resize";
  };
  
  return (
    <div 
      onMouseDown={handleMouseDown}
      className="absolute right-0 bottom-0 w-6 h-6 z-50 cursor-nwse-resize opacity-0 group-hover/widget:opacity-100 transition-opacity flex items-end justify-end p-1.5"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M9 1 L1 9 M9 5 L5 9 M9 9 L9 9.01" />
      </svg>
    </div>
  );
}

/**
 * Renders an editable widget, grid, or stack node with layout-editor interactions.
 *
 * @param node - The layout node to render.
 * @param isOverlay - Whether the node is rendered as a drag overlay.
 */
export function EditableNodeRenderer({ node, isOverlay = false }: { node: LayoutNode, isOverlay?: boolean }) {
  const { selectedNodeId, selectNode, removeNodeById, updateNodeProps } = useLayoutEditor();
  const isSelected = selectedNodeId === node.id;

  // Use Sortable for all nodes so they can be reordered
  // But only widgets have the drag handle to initiate dragging
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id!,
    data: {
      type: node.type,
      node,
    },
    disabled: node.type !== "widget", // only widgets are draggable
  });

  // Also make containers droppable targets explicitly
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.id!,
    data: {
      type: node.type,
      node,
    },
    disabled: node.type === "widget", // only containers are droppable targets for containers
  });

  // Combine refs if it's a container
  const setCombinedRef = (el: HTMLElement | null) => {
    setNodeRef(el);
    if (node.type !== "widget") {
      setDroppableRef(el);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  let inner: React.ReactNode = null;
  let layoutClass = "";

  if (node.type === "widget") {
    const WidgetComponent = ComponentManifest[node.widgetId];
    const meta = WidgetRegistry[node.widgetId];
    
    inner = (
      <div className="relative w-full h-full min-h-[100px] group/widget">
        
        {/* Drag Handle & Toolbar - Only visible on hover/selected */}
        {meta && !isOverlay && (
          <div className="absolute top-2 right-2 flex gap-1 z-50 opacity-0 group-hover/widget:opacity-100 transition-opacity">
            <div 
              {...attributes}
              {...listeners}
              onClick={(e) => {
                e.stopPropagation();
                selectNode(node.id!);
              }}
              className="p-1.5 rounded bg-black/50 text-white cursor-grab active:cursor-grabbing hover:bg-black/70 backdrop-blur-md outline-none"
              title="Drag to move"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>

            {isSelected && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeNodeById(node.id!); }}
                  className="p-1.5 rounded bg-black/50 text-white hover:bg-red-500 transition-colors backdrop-blur-md outline-none"
                  title="Remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Resize Handle */}
        {meta && isSelected && !isOverlay && <WidgetResizeHandle node={node} />}

        {/* The actual interactive widget content */}
        <div className="w-full h-full flex flex-col min-w-0 min-h-0" onClick={() => selectNode(node.id!)}>
          {WidgetComponent ? <WidgetComponent {...(node.props || {})} /> : <div>Unknown Widget</div>}
        </div>
      </div>
    );
  } else if (node.type === "grid") {
    const cols = node.columns <= 12 ? node.columns : 12;
    const gapClass = node.gap === "sm" ? "gap-2" : node.gap === "lg" ? "gap-8" : "gap-4 md:gap-5";
    
    const colMap: Record<number, string> = {
      1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 12: "md:grid-cols-12",
    };

    let gridClass = `grid grid-cols-1 ${colMap[cols] || "md:grid-cols-1"} ${gapClass}`;
    if ((node as any).id === "home-main-grid") {
      gridClass = `grid grid-cols-1 lg:grid-cols-[1fr_300px] ${gapClass}`;
    }
    layoutClass = `${gridClass} w-full p-2 border-2 border-transparent transition-colors`;
    if (isOver) layoutClass += " border-[var(--accent)] bg-[var(--accent)]/5";

    inner = (
      <SortableContext items={node.children.map(c => c.id!)} strategy={rectSortingStrategy}>
        {node.children.length === 0 ? (
          <div className="w-full min-h-[100px] border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--muted)] opacity-50">
            Empty Grid
          </div>
        ) : (
          node.children.map(child => (
            <EditableNodeRenderer key={child.id} node={child} />
          ))
        )}
      </SortableContext>
    );
  } else if (node.type === "stack") {
    const dirClass = node.direction === "col" ? "flex flex-col" : "flex flex-row";
    const gapClass = node.gap === "sm" ? "gap-2" : node.gap === "lg" ? "gap-8" : "gap-4 md:gap-5";
    layoutClass = `${dirClass} ${gapClass} w-full min-w-0 p-2 border-2 border-transparent transition-colors`;
    if (isOver) layoutClass += " border-[var(--accent)] bg-[var(--accent)]/5";

    inner = (
      <SortableContext items={node.children.map(c => c.id!)} strategy={rectSortingStrategy}>
        {node.children.length === 0 ? (
          <div className="w-full min-h-[100px] border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--muted)] opacity-50">
            Empty Stack
          </div>
        ) : (
          node.children.map(child => (
            <EditableNodeRenderer key={child.id} node={child} isOverlay={isOverlay} />
          ))
        )}
      </SortableContext>
    );
  }

  const spanMap: Record<number, string> = {
    1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
    5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
    9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12"
  };
  const spanClass = node.type === "widget" && node.span && spanMap[node.span] ? spanMap[node.span] : "md:col-span-12";

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={`relative rounded-xl min-w-0 min-h-0
        ${isSelected && node.type === "widget" ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] z-10" : "ring-0"}
        ${node.type !== "widget" ? layoutClass : `w-full transition-shadow duration-200 ${spanClass}`}
      `}
    >
      <div className="relative z-10 w-full h-full min-w-0 min-h-0">
        {inner}
      </div>
    </div>
  );
}
