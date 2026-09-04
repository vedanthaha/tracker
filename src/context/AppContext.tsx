import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, checkDbReady } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { LayoutSpec, WorkspaceLayout } from "../lib/design/LayoutSpec";

export type Priority = "high" | "medium" | "low";
export type TaskCategory = "work" | "personal" | "health" | "focus";
export type NoteCategory = "work" | "personal" | "ideas" | "journal";

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  category: TaskCategory;
  time?: string;
  createdAt: string;
  completedAt?: string | null;
  linkedNoteId?: number;
}

export interface Note {
  id: number;
  title: string;
  content: any;
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  linkedTaskId?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string;
}

interface AppContextType {
  tasks: Task[];
  notes: Note[];
  layouts: WorkspaceLayout[];
  user: User | null;
  loading: boolean;
  dbReady: boolean;
  // task ops
  addTask: (t: Omit<Task, "id" | "createdAt">) => void;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
  // note ops
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: number, updates: Partial<Pick<Note, "title" | "content" | "category" | "pinned">>) => void;
  deleteNote: (id: number) => void;
  // linked
  createLinked: (task: Omit<Task, "id" | "createdAt" | "linkedNoteId">, noteTitle: string) => { taskId: number; noteId: number };
  linkTaskToNote: (taskId: number, noteId: number) => void;
  // auth
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string; needsVerification?: boolean }>;
  signInWithOAuth: (provider: "google") => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendOtp: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  // profile
  updateProfile: (updates: { name?: string; bio?: string }) => Promise<{ error?: string }>;
  uploadAvatar: (file: File) => Promise<{ url?: string; error?: string }>;
  // layouts
  saveLayout: (surface: string, spec: LayoutSpec) => Promise<{ error?: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

// -- DB row <-> frontend type mappers ----------------------------

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    text: row.text as string,
    completed: row.completed as boolean,
    priority: row.priority as Priority,
    category: row.category as TaskCategory,
    time: (row.time as string | null) ?? undefined,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    linkedNoteId: (row.linked_note_id as number | null) ?? undefined,
  };
}

