import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useApp, Priority, TaskCategory } from "../../context/AppContext";
import { useTasksContext } from "../../context/TasksContext";

const CAT_COLORS: Record<TaskCategory, string> = {
  work: "#d4a853",
  personal: "#7eb8e8",
  health: "#6fcf8a",
  focus: "#b48ee8",
};

const CAT_LABELS: Record<TaskCategory, string> = {
  work: "Work",
  personal: "Personal",
  health: "Health",
  focus: "Deep Focus",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#e07070",
  medium: "#d4a853",
  low: "color-mix(in srgb, var(--foreground) 20%, transparent)",
};

/**
 * Renders a circular progress indicator for a value relative to a maximum.
 *
 * @param value - The current progress value
 * @param max - The maximum progress value
 * @param size - The diameter of the indicator in pixels
 */
function ProgressRing({ value, max, size = 56 }: { value: number; max: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = max === 0 ? circumference : circumference - (value / max) * circumference;
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="color-mix(in srgb, var(--foreground) 7%, transparent)" strokeWidth="2.5" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--green)" strokeWidth="2.5"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

/**
 * Renders the task manager heading and a button for opening the new-task modal.
 */
export function TaskHeaderWidget() {
  const { setShowModal } = useTasksContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full"
    >
      <div>
        <p className="font-mono-data text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Task Manager</p>
        <h1 className="font-display text-4xl" style={{ color: "var(--foreground)" }}>Tasks</h1>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
        style={{ background: "var(--accent)", color: "var(--background)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        New Task
      </motion.button>
    </motion.div>
  );
}

/**
 * Displays summary statistics for the current task list, including total, completed, remaining, and incomplete high-priority tasks.
 */
export function TaskStatsWidget() {
  const { tasks } = useApp();
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
      {[
        { label: "Total", value: total, color: "var(--foreground)" },
        { label: "Done", value: completed, color: "var(--green)" },
        { label: "Remaining", value: total - completed, color: "var(--accent)" },
        { label: "High Priority", value: tasks.filter((t) => t.priority === "high" && !t.completed).length, color: "#e07070" },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.28, ease: "easeOut" }}
          className="p-4 rounded-xl flex flex-col justify-between h-full"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <p className="font-mono-data text-[10px] md:text-xs tracking-widest uppercase mb-1.5" style={{ color: "var(--muted)" }}>{s.label}</p>
          <p className="font-display text-2xl md:text-3xl" style={{ color: s.color }}>{s.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Provides task category, priority, visibility, sorting, and completion-progress controls.
 */
export function TaskFiltersWidget() {
  const { tasks } = useApp();
  const {
    activeFilter, setActiveFilter,
    activePriority, setActivePriority,
    showDone, setShowDone,
    sortBy, setSortBy
  } = useTasksContext();

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.28 }}
      className="flex flex-wrap items-center gap-3 p-4 rounded-xl w-full"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "work", "focus", "personal", "health"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="font-mono-data text-xs px-3 py-1.5 rounded-md tracking-wide uppercase transition-all duration-150"
            style={{
              background: activeFilter === f ? "color-mix(in srgb, var(--foreground) 8%, transparent)" : "transparent",
              color: activeFilter === f ? "var(--foreground)" : "var(--muted)",
              border: activeFilter === f ? "1px solid var(--card-border)" : "1px solid transparent",
            }}
          >
            {f === "all" ? "All" : CAT_LABELS[f as TaskCategory].replace(" Focus", "")}
          </button>
        ))}
      </div>

      <div className="hidden md:block h-4 w-px" style={{ background: "var(--card-border)" }} />

      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "high", "medium", "low"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setActivePriority(p)}
            className="flex items-center gap-1.5 font-mono-data text-xs px-2.5 py-1.5 rounded-md transition-all duration-150"
            style={{
              background: activePriority === p ? "color-mix(in srgb, var(--foreground) 8%, transparent)" : "transparent",
              color: activePriority === p ? "var(--foreground)" : "var(--muted)",
              border: activePriority === p ? "1px solid var(--card-border)" : "1px solid transparent",
            }}
          >
            {p !== "all" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[p as Priority] }} />}
            <span className="capitalize">{p}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        className="font-mono-data text-xs px-2.5 py-1.5 rounded-md border outline-none cursor-pointer"
        style={{ background: "color-mix(in srgb, var(--foreground) 5%, transparent)", color: "var(--muted)", borderColor: "var(--card-border)" }}
      >
        <option value="added" style={{ background: "var(--surface-elevated)" }}>Sort: Added</option>
        <option value="priority" style={{ background: "var(--surface-elevated)" }}>Sort: Priority</option>
        <option value="time" style={{ background: "var(--surface-elevated)" }}>Sort: Time</option>
      </select>

      <button
        onClick={() => setShowDone(!showDone)}
        className="font-mono-data text-xs px-3 py-1.5 rounded-md transition-all duration-150"
        style={{
          background: showDone ? "color-mix(in srgb, var(--foreground) 8%, transparent)" : "transparent",
          color: showDone ? "var(--foreground)" : "var(--muted)",
          border: "1px solid var(--card-border)",
        }}
      >
        {showDone ? "Hide done" : "Show done"}
      </button>

      <div className="relative flex-shrink-0">
        <ProgressRing value={completed} max={total} />
        <div className="absolute inset-0 flex items-center justify-center font-mono-data text-xs" style={{ color: "var(--foreground)" }}>
          {total ? `${Math.round((completed / total) * 100)}%` : "0%"}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Displays the filtered and sorted task list with task actions and an option to add a new task.
 */
