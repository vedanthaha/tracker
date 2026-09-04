import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { ThemeDefinition, CustomTheme } from '../lib/theme/types';
import { validateThemeJson, PartialThemeJson } from '../lib/theme/ThemeValidator';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface Props {
  initialTheme?: CustomTheme;
  onClose: () => void;
}

/**
 * Provides a JSON editor for creating or editing custom themes, including preview, import, export, formatting, and persistence controls.
 *
 * @param initialTheme - The existing custom theme to edit; when omitted, the active theme is used as a template for a new theme.
 * @param onClose - Callback invoked when the editor closes after cancellation or a successful save.
 */
export function CustomThemeEditor({ initialTheme, onClose }: Props) {
  const { theme, setPreviewTheme, setThemeId, fetchCustomThemes } = useTheme();
  const { user } = useApp();
  
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize text
  useEffect(() => {
    if (initialTheme) {
      const payload: PartialThemeJson = {
        name: initialTheme.name,
        ...initialTheme.theme_json
      };
      setJsonText(JSON.stringify(payload, null, 2));
    } else {
      // Use current active theme as a template
      const payload: PartialThemeJson = {
        name: theme.name + ' (Copy)',
        colors: theme.colors,
        typography: theme.typography,
        shape: theme.shape,
        density: theme.density
      };
      setJsonText(JSON.stringify(payload, null, 2));
    }
  }, [initialTheme, theme]);

  // Clean up preview on unmount
  useEffect(() => {
    return () => setPreviewTheme(null);
  }, [setPreviewTheme]);

  const handlePreview = () => {
    try {
      const validated = validateThemeJson(jsonText);
      setError(null);
      
      const preview: ThemeDefinition = {
        id: initialTheme ? initialTheme.id : 'preview-temp-id',
        name: validated.name,
        colors: validated.colors,
        typography: validated.typography,
        shape: validated.shape,
        density: validated.density
      };
      
      setPreviewTheme(preview);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApply = async () => {
    if (!user) {
      setError("You must be logged in to save custom themes.");
      return;
    }
    
    let validated: PartialThemeJson;
    try {
      validated = validateThemeJson(jsonText);
    } catch (err: any) {
      setError(err.message);
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const themeData = {
        user_id: user.id,
        name: validated.name,
        theme_json: {
          colors: validated.colors,
          typography: validated.typography,
          shape: validated.shape,
          density: validated.density
        }
      };
      
      let savedId = initialTheme?.id;
      
      if (initialTheme) {
        // Update existing
        const { error: saveErr } = await supabase
          .from('custom_themes')
          .update(themeData)
          .eq('id', initialTheme.id)
          .eq('user_id', user.id);
          
        if (saveErr) throw saveErr;
      } else {
        // Insert new
        const { data, error: insertErr } = await supabase
          .from('custom_themes')
          .insert([themeData])
          .select()
          .single();
          
        if (insertErr) throw insertErr;
        if (data) savedId = data.id;
      }
      
      await fetchCustomThemes();
      
      if (savedId) {
        setPreviewTheme(null); // Clear preview so context uses actual saved theme
        await setThemeId(savedId);
      }
      
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save theme.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError("Cannot format: Invalid JSON");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Just paste into the text area, user can preview/apply
        setJsonText(text);
        setError(null);
        // Clean the input so same file can be selected again
        e.target.value = '';
      } catch (err) {
        setError("Failed to read file.");
      }
    };
    reader.readAsText(file);
  };
  
  const handleExport = () => {
    try {
      // Validate first so we don't export garbage
      const validated = validateThemeJson(jsonText);
      const blob = new Blob([JSON.stringify(validated, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${validated.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Cannot export: ${err.message}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ background: "color-mix(in srgb, var(--background) 80%, transparent)", backdropFilter: "blur(8px)" }}
    >
      <div 
        className="w-full max-w-4xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <header className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--surface-elevated)" }}>
          <h2 className="font-medium" style={{ color: "var(--foreground)" }}>
            {initialTheme ? 'Edit Custom Theme' : 'Create Custom Theme'}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Export
            </button>
            <label 
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* JSON Editor */}
          <div className="flex-1 flex flex-col border-r border-b md:border-b-0" style={{ borderColor: "var(--border)" }}>
            <div className="flex-1 p-4 relative">
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                className="w-full h-full p-4 rounded-lg font-mono text-sm resize-none focus:outline-none"
                style={{ 
                  background: "color-mix(in srgb, var(--background) 50%, transparent)", 
                  color: "var(--foreground)", 
                  border: "1px solid var(--border)" 
                }}
                spellCheck={false}
              />
            </div>
            
            {/* Error Bar */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-3 mx-4 mb-4 rounded-lg text-sm font-medium"
                  style={{ background: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)" }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="px-4 py-3 flex gap-2 border-t" style={{ borderColor: "var(--border)", background: "var(--surface-elevated)" }}>
              <button 
                onClick={handleFormat}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Format
              </button>
              <div className="flex-1" />
              <button 
                onClick={handlePreview}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--accent)" }}
              >
                Preview UI
              </button>
            </div>
          </div>
          
          {/* Mock UI Preview Panel */}
          <div className="w-full md:w-80 flex-shrink-0 p-6 flex flex-col gap-6 overflow-y-auto" style={{ background: "var(--background)" }}>
            <div className="space-y-1">
              <h3 className="font-display text-2xl" style={{ color: "var(--foreground)" }}>Preview</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Click 'Preview UI' to test changes.</p>
            </div>
            
            <div className="p-4 rounded-xl space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
              <h4 className="font-medium" style={{ color: "var(--foreground)" }}>Surface Card</h4>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Testing typography and muted text scaling within standard containers.</p>
              
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: "var(--accent)", color: "var(--background)", borderRadius: "var(--radius-sm)" }}>
                  Primary
                </button>
                <button className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors border" style={{ background: "transparent", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: "var(--radius-sm)" }}>
                  Outline
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: "var(--success)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Success Token</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: "var(--warning)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Warning Token</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: "var(--danger)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Danger Token</span>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="px-6 py-4 flex justify-end gap-3 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{ background: "transparent", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              background: saving ? "var(--muted)" : "var(--foreground)", 
              color: "var(--background)" 
            }}
          >
            {saving ? 'Saving...' : 'Apply & Save'}
          </button>
        </footer>
      </div>
    </motion.div>
  );
}
