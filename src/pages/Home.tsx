import { useMemo } from "react";
import { LayoutRenderer } from "../components/layout/LayoutRenderer";
import { LayoutSpec } from "../lib/design/LayoutSpec";
import { useApp } from "../context/AppContext";

const DEFAULT_HOME_LAYOUT: LayoutSpec = {
  version: 1,
  surface: "home",
  root: {
    type: "stack",
    direction: "col",
    gap: "lg",
    children: [
      { type: "widget", widgetId: "header" },
      { type: "widget", widgetId: "upcoming_tasks" },
      {
        type: "grid",
        columns: 2, // Renderer maps this to a 2-column grid
        gap: "lg",
        children: [
          {
            type: "stack",
            direction: "col",
            gap: "md",
            children: [
              { type: "widget", widgetId: "weekly_chart" },
              { type: "widget", widgetId: "stats_row" }
            ]
          },
          {
            type: "stack",
            direction: "col",
            gap: "md",
            children: [
              { type: "widget", widgetId: "recent_notes" },
              { type: "widget", widgetId: "category_breakdown" }
            ]
          }
        ]
      }
    ]
  }
};

export default function Home() {
  const { layouts } = useApp();
  
  const currentLayout = useMemo(() => {
    const customLayout = layouts.find(l => l.surface === "home");
    if (customLayout && customLayout.layout_spec && customLayout.layout_spec.root) {
      return customLayout.layout_spec;
    }
    return DEFAULT_HOME_LAYOUT;
  }, [layouts]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden w-full">
      <div className="px-4 md:px-8 py-6 md:py-8 w-full max-w-5xl mx-auto">
        <LayoutRenderer spec={currentLayout} />
      </div>
    </div>
  );
}