function mapNote(row: Record<string, unknown>): Note {
  // Handle case where content might come back as parsed JSON object or string
  let content = row.content;
  if (typeof content === 'string' && content.startsWith('{')) {
    try {
      content = JSON.parse(content);
    } catch (e) {
      // ignore
    }
  }

  return {
    id: row.id as number,
    title: row.title as string,
    content: content,
    category: row.category as NoteCategory,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    pinned: row.pinned as boolean,
    linkedTaskId: (row.linked_task_id as number | null) ?? undefined,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [layouts, setLayouts] = useState<WorkspaceLayout[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const loadUserData = useCallback(async (session: Session) => {
    const authUser = session.user;

    const [profileRes, tasksRes, notesRes, layoutsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authUser.id).single(),
      supabase.from("tasks").select("*").eq("user_id", authUser.id).order("created_at", { ascending: true }),
      supabase.from("notes").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
      supabase.from("workspace_layouts").select("*").eq("user_id", authUser.id),
    ]);

    const profile = profileRes.data;
    setUser({
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
      email: authUser.email ?? "",
      avatarUrl: profile?.avatar_url ?? null,
      bio: profile?.bio ?? "",
    });

    setTasks(tasksRes.data ? tasksRes.data.map(mapTask) : []);
    setNotes(notesRes.data ? notesRes.data.map(mapNote) : []);
    setLayouts(layoutsRes.data ? layoutsRes.data as WorkspaceLayout[] : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkDbReady().then(setDbReady);

    // Handle PKCE OAuth callback: Supabase puts ?code=... in URL.
    // With detectSessionInUrl:true it auto-exchanges, but with HashRouter the code can land after '#'
    // so we defensively exchange if we see a code anywhere in href.
    const handleOAuthCallback = async () => {
      const href = window.location.href;
      const hasCode = href.includes("code=");
      if (hasCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(href);
        if (error) {
          console.error("OAuth code exchange failed:", error.message);
          // Clean URL even on failure to avoid loop
          window.history.replaceState({}, "", window.location.origin + "/#/");
        } else {
          // Clean code from URL before HashRouter processes it
          window.history.replaceState({}, "", window.location.origin + "/#/");
        }
        // getSession / onAuthStateChange will handle the rest
        return true;
      }
      return false;
    };

    handleOAuthCallback().then((handled) => {
      if (handled) return; // loadUserData will be triggered by SIGNED_IN event after exchange
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          loadUserData(session).catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        loadUserData(session).catch(console.error);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setTasks([]);
        setNotes([]);
        setLayouts([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // -- Auth ------------------------------------------------------

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signup = async (email: string, password: string, name: string): Promise<{ error?: string; needsVerification?: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already"))
        return { error: "An account with this email already exists. Try Continue with Google or Sign in." };
      return { error: error.message };
    }
    // Supabase with Confirm email ON returns fake success (identities=[]) for enumeration protection.
    // Detect duplicate: user created but no identities and no session.
    if (data.user && !data.session) {
      const identities = (data.user as unknown as { identities?: unknown[] })?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        return { error: "An account with this email already exists. Try Continue with Google or Sign in." };
      }
      return { needsVerification: true };
    }
    return {};
  };

  const signInWithOAuth = async (provider: "google"): Promise<{ error?: string }> => {
    // HashRouter (#) breaks PKCE code detection if code ends up after '#'.
    // Use origin (no hash) so Supabase puts ?code=... in search where detectSessionInUrl can parse it.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const verifyOtp = async (email: string, token: string): Promise<{ error?: string }> => {
    if (token.length !== 8) return { error: "Enter 8-digit code" };
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) return { error: error.message };
    return {};
  };

  const resendOtp = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // -- Profile ---------------------------------------------------

  const updateProfile = async (updates: { name?: string; bio?: string }): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return { error: error.message };
    setUser((prev) => prev ? { ...prev, ...updates } : prev);
    return {};
  };

  const uploadAvatar = async (file: File): Promise<{ url?: string; error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) return { error: upErr.message };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + `?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", user.id);
    setUser((prev) => prev ? { ...prev, avatarUrl: url } : prev);
    return { url };
  };

  // -- Tasks (optimistic + DB sync) ------------------------------

  const addTask = (t: Omit<Task, "id" | "createdAt">) => {
    if (!user) return;
    const id = Date.now();
    const now = new Date().toISOString();
    const newTask: Task = { ...t, id, createdAt: now, completedAt: t.completed ? now : null };
    setTasks((prev) => [...prev, newTask]);
    supabase.from("tasks").insert({
      id,
      user_id: user.id,
      text: t.text,
      completed: t.completed,
      priority: t.priority,
      category: t.category,
      time: t.time ?? null,
      linked_note_id: t.linkedNoteId ?? null,
      created_at: now,
      completed_at: t.completed ? now : null,
    }).then(({ error }) => { if (error) console.error("addTask sync:", error.message); });
  };

  const toggleTask = (id: number) => {
    let newVal = false;
    let newCompletedAt: string | null = null;
    setTasks((prev) => prev.map((t) => {
      if (t.id === id) {
        newVal = !t.completed;
        newCompletedAt = newVal ? new Date().toISOString() : null;
        return { ...t, completed: newVal, completedAt: newCompletedAt };
      }
      return t;
    }));
    supabase.from("tasks").update({ completed: newVal, completed_at: newCompletedAt }).eq("id", id)
      .then(({ error }) => { if (error) console.error("toggleTask sync:", error.message); });
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    supabase.from("tasks").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("deleteTask sync:", error.message); });
  };

  // -- Notes (optimistic + DB sync) -----------------------------

  const addNote = (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    if (!user) return;
    const id = Date.now();
    const now = new Date().toISOString();
    const newNote: Note = { ...n, id, createdAt: now, updatedAt: now };
    setNotes((prev) => [newNote, ...prev]);
    supabase.from("notes").insert({
      id,
      user_id: user.id,
      title: n.title,
      content: n.content,
      category: n.category,
      pinned: n.pinned,
      linked_task_id: n.linkedTaskId ?? null,
      created_at: now,
      updated_at: now,
    }).then(({ error }) => { if (error) console.error("addNote sync:", error.message); });
  };

  const updateNote = (id: number, updates: Partial<Pick<Note, "title" | "content" | "category" | "pinned">>) => {
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: now } : n))
    );
    supabase.from("notes").update({ ...updates, updated_at: now }).eq("id", id)
      .then(({ error }) => { if (error) console.error("updateNote sync:", error.message); });
  };

  const deleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    supabase.from("notes").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("deleteNote sync:", error.message); });
  };

  const createLinked = (taskBase: Omit<Task, "id" | "createdAt" | "linkedNoteId">, noteTitle: string) => {
    if (!user) return { taskId: 0, noteId: 0 };
    const now = new Date().toISOString();
    const noteId = Date.now();
    const taskId = noteId + 1;
    const newNote: Note = {
      id: noteId,
      title: noteTitle,
      content: `Notes for task: ${taskBase.text}\n\n`,
      category: (taskBase.category === "health" ? "personal" : taskBase.category) as NoteCategory,
      createdAt: now,
      updatedAt: now,
      pinned: false,
      linkedTaskId: taskId,
    };
    const newTask: Task = { ...taskBase, id: taskId, createdAt: now, completedAt: taskBase.completed ? now : null, linkedNoteId: noteId };
    setNotes((prev) => [newNote, ...prev]);
    setTasks((prev) => [...prev, newTask]);
    supabase.from("notes").insert({
      id: noteId, user_id: user.id, title: newNote.title, content: newNote.content,
      category: newNote.category, pinned: false, linked_task_id: taskId,
      created_at: now, updated_at: now,
    }).then(({ error }) => { if (error) console.error("createLinked note sync:", error.message); });
    supabase.from("tasks").insert({
      id: taskId, user_id: user.id, text: taskBase.text, completed: taskBase.completed,
      priority: taskBase.priority, category: taskBase.category, time: taskBase.time ?? null,
      linked_note_id: noteId, created_at: now, completed_at: taskBase.completed ? now : null,
    }).then(({ error }) => { if (error) console.error("createLinked task sync:", error.message); });
    return { taskId, noteId };
  };

  const linkTaskToNote = (taskId: number, noteId: number) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, linkedNoteId: noteId } : t)));
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, linkedTaskId: taskId } : n)));
    supabase.from("tasks").update({ linked_note_id: noteId }).eq("id", taskId)
      .then(({ error }) => { if (error) console.error("linkTaskToNote task sync:", error.message); });
    supabase.from("notes").update({ linked_task_id: taskId }).eq("id", noteId)
      .then(({ error }) => { if (error) console.error("linkTaskToNote note sync:", error.message); });
  };

  const saveLayout = async (surface: string, spec: LayoutSpec) => {
    if (!user) return { error: "Not logged in" };
    const { data, error } = await supabase
      .from("workspace_layouts")
      .upsert(
        { user_id: user.id, surface, layout_spec: spec },
        { onConflict: "user_id, surface" }
      )
      .select()
      .single();

    if (error) {
      console.error("saveLayout error:", error.message);
      return { error: error.message };
    }
    setLayouts((prev) => {
      const filtered = prev.filter((l) => l.surface !== surface);
      return [...filtered, data as WorkspaceLayout];
    });
    return {};
  };

  return (
    <AppContext.Provider value={{
      tasks, notes, layouts, user, loading, dbReady,
      addTask, toggleTask, deleteTask,
      addNote, updateNote, deleteNote,
      createLinked, linkTaskToNote,
      login, signup, signInWithOAuth, verifyOtp, resendOtp, logout,
      updateProfile, uploadAvatar, saveLayout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
