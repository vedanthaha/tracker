import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  getThirtyDays,
  getWeekData,
  getTaskDistribution,
  getNoteDistribution,
  getPriorityDistribution,
  computeStreak,
  getHeatmap,
  getTasksThisWeek,
} from "../lib/analytics";

const GOALS = [
  { name: "Tasks", value: 68, fill: "#d4a853" },
  { name: "Focus", value: 82, fill: "#b48ee8" },
  { name: "Notes", value: 55, fill: "#6fcf8a" },
  { name: "Streak", value: 90, fill: "#7eb8e8" },
];

const TT = {
  contentStyle: {
    background: "#1a1a1a",
    border: "1px solid color-mix(in srgb, var(--foreground) 7%, transparent)",
    borderRadius: "8px",
    fontSize: "11px",
    fontFamily: "JetBrains Mono, monospace",
    color: "#f0ede8",
  },
  labelStyle: { color: "color-mix(in srgb, var(--foreground) 40%, transparent)", marginBottom: "4px" },
};

const TICK = {
  fontSize: 10,
  fill: "color-mix(in srgb, var(--foreground) 30%, transparent)",
  fontFamily: "JetBrains Mono, monospace",
};

/**
 * Renders an animated card container with a title and content.
 *
 * @param title - The card title.
 * @param children - The content displayed inside the card.
 * @param className - Additional CSS classes applied to the card.
 * @param delay - The animation delay in seconds.
 */
function Card({ title, children, className = "", delay = 0 }: { title: string; children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`rounded-xl p-5 ${className}`}
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <p className="font-mono-data text-xs tracking-widest uppercase mb-5" style={{ color: "var(--muted)" }}>{title}</p>
      {children}
    </motion.div>
  );
}

