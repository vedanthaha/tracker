import React from "react";
import { LayoutNode, LayoutSpec } from "../../lib/design/LayoutSpec";
import { ComponentManifest } from "../../lib/design/ComponentManifest";

interface LayoutRendererProps {
  spec: LayoutSpec;
}

export function LayoutRenderer({ spec }: LayoutRendererProps) {
  if (!spec || !spec.root) return null;
  return (
    <div className="layout-renderer w-full h-full bg-[var(--background)] text-[var(--foreground)]">
      {renderNode(spec.root)}
    </div>
  );
}

function renderNode(node: LayoutNode, keyPath: string = "root"): React.ReactNode {
  if (!node) return null;
  switch (node.type) {
    case "widget": {
      const WidgetComponent = ComponentManifest[node.widgetId];
      if (!WidgetComponent) {
        return (
          <div key={keyPath} className="p-4 border border-dashed border-red-500 text-red-500 text-sm">
            Unknown widget: {node.widgetId}
          </div>
        );
      }
      return (
        <div key={keyPath} className="widget-wrapper min-w-0 flex flex-col w-full h-full">
          <WidgetComponent {...(node.props || {})} />
        </div>
      );
    }
    case "grid": {
      const cols = node.columns <= 12 ? node.columns : 12;
      const gapClass = node.gap === "sm" ? "gap-2" : node.gap === "lg" ? "gap-8" : "gap-4 md:gap-5";
      
      const colMap: Record<number, string> = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        12: "md:grid-cols-12",
      };

      let gridClass = `grid grid-cols-1 ${colMap[cols] || "md:grid-cols-1"} ${gapClass}`;
      
      // Hack for our specific home layout to look exactly the same
      if (node.id === "home-main-grid") {
        gridClass = `grid grid-cols-1 lg:grid-cols-[1fr_300px] ${gapClass}`;
      }

      return (
        <div key={keyPath} className={`${gridClass} w-full`}>
          {node.children?.map((child, index) => renderNode(child, `${keyPath}-${index}`))}
        </div>
      );
    }
    case "stack": {
      const dirClass = node.direction === "col" ? "flex flex-col" : "flex flex-row";
      const gapClass = node.gap === "sm" ? "gap-2" : node.gap === "lg" ? "gap-8" : "gap-4 md:gap-5";
      return (
        <div key={keyPath} className={`${dirClass} ${gapClass} w-full min-w-0`}>
          {node.children?.map((child, index) => renderNode(child, `${keyPath}-${index}`))}
        </div>
      );
    }
    case "canvas": {
      const columns = node.columns || 12;
      const rowHeight = node.rowHeight || 40;
      const gap = node.gap || 16;
      
      const spanMap: Record<number, string> = {
        1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
        5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
        9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12"
      };
      
      return (
        <div 
          key={keyPath} 
          className="w-full relative"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: `minmax(${rowHeight}px, auto)`,
            gap: `${gap}px`
          }}
        >
          {node.children?.map((child, index) => {
            // we use the standard span mapping for widgets in the canvas
            const spanClass = child.type === "widget" && child.span && spanMap[child.span] ? spanMap[child.span] : "md:col-span-12";
            return (
              <div key={`${keyPath}-${index}`} className={`${spanClass} w-full h-full min-w-0 min-h-0`}>
                {renderNode(child, `${keyPath}-${index}`)}
              </div>
            );
          })}
        </div>
      );
    }
    default:
      return null;
  }
}
