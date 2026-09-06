import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

interface PublicProfileModalProps {
  userId: string;
  onClose: () => void;
}

interface ProfileData {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  current_streak: number;
  longest_streak: number;
  tasks_completed: number;
  notes_created: number;
  focus_minutes: number;
}

export default function PublicProfileModal({ userId, onClose }: PublicProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");
      
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, error: rpcError } = await supabase.rpc("get_public_profile", {
        target_user_id: userId,
        viewer_tz: tz
      });

      if (rpcError) {
        console.error("Failed to load public profile", rpcError);
        setError("Failed to load profile.");
      } else if (!data || data.length === 0) {
        setError("This profile isn't public.");
      } else {
        setProfile(data[0] as ProfileData);
      }
      
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden border shadow-2xl flex flex-col"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        {/* Header/Close */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-sm" style={{ color: "var(--muted)" }}>
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin mb-4" />
            Loading profile...
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-xl" style={{ background: "var(--surface)", color: "var(--muted)" }}>
              🔒
            </div>
            <div className="font-semibold text-white mb-1">Private Profile</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>{error}</div>
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Top section with avatar */}
            <div className="p-8 pb-6 flex flex-col items-center text-center border-b relative" style={{ borderColor: "var(--border)", background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)" }}>
              <div className="w-20 h-20 rounded-full mb-4 border-4 overflow-hidden relative shadow-lg" style={{ borderColor: "var(--bg)" }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-neutral-800 text-white">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-1">{profile.display_name}</h2>
              
              {profile.bio ? (
                <p className="text-sm px-4 italic" style={{ color: "var(--muted)" }}>"{profile.bio}"</p>
              ) : (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>No bio provided.</p>
              )}
            </div>

            {/* Stats section */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <StatCard value={profile.current_streak.toString()} label="Current streak" sub="days" />
              <StatCard value={profile.longest_streak.toString()} label="Longest streak" sub="days" />
              <StatCard value={profile.tasks_completed.toString()} label="Tasks completed" sub="total" />
              <StatCard value={profile.notes_created.toString()} label="Notes created" sub="total" />
              
              <div className="col-span-2">
                <StatCard 
                  value={
                    profile.focus_minutes >= 60 
                      ? `${Math.floor(profile.focus_minutes / 60)}h ${profile.focus_minutes % 60}m`
                      : `${profile.focus_minutes}m`
                  } 
                  label="Focus time" 
                  sub="total" 
                />
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.01)" }}>
      <div className="text-xl font-bold text-white mb-0.5 flex items-baseline gap-1">
        {value}
        <span className="text-[10px] font-normal" style={{ color: "var(--muted)" }}>{sub}</span>
      </div>
      <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
