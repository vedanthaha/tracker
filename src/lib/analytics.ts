import type { Task, Note, TaskCategory, NoteCategory } from "../context/AppContext";

/**
 * Converts a date to its UTC calendar-date key in `YYYY-MM-DD` format.
 *
 * @param d - The date to convert
 * @returns The date formatted as a UTC `YYYY-MM-DD` key
 */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function toDisplayDate(key: string): string {
  const d = new Date(key + "T00:00:00Z");
  return d.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Extracts a UTC calendar date key from an ISO timestamp.
 *
 * @param iso - The ISO timestamp, or `null` or `undefined` when unavailable
 * @returns The date in `YYYY-MM-DD` format, or `null` when no timestamp is provided
 */
function dayKeyFromISO(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 10);
}

// -- buckets ----------------------------------------------------
export interface ThirtyDayRow {
  date: string;
  key: string;
  added: number;
  completed: number;
}

export function getThirtyDays(tasks: Task[]): ThirtyDayRow[] {
  const mapAdded = new Map<string, number>();
  const mapCompleted = new Map<string, number>();
  for (const t of tasks) {
    const k = dayKeyFromISO(t.createdAt);
    if (k) mapAdded.set(k, (mapAdded.get(k) ?? 0) + 1);
    const ck = dayKeyFromISO(t.completedAt ?? null);
    if (t.completed && ck) mapCompleted.set(ck, (mapCompleted.get(ck) ?? 0) + 1);
  }
  const rows: ThirtyDayRow[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    rows.push({
      key,
      date: toDisplayDate(key),
      added: mapAdded.get(key) ?? 0,
      completed: mapCompleted.get(key) ?? 0,
    });
  }
  return rows;
}

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const WEEK_DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface WeekRow {
  day: WeekDay;
  work: number;
  focus: number;
  personal: number;
  health: number;
}

export function getWeekData(tasks: Task[]): WeekRow[] {
  // Last 7 days Mon-Sun bucket by createdAt
  // Build Mon..Sun structure
  const buckets: Record<WeekDay, Record<TaskCategory, number>> = {
    Mon: { work: 0, focus: 0, personal: 0, health: 0 },
    Tue: { work: 0, focus: 0, personal: 0, health: 0 },
    Wed: { work: 0, focus: 0, personal: 0, health: 0 },
    Thu: { work: 0, focus: 0, personal: 0, health: 0 },
    Fri: { work: 0, focus: 0, personal: 0, health: 0 },
    Sat: { work: 0, focus: 0, personal: 0, health: 0 },
    Sun: { work: 0, focus: 0, personal: 0, health: 0 },
  };
  // For "This Week" we use last 7 days window? To match UI Mon-Sun, map each task's weekday
  // Only include tasks from last 7 days to avoid all-time skew? Use last 7 days window.
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startKey = toDateKey(start);
  for (const t of tasks) {
    const k = dayKeyFromISO(t.createdAt);
    if (!k || k < startKey) continue;
    const d = new Date(t.createdAt);
    const jsDay = d.getUTCDay(); // 0 Sun .. 6 Sat
    const label: WeekDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][jsDay] as WeekDay;
    if (buckets[label]) buckets[label][t.category] = (buckets[label][t.category] ?? 0) + 1;
  }
  return WEEK_DAYS.map((day) => ({ day, ...buckets[day] }));
}

export interface MiniRow { day: string; tasks: number }

/**
 * Builds daily task totals for the current Monday–Sunday week.
 *
 * @param tasks - The tasks to include in the daily totals
 * @returns Rows containing each weekday and its total task count
 */
export function getMiniChartData(tasks: Task[]): MiniRow[] {
  const week = getWeekData(tasks);
  return week.map((r) => ({ day: r.day, tasks: r.work + r.focus + r.personal + r.health }));
}

/**
 * Calculates the percentage distribution of tasks across categories.
 *
 * @param tasks - The tasks to categorize
 * @returns Category entries with rounded percentages and associated display colors
 */
export function getTaskDistribution(tasks: Task[]): { name: string; value: number; color: string }[] {
  const total = tasks.length;
  if (total === 0) return [
    { name: "Work", value: 0, color: "#d4a853" },
    { name: "Deep Focus", value: 0, color: "#b48ee8" },
    { name: "Personal", value: 0, color: "#7eb8e8" },
    { name: "Health", value: 0, color: "#6fcf8a" },
  ];
  const counts: Record<string, number> = { work: 0, focus: 0, personal: 0, health: 0 };
  for (const t of tasks) counts[t.category] = (counts[t.category] ?? 0) + 1;
  return [
    { name: "Work", value: Math.round((counts.work / total) * 100), color: "#d4a853" },
    { name: "Deep Focus", value: Math.round((counts.focus / total) * 100), color: "#b48ee8" },
    { name: "Personal", value: Math.round((counts.personal / total) * 100), color: "#7eb8e8" },
    { name: "Health", value: Math.round((counts.health / total) * 100), color: "#6fcf8a" },
  ];
}

