import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useApp } from "../context/AppContext";
import PublicProfileModal from "../components/community/PublicProfileModal";

export type PeriodFilter = "week" | "month" | "all";
export type SortMetric = "streak" | "tasks" | "notes";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  tasks_completed: number;
  notes_created: number;
  focus_minutes: number;
}

export default function Community() {
  const { user } = useApp();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [sortMetric, setSortMetric] = useState<SortMetric>("streak");
  const [period, setPeriod] = useState<PeriodFilter>("week");
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Check current user status to see if they are opted in
  const [currentUserCommunity, setCurrentUserCommunity] = useState(false);
  const [currentUserLeaderboard, setCurrentUserLeaderboard] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    async function checkVisibility() {
      const { data } = await supabase.from("profiles").select("community_visible, leaderboard_visible").eq("id", user!.id).single();
      if (data) {
        setCurrentUserCommunity(data.community_visible);
        setCurrentUserLeaderboard(data.leaderboard_visible);
      }
    }
    checkVisibility();
  }, [user]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError("");
      
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const { data, error } = await supabase.rpc("get_community_leaderboard", {
        viewer_tz: tz,
        period_filter: period,
        sort_metric: sortMetric,
        limit_count: 20,
        page_offset: 0
      });

      if (error) {
        console.error("Failed to fetch leaderboard", error);
        setError("Failed to load community leaderboard.");
      } else {
        setEntries(data as LeaderboardEntry[]);
      }
      
      setLoading(false);
    }
    
    fetchLeaderboard();
  }, [period, sortMetric]);

  const currentUserPosition = useMemo(() => {
    if (!user || !currentUserLeaderboard) return null;
    const index = entries.findIndex(e => e.user_id === user.id);
    if (index === -1) {
      // Not in top 20
      return -1;
    }
    return index + 1;
  }, [entries, user, currentUserLeaderboard]);

  const currentUserEntry = useMemo(() => {
    if (!user) return null;
    return entries.find(e => e.user_id === user.id);
  }, [entries, user]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col h-full overflow-hidden min-h-0 w-full relative">
      <div className="flex-shrink-0 mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Community</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          See how you compare, stay motivated, and discover productive profiles.
        </p>
      </div>

      {!currentUserCommunity && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 mb-8 p-5 rounded-xl border border-dashed text-sm flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
        >
          <div>
            <div className="font-semibold mb-1">YOUR PROFILE IS PRIVATE</div>
            <div style={{ color: "var(--muted)" }}>Your statistics are not shown publicly.</div>
          </div>
          <button 
            onClick={() => window.location.hash = "#/dashboard/settings"}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-white text-black hover:opacity-90 transition-opacity"
          >
            Enable Community
          </button>
        </motion.div>
      )}

      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-end border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-6">
          {(["streak", "tasks", "notes"] as SortMetric[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSortMetric(tab)}
              className="text-sm font-medium transition-colors relative pb-2"
              style={{ color: sortMetric === tab ? "white" : "var(--muted)" }}
            >
              <span className="capitalize">{tab === "tasks" ? "Productivity" : tab}</span>
              {sortMetric === tab && (
                <motion.div layoutId="communityTabIndicator" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 p-1 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          {(["week", "month", "all"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                background: period === p ? "var(--border)" : "transparent",
                color: period === p ? "white" : "var(--muted)"
              }}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0 relative -mx-4 px-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
            Loading leaderboard...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-sm text-red-400">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-sm border border-dashed rounded-xl" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            <div className="font-medium text-white mb-1">COMMUNITY IS QUIET</div>
            <div>No public profiles are available yet.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-20">
            <div className="px-4 py-2 text-[10px] font-mono-data tracking-wider flex items-center" style={{ color: "var(--muted)" }}>
              <div className="w-12 text-center">RANK</div>
              <div className="flex-1 px-4">USER</div>
              <div className="w-24 text-right">
                {sortMetric === "streak" ? "STREAK" : sortMetric === "tasks" ? "TASKS" : "NOTES"}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                const isCurrentUser = user && entry.user_id === user.id;
                
                let primaryVal = entry.current_streak;
                if (sortMetric === "tasks") primaryVal = entry.tasks_completed;
                if (sortMetric === "notes") primaryVal = entry.notes_created;

                let subText = "";
                if (sortMetric !== "streak") subText = `${entry.current_streak} day streak`;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                    key={entry.user_id}
                    onClick={() => setSelectedUserId(entry.user_id)}
                    className="flex items-center px-4 py-3.5 rounded-xl cursor-pointer group transition-all"
                    style={{
                      background: isCurrentUser ? "var(--surface)" : "transparent",
                      border: isCurrentUser ? "1px solid var(--border)" : "1px solid transparent",
                    }}
                  >
                    <div className="w-12 text-center text-sm font-mono-data flex flex-col items-center justify-center">
                      <span style={{ 
                        color: rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "var(--muted)",
                        fontWeight: isTop3 ? 600 : 400
                      }}>
                        #{rank}
                      </span>
                    </div>

                    <div className="flex-1 px-4 flex items-center gap-3">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border" style={{ borderColor: "var(--border)" }} />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}>
                          {entry.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm group-hover:text-white transition-colors" style={{ color: isCurrentUser ? "white" : "rgba(255,255,255,0.9)" }}>
                          {entry.display_name} {isCurrentUser && <span className="text-[10px] ml-1 opacity-50 font-normal">(You)</span>}
                        </div>
                        {subText && <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{subText}</div>}
                      </div>
                    </div>

                    <div className="w-24 text-right font-medium text-sm flex items-center justify-end gap-1.5" style={{ color: "white" }}>
                      {primaryVal}
                      <span className="text-[10px] font-normal" style={{ color: "var(--muted)" }}>
                        {sortMetric === "streak" ? "days" : ""}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Current user out-of-top-20 state */}
            {currentUserLeaderboard && currentUserPosition === -1 && !loading && entries.length >= 20 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 pt-4 border-t flex items-center px-4 py-3.5 rounded-xl border border-dashed"
                style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="w-12 text-center text-xs font-mono-data" style={{ color: "var(--muted)" }}>
                  #?
                </div>
                <div className="flex-1 px-4 font-medium text-sm">You're below the top 20</div>
                <div className="w-24 text-right text-[10px]" style={{ color: "var(--muted)" }}>
                  Keep going!
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <PublicProfileModal 
            userId={selectedUserId} 
            onClose={() => setSelectedUserId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
