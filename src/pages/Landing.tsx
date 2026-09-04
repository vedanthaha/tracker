import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import BackgroundPixelStars from "../components/BackgroundPixelStars";
import DotMatrixText from "../components/DotMatrixText";

// -- Bento mini-components --------------------------------------------------

function TasksDemo() {
  const items = [
    { text: "Review Q3 strategy deck", cat: "color-mix(in srgb, var(--foreground) 50%, transparent)", done: false },
    { text: "Write newsletter draft", cat: "color-mix(in srgb, var(--foreground) 35%, transparent)", done: false },
    { text: "Morning run - 5 km", cat: "color-mix(in srgb, var(--foreground) 65%, transparent)", done: false },
    { text: "Refactor auth module", cat: "color-mix(in srgb, var(--foreground) 30%, transparent)", done: false },
  ];
  const [checked, setChecked] = useState([true, true, false, false]);

  useEffect(() => {
    const id = setInterval(() => {
      setChecked((prev) => {
        const first = prev.findIndex((v) => !v);
        if (first === -1) return [false, false, false, false];
        const next = [...prev];
        next[first] = true;
        return next;
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2.5 py-1">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2.5"
          animate={{ opacity: checked[i] ? 0.4 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            animate={{
              borderColor: checked[i] ? "color-mix(in srgb, var(--foreground) 70%, transparent)" : "color-mix(in srgb, var(--foreground) 18%, transparent)",
              background: checked[i] ? "color-mix(in srgb, var(--foreground) 8%, transparent)" : "transparent",
            }}
            style={{ border: "1.5px solid color-mix(in srgb, var(--foreground) 18%, transparent)", transition: "all 0.3s" }}
          >
            <AnimatePresence>
              {checked[i] && (
                <motion.svg
                  width="8" height="8" viewBox="0 0 8 8"
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
                >
                  <path d="M1 4L3 6L7 2" stroke="color-mix(in srgb, var(--foreground) 90%, transparent)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
          <span
            className="text-xs flex-1 truncate"
            style={{
              color: checked[i] ? "color-mix(in srgb, var(--foreground) 30%, transparent)" : "color-mix(in srgb, var(--foreground) 78%, transparent)",
              textDecoration: checked[i] ? "line-through" : "none",
              transition: "all 0.3s",
            }}
          >
            {item.text}
          </span>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.cat }} />
        </motion.div>
      ))}
    </div>
  );
}

function NotesDemo() {
  const full = "Clear head today. The work ahead feels manageable - focus on the newsletter draft first.";
  const [len, setLen] = useState(0);

  useEffect(() => {
    let i = 0;
    const forward = setInterval(() => {
      i++;
      if (i <= full.length) setLen(i);
      else {
        clearInterval(forward);
        setTimeout(() => setLen(0), 1400);
      }
    }, 32);
    return () => clearInterval(forward);
  }, [len === 0 ? 0 : undefined]);

  return (
    <div className="flex flex-col h-full justify-center">
      <div
        className="font-mono-data text-xs uppercase tracking-widest mb-2"
        style={{ color: "color-mix(in srgb, var(--foreground) 22%, transparent)" }}
      >
        Morning pages - Sep 1
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "color-mix(in srgb, var(--foreground) 70%, transparent)" }}>
        {full.slice(0, len)}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
          style={{ color: "color-mix(in srgb, var(--foreground) 70%, transparent)" }}
        >
          |
        </motion.span>
      </p>
    </div>
  );
}

function GraphDemo() {
  const nodes = [
    { x: 50, y: 48, r: 9, c: "#d4a853" },
    { x: 76, y: 28, r: 5, c: "#9b8cc4" },
    { x: 24, y: 30, r: 5, c: "#9b8cc4" },
    { x: 64, y: 68, r: 5, c: "#9b8cc4" },
    { x: 32, y: 64, r: 5, c: "#b48ee8" },
    { x: 82, y: 60, r: 4, c: "#d4a853" },
    { x: 14, y: 58, r: 4, c: "#7eb8e8" },
    { x: 68, y: 18, r: 4, c: "#6fcf8a" },
    { x: 42, y: 82, r: 4, c: "#d4a853" },
  ];
  const links = [[0, 1], [0, 2], [0, 3], [0, 4], [3, 5], [4, 6], [1, 7], [3, 8]];
  const [hov, setHov] = useState<number | null>(null);

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {links.map(([a, b], i) => {
        const s = nodes[a]!, t = nodes[b]!;
        const lit = hov === a || hov === b;
        return (
          <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke={lit ? "rgba(212,168,83,0.55)" : "color-mix(in srgb, var(--foreground) 9%, transparent)"}
            strokeWidth={lit ? 0.8 : 0.4}
            style={{ transition: "all 0.2s" }}
          />
        );
      })}
      {nodes.map((n, i) => (
        <g key={i} style={{ cursor: "pointer" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
        >
          {hov === i && <circle cx={n.x} cy={n.y} r={n.r + 5} fill={n.c} opacity={0.1} />}
          <motion.circle cx={n.x} cy={n.y} r={n.r} fill={n.c}
            animate={{ opacity: hov == null ? 0.72 : hov === i ? 1 : 0.22, r: hov === i ? n.r * 1.35 : n.r }}
            transition={{ duration: 0.2 }}
          />
        </g>
      ))}
    </svg>
  );
}

function AnalyticsDemo() {
  const bars = [
    { h: 60, label: "M", c: "#d4a853" }, { h: 85, label: "T", c: "#d4a853" },
    { h: 45, label: "W", c: "#b48ee8" }, { h: 92, label: "T", c: "#6fcf8a" },
    { h: 70, label: "F", c: "#d4a853" }, { h: 28, label: "S", c: "color-mix(in srgb, var(--foreground) 12%, transparent)" },
    { h: 15, label: "S", c: "color-mix(in srgb, var(--foreground) 12%, transparent)" },
  ];

  return (
    <div className="flex items-end justify-between gap-1 h-full pt-3 pb-1.5 px-1">
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            className="w-full rounded-sm"
            style={{ background: b.c, minHeight: 3 }}
            initial={{ height: 0 }}
            whileInView={{ height: `${b.h}%` }}
            viewport={{ once: false }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          />
          <span className="font-mono-data" style={{ fontSize: 8, color: "color-mix(in srgb, var(--foreground) 22%, transparent)" }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function FocusDemo() {
  const total = 25 * 60;
  const [sec, setSec] = useState(total - 180);

  useEffect(() => {
    const id = setInterval(() => setSec((s) => (s <= 0 ? total : s - 1)), 120);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  const progress = 1 - sec / total;
  const r = 34;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center justify-center gap-7 h-full">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="color-mix(in srgb, var(--foreground) 5%, transparent)" strokeWidth="3" />
          <circle
            cx="40" cy="40" r={r}
            fill="none" stroke="color-mix(in srgb, var(--foreground) 85%, transparent)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            style={{ transform: "rotate(-90deg)", transformOrigin: "40px 40px", transition: "stroke-dashoffset 0.12s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono-data text-base" style={{ color: "var(--foreground)" }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div>
        <p className="font-mono-data text-xs uppercase tracking-widest mb-1" style={{ color: "color-mix(in srgb, var(--foreground) 55%, transparent)" }}>
          Focus Session
        </p>
        <p className="text-sm" style={{ color: "color-mix(in srgb, var(--foreground) 50%, transparent)" }}>Deep work · 25 min</p>
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "color-mix(in srgb, var(--foreground) 70%, transparent)" }} />
          <span className="font-mono-data text-xs" style={{ color: "color-mix(in srgb, var(--foreground) 70%, transparent)" }}>Active</span>
        </div>
      </div>
    </div>
  );
}

function CategoriesDemo() {
  const cats = [
    { label: "Work", color: "color-mix(in srgb, var(--foreground) 85%, transparent)", count: 8 },
    { label: "Focus", color: "color-mix(in srgb, var(--foreground) 70%, transparent)", count: 5 },
    { label: "Health", color: "color-mix(in srgb, var(--foreground) 60%, transparent)", count: 3 },
    { label: "Personal", color: "color-mix(in srgb, var(--foreground) 50%, transparent)", count: 6 },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % cats.length), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center gap-5 h-full">
      {cats.map((cat, i) => (
        <motion.div
          key={cat.label}
          className="flex flex-col items-center gap-1.5"
          animate={{ scale: active === i ? 1.12 : 0.9, opacity: active === i ? 1 : 0.3 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-mono-data text-sm font-semibold"
            style={{
              background: "color-mix(in srgb, var(--foreground) 6%, transparent)",
              color: cat.color,
              border: "1px solid color-mix(in srgb, var(--foreground) 10%, transparent)",
            }}
          >
            {cat.count}
          </div>
          <span className="font-mono-data text-xs" style={{ color: active === i ? "color-mix(in srgb, var(--foreground) 75%, transparent)" : "transparent" }}>
            {cat.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}


const STATS = [
  { value: "12,400+", label: "Tasks completed daily" },
  { value: "98%", label: "Uptime reliability" },
  { value: "4.9 / 5", label: "User satisfaction" },
  { value: "< 1s", label: "Page load time" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useApp();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100%" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          background: "color-mix(in srgb, var(--background) 90%, transparent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/DailysLogo.png" alt="Dailys" className="w-full h-full object-cover scale-[2.2]" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm px-4 py-2 rounded-lg transition-colors duration-150"
            style={{ color: "var(--muted)" }}
          >
            Log in
          </Link>
          <button
            onClick={() => navigate("/signup")}
            className="text-sm px-4 py-2 rounded-lg font-medium transition-all duration-150 hover:opacity-85"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden"
        style={{ minHeight: "calc(100vh - 65px)", background: "var(--background)" }}
      >
        {/* Pixel star field canvas */}
        <BackgroundPixelStars />

        {/* Pixel noise grain texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAIElEQVR42mIUEhJiwAbevXuHVZyJgUQwqmEUDB0AEGAADd8DEPTX6ksAAAAASUVORK5CYII=")`,
            backgroundSize: "10px",
            opacity: 0.18,
          }}
        />

        {/* Subtle white radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--foreground) 4%, transparent) 0%, transparent 68%)",
          }}
        />

        {/* Bottom fade into page */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-6 w-full"
            style={{ height: "clamp(120px, 22vw, 280px)" }}
          >
            <DotMatrixText
              text={["Think clearly,", "work deeply.", "Stay focused.", "Dailys."]}
              transition="fade"
              cycleInterval={2800}
              dotSize={4}
              gap={2}
              activeColor="#f0ede8"
              inactiveColor="color-mix(in srgb, var(--foreground) 4%, transparent)"
              showInactive={true}
              fontFamily="Georgia, 'Times New Roman', serif"
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 0 28px color-mix(in srgb, var(--foreground) 25%, transparent))" }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}
            className="text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            The minimal productivity workspace for professionals who value focus.
            Tasks, notes, and analytics - unified, beautiful, distraction-free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.4 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/signup")}
              className="px-7 py-3.5 rounded-xl font-medium text-sm transition-all duration-150"
              style={{ background: "var(--foreground)", color: "var(--background)" }}
            >
              Start for free
            </motion.button>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl text-sm transition-all duration-150 hover:opacity-80"
              style={{
                color: "var(--foreground)",
                border: "1px solid var(--card-border)",
                background: "var(--card)",
                textDecoration: "none",
              }}
            >
              Sign in →
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42, duration: 0.3 }}
            className="mt-5 text-xs"
            style={{ color: "var(--muted)" }}
          >
            No credit card required · Free forever on the basic plan
          </motion.p>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="px-8 py-10"
        style={{ borderTop: "1px solid var(--card-border)", borderBottom: "1px solid var(--card-border)" }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.32 }}
              className="text-center"
            >
              <p className="font-display text-3xl md:text-4xl mb-1" style={{ color: "var(--foreground)" }}>
                {s.value}
              </p>
              <p className="font-mono-data text-xs tracking-wide uppercase" style={{ color: "var(--muted)" }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.36 }}
            className="mb-12"
          >
            <p className="font-mono-data text-xs tracking-widest uppercase mb-4" style={{ color: "var(--muted)" }}>
              Everything you need
            </p>
            <h2 className="font-display text-4xl md:text-5xl" style={{ color: "var(--foreground)" }}>
              Built for deep work
            </h2>
          </motion.div>

          <div
            className="grid grid-cols-1 md:grid-cols-6 gap-3"
            style={{ gridAutoRows: "200px" }}
          >

            {/* 1 · Tasks - tall 2x2 */}
            <motion.div
              className="md:col-span-2 md:row-span-2 rounded-2xl p-6 flex flex-col overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.38 }}
              whileHover={{ scale: 1.015, borderColor: "color-mix(in srgb, var(--foreground) 14%, transparent)", transition: { duration: 0.22 } }}
            >
              <div className="flex-1 overflow-hidden">
                <TasksDemo />
              </div>
              <div className="pt-4" style={{ borderTop: "1px solid var(--card-border)" }}>
                <h3 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Smart Tasks</h3>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  Priority-aware, time-blocked, color-coded. Finish days feeling done.
                </p>
              </div>
            </motion.div>

            {/* 2 · Notes - standard 2x1 */}
            <motion.div
              className="md:col-span-2 rounded-2xl p-6 flex flex-col overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.08, duration: 0.38 }}
              whileHover={{ scale: 0.98, transition: { duration: 0.22 } }}
            >
              <div className="flex-1 overflow-hidden">
                <NotesDemo />
              </div>
              <div className="mt-3">
                <h3 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Rich Notes</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Ideas, reflections, linked to tasks.</p>
              </div>
            </motion.div>

            {/* 3 · Knowledge Graph - tall 2x2 */}
            <motion.div
              className="md:col-span-2 md:row-span-2 rounded-2xl p-5 flex flex-col overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.14, duration: 0.38 }}
              whileHover={{ scale: 1.015, boxShadow: "0 20px 48px color-mix(in srgb, var(--background) 40%, transparent)", transition: { duration: 0.22 } }}
            >
              <div className="flex-1">
                <GraphDemo />
              </div>
              <div
                className="mt-auto rounded-xl p-3"
                style={{ background: "rgba(14,14,14,0.7)", backdropFilter: "blur(8px)" }}
              >
                <h3 className="font-display text-xl flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="2.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="13.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="2.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="13.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M6.2 6.8L3.7 4.8M9.8 6.8L12.3 4.8M6.2 9.2L3.7 11.2M9.8 9.2L12.3 11.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                  Knowledge Graph
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  Explore connections between tasks and notes. Hover to navigate.
                </p>
              </div>
            </motion.div>

            {/* 4 · Analytics - standard 2x1 */}
            <motion.div
              className="md:col-span-2 rounded-2xl p-6 flex flex-col overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.38 }}
              whileHover={{ scale: 0.98, transition: { duration: 0.22 } }}
            >
              <div className="flex-1 overflow-hidden">
                <AnalyticsDemo />
              </div>
              <div className="mt-3">
                <h3 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Analytics</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Streaks, output, and focus patterns.</p>
              </div>
            </motion.div>

            {/* 5 · Focus Mode - wide 3x1 */}
            <motion.div
              className="md:col-span-3 rounded-2xl p-6 flex flex-col overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.26, duration: 0.38 }}
              whileHover={{ scale: 0.99, transition: { duration: 0.22 } }}
            >
              <div className="flex-1 overflow-hidden">
                <FocusDemo />
              </div>
              <div>
                <h3 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Focus Mode</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Pomodoro-style sessions keep you in flow without distraction.
                </p>
              </div>
            </motion.div>

            {/* 6 · Categories - wide 3x1 */}
            <motion.div
              className="md:col-span-3 rounded-2xl p-6 flex flex-col overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.32, duration: 0.38 }}
              whileHover={{ scale: 0.99, transition: { duration: 0.22 } }}
            >
              <div className="flex-1 overflow-hidden">
                <CategoriesDemo />
              </div>
              <div>
                <h3 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Unified Workspace</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Work, focus, health, personal - one view, zero context switching.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Dashboard preview mockup */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--card-border)", background: "var(--card)" }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid var(--card-border)", background: "color-mix(in srgb, var(--foreground) 3%, transparent)" }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: "color-mix(in srgb, var(--foreground) 15%, transparent)" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "color-mix(in srgb, var(--foreground) 25%, transparent)" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "color-mix(in srgb, var(--foreground) 35%, transparent)" }} />
            <span
              className="ml-4 flex-1 max-w-xs rounded-md px-3 py-1 text-xs font-mono-data text-center"
              style={{ background: "color-mix(in srgb, var(--foreground) 5%, transparent)", color: "var(--muted)" }}
            >
              app.dailys.work/dashboard
            </span>
          </div>

          {/* Mock dashboard content */}
          <div className="flex" style={{ minHeight: "300px" }}>
            {/* Mock sidebar */}
            <div
              className="flex flex-col gap-2 p-3 flex-shrink-0"
              style={{ width: "160px", borderRight: "1px solid var(--card-border)" }}
            >
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center">
                  <img src="/DailysLogo.png" alt="Dailys" className="w-full h-full object-cover scale-[2.2]" />
                </div>
              </div>
              {["Home", "Tasks", "Notes", "Analytics"].map((item, i) => (
                <div
                  key={item}
                  className="px-2 py-1.5 rounded-md text-xs"
                  style={{
                    background: i === 0 ? "color-mix(in srgb, var(--foreground) 7%, transparent)" : "transparent",
                    color: i === 0 ? "var(--foreground)" : "var(--muted)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Mock content */}
            <div className="flex-1 p-5">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="font-mono-data text-xs mb-1" style={{ color: "var(--muted)" }}>MONDAY</p>
                  <p className="font-display text-2xl" style={{ color: "var(--foreground)" }}>1 September</p>
                </div>
                <div
                  className="text-xs px-3 py-1.5 rounded-lg font-mono-data"
                  style={{ background: "color-mix(in srgb, var(--foreground) 6%, transparent)", color: "color-mix(in srgb, var(--foreground) 55%, transparent)", border: "1px solid color-mix(in srgb, var(--foreground) 10%, transparent)" }}
                >
                  7 day streak
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["5/8", "Tasks done"], ["4", "Notes"], ["4.5h", "Focus"]].map(([v, l]) => (
                  <div
                    key={l}
                    className="p-3 rounded-lg"
                    style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", border: "1px solid var(--card-border)" }}
                  >
                    <p className="font-display text-xl" style={{ color: "var(--foreground)" }}>{v}</p>
                    <p className="font-mono-data text-xs mt-0.5" style={{ color: "var(--muted)" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-8 py-24 text-center"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="font-mono-data text-xs tracking-widest uppercase mb-4"
          style={{ color: "var(--muted)" }}
        >
          Ready?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="font-display text-4xl md:text-5xl mb-6"
          style={{ color: "var(--foreground)" }}
        >
          Start your focused
          <br />
          <span style={{ color: "var(--muted)", fontStyle: "italic" }}>workflow today.</span>
        </motion.h2>
        <motion.button
          initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.18, type: "spring", stiffness: 340, damping: 24 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/signup")}
          className="px-8 py-4 rounded-xl text-base font-medium"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          Create free account →
        </motion.button>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-8 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center">
            <img src="/DailysLogo.png" alt="Dailys" className="w-full h-full object-cover scale-[2.2]" />
          </div>
        </div>
        <p className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>
          (c) 2026 Dailys. All rights reserved.
        </p>
        <div className="hidden md:flex items-center gap-6">
          {["Privacy", "Terms", "Contact"].map((item) => (
            <a key={item} href="#" className="font-mono-data text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--muted)", textDecoration: "none" }}>
              {item}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}
