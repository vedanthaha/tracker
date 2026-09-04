import { useMemo } from "react";
import { Link } from "react-router";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { getMiniChartData, computeStreak } from "../../lib/analytics";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CAT_COLORS: Record<string, string> = {
  work: "#d4a853",
  personal: "#7eb8e8",
  health: "#6fcf8a",
  focus: "#b48ee8",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#e07070",
  medium: "#d4a853",
  low: "color-mix(in srgb, var(--foreground) 20%, transparent)",
};

export function HeaderWidget() {
  const { tasks, user } = useApp();
  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8 w-full"
    >
      <div>
        <p className="font-mono-data text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>
          {dayName} · {dateStr}
        </p>
        <h1 className="font-display text-3xl md:text-4xl" style={{ color: "var(--foreground)" }}>
          {user?.name ? `Good morning, ${user.name.split(" ")[0]}.` : "Good morning."}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {completed === total && total > 0
            ? "All tasks done. Perfect day."
            : `${total - completed} task${total - completed !== 1 ? "s" : ""} remaining today.`}
        </p>
      </div>
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="self-start md:self-auto">
        <Link
          to="/dashboard/todos"
          className="text-sm px-4 py-2 rounded-lg transition-colors duration-150 hover:opacity-80 inline-block"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--muted)", textDecoration: "none" }}
        >
          View all tasks →
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function StatsRowWidget() {
  const { tasks, notes } = useApp();
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const high = tasks.filter((t) => t.priority === "high" && !t.completed).length;
  const streak = useMemo(() => computeStreak(tasks), [tasks]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 w-full">
      {[
        { label: "Completed", value: `${completed}/${total}`, sub: `${pct}% done`, color: "var(--green)" },
        { label: "High Priority", value: high.toString(), sub: "open items", color: "#e07070" },
        { label: "Notes", value: notes.length.toString(), sub: "total notes", color: "var(--accent)" },
        { label: "Day Streak", value: streak.toString(), sub: streak ? `${streak} day${streak !== 1 ? "s" : ""} in a row` : "no streak yet", color: "#b48ee8" },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
          className="p-4 md:p-5 rounded-xl flex flex-col justify-between"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <p className="font-mono-data text-[10px] md:text-xs tracking-widest uppercase mb-1 md:mb-2" style={{ color: "var(--muted)" }}>
            {s.label}
          </p>
          <p className="font-display text-2xl md:text-3xl mb-0.5" style={{ color: s.color }}>
            {s.value}
          </p>
          <p className="text-[10px] md:text-xs leading-tight" style={{ color: "var(--muted)" }}>{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{ background: "#1e1e1e", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
    >
      <p className="font-mono-data mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
      <p style={{ color: "var(--accent)" }}>{payload[0].value} tasks</p>
    </div>
  );
}

export function WeeklyChartWidget() {
  const { tasks } = useApp();
  const miniData = useMemo(() => getMiniChartData(tasks), [tasks]);
  const weeklyTotal = useMemo(() => miniData.reduce((s, d) => s + d.tasks, 0), [miniData]);
  const prevWeekTotal = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const prevTasks = tasks.filter((t) => {
      const k = new Date(t.createdAt).toISOString().slice(0, 10);
      const start = new Date();
      start.setDate(start.getDate() - 13);
      const mid = new Date();
      mid.setDate(mid.getDate() - 6);
      return k >= start.toISOString().slice(0, 10) && k < mid.toISOString().slice(0, 10);
    });
    return prevTasks.length;
  }, [tasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.32 }}
      className="p-5 rounded-xl w-full"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
            Weekly Output
          </p>
          <p className="font-display text-2xl mt-0.5" style={{ color: "var(--foreground)" }}>{weeklyTotal} tasks</p>
        </div>
        <span
          className="font-mono-data text-xs px-2 py-1 rounded-md"
          style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(111,207,138,0.2)" }}
        >
          {prevWeekTotal === 0 ? (weeklyTotal > 0 ? `+${weeklyTotal} vs last week` : "no change") : `${weeklyTotal >= prevWeekTotal ? "+" : ""}${Math.round(((weeklyTotal - prevWeekTotal) / prevWeekTotal) * 100)}% vs last week`}
        </span>
      </div>
      <div style={{ height: "140px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={miniData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a853" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#d4a853" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "color-mix(in srgb, var(--foreground) 35%, transparent)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "color-mix(in srgb, var(--foreground) 25%, transparent)", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "color-mix(in srgb, var(--foreground) 10%, transparent)" }} />
            <Area type="monotone" dataKey="tasks" stroke="#d4a853" strokeWidth={2} fill="url(#taskGradient)" dot={false} activeDot={{ r: 4, fill: "#d4a853", stroke: "var(--background)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function UpcomingTasksWidget() {
  const { tasks } = useApp();
  const upcomingTasks = tasks.filter((t) => !t.completed).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.32 }}
      className="rounded-xl overflow-hidden w-full"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--card-border)" }}>
        <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>Up Next</p>
        <Link to="/dashboard/todos" className="font-mono-data text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--accent)", textDecoration: "none" }}>
          All tasks →
        </Link>
      </div>
      {upcomingTasks.length === 0 ? (
        <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--muted)" }}>All done for today!</p>
      ) : (
        upcomingTasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 + idx * 0.05, duration: 0.22 }}
            className="flex items-center gap-4 px-5 py-3.5 task-item"
            style={{ borderBottom: idx < upcomingTasks.length - 1 ? "1px solid var(--card-border)" : "none" }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} />
            <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{task.text}</span>
            {task.time && <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{task.time}</span>}
            <span className="font-mono-data text-xs px-2 py-0.5 rounded-full" style={{ background: `${CAT_COLORS[task.category]}18`, color: CAT_COLORS[task.category], border: `1px solid ${CAT_COLORS[task.category]}30` }}>
              {task.category}
            </span>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

export function FocusWidget() {
  const { tasks } = useApp();
  const high = tasks.filter((t) => t.priority === "high" && !t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.3 }}
      className="p-5 rounded-xl w-full"
      style={{ background: "var(--accent-dim)", border: "1px solid rgba(212,168,83,0.2)" }}
    >
      <p className="font-mono-data text-xs tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>Today's Focus</p>
      <p className="font-display text-lg leading-snug mb-1" style={{ color: "var(--foreground)" }}>
        {tasks.filter((t) => t.priority === "high" && !t.completed)[0]?.text ?? "No high priority tasks remaining."}
      </p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{high} high-priority item{high !== 1 ? "s" : ""} open</p>
    </motion.div>
  );
}

