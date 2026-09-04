import {
  HeaderWidget,
  StatsRowWidget,
  WeeklyChartWidget,
  UpcomingTasksWidget,
  FocusWidget,
  RecentNotesWidget,
  CategoryBreakdownWidget,
} from "../../components/widgets/HomeWidgets";

import {
  TaskHeaderWidget,
  TaskStatsWidget,
  TaskFiltersWidget,
  TaskListWidget,
} from "../../components/widgets/TasksWidgets";

import {
  NotesSidebarWidget,
  NotesEditorWidget,
} from "../../components/widgets/NotesWidgets";

export const ComponentManifest: Record<string, React.ComponentType<any>> = {
  header: HeaderWidget,
  stats_row: StatsRowWidget,
  weekly_chart: WeeklyChartWidget,
  upcoming_tasks: UpcomingTasksWidget,
  focus: FocusWidget,
  recent_notes: RecentNotesWidget,
  category_breakdown: CategoryBreakdownWidget,
  task_header: TaskHeaderWidget,
  task_stats: TaskStatsWidget,
  task_filters: TaskFiltersWidget,
  task_list: TaskListWidget,
  notes_sidebar: NotesSidebarWidget,
  notes_editor: NotesEditorWidget,
};

export interface WidgetMetadata {
  widgetId: string;
  title: string;
  icon?: string;
  allowedSurfaces: string[]; // e.g. "home", "notes", "*"
  draggable: boolean;
  resizable: boolean;
  hideable: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export const WidgetRegistry: Record<string, WidgetMetadata> = {
  header: {
    widgetId: "header",
    title: "Header",
    allowedSurfaces: ["home"],
    draggable: false,
    resizable: false,
    hideable: false,
  },
  stats_row: {
    widgetId: "stats_row",
    title: "Quick Stats",
    allowedSurfaces: ["home", "analytics"],
    draggable: true,
    resizable: false,
    hideable: true,
  },
  weekly_chart: {
    widgetId: "weekly_chart",
    title: "Weekly Activity",
    allowedSurfaces: ["home", "analytics"],
    draggable: true,
    resizable: true,
    hideable: true,
  },
  upcoming_tasks: {
    widgetId: "upcoming_tasks",
    title: "Upcoming Tasks",
    allowedSurfaces: ["home", "tasks"],
    draggable: true,
    resizable: true,
    hideable: true,
  },
  focus: {
    widgetId: "focus",
    title: "Focus Mode",
    allowedSurfaces: ["home"],
    draggable: true,
    resizable: false,
    hideable: true,
  },
  recent_notes: {
    widgetId: "recent_notes",
    title: "Recent Notes",
    allowedSurfaces: ["home", "notes"],
    draggable: true,
    resizable: true,
    hideable: true,
  },
  category_breakdown: {
    widgetId: "category_breakdown",
    title: "Category Breakdown",
    allowedSurfaces: ["home", "analytics"],
    draggable: true,
    resizable: false,
    hideable: true,
  },
  task_header: {
    widgetId: "task_header",
    title: "Task Header",
    allowedSurfaces: ["tasks"],
    draggable: false,
    resizable: false,
    hideable: false,
  },
  task_stats: {
    widgetId: "task_stats",
    title: "Task Stats",
    allowedSurfaces: ["tasks"],
    draggable: true,
    resizable: false,
    hideable: true,
  },
  task_filters: {
    widgetId: "task_filters",
    title: "Task Filters",
    allowedSurfaces: ["tasks"],
    draggable: true,
    resizable: false,
    hideable: false,
  },
  task_list: {
    widgetId: "task_list",
    title: "Task List",
    allowedSurfaces: ["tasks"],
    draggable: true,
    resizable: true,
    hideable: false,
  },
  notes_sidebar: {
    widgetId: "notes_sidebar",
    title: "Notes Sidebar",
    allowedSurfaces: ["notes"],
    draggable: true,
    resizable: true,
    hideable: false,
  },
  notes_editor: {
    widgetId: "notes_editor",
    title: "Notes Editor",
    allowedSurfaces: ["notes"],
    draggable: true,
    resizable: true,
    hideable: false,
  },
};
