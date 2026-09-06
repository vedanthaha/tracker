import { createHashRouter, Navigate } from "react-router";
import Landing from "../pages/Landing";
import HelpPage from "../pages/Help";
import PrivacyPage from "../pages/Privacy";
import FaqPage from "../pages/Faq";
import Auth from "../pages/Auth";
import AppLayout from "../layouts/AppLayout";
import Home from "../pages/Home";
import Todos from "../pages/Todos";
import Notes from "../pages/Notes";
import Analytics from "../pages/Analytics";
import Graph from "../pages/Graph";
import MetricTracker from "../pages/MetricTracker";
import Community from "../pages/Community";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

export const router = createHashRouter([
  { path: "/", Component: Landing },
  { path: "/help", Component: HelpPage },
  { path: "/privacy", Component: PrivacyPage },
  { path: "/faq", Component: FaqPage },
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
      { path: "metric-tracker", Component: MetricTracker },
      { path: "community", Component: Community },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);
