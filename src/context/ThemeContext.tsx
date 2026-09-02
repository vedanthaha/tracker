import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeDefinition } from '../lib/theme/types';
import { getTheme, BUILT_IN_THEMES } from '../lib/theme/registry';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';

interface ThemeContextType {
  theme: ThemeDefinition;
  setThemeId: (id: string) => Promise<void>;
  availableThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'dailys-active-theme-id';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [activeThemeId, setActiveThemeId] = useState<string>('dailys-default');
  const [theme, setTheme] = useState<ThemeDefinition>(getTheme('dailys-default'));
  
  // Load initial theme from localStorage for fast initial render
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId && BUILT_IN_THEMES[savedThemeId]) {
      setActiveThemeId(savedThemeId);
      setTheme(getTheme(savedThemeId));
    }
  }, []);
  
  // Load user preference from Supabase if logged in
  useEffect(() => {
    if (!user) return;
    
    const fetchUserPreference = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('active_theme_id')
          .eq('user_id', user.id)
          .single();
          
        if (data && data.active_theme_id && BUILT_IN_THEMES[data.active_theme_id]) {
          setActiveThemeId(data.active_theme_id);
          setTheme(getTheme(data.active_theme_id));
          localStorage.setItem(THEME_STORAGE_KEY, data.active_theme_id);
        }
      } catch (err) {
        // user_preferences table might not exist yet, ignore
        console.log("Could not load user theme preference", err);
      }
    };
    
    fetchUserPreference();
  }, [user]);

  // Apply theme as CSS variables to the document
  useEffect(() => {
    const root = document.documentElement;
    
    // Colors
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--surface-elevated', theme.colors.surfaceElevated);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-soft', theme.colors.accentSoft);
    root.style.setProperty('--success', theme.colors.success);
    root.style.setProperty('--warning', theme.colors.warning);
    root.style.setProperty('--danger', theme.colors.danger);
    root.style.setProperty('--selection', theme.colors.selection);
    root.style.setProperty('--focus', theme.colors.focus);
    
    // Fallback variable names used in older CSS
    root.style.setProperty('--card', theme.colors.surface);
    root.style.setProperty('--card-border', theme.colors.border);
    root.style.setProperty('--green', theme.colors.success);
    root.style.setProperty('--red', theme.colors.danger);
    root.style.setProperty('--accent-dim', theme.colors.accentSoft);
    
    // Typography
    root.style.setProperty('--font-display', theme.typography.display);
    root.style.setProperty('--font-body', theme.typography.body);
    root.style.setProperty('--font-mono', theme.typography.mono);
    
    // Shape
    root.style.setProperty('--radius-sm', `${theme.shape.radiusSm}px`);
    root.style.setProperty('--radius-md', `${theme.shape.radiusMd}px`);
    root.style.setProperty('--radius-lg', `${theme.shape.radiusLg}px`);
    root.style.setProperty('--border-width', `${theme.shape.borderWidth}px`);
    
    // Fallback variable
    root.style.setProperty('--radius', `${theme.shape.radiusMd}px`);
    
    // Note: density is handled by adding a class or passing via context
    root.setAttribute('data-density', theme.density);
    
  }, [theme]);

  const handleSetThemeId = async (id: string) => {
    if (!BUILT_IN_THEMES[id]) return;
    
    setActiveThemeId(id);
    setTheme(getTheme(id));
    localStorage.setItem(THEME_STORAGE_KEY, id);
    
    if (user) {
      try {
        // Use upsert to update user preferences
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            active_theme_id: id 
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error("Failed to save theme preference", err);
      }
    }
  };

  const availableThemes = useMemo(() => Object.values(BUILT_IN_THEMES), []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId: handleSetThemeId, availableThemes }}>
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