export function RecentNotesWidget() {
  const { notes } = useApp();
  const recentNotes = notes.slice(0, 3);

  const getPreviewText = (content: any): string => {
    if (!content) return "";
    if (typeof content === "string") {
      if (content.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(content);
          return getPreviewText(parsed);
        } catch {
          return content.slice(0, 80);
        }
      }
      return content.slice(0, 80);
    }
    
    // It's an object (Tiptap JSON)
    const extract = (node: any): string => {
      if (!node) return "";
      if (node.type === "text") return node.text || "";
      if (Array.isArray(node.content)) {
        return node.content.map(extract).join(" ");
      }
      return "";
    };
    
    return extract(content).slice(0, 80) || "Rich content note...";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}
      className="rounded-xl overflow-hidden w-full"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--card-border)" }}>
        <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>Recent Notes</p>
        <Link to="/dashboard/notes" className="font-mono-data text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--accent)", textDecoration: "none" }}>
          All notes →
        </Link>
      </div>
      {recentNotes.map((note, idx) => (
        <Link
          key={note.id}
          to="/dashboard/notes"
          className="block px-5 py-3.5 task-item"
          style={{ borderBottom: idx < recentNotes.length - 1 ? "1px solid var(--card-border)" : "none", textDecoration: "none" }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{note.title}</p>
            {note.pinned && <span className="text-xs flex-shrink-0" style={{ color: "var(--accent)" }}>★</span>}
          </div>
          <p className="text-xs line-clamp-1" style={{ color: "var(--muted)" }}>{getPreviewText(note.content)}</p>
        </Link>
      ))}
    </motion.div>
  );
}

export function CategoryBreakdownWidget() {
  const { tasks } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.3 }}
      className="p-5 rounded-xl w-full"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <p className="font-mono-data text-xs tracking-widest uppercase mb-4" style={{ color: "var(--muted)" }}>By Category</p>
      {(["work", "focus", "personal", "health"] as const).map((cat, i) => {
        const catTotal = tasks.filter((t) => t.category === cat).length;
        const done = tasks.filter((t) => t.category === cat && t.completed).length;
        const barPct = catTotal ? (done / catTotal) * 100 : 0;
        return (
          <motion.div key={cat} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + i * 0.06, duration: 0.22 }} className="mb-3 last:mb-0">
            <div className="flex justify-between mb-1">
              <span className="text-xs capitalize" style={{ color: "var(--foreground)" }}>{cat}</span>
              <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{done}/{catTotal}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--foreground) 7%, transparent)" }}>
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${barPct}%` }} transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: "easeOut" }} style={{ background: CAT_COLORS[cat] }} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
