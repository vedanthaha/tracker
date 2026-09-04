import { useState, useMemo } from "react";
import { useLayoutEditor } from "./LayoutEditorContext";
import { WidgetRegistry } from "../../lib/design/ComponentManifest";
import { findNode } from "./layoutOperations";

/**
 * Renders a floating menu for adding widgets to the layout during editing.
 */
export function WidgetPicker() {
  const { isEditing, spec, addNode } = useLayoutEditor();
  const [isOpen, setIsOpen] = useState(false);
  
  const availableWidgets = useMemo(() => {
    if (!spec) return [];
    
    // Recursive function to check if widgetId exists in tree
    const hasWidget = (node: any, widgetId: string): boolean => {
      if (node.type === "widget" && node.widgetId === widgetId) return true;
      if (node.children) return node.children.some((c: any) => hasWidget(c, widgetId));
      return false;
    };

    return Object.values(WidgetRegistry).filter(meta => {
      // Must be allowed on surface
      if (!meta.allowedSurfaces.includes("*") && !meta.allowedSurfaces.includes(spec.surface)) return false;
      // If hideable, allow if not in layout
      if (!hasWidget(spec.root, meta.widgetId)) return true;
      return false;
    });
  }, [spec]);

  if (!isEditing || !spec) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div 
          className="w-64 rounded-xl shadow-2xl border backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-2 fade-in"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
        >
          <div className="p-3 border-b text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            Add Widget
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {availableWidgets.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: "var(--muted)" }}>
                No widgets available
              </div>
            ) : (
              availableWidgets.map(w => (
                <button
                  key={w.widgetId}
                  onClick={() => {
                    addNode(w.widgetId);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--foreground)" }}
                >
                  {w.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--foreground)", color: "var(--background)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12"/>
          ) : (
            <path d="M12 5v14M5 12h14"/>
          )}
        </svg>
      </button>
    </div>
  );
}
