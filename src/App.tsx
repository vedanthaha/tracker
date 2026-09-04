import { RouterProvider } from "react-router";
import { router } from "./app/routes";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ClockProvider } from "./context/ClockContext";

/**
 * Renders the application with its state, theme, clock, and routing providers.
 */
export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <ClockProvider>
          <RouterProvider router={router} />
        </ClockProvider>
      </ThemeProvider>
    </AppProvider>
  );
}
