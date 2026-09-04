import { motion, AnimatePresence } from "framer-motion";
import { NoteCategory, useApp } from "../../context/AppContext";
import { useNotesContext } from "../../context/NotesContext";

const CAT_COLORS: Record<NoteCategory, string> = {
  work: "#d4a853",
  personal: "#7eb8e8",
  ideas: "#b48ee8",
  journal: "#6fcf8a",
};

const CATEGORY_OPTIONS: NoteCategory[] = ["work", "personal", "ideas", "journal"];

/**
 * Displays a searchable, category-filtered list of notes with selection and creation controls.
 */
export function NotesSidebarWidget() {
  const { notes } = useApp();
  const {
    search, setSearch,
    filterCat, setFilterCat,
    selectedId, setSelectedId,
    createNote,
    formatDate,
    filteredNotes
  } = useNotesContext();

  return (
    <div
      className="flex flex-col w-full h-full rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--card-border)", background: "var(--card)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl" style={{ color: "var(--foreground)" }}>Notes</h1>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={createNote}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "color-mix(in srgb, var(--foreground) 5%, transparent)", border: "1px solid var(--card-border)" }}
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
      </div>

      {/* Category filter */}
      <div
        className="flex flex-wrap items-center gap-1 px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--card-border)" }}
      >
        {(["all", ...CATEGORY_OPTIONS] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className="font-mono-data text-xs px-2 py-1 rounded-md transition-all duration-150"
            style={{
              background: filterCat === cat ? "color-mix(in srgb, var(--foreground) 8%, transparent)" : "transparent",
              color: filterCat === cat
                ? cat === "all" ? "var(--foreground)" : CAT_COLORS[cat as NoteCategory]
                : "var(--muted)",
            }}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs text-center py-8"
            style={{ color: "var(--muted)" }}
          >
            No notes found.
          </motion.p>
        )}
        <AnimatePresence initial={false}>
          {filteredNotes.map((note: any) => (
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
                background: selectedId === note.id ? "color-mix(in srgb, var(--foreground) 5%, transparent)" : "transparent",
                borderBottom: "1px solid var(--card-border)",
                borderLeft: selectedId === note.id ? `2px solid ${CAT_COLORS[note.category as NoteCategory]}` : "2px solid transparent",
                display: "block",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p
                  className="text-sm font-medium truncate leading-snug"
                  style={{ color: selectedId === note.id ? "var(--foreground)" : "color-mix(in srgb, var(--foreground) 70%, transparent)" }}
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
                    background: `${CAT_COLORS[note.category as NoteCategory]}15`,
                    color: CAT_COLORS[note.category as NoteCategory],
                    border: `1px solid ${CAT_COLORS[note.category as NoteCategory]}25`,
                  }}
                >
                  {note.category}
                </span>
                <span className="font-mono-data text-xs" style={{ color: "color-mix(in srgb, var(--foreground) 20%, transparent)" }}>
                  {formatDate(note.updatedAt)}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Displays the selected note in an editor with controls for categorization, pinning, deletion, and content editing.
 */
export function NotesEditorWidget() {
  const { notes, updateNote, deleteNote } = useApp();
  const {
    selectedId, setSelectedId,
    saved, handleChange,
    createNote, togglePin, formatDate,
    selectedNote
  } = useNotesContext();

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
      <AnimatePresence mode="wait" initial={false}>
        {selectedNote ? (
          <motion.div
            key={selectedNote.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 flex flex-col overflow-hidden w-full h-full"
          >
            {/* Editor toolbar */}
            <div
              className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 flex-shrink-0 flex-wrap"
              style={{ borderBottom: "1px solid var(--card-border)", background: "color-mix(in srgb, var(--foreground) 1%, transparent)" }}
            >
              <select
                value={selectedNote.category}
                onChange={(e) => updateNote(selectedNote.id, { category: e.target.value as NoteCategory })}
                className="font-mono-data text-xs px-2.5 py-1.5 rounded-md border outline-none cursor-pointer"
                style={{
                  background: `${CAT_COLORS[selectedNote.category as NoteCategory]}12`,
                  color: CAT_COLORS[selectedNote.category as NoteCategory],
                  borderColor: `${CAT_COLORS[selectedNote.category as NoteCategory]}30`,
                }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c} style={{ background: "var(--surface-elevated)", color: "var(--foreground)" }}>
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
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 md:py-8 h-full">
              <input
                className="w-full font-display text-3xl md:text-4xl bg-transparent border-none outline-none mb-4 leading-tight"
                style={{ color: "var(--foreground)", fontFamily: "Instrument Serif, serif" }}
                placeholder="Title"
                value={selectedNote.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              <textarea
                className="w-full bg-transparent border-none outline-none resize-none text-sm leading-loose h-full min-h-[300px]"
                style={{
                  color: "var(--foreground)",
                  fontFamily: "Inter, sans-serif",
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
              style={{ borderTop: "1px solid var(--card-border)", marginTop: "auto" }}
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
            className="flex-1 flex items-center justify-center h-full w-full"
          >
            <div className="text-center">
              <p className="font-display text-2xl mb-2" style={{ color: "var(--muted)", fontStyle: "italic" }}>
                No note selected
              </p>
              <motion.button
                whileHover={{ scale: 1.04, opacity: 0.9 }} whileTap={{ scale: 0.96 }}
                onClick={createNote}
                className="mt-3 text-sm px-4 py-2 rounded-xl"
                style={{ background: "var(--accent)", color: "var(--background)" }}
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
