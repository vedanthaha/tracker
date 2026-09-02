import { createHashRouter } from "react-router";
import Landing from "../pages/Landing";
import Auth from "../pages/Auth";
import AppLayout from "../layouts/AppLayout";
import Home from "../pages/Home";
import Todos from "../pages/Todos";
import Notes from "../pages/Notes";
import Analytics from "../pages/Analytics";
import Graph from "../pages/Graph";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

export const router = createHashRouter([
  { path: "/", Component: Landing },
  { path: "/login", Component: Auth },
  { path: "/signup", Component: Auth },
  {
    path: "/dashboard",
    Component: AppLayout,
    children: [
      { index: true, Component: Home },
      { path: "todos", Component: Todos },
      { path: "notes", Component: Notes },
      { path: "analytics", Component: Analytics },
      { path: "graph", Component: Graph },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);
