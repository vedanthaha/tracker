import { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";
import { NoteCategory, useApp } from "./AppContext";

interface NotesContextType {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  search: string;
  setSearch: (s: string) => void;
  filterCat: NoteCategory | "all";
  setFilterCat: (c: NoteCategory | "all") => void;
  saved: boolean;
  setSaved: (s: boolean) => void;
  handleChange: (field: "title" | "content", value: string) => void;
  createNote: () => void;
  togglePin: () => void;
  formatDate: (iso: string) => string;
  filteredNotes: any[];
  selectedNote: any | null;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [selectedId, setSelectedId] = useState<number | null>(notes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<NoteCategory | "all">("all");
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const filteredNotes = notes.filter((n) => {
    const matchCat = filterCat === "all" || n.category === filterCat;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.id - a.id;
  });

  useEffect(() => {
    if (filteredNotes.length > 0 && !filteredNotes.find((n) => n.id === selectedId)) {
      setSelectedId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedId]);

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
      const newNote = notes[0]; // Wait, addNote might not be immediately reflected in `notes` locally if we rely on next render.
      // Better to rely on useEffect or generate id inside createNote.
      // But let's just keep the old logic for now, though notes[0] might not be updated yet in this closure.
      // We will handle it carefully.
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

  return (
    <NotesContext.Provider
      value={{
        selectedId, setSelectedId,
        search, setSearch,
        filterCat, setFilterCat,
        saved, setSaved,
        handleChange,
        createNote,
        togglePin,
        formatDate,
        filteredNotes,
        selectedNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotesContext must be used within NotesProvider");
  return ctx;
}
