import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useEffect, useRef } from "react";
import { ErrorBoundary } from "../ErrorBoundary";
import { SidebarClock } from "../components/SidebarClock";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Home",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/todos",
    label: "Tasks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 9L8 11L12 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/notes",
    label: "Notes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 5h10M4 9h10M4 13h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: "/dashboard/analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M1 14L5.5 9L8.5 12L12.5 6L17 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 17H17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/dashboard/graph",
    label: "Graph",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="3" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="15" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="3" cy="14" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="15" cy="14" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.8 7.8L4.5 5.5M11.2 7.8L13.5 5.5M6.8 10.2L4.5 12.5M11.2 10.2L13.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/dashboard/metric-tracker",
    label: "Metric Tracker",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 5v8M12 5v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M2 9h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 13.5A4.5 4.5 0 109 4.5a4.5 4.5 0 000 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.9 2.5l.8 2.2a6.3 6.3 0 011.6.7l2.1-1.1L18.8 5.7l-1.3 2a6 6 0 010 2.6l1.3 2-1.4 1.4-2.1-1.1a6.3 6.3 0 01-1.6.7l-.8 2.2H10.1l-.8-2.2a6.3 6.3 0 01-1.6-.7l-2.1 1.1-1.4-1.4 1.3-2a6 6 0 010-2.6l-1.3-2L3.8 4.3l2.1 1.1a6.3 6.3 0 011.6-.7l.8-2.2h2.8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/**
 * Provides the authenticated application layout with navigation, user controls, database setup guidance, and routed content.
 */
export default function AppLayout() {
  const { user, logout, tasks, notes, loading, dbReady } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [dbBannerDismissed, setDbBannerDismissed] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => { await logout(); navigate("/"); };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "var(--background)" }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="font-display text-2xl"
          style={{ color: "color-mix(in srgb, var(--foreground) 50%, transparent)" }}
        >
          Dailys
        </motion.div>
      </div>
    );
  }

  const completedToday = tasks.filter((t) => t.completed).length;
  const totalToday = tasks.length;
  const initials = user ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "FO";

  const SETUP_SQL_URL = "https://supabase.com/dashboard/project/_/sql/new";

  const copySql = () => {
    navigator.clipboard.writeText("-- See supabase/migrations/001_setup.sql in your project for the full setup SQL").catch(() => {});
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="flex h-full" style={{ background: "var(--background)" }}>

      {/* Sidebar - motion width */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col flex-shrink-0 h-full overflow-hidden"
        style={{ background: "var(--card)", borderRight: "1px solid var(--card-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--card-border)" }}>
          <motion.div
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden -ml-1"
            onClick={() => navigate("/dashboard")}
          >
            <img src="/DailysLogo.png" alt="Dailys" className="w-full h-full object-cover scale-[2.4]" />
          </motion.div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="font-display text-3xl tracking-wide flex-1 whitespace-nowrap overflow-hidden"
                style={{ color: "var(--foreground)", paddingTop: "4px" }}
              >
                Dailys
              </motion.span>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
            className="ml-auto flex-shrink-0 opacity-40 hover:opacity-80"
            onClick={() => setCollapsed((v) => !v)}
          >
            <motion.svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.22 }}
            >
              <path d="M5 2L9 7L5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </motion.button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.to === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.to);
            return (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22, ease: "easeOut" }}
              >
                <NavLink
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg relative overflow-hidden transition-all hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:scale-[0.98]"
                  style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}
                >
                  {/* Animated active background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.2)" }}
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}

                  <motion.span
                    className="flex-shrink-0 relative z-10"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {item.icon}
                  </motion.span>

                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.14 }}
                        className="text-sm font-medium relative z-10 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Sidebar Clock */}
        <SidebarClock collapsed={collapsed} />

        {/* Today progress */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0.85, originY: 1 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.85 }}
              transition={{ duration: 0.2 }}
              className="mx-3 mb-3 p-3 rounded-lg flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", border: "1px solid var(--card-border)" }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>Today</span>
                <span className="font-mono-data text-xs" style={{ color: "var(--foreground)" }}>
                  {completedToday}/{totalToday}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--foreground) 7%, transparent)" }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: totalToday ? `${(completedToday / totalToday) * 100}%` : "0%" }}
                  transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ background: "var(--green)" }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                {notes.length} note{notes.length !== 1 ? "s" : ""}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User */}
        <motion.div
          className="flex items-center gap-3 p-4 flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)] transition-colors"
          style={{ borderTop: "1px solid var(--card-border)" }}
          whileHover={{ background: "color-mix(in srgb, var(--foreground) 3%, transparent)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/dashboard/profile")}
          title="View profile"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate("/dashboard/profile"); }}
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-mono-data text-xs flex-shrink-0"
            style={{ background: "rgba(212,168,83,0.15)", color: "var(--accent)", border: "1px solid rgba(212,168,83,0.25)" }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </motion.div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.16 }}
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 min-w-0" onClick={() => navigate("/dashboard/profile")} style={{ cursor: "pointer" }}>
                  <p className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{user?.name ?? "Guest"}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{user?.email ?? ""}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15, opacity: 1 }} whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="opacity-35 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] rounded-md p-1"
                  title="Sign out"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* DB setup banner */}
        <AnimatePresence>
          {!dbReady && !dbBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 text-xs gap-4"
              style={{ background: "rgba(212,168,83,0.08)", borderBottom: "1px solid rgba(212,168,83,0.18)", color: "rgba(212,168,83,0.9)" }}
            >
              <span className="font-mono-data">
                Database not set up · Run <strong>supabase/migrations/001_setup.sql</strong> in your{" "}
                <a href={SETUP_SQL_URL} target="_blank" rel="noreferrer" style={{ color: "rgba(212,168,83,1)", textDecoration: "underline" }}>
                  Supabase SQL editor
                </a>
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={copySql} className="hover:opacity-80 transition-opacity" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
                  {sqlCopied ? "Copied!" : "Copy hint"}
                </button>
                <button onClick={() => setDbBannerDismissed(true)} className="opacity-50 hover:opacity-100 transition-opacity" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>X</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 min-h-0 overflow-hidden"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
