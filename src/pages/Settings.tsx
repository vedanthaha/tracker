import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useClock } from "../context/ClockContext";
import { CustomThemeEditor } from "../components/CustomThemeEditor";
import { CustomTheme } from "../lib/theme/types";
import { supabase } from "../lib/supabase";
import { ThemedSelect } from "../components/ui/ThemedSelect";

export default function Settings() {
  const { theme, setThemeId, availableThemes, customThemes, fetchCustomThemes, activeFontId, setFontId, availableFonts } = useTheme();
  const { activeClock, setClockId, availableClocks } = useClock();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | undefined>(undefined);

  const [profile, setProfile] = useState<{ bio: string | null, community_visible: boolean, leaderboard_visible: boolean } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('profiles').select('bio, community_visible, leaderboard_visible').eq('id', session.user.id).single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, []);

  const updateProfile = async (updates: Partial<NonNullable<typeof profile>>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    if (updates.community_visible === false) newProfile.leaderboard_visible = false;
    
    setProfile(newProfile);
    setSavingProfile(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({
        bio: newProfile.bio,
        community_visible: newProfile.community_visible,
        leaderboard_visible: newProfile.leaderboard_visible
      }).eq('id', session.user.id);
    }
    setSavingProfile(false);
  };

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
        
        {/* Community Section */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Community</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Manage your public profile and leaderboard visibility.</p>
          </div>

          <div className="p-6 rounded-xl space-y-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {profile ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Appear in Community</h3>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Allow others to view your public profile statistics.</p>
                  </div>
                  <button
                    onClick={() => updateProfile({ community_visible: !profile.community_visible })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${profile.community_visible ? "bg-[var(--accent)]" : "bg-neutral-600"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile.community_visible ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="space-y-1">
                    <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Appear on Leaderboard</h3>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Include your statistics in the community ranking.</p>
                  </div>
                  <button
                    disabled={!profile.community_visible}
                    onClick={() => updateProfile({ leaderboard_visible: !profile.leaderboard_visible })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${profile.leaderboard_visible ? "bg-[var(--accent)]" : "bg-neutral-600"} ${!profile.community_visible ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile.leaderboard_visible ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="pt-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                  <div className="space-y-1 mb-2">
                    <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Public Bio</h3>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>A short message displayed on your public profile.</p>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={profile.bio || ""}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    placeholder="E.g., Working on side projects..."
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                    style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  />
                  {savingProfile && <p className="text-xs" style={{ color: "var(--muted)" }}>Saving...</p>}
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading community settings...</p>
            )}
          </div>
        </section>

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
              
              <div className="relative group flex items-center justify-end">
                <ThemedSelect
                  value={theme.id}
                  onChange={setThemeId}
                  groups={[
                    {
                      label: "Built-in",
                      options: availableThemes.map(t => ({ value: t.id, label: t.name }))
                    },
                    ...(customThemes.length > 0 ? [{
                      label: "Custom",
                      options: customThemes.map(t => ({ value: t.id, label: t.name }))
                    }] : [])
                  ]}
                />
              </div>
            </div>

            {/* Typography Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Interface Typography</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Select the primary font for the application.</p>
              </div>
              
              <div className="relative group flex items-center justify-end">
                <ThemedSelect
                  value={activeFontId}
                  onChange={setFontId}
                  groups={[
                    {
                      options: availableFonts.map(f => ({ value: f.id, label: f.name }))
                    }
                  ]}
                />
              </div>
            </div>

            {/* Clock Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Sidebar Clock</h3>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Choose how the time is displayed.</p>
              </div>
              
              <div className="relative group flex items-center justify-end">
                <ThemedSelect
                  value={activeClock.id}
                  onChange={setClockId}
                  groups={[
                    {
                      options: availableClocks.map(c => ({ value: c.id, label: c.name }))
                    }
                  ]}
                />
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
