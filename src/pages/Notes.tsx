import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, type NoteCategory } from "../context/AppContext";

const CAT_COLORS: Record<NoteCategory, string> = {
  work: "#d4a853",
  personal: "#7eb8e8",
  ideas: "#b48ee8",
  journal: "#6fcf8a",
};

const CATEGORY_OPTIONS: NoteCategory[] = ["work", "personal", "ideas", "journal"];

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [selectedId, setSelectedId] = useState<number | null>(notes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<NoteCategory | "all">("all");
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const filtered = notes.filter((n) => {
    const matchCat = filterCat === "all" || n.category === filterCat;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.id - a.id;
  });

  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((n) => n.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const handleChange = (field: "title" | "content", value: string) => {
    if (!selectedId) return;
    updateNote(selectedId, { [field]: value });
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(true), 800);
  };

  const createNote = () => {
    addNote({ title: "Untitled", content: "", category: "personal", pinned: false });
    setTimeout(() => {
      const newNote = notes[0];
      if (newNote) setSelectedId(newNote.id);
    }, 50);
  };

  const togglePin = () => {
    if (!selectedId || !selectedNote) return;
    updateNote(selectedId, { pinned: !selectedNote.pinned });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Resizable pane logic
  const MIN_WIDTH = 260;
  const MAX_WIDTH = 500;
  const DEFAULT_WIDTH = 330;

  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem("dailys-notes-pane-width");
    return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parseInt(saved, 10))) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      // e.clientX gives us the width since the left panel starts at x=0 (relative to window)
      // Actually we should measure relative to the container if we want, but clientX is close enough for a full-screen app.
      // Better: we can calculate based on the bounding rect of the main container, but clientX works flawlessly for a sidebar docked to the left.
      let newWidth = e.clientX;
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      setLeftWidth(newWidth);
    };

    const onPointerUp = (e: PointerEvent) => {
      setIsDragging(false);
      let newWidth = e.clientX;
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      localStorage.setItem("dailys-notes-pane-width", newWidth.toString());
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    // Add a class to body to prevent accidental selection/cursor flickering while dragging
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <div 
      className="flex flex-col md:flex-row h-full" 
      style={{ color: "var(--foreground)", "--left-width": `${leftWidth}px` } as React.CSSProperties}
    >

      {/* Left panel — notes list */}
      <div
        className="flex flex-col flex-shrink-0 w-full md:w-[var(--left-width)] h-1/3 md:h-full border-b md:border-b-0"
        style={{ borderColor: "var(--card-border)", background: "var(--card)" }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          className="px-4 py-5"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Notes</h1>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={createNote}
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: "var(--accent)", color: "#0c0c0c" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(240,237,232,0.05)", border: "1px solid var(--card-border)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--muted)", flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 8l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              className="add-input text-xs"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05, duration: 0.22 }}
          className="flex flex-wrap items-center gap-1 px-3 py-2.5"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          {(["all", ...CATEGORY_OPTIONS] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className="font-mono-data text-xs px-2 py-1 rounded-md transition-all duration-150"
              style={{
                background: filterCat === cat ? "rgba(240,237,232,0.08)" : "transparent",
                color: filterCat === cat
                  ? cat === "all" ? "var(--foreground)" : CAT_COLORS[cat as NoteCategory]
                  : "var(--muted)",
              }}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-center py-8"
              style={{ color: "var(--muted)" }}
            >
              No notes found.
            </motion.p>
          )}
          <AnimatePresence initial={false}>
            {filtered.map((note) => (
              <motion.button
                key={note.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12, height: 0, padding: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => setSelectedId(note.id)}
                className="w-full text-left px-4 py-3.5"
                style={{
                  background: selectedId === note.id ? "rgba(240,237,232,0.05)" : "transparent",
                  borderBottom: "1px solid var(--card-border)",
                  borderLeft: selectedId === note.id ? `2px solid ${CAT_COLORS[note.category]}` : "2px solid transparent",
                  display: "block",
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p
                    className="text-sm font-medium truncate leading-snug"
                    style={{ color: selectedId === note.id ? "var(--foreground)" : "rgba(240,237,232,0.7)" }}
                  >
                    {note.title || "Untitled"}
                  </p>
                  {note.pinned && <span className="text-xs flex-shrink-0" style={{ color: "var(--accent)" }}>★</span>}
                </div>
                <p className="text-xs line-clamp-2 leading-relaxed mb-1.5" style={{ color: "var(--muted)" }}>
                  {note.content || "Empty note"}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono-data text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${CAT_COLORS[note.category]}15`,
                      color: CAT_COLORS[note.category],
                      border: `1px solid ${CAT_COLORS[note.category]}25`,
                    }}
                  >
                    {note.category}
                  </span>
                  <span className="font-mono-data text-xs" style={{ color: "rgba(240,237,232,0.2)" }}>
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className="hidden md:flex w-1.5 cursor-col-resize transition-colors z-10 flex-shrink-0"
        onPointerDown={startDrag}
        style={{ 
          borderRight: "1px solid var(--card-border)",
          background: isDragging ? "rgba(240,237,232,0.1)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) e.currentTarget.style.background = "rgba(240,237,232,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!isDragging) e.currentTarget.style.background = "transparent";
        }}
      />

      {/* Right panel — editor */}
      <AnimatePresence mode="wait" initial={false}>
        {selectedNote ? (
          <motion.div
            key={selectedNote.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Editor toolbar */}
            <div
              className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 flex-shrink-0 flex-wrap"
              style={{ borderBottom: "1px solid var(--card-border)", background: "rgba(240,237,232,0.015)" }}
            >
              <select
                value={selectedNote.category}
                onChange={(e) => updateNote(selectedNote.id, { category: e.target.value as NoteCategory })}
                className="font-mono-data text-xs px-2.5 py-1.5 rounded-md border outline-none cursor-pointer"
                style={{
                  background: `${CAT_COLORS[selectedNote.category]}12`,
                  color: CAT_COLORS[selectedNote.category],
                  borderColor: `${CAT_COLORS[selectedNote.category]}30`,
                }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c} style={{ background: "#141414", color: "var(--foreground)" }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>

              <div className="flex-1" />

              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono-data text-xs"
                    style={{ color: "var(--green)" }}
                  >
                    Saved ✓
                  </motion.span>
                )}
              </AnimatePresence>

              <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>
                {formatDate(selectedNote.updatedAt)}
              </span>

              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={togglePin}
                className="w-7 h-7 flex items-center justify-center rounded-md"
                style={{
                  background: selectedNote.pinned ? "var(--accent-dim)" : "transparent",
                  color: selectedNote.pinned ? "var(--accent)" : "var(--muted)",
                  border: "1px solid var(--card-border)",
                }}
                title={selectedNote.pinned ? "Unpin" : "Pin note"}
              >
                ★
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => {
                  deleteNote(selectedNote.id);
                  setSelectedId(notes.find((n) => n.id !== selectedNote.id)?.id ?? null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-md"
                style={{ color: "var(--muted)", border: "1px solid var(--card-border)" }}
                title="Delete note"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h10M4 3V2h4v1M2 3l.7 7.3A1 1 0 003.7 11h4.6a1 1 0 001-.7L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 md:py-8">
              <input
                className="w-full font-display text-3xl md:text-4xl bg-transparent border-none outline-none mb-4 leading-tight"
                style={{ color: "var(--foreground)", fontFamily: "Instrument Serif, serif" }}
                placeholder="Title"
                value={selectedNote.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              <textarea
                className="w-full bg-transparent border-none outline-none resize-none text-sm leading-loose"
                style={{
                  color: "var(--foreground)",
                  fontFamily: "Inter, sans-serif",
                  minHeight: "calc(100vh - 280px)",
                  caretColor: "var(--accent)",
                }}
                placeholder="Start writing..."
                value={selectedNote.content}
                onChange={(e) => handleChange("content", e.target.value)}
              />
            </div>

            {/* Word count footer */}
            <div
              className="flex items-center justify-end gap-4 px-6 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid var(--card-border)" }}
            >
              <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>
                {selectedNote.content.split(/\s+/).filter(Boolean).length} words
              </span>
              <span className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>
                {selectedNote.content.length} chars
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <p className="font-display text-2xl mb-2" style={{ color: "var(--muted)", fontStyle: "italic" }}>
                No note selected
              </p>
              <motion.button
                whileHover={{ scale: 1.04, opacity: 0.9 }} whileTap={{ scale: 0.96 }}
                onClick={createNote}
                className="mt-3 text-sm px-4 py-2 rounded-xl"
                style={{ background: "var(--accent)", color: "#0c0c0c" }}
              >
                Create a note
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
