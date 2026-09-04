export const ALLOWED_SURFACES = ["home", "todos", "notes", "analytics", "graph"] as const;
export type Surface = typeof ALLOWED_SURFACES[number];

export interface WidgetManifest {
  id: string;
  purpose: string;
  supportedSurfaces: Surface[];
}

export const SERVER_COMPONENT_MANIFEST: WidgetManifest[] = [
  { id: "header", purpose: "Greets the user and shows the current date.", supportedSurfaces: ["home", "todos", "notes", "analytics", "graph"] },
  { id: "stats_row", purpose: "Displays 4 key statistics horizontally.", supportedSurfaces: ["home", "analytics"] },
  { id: "weekly_chart", purpose: "Shows a bar chart of activity over the week.", supportedSurfaces: ["home", "analytics"] },
  { id: "upcoming_tasks", purpose: "Displays a list of upcoming tasks.", supportedSurfaces: ["home", "todos"] },
  { id: "focus", purpose: "Shows the current priority/focus item.", supportedSurfaces: ["home", "notes", "todos"] },
  { id: "recent_notes", purpose: "Displays a list of recently edited notes.", supportedSurfaces: ["home", "notes"] },
  { id: "category_breakdown", purpose: "Shows a pie/doughnut chart of time/tasks by category.", supportedSurfaces: ["home", "analytics"] }
];

export const isValidSurface = (surface: string): surface is Surface => {
  return ALLOWED_SURFACES.includes(surface as Surface);
};

export const getWidgetsForSurface = (surface: Surface): string[] => {
  return SERVER_COMPONENT_MANIFEST
    .filter(w => w.supportedSurfaces.includes(surface))
    .map(w => w.id);
};
