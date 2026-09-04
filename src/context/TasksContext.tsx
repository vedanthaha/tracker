import { createContext, useContext, useState, ReactNode } from "react";
import { Priority, TaskCategory } from "./AppContext";

interface TasksContextType {
  activeFilter: "all" | TaskCategory;
  setActiveFilter: (v: "all" | TaskCategory) => void;
  activePriority: "all" | Priority;
  setActivePriority: (v: "all" | Priority) => void;
  showDone: boolean;
  setShowDone: (v: boolean) => void;
  sortBy: "time" | "priority" | "added";
  setSortBy: (v: "time" | "priority" | "added") => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}

const TasksContext = createContext<TasksContextType | null>(null);

/**
 * Provides task-list UI state and controls to descendant components.
 *
 * @param children - Components that consume the task context
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<"all" | TaskCategory>("all");
  const [activePriority, setActivePriority] = useState<"all" | Priority>("all");
  const [showDone, setShowDone] = useState(true);
  const [sortBy, setSortBy] = useState<"time" | "priority" | "added">("added");
  const [showModal, setShowModal] = useState(false);

  return (
    <TasksContext.Provider
      value={{
        activeFilter,
        setActiveFilter,
        activePriority,
        setActivePriority,
        showDone,
        setShowDone,
        sortBy,
        setSortBy,
        showModal,
        setShowModal,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

/**
 * Provides access to task-list UI state and its setters.
 *
 * @returns The current task context
 * @throws An error if called outside a `TasksProvider`
 */
export function useTasksContext() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasksContext must be used within TasksProvider");
  return ctx;
}