export function TaskListWidget() {
  const { tasks, toggleTask, deleteTask, notes } = useApp();
  const navigate = useNavigate();
  const { activeFilter, activePriority, showDone, sortBy, setShowModal } = useTasksContext();

  const filtered = useMemo(() => {
    let result = tasks;
    if (activeFilter !== "all") result = result.filter((t) => t.category === activeFilter);
    if (activePriority !== "all") result = result.filter((t) => t.priority === activePriority);
    if (!showDone) result = result.filter((t) => !t.completed);
    return [...result].sort((a, b) => {
      if (sortBy === "time") return (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
      if (sortBy === "priority") return ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]);
      return b.id - a.id;
    });
  }, [tasks, activeFilter, activePriority, showDone, sortBy]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32, duration: 0.28 }}
      className="rounded-xl overflow-hidden w-full h-full flex flex-col"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      {filtered.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-12 text-sm flex-1"
          style={{ color: "var(--muted)" }}
        >
          No tasks match your filters.
        </motion.p>
      )}

      <div className="flex-1 overflow-y-auto min-h-[300px]">
        <AnimatePresence initial={false}>
          {filtered.map((task, idx) => {
            const linkedNote = task.linkedNoteId ? notes.find((n) => n.id === task.linkedNoteId) : null;
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="task-item group flex items-center gap-4 px-5 py-4"
                style={{
                  borderBottom: idx < filtered.length - 1 ? "1px solid var(--card-border)" : "none",
                  opacity: task.completed ? 0.45 : 1,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
                  className={`task-checkbox ${task.completed ? "checked" : ""}`}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </motion.button>

                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} />

                <span
                  className="flex-1 text-sm"
                  style={{
                    textDecoration: task.completed ? "line-through" : "none",
                    color: task.completed ? "var(--muted)" : "var(--foreground)",
                    fontWeight: task.priority === "high" ? 500 : 400,
                  }}
                >
                  {task.text}
                </span>

                {linkedNote && (
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={() => navigate("/dashboard/notes")}
                    className="flex items-center gap-1.5 font-mono-data text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: "rgba(155,140,196,0.1)",
                      color: "#9b8cc4",
                      border: "1px solid rgba(155,140,196,0.25)",
                    }}
                    title={`Linked note: ${linkedNote.title}`}
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="3" r="2" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="2" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M6 5L2 8.5M6 5L10 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    note
                  </motion.button>
                )}

                {task.time && (
                  <span className="font-mono-data text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                    {task.time}
                  </span>
                )}

                <span
                  className="font-mono-data text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: `${CAT_COLORS[task.category]}18`,
                    color: CAT_COLORS[task.category],
                    border: `1px solid ${CAT_COLORS[task.category]}30`,
                  }}
                >
                  {CAT_LABELS[task.category]}
                </span>

                <motion.button
                  whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
                  style={{ color: "var(--muted)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ backgroundColor: "color-mix(in srgb, var(--foreground) 2%, transparent)" }}
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-3 px-5 py-4 group/add mt-auto"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        <span
          className="w-[18px] h-[18px] rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-150 group-hover/add:border-[var(--accent)]"
          style={{ border: "1.5px dashed color-mix(in srgb, var(--foreground) 15%, transparent)" }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 1V7M1 4H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-sm" style={{ color: "var(--muted)" }}>Add task or task + note...</span>
      </motion.button>
    </motion.div>
  );
}
