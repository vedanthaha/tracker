import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, setThemeId, availableThemes } = useTheme();

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="flex h-16 items-center px-6 shrink-0" style={{ borderBottom: "1px solid var(--card-border)" }}>
        <h1 className="font-display text-2xl" style={{ color: "var(--foreground)" }}>Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto w-full p-6 space-y-12">
        
        {/* Appearance Section */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Appearance</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Customize how Dailys looks on this device.</p>
          </div>

          <div className="p-6 rounded-xl space-y-6" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            
            {/* Theme Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Theme</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Select a global color and typography theme.</p>
              </div>
              
              <div className="relative">
                <select 
                  value={theme.id}
                  onChange={(e) => setThemeId(e.target.value)}
                  className="appearance-none bg-transparent py-2 pl-4 pr-10 rounded-lg text-sm border font-medium focus:outline-none transition-colors"
                  style={{ 
                    color: "var(--foreground)", 
                    borderColor: "var(--border)", 
                    background: "var(--surface-elevated)"
                  }}
                >
                  {availableThemes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Preview boxes to show theme colors */}
            <div className="pt-4 border-t flex gap-3 flex-wrap" style={{ borderColor: "var(--card-border)" }}>
              <div className="w-10 h-10 rounded-full border shadow-sm" style={{ background: "var(--background)", borderColor: "var(--border)" }} title="Background" />
              <div className="w-10 h-10 rounded-full border shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }} title="Surface" />
              <div className="w-10 h-10 rounded-full border shadow-sm" style={{ background: "var(--accent)", borderColor: "var(--border)" }} title="Accent" />
              <div className="w-10 h-10 rounded-full border shadow-sm flex items-center justify-center font-display text-lg" style={{ background: "var(--surface-elevated)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                Aa
              </div>
              <div className="w-10 h-10 rounded-full border shadow-sm flex items-center justify-center font-mono text-xs" style={{ background: "var(--surface-elevated)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                &lt;/&gt;
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
