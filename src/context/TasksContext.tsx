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

export function useTasksContext() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasksContext must be used within TasksProvider");
  return ctx;
}
