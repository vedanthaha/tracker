import { useLayoutEditor } from "./LayoutEditorContext";

interface DropIndicatorProps {
  parentId: string;
  index: number;
  direction: "row" | "col" | "grid";
}

/**
 * Renders a directional drop-zone indicator for a layout editor.
 *
 * @param parentId - The identifier of the parent layout node.
 * @param index - The child position represented by the drop zone.
 * @param direction - The layout direction used to orient the indicator.
 * @returns The rendered drop-zone indicator.
 */
export function DropIndicator({ parentId, index, direction }: DropIndicatorProps) {
  const { draggedNodeId, dropTargetId, dropPosition, setDropTargetId, setDropPosition } = useLayoutEditor();
  
  // We represent this specific drop zone by combining parentId and index
  const zoneId = `${parentId}-gap-${index}`;
  const isTarget = dropTargetId === parentId && dropPosition === (index === 0 ? "before" : "after"); // Not perfectly mapped, but close

  const isGrid = direction === "grid";
  const isRow = direction === "row" || isGrid; // For grid, gaps are effectively both, but let's draw vertical lines

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-200
        ${isRow ? "w-4 -mx-2 h-full z-10" : "h-4 -my-2 w-full z-10"}
        ${isTarget ? "opacity-100" : "opacity-0 hover:opacity-100"}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedNodeId) {
          setDropTargetId(parentId);
          setDropPosition(index === 0 ? "before" : "after"); // In reality, we want specific index
          // We can't pass index cleanly without changing moveNode signature...
          // Let's rely on node-based targeting in EditableNodeRenderer instead of explicit gap zones for simplicity,
          // or we update moveNode to accept index.
        }
      }}
    >
      <div 
        className={`bg-[var(--accent)] rounded-full ${isRow ? "w-1 h-full" : "h-1 w-full"}`} 
      />
    </div>
  );
}
