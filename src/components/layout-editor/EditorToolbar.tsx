import { useLayoutEditor } from "./LayoutEditorContext";
import { LayoutSpec } from "../../lib/design/LayoutSpec";

interface EditorToolbarProps {
  onSave: (spec: LayoutSpec) => Promise<void>;
  defaultSpec: LayoutSpec;
}

/**
 * Renders controls for undoing, redoing, resetting, discarding, and saving layout edits.
 *
 * @param onSave - Callback invoked with the finalized layout specification
 * @param defaultSpec - Layout specification restored when the user confirms a reset
 */
export function EditorToolbar({ onSave, defaultSpec }: EditorToolbarProps) {
  const { 
    isEditing, 
    spec,
    historyIndex, 
    history,
    undo, 
    redo, 
    reset, 
    discard, 
    finishEditing 
  } = useLayoutEditor();

  if (!isEditing || !spec) return null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = async () => {
    const finalSpec = finishEditing();
    if (finalSpec) {
      await onSave(finalSpec);
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-2xl shadow-xl border backdrop-blur-md"
      style={{ 
        background: "var(--surface-elevated)", 
        borderColor: "var(--border)"
      }}
    >
      <button 
        onClick={undo}
        disabled={!canUndo}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{ color: "var(--foreground)" }}
        title="Undo"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      
      <button 
        onClick={redo}
        disabled={!canRedo}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{ color: "var(--foreground)" }}
        title="Redo"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
      </button>

      <div className="w-px h-6 mx-1" style={{ background: "var(--border)" }} />

      <button 
        onClick={() => {
          if (confirm("Reset to default layout?")) {
            reset(defaultSpec);
          }
        }}
        className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        style={{ color: "var(--muted)" }}
      >
        Reset
      </button>

      <button 
        onClick={discard}
        className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        style={{ color: "var(--muted)" }}
      >
        Discard
      </button>

      <button 
        onClick={handleSave}
        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ml-1"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Save
      </button>
    </div>
  );
}