/**
 * Renders a responsive donut chart with a legend for labeled percentage data.
 *
 * @param data - The chart segments, including their labels, percentage values, and colors.
 */
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const isEmpty = data.every((d) => d.value === 0);
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          No data yet
        </p>
      </div>
    );
  }
  return (
    <div>
      <div style={{ height: "160px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data as any[]} cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((d) => <Cell key={d.name} fill={d.color} opacity={0.85} />)}
            </Pie>
            <Tooltip {...TT} formatter={(v) => [`${v}%`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-xs" style={{ color: "var(--foreground)" }}>{d.name}</span>
            </div>
            <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders an analytics dashboard with task, note, productivity, and activity insights.
 */
export default function Analytics() {
  const { tasks, notes } = useApp();

  const thirtyDays = useMemo(() => getThirtyDays(tasks), [tasks]);
  const weekData = useMemo(() => getWeekData(tasks), [tasks]);
  const taskDist = useMemo(() => getTaskDistribution(tasks), [tasks]);
  const noteDist = useMemo(() => getNoteDistribution(notes), [notes]);
  const priorityDist = useMemo(() => getPriorityDistribution(tasks), [tasks]);
  const streak = useMemo(() => computeStreak(tasks), [tasks]);
  const tasksThisWeek = useMemo(() => getTasksThisWeek(tasks), [tasks]);
  const heatmap = useMemo(() => getHeatmap(tasks), [tasks]);

  const totalCompleted = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const completionRate = total ? Math.round((totalCompleted / total) * 100) : 0;
  const avgFocus = useMemo(() => {
    const totalCompletedInPeriod = thirtyDays.reduce((s, d) => s + d.completed, 0);
    return thirtyDays.length ? Math.round((totalCompletedInPeriod / 30) * 10) / 10 : 0;
  }, [thirtyDays]);

  const statsRow = [
    { label: "Total Tasks", value: total.toString(), change: total ? `${total} total` : "No tasks yet", up: true },
    { label: "Completion Rate", value: `${completionRate}%`, change: `${totalCompleted} done`, up: true },
    { label: "Notes Written", value: notes.length.toString(), change: notes.length ? `${notes.length} total` : "No notes", up: true },
    { label: "Avg Completed / Day", value: `${avgFocus}`, change: "last 30 days", up: true },
    { label: "Day Streak", value: streak.toString(), change: streak ? `${streak} day${streak !== 1 ? "s" : ""} in a row` : "Start a task to begin", up: streak > 0 },
    { label: "Tasks This Week", value: tasksThisWeek.toString(), change: "last 7 days", up: true },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-8"
        >
          <p className="font-mono-data text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Data Overview</p>
          <h1 className="font-display text-4xl" style={{ color: "var(--foreground)" }}>Analytics</h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {statsRow.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.28, ease: "easeOut" }}
              className="p-4 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <p className="font-mono-data text-xs tracking-wide uppercase mb-2 leading-tight" style={{ color: "var(--muted)" }}>{s.label}</p>
              <p className="font-display text-2xl mb-1" style={{ color: "var(--foreground)" }}>{s.value}</p>
              <p className="font-mono-data text-xs" style={{ color: s.up ? "var(--green)" : "#e07070" }}>{s.change}</p>
            </motion.div>
          ))}
        </div>

        {/* 30-day area chart */}
        <Card title="30-Day Productivity - Tasks Completed" className="mb-5" delay={0.36}>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={thirtyDays as any[]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a853" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#d4a853" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="addedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7eb8e8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#7eb8e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="color-mix(in srgb, var(--foreground) 4%, transparent)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip {...TT} cursor={{ stroke: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#d4a853" strokeWidth={2} fill="url(#completedGrad)" dot={false} activeDot={{ r: 4, fill: "#d4a853", stroke: "var(--background)", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="added" name="Added" stroke="#7eb8e8" strokeWidth={1.5} fill="url(#addedGrad)" dot={false} activeDot={{ r: 3, fill: "#7eb8e8" }} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3">
            {[["Completed", "#d4a853"], ["Added", "#7eb8e8"]].map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
                <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Row: stacked bar + radial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <Card title="Tasks by Category - This Week" delay={0.42}>
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData as any[]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={10}>
                  <CartesianGrid stroke="color-mix(in srgb, var(--foreground) 4%, transparent)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="day" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} cursor={{ fill: "color-mix(in srgb, var(--foreground) 3%, transparent)" }} />
                  <Bar dataKey="work" name="Work" stackId="a" fill="#d4a853" />
                  <Bar dataKey="focus" name="Focus" stackId="a" fill="#b48ee8" />
                  <Bar dataKey="personal" name="Personal" stackId="a" fill="#7eb8e8" />
                  <Bar dataKey="health" name="Health" stackId="a" fill="#6fcf8a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {[["Work", "#d4a853"], ["Focus", "#b48ee8"], ["Personal", "#7eb8e8"], ["Health", "#6fcf8a"]].map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Weekly Goals Progress" delay={0.46}>
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={GOALS as any[]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "color-mix(in srgb, var(--foreground) 4%, transparent)" }} />
                  <Tooltip {...TT} formatter={(v) => [`${v}%`, "Progress"]} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {GOALS.map((g) => (
                <div key={g.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: g.fill }} />
                  <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{g.name}</span>
                  <span className="font-mono-data text-xs" style={{ color: "var(--foreground)" }}>{g.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Three pie charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <Card title="Task Distribution" delay={0.5}>
            <DonutChart data={taskDist} />
          </Card>
          <Card title="Priority Breakdown" delay={0.54}>
            <DonutChart data={priorityDist} />
          </Card>
          <Card title="Notes by Category" delay={0.58}>
            <DonutChart data={noteDist} />
          </Card>
        </div>

        {/* Focus time - left for now (repurposed to real completed/day) */}
        <Card title="Daily Tasks Completed - 30 Days" className="mb-5" delay={0.62}>
          <div style={{ height: "180px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thirtyDays as any[]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="color-mix(in srgb, var(--foreground) 4%, transparent)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TT} cursor={{ stroke: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} formatter={(v) => [`${v}`, "Completed"]} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#b48ee8" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#b48ee8", stroke: "var(--background)", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-3">
            {[
              { label: "Average", value: `${avgFocus}`, color: "#b48ee8" },
              { label: "Best day", value: `${Math.max(...thirtyDays.map((d) => d.completed), 0)}`, color: "var(--green)" },
              { label: "This week", value: `${thirtyDays.slice(-7).reduce((s, d) => s + d.completed, 0)}`, color: "var(--accent)" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-mono-data text-[10px] md:text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                <p className="font-display text-base md:text-lg" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity heatmap - now real */}
        <Card title="Activity Heatmap - Last 12 Weeks" delay={0.66}>
          <div className="overflow-x-auto">
            <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
              {Array.from({ length: 12 }, (_, week) => (
                <div key={week} className="flex flex-col gap-1">
                  {heatmap.slice(week * 7, week * 7 + 7).map((cell, day) => {
                    const ops = [0.05, 0.2, 0.4, 0.65, 1];
                    return (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.66 + (week * 7 + day) * 0.003, duration: 0.15 }}
                        className="w-3.5 h-3.5 rounded-sm"
                        title={`${cell.date}: ${cell.count} task${cell.count !== 1 ? "s" : ""}`}
                        style={{ background: cell.level === 0 ? "color-mix(in srgb, var(--foreground) 5%, transparent)" : `rgba(212,168,83,${ops[cell.level]})` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>Less</span>
            {[0.05, 0.2, 0.4, 0.65, 1].map((o) => (
              <div key={o} className="w-3 h-3 rounded-sm" style={{ background: `rgba(212,168,83,${o})` }} />
            ))}
            <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>More</span>
          </div>
        </Card>

      </div>
    </div>
  );
}
