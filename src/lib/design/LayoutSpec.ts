export type LayoutNodeType = "grid" | "stack" | "widget" | "canvas";

export interface BaseLayoutNode {
  type: LayoutNodeType;
  id?: string;
}

export interface GridContainer extends BaseLayoutNode {
  type: "grid";
  columns: number;
  gap?: "sm" | "md" | "lg";
  children: LayoutNode[];
}

export interface StackContainer extends BaseLayoutNode {
  type: "stack";
  direction: "row" | "col";
  gap?: "sm" | "md" | "lg";
  children: LayoutNode[];
}

export interface CanvasContainer extends BaseLayoutNode {
  type: "canvas";
  columns: number;
  rowHeight: number;
  gap?: number;
  children: LayoutNode[];
}

export interface WidgetNode extends BaseLayoutNode {
  type: "widget";
  widgetId: string;
  props?: Record<string, any>;
  span?: number; // for grid spanning
  placement?: { column: number; row: number; columnSpan: number; rowSpan: number };
}

export type LayoutNode = GridContainer | StackContainer | WidgetNode | CanvasContainer;

export interface LayoutSpec {
  version: number;
  surface: string; // e.g., "home", "notes", "tasks"
  root: LayoutNode;
}

export interface WorkspaceLayout {
  id: string;
  user_id: string;
  surface: string;
  layout_spec: LayoutSpec;
  created_at: string;
  updated_at: string;
}