export function getNoteDistribution(notes: Note[]): { name: string; value: number; color: string }[] {
  const total = notes.length;
  if (total === 0) return [
    { name: "Work", value: 0, color: "#d4a853" },
    { name: "Personal", value: 0, color: "#7eb8e8" },
    { name: "Ideas", value: 0, color: "#b48ee8" },
    { name: "Journal", value: 0, color: "#6fcf8a" },
  ];
  const counts: Record<NoteCategory, number> = { work: 0, personal: 0, ideas: 0, journal: 0 };
  for (const n of notes) counts[n.category] = (counts[n.category] ?? 0) + 1;
  return [
    { name: "Work", value: Math.round((counts.work / total) * 100), color: "#d4a853" },
    { name: "Personal", value: Math.round((counts.personal / total) * 100), color: "#7eb8e8" },
    { name: "Ideas", value: Math.round((counts.ideas / total) * 100), color: "#b48ee8" },
    { name: "Journal", value: Math.round((counts.journal / total) * 100), color: "#6fcf8a" },
  ];
}

/**
 * Calculates the percentage distribution of tasks by priority.
 *
 * @param tasks - The tasks to classify by priority
 * @returns Priority entries for High, Medium, and Low with rounded percentage values and display colors
 */
export function getPriorityDistribution(tasks: Task[]): { name: string; value: number; color: string }[] {
  const total = tasks.length;
  if (total === 0) return [
    { name: "High", value: 0, color: "#e07070" },
    { name: "Medium", value: 0, color: "#d4a853" },
    { name: "Low", value: 0, color: "rgba(240,237,232,0.3)" },
  ];
  const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
  for (const t of tasks) counts[t.priority] = (counts[t.priority] ?? 0) + 1;
  return [
    { name: "High", value: Math.round((counts.high / total) * 100), color: "#e07070" },
    { name: "Medium", value: Math.round((counts.medium / total) * 100), color: "#d4a853" },
    { name: "Low", value: Math.round((counts.low / total) * 100), color: "rgba(240,237,232,0.3)" },
  ];
}

/**
 * Calculates the current consecutive-day activity streak from task activity.
 *
 * @param tasks - Tasks whose creation and completion dates contribute activity days
 * @returns The number of consecutive active days ending today or the most recent active day
 */
export function computeStreak(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const activeDays = new Set<string>();
  for (const t of tasks) {
    const k1 = dayKeyFromISO(t.createdAt);
    if (k1) activeDays.add(k1);
    if (t.completed) {
      const k2 = dayKeyFromISO(t.completedAt ?? t.createdAt);
      if (k2) activeDays.add(k2);
    }
  }
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 365; i++) {
    const key = toDateKey(cur);
    if (activeDays.has(key)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      // Allow today to be empty without breaking streak? If today has no activity, streak is from yesterday.
      // If streak==0 and today empty, look at yesterday
      if (streak === 0 && i === 0) {
        cur.setDate(cur.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

/**
 * Generates daily task activity data for the previous 84 days.
 *
 * @param tasks - The tasks used to count creation and completion activity.
 * @returns An array of daily activity records with date keys, task counts, and activity levels from 0 to 4.
 */
export function getHeatmap(tasks: Task[]): { date: string; count: number; level: number }[] {
  const map = new Map<string, number>();
  for (const t of tasks) {
    const k = dayKeyFromISO(t.createdAt);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
    if (t.completed) {
      const ck = dayKeyFromISO(t.completedAt ?? null);
      if (ck && ck !== k) map.set(ck, (map.get(ck) ?? 0) + 1);
    }
  }
  const today = new Date();
  const rows: { date: string; count: number; level: number }[] = [];
  // Last 84 days = 12 weeks
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    const count = map.get(key) ?? 0;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    rows.push({ date: key, count, level });
  }
  return rows;
}

export function getTasksThisWeek(tasks: Task[]): number {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startKey = toDateKey(start);
  return tasks.filter((t) => {
    const k = dayKeyFromISO(t.createdAt);
    return k !== null && k >= startKey;
  }).length;
}
