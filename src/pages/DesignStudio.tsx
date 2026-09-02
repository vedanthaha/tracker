import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { LayoutRenderer } from "../components/layout/LayoutRenderer";
import { LayoutSpec } from "../lib/design/LayoutSpec";
import { supabase } from "../lib/supabase";

export default function DesignStudio() {
  const { layouts, saveLayout } = useApp();
  
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentSurface, setCurrentSurface] = useState("home");
  
  // The layout we are currently previewing
  const [previewLayout, setPreviewLayout] = useState<LayoutSpec | null>(null);

  // Load the current saved layout for the selected surface when the component mounts or surface changes
  useEffect(() => {
    const saved = layouts.find((l) => l.surface === currentSurface);
    if (saved) {
      setPreviewLayout(saved.layout_spec);
    } else {
      // We don't have a specific way to load the default dynamically here without duplicating it,
      // but in a real scenario we'd import DEFAULT_HOME_LAYOUT.
      setPreviewLayout(null);
    }
  }, [layouts, currentSurface]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a design prompt.");
      return;
    }
    // API key is now optional (backend uses env var fallback)

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate layouts.");
      }

      const response = await fetch("https://zuxzxzwkushkvlrqqyqv.supabase.co/functions/v1/design-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider-key": apiKey,
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt,
          surface: currentSurface,
          currentLayout: previewLayout
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to generate layout" }));
        throw new Error(err.error || err.message || "An unknown error occurred");
      }

      const data = await response.json();
      setPreviewLayout(data.previewLayout);
    } catch (err: any) {
      setError(err.message || "Failed to communicate with design engine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!previewLayout) return;
    const { error } = await saveLayout(currentSurface, previewLayout);
    if (error) {
      setError(error);
    } else {
      // Success
      setError(null);
    }
  };

  const handleDiscard = () => {
    const saved = layouts.find((l) => l.surface === currentSurface);
    setPreviewLayout(saved ? saved.layout_spec : null);
    setPrompt("");
    setError(null);
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[var(--background)]">
      
      {/* Left Sidebar: Controls */}
      <div className="w-full md:w-80 flex-shrink-0 border-r border-[var(--card-border)] bg-[var(--card)] flex flex-col">
        <div className="p-5 border-b border-[var(--card-border)]">
          <h2 className="font-display text-2xl text-[var(--foreground)] mb-1">Design Studio</h2>
          <p className="text-xs text-[var(--muted)]">Design your workspace with AI.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Surface Selection */}
          <div>
            <label className="block text-xs font-mono-data tracking-widest text-[var(--muted)] uppercase mb-2">Surface</label>
            <select 
              value={currentSurface}
              onChange={(e) => setCurrentSurface(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="home">Home Dashboard</option>
              <option value="notes">Notes Workspace</option>
              <option value="todos">Tasks Workspace</option>
            </select>
          </div>

          {/* Provider Settings */}
          <div>
            <label className="block text-xs font-mono-data tracking-widest text-[var(--muted)] uppercase mb-2">Groq Key (Optional)</label>
            <input 
              type="password"
              placeholder="Leave blank to use server default"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-mono-data tracking-widest text-[var(--muted)] uppercase mb-2">Design Prompt</label>
            <textarea 
              rows={4}
              placeholder="e.g. Make my Home page focus on today's tasks, put notes on the right, and make analytics smaller."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-[var(--background)] font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Layout"}
          </button>
        </div>
      </div>

      {/* Right Area: Preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)] relative">
        {/* Preview Toolbar */}
        <div className="h-14 border-b border-[var(--card-border)] bg-[var(--card)] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--green)]"></div>
            <span className="text-xs font-mono-data uppercase tracking-widest text-[var(--muted)]">Live Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDiscard}
              className="px-4 py-1.5 rounded-md text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleApply}
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Apply to Workspace
            </button>
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto border border-dashed border-[var(--card-border)] rounded-xl min-h-[400px] relative">
            {previewLayout ? (
              <LayoutRenderer spec={previewLayout} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">
                No custom layout loaded. Generate one to preview.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
