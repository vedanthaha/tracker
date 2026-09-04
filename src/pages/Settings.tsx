import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useClock } from "../context/ClockContext";
import { CustomThemeEditor } from "../components/CustomThemeEditor";
import { CustomTheme } from "../lib/theme/types";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const { theme, setThemeId, availableThemes, customThemes, fetchCustomThemes, activeFontId, setFontId, availableFonts } = useTheme();
  const { activeClock, setClockId, availableClocks } = useClock();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | undefined>(undefined);

  const handleCreate = () => {
    setEditingTheme(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (ct: CustomTheme) => {
    setEditingTheme(ct);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this theme?")) return;
    try {
      await supabase.from('custom_themes').delete().eq('id', id);
      await fetchCustomThemes();
      if (theme.id === id) {
        await setThemeId("dailys-default");
      }
    } catch (err) {
      console.error("Failed to delete theme", err);
    }
  };

  const handleDuplicate = (ct: CustomTheme) => {
    const copy: CustomTheme = {
      ...ct,
      name: `${ct.name} (Copy)`,
    };
    // Since it has the same ID right now, we can omit the ID by passing it through a transformer or just clearing it.
    // However, our CustomThemeEditor treats `initialTheme` with an ID as an update. 
    // We can trick it into creating a new one by removing the ID from the payload.
    const duplicatePayload = {
      ...copy,
      id: undefined as any // Force it to act like a new theme creation
    };
    setEditingTheme(duplicatePayload);
    setEditorOpen(true);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="flex h-16 items-center px-6 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <h1 className="font-display text-2xl" style={{ color: "var(--foreground)" }}>Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto w-full p-6 space-y-12 pb-32">
        
        {/* Appearance Section */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Appearance</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Customize how Dailys looks on this device.</p>
          </div>

          <div className="p-6 rounded-xl space-y-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            
            {/* Built-in Theme Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Active Theme</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Select a built-in or custom theme.</p>
              </div>
              
              <div className="relative group">
                <select 
                  value={theme.id}
                  onChange={(e) => setThemeId(e.target.value)}
                  className="appearance-none bg-transparent py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] transition-all border active:scale-95 cursor-pointer"
                  style={{ 
                    color: "var(--foreground)", 
                    borderColor: "var(--border)", 
                    background: "var(--surface-elevated)"
                  }}
                >
                  <optgroup label="Built-in" style={{ background: "var(--surface)" }}>
                    {availableThemes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                  {customThemes.length > 0 && (
                    <optgroup label="Custom" style={{ background: "var(--surface)" }}>
                      {customThemes.map(t => (
                         <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Typography Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Interface Typography</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Select the primary font for the application.</p>
              </div>
              
              <div className="relative group">
                <select 
                  value={activeFontId}
                  onChange={(e) => setFontId(e.target.value)}
                  className="appearance-none bg-transparent py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] transition-all border active:scale-95 cursor-pointer"
                  style={{ 
                    color: "var(--foreground)", 
                    borderColor: "var(--border)", 
                    background: "var(--surface-elevated)"
                  }}
                >
                  {availableFonts.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Clock Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Sidebar Clock</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Choose how the time is displayed.</p>
              </div>
              
              <div className="relative group">
                <select 
                  value={activeClock.id}
                  onChange={(e) => setClockId(e.target.value)}
                  className="appearance-none bg-transparent py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] transition-all border active:scale-95 cursor-pointer"
                  style={{ 
                    color: "var(--foreground)", 
                    borderColor: "var(--border)", 
                    background: "var(--surface-elevated)"
                  }}
                >
                  {availableClocks.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Preview boxes to show theme colors */}
            <div className="pt-4 border-t flex gap-3 flex-wrap" style={{ borderColor: "var(--border)" }}>
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
          
          {/* Custom Themes Section */}
          <div className="p-6 rounded-xl space-y-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Custom Themes</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Create or manage your personal JSON themes.</p>
              </div>
              <button 
                onClick={handleCreate}
                className="px-3 py-1.5 flex items-center gap-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] transition-all border active:scale-95 cursor-pointer"
                style={{ background: "var(--surface-elevated)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create
              </button>
            </div>
            
            {customThemes.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--muted)" }}>No custom themes yet.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {customThemes.map(ct => (
                  <div key={ct.id} className="group flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--background) 40%, transparent)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border shadow-sm" style={{ background: ct.theme_json.colors.background, borderColor: "var(--border)" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{ct.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>Updated {new Date(ct.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(ct)} className="p-1.5 rounded-md hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:scale-95 transition-all" style={{ color: "var(--foreground)" }} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDuplicate(ct)} className="p-1.5 rounded-md hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:scale-95 transition-all" style={{ color: "var(--foreground)" }} title="Duplicate">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(ct.id)} className="p-1.5 rounded-md hover:bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] active:scale-95 transition-all" style={{ color: "var(--danger)" }} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </section>

      </div>
      
      <AnimatePresence>
        {editorOpen && (
          <CustomThemeEditor 
            initialTheme={editingTheme} 
            onClose={() => setEditorOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
