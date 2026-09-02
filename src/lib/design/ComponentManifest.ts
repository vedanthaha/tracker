import {
  HeaderWidget,
  StatsRowWidget,
  WeeklyChartWidget,
  UpcomingTasksWidget,
  FocusWidget,
  RecentNotesWidget,
  CategoryBreakdownWidget,
} from "../../components/widgets/HomeWidgets";

export const ComponentManifest: Record<string, React.ComponentType<any>> = {
  header: HeaderWidget,
  stats_row: StatsRowWidget,
  weekly_chart: WeeklyChartWidget,
  upcoming_tasks: UpcomingTasksWidget,
  focus: FocusWidget,
  recent_notes: RecentNotesWidget,
  category_breakdown: CategoryBreakdownWidget,
};
