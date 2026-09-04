import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeDefinition, CustomTheme } from '../lib/theme/types';
import { getTheme, BUILT_IN_THEMES } from '../lib/theme/registry';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';

interface ThemeContextType {
  theme: ThemeDefinition;
  setThemeId: (id: string) => Promise<void>;
  availableThemes: ThemeDefinition[];
  customThemes: CustomTheme[];
  fetchCustomThemes: () => Promise<void>;
  setPreviewTheme: (theme: ThemeDefinition | null) => void;
  activeFontId: string;
  setFontId: (id: string) => Promise<void>;
  availableFonts: { id: string, name: string, value: string }[];
}

const AVAILABLE_FONTS = [
  { id: 'theme', name: 'Theme Default', value: '' },
  { id: 'inter', name: 'Inter (Sans)', value: 'Inter, sans-serif' },
  { id: 'instrument', name: 'Instrument (Serif)', value: 'Instrument Serif, serif' },
  { id: 'jetbrains', name: 'JetBrains (Mono)', value: 'JetBrains Mono, monospace' },
  { id: 'system', name: 'System', value: 'system-ui, -apple-system, sans-serif' }
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'dailys-active-theme-id';
const FONT_STORAGE_KEY = 'dailys-active-font-id';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [activeThemeId, setActiveThemeId] = useState<string>('dailys-default');
  const [theme, setTheme] = useState<ThemeDefinition>(getTheme('dailys-default'));
  const [activeFontId, setActiveFontId] = useState<string>('theme');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [previewTheme, setPreviewTheme] = useState<ThemeDefinition | null>(null);
  
  const resolveTheme = useCallback((id: string, customList: CustomTheme[]): ThemeDefinition => {
    if (BUILT_IN_THEMES[id]) {
      return getTheme(id);
    }
    const ct = customList.find(c => c.id === id);
    if (ct) {
      return { id: ct.id, name: ct.name, ...ct.theme_json } as ThemeDefinition;
    }
    return getTheme('dailys-default');
  }, []);

  const fetchCustomThemes = useCallback(async () => {
    if (!user) {
      setCustomThemes([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('custom_themes')
        .select('*')
        .eq('user_id', user.id);
      
      if (data && !error) {
        setCustomThemes(data);
      }
    } catch (err) {
      console.log("Could not load custom themes", err);
    }
  }, [user]);

  // Load custom themes when user changes
  useEffect(() => {
    fetchCustomThemes();
  }, [fetchCustomThemes]);

  // Load initial theme from localStorage for fast initial render
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      setActiveThemeId(savedThemeId);
      // We might not have custom themes loaded yet, so it may default if it's a custom theme.
      setTheme(resolveTheme(savedThemeId, customThemes));
    }
    const savedFontId = localStorage.getItem(FONT_STORAGE_KEY);
    if (savedFontId) setActiveFontId(savedFontId);
  }, [resolveTheme, customThemes]);
  
  // Load user preference from Supabase if logged in
  useEffect(() => {
    if (!user) return;
    
    const fetchUserPreference = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('active_theme_id, active_font')
          .eq('user_id', user.id)
          .single();
          
        if (data) {
          if (data.active_theme_id) {
            setActiveThemeId(data.active_theme_id);
            setTheme(resolveTheme(data.active_theme_id, customThemes));
            localStorage.setItem(THEME_STORAGE_KEY, data.active_theme_id);
          }
          if (data.active_font) {
            setActiveFontId(data.active_font);
            localStorage.setItem(FONT_STORAGE_KEY, data.active_font);
          }
        }
      } catch (err) {
        // user_preferences table might not exist yet, ignore
        console.log("Could not load user theme preference", err);
      }
    };
    
    fetchUserPreference();
  }, [user, customThemes, resolveTheme]);

  // Apply theme as CSS variables to the document
  const activeDisplayTheme = previewTheme || theme;

  useEffect(() => {
    const root = document.documentElement;
    const t = activeDisplayTheme;
    
    // Colors
    root.style.setProperty('--background', t.colors.background);
    root.style.setProperty('--surface', t.colors.surface);
    root.style.setProperty('--surface-elevated', t.colors.surfaceElevated);
    root.style.setProperty('--foreground', t.colors.foreground);
    root.style.setProperty('--muted', t.colors.muted);
    root.style.setProperty('--border', t.colors.border);
    root.style.setProperty('--accent', t.colors.accent);
    root.style.setProperty('--accent-soft', t.colors.accentSoft);
    root.style.setProperty('--success', t.colors.success);
    root.style.setProperty('--warning', t.colors.warning);
    root.style.setProperty('--danger', t.colors.danger);
    root.style.setProperty('--selection', t.colors.selection);
    root.style.setProperty('--focus', t.colors.focus);
    
    // Fallback variable names used in older CSS
    root.style.setProperty('--card', t.colors.surface);
    root.style.setProperty('--card-border', t.colors.border);
    root.style.setProperty('--green', t.colors.success);
    root.style.setProperty('--red', t.colors.danger);
    root.style.setProperty('--accent-dim', t.colors.accentSoft);
    
    // Typography
    const selectedFont = AVAILABLE_FONTS.find(f => f.id === activeFontId);
    const bodyFont = (selectedFont && selectedFont.value) ? selectedFont.value : t.typography.body;
    // We only override display if user picks a specific font, otherwise we leave display as theme default unless they picked a serif.
    const displayFont = (selectedFont && selectedFont.value) ? selectedFont.value : t.typography.display;
    
    root.style.setProperty('--font-display', displayFont);
    root.style.setProperty('--font-body', bodyFont);
    root.style.setProperty('--font-mono', t.typography.mono);
    
    // Shape
    root.style.setProperty('--radius-sm', `${t.shape.radiusSm}px`);
    root.style.setProperty('--radius-md', `${t.shape.radiusMd}px`);
    root.style.setProperty('--radius-lg', `${t.shape.radiusLg}px`);
    root.style.setProperty('--border-width', `${t.shape.borderWidth}px`);
    
    // Fallback variable
    root.style.setProperty('--radius', `${t.shape.radiusMd}px`);
    
    // Note: density is handled by adding a class or passing via context
    root.setAttribute('data-density', t.density);
    
  }, [activeDisplayTheme, activeFontId]);

  const handleSetThemeId = async (id: string) => {
    const nextTheme = resolveTheme(id, customThemes);
    if (nextTheme.id !== id && id !== 'dailys-default') {
      // Means we couldn't find the theme (invalid ID), resolveTheme fell back to dailys-default.
      // But we allow it to fall back safely.
    }
    
    setActiveThemeId(nextTheme.id);
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme.id);
    
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            active_theme_id: nextTheme.id 
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error("Failed to save theme preference", err);
      }
    }
  };

  const handleSetFontId = async (id: string) => {
    setActiveFontId(id);
    localStorage.setItem(FONT_STORAGE_KEY, id);
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ user_id: user.id, active_font: id }, { onConflict: 'user_id' });
      } catch (err) {
        console.error("Failed to save font preference", err);
      }
    }
  };

  const availableThemes = useMemo(() => Object.values(BUILT_IN_THEMES), []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setThemeId: handleSetThemeId, 
      availableThemes,
      customThemes,
      fetchCustomThemes,
      setPreviewTheme,
      activeFontId,
      setFontId: handleSetFontId,
      availableFonts: AVAILABLE_FONTS
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
