import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Edit3, X, Filter, Phone, Mail, MessageCircle, Calendar, FileText, Activity, AlertCircle, Bookmark, Download, Upload, CheckSquare, LayoutGrid, List } from "lucide-react";
import { useMetricLeads, MetricLead, LeadStatus, LeadPriority, WebsiteQuality, MetricActivity, ActivityType, CallOutcome, MetricPitch, MetricSavedView } from "../hooks/useMetricLeads";
import { MetricAnalytics } from "../components/MetricAnalytics";

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "var(--accent)",
  CONTACTED: "var(--foreground)",
  CONNECTED: "#7eb8e8",
  INTERESTED: "var(--green)",
  CALL_BOOKED: "#b48ee8",
  CALL_COMPLETED: "#b48ee8",
  PROPOSAL: "var(--accent)",
  WON: "var(--green)",
  LOST: "var(--red)",
  NO_RESPONSE: "var(--muted)",
  NOT_INTERESTED: "var(--muted)",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONNECTED: "Connected",
  INTERESTED: "Interested",
  CALL_BOOKED: "Call Booked",
  CALL_COMPLETED: "Call Completed",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
  NO_RESPONSE: "No Response",
  NOT_INTERESTED: "Not Interested",
};

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  HOT: "var(--red)",
  WARM: "var(--accent)",
  COLD: "color-mix(in srgb, var(--foreground) 20%, transparent)",
};

const BOARD_COLUMNS: LeadStatus[] = [
  "NEW", "CONTACTED", "CONNECTED", "INTERESTED", 
  "CALL_BOOKED", "CALL_COMPLETED", "PROPOSAL", "WON"
];

function getAttentionIndicator(lead: MetricLead) {
  const reasons: string[] = [];
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (lead.priority === "HOT") reasons.push("Hot Priority");
  if (lead.next_follow_up && lead.next_follow_up < todayStr && lead.status !== "WON" && lead.status !== "LOST") {
    reasons.push("Overdue Follow-up");
  }
  if (lead.has_website && (lead.website_quality === "POOR" || lead.website_quality === "NONE")) {
    reasons.push("Poor/No Website");
  }
  
  if (reasons.length >= 2 || (lead.priority === "HOT" && reasons.length >= 1)) {
    return { level: "HIGH", reasons };
  } else if (reasons.length === 1) {
    return { level: "MEDIUM", reasons };
  }
  return null;
}

export default function MetricTracker() {
  const { 
    leads, pitches, savedViews, analytics, loading, error, 
    addLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads,
    fetchActivities, addActivity, addPitch, addSavedView, deleteSavedView,
    preferences, updatePreferences
  } = useMetricLeads();

  // Notification System
  const notifiedRefs = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!preferences.reminders_enabled) return;
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    if (Notification.permission === "granted") {
      const todayStr = new Date().toISOString().split('T')[0];
      const toNotify = leads.filter(l => 
        l.status !== "WON" && 
        l.status !== "LOST" &&
        (l.next_follow_up === todayStr || (preferences.overdue_reminders_enabled && l.next_follow_up && l.next_follow_up < todayStr))
      );
      
      toNotify.forEach(lead => {
        if (!notifiedRefs.current.has(lead.id)) {
          new Notification("Follow-up Reminder", {
            body: `Follow up with ${lead.business_name} today!`,
            icon: "/favicon.ico"
          });
          notifiedRefs.current.add(lead.id);
        }
      });
    }
  }, [leads, preferences]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [websiteFilter, setWebsiteFilter] = useState<"ALL" | "NO_WEBSITE" | "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT">("ALL");
  const [quickFilter, setQuickFilter] = useState<"ALL"|"TODAY"|"OVERDUE"|"UPCOMING"|"HOT"|"BOOKED"|"WON"|"LOST">("ALL");
  
  const [viewMode, setViewMode] = useState<"TABLE" | "BOARD">("TABLE");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<MetricLead | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [showSavedViewsMenu, setShowSavedViewsMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters logic
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (statusFilter !== "ALL") {
      result = result.filter(l => l.status === statusFilter);
    }
    
    if (websiteFilter !== "ALL") {
      if (websiteFilter === "NO_WEBSITE") result = result.filter(l => !l.has_website);
      else result = result.filter(l => l.has_website && l.website_quality === websiteFilter);
    }
    
    if (quickFilter !== "ALL") {
      const todayStr = new Date().toISOString().split('T')[0];
      if (quickFilter === "TODAY") {
        result = result.filter(l => l.next_follow_up?.startsWith(todayStr));
      } else if (quickFilter === "OVERDUE") {
        result = result.filter(l => l.next_follow_up && l.next_follow_up < todayStr && l.status !== "WON" && l.status !== "LOST");
      } else if (quickFilter === "UPCOMING") {
        result = result.filter(l => l.next_follow_up && l.next_follow_up > todayStr);
      } else if (quickFilter === "HOT") {
        result = result.filter(l => l.priority === "HOT");
      } else if (quickFilter === "BOOKED") {
        result = result.filter(l => l.status === "CALL_BOOKED" || l.status === "CALL_COMPLETED");
      } else if (quickFilter === "WON") {
        result = result.filter(l => l.status === "WON");
      } else if (quickFilter === "LOST") {
        result = result.filter(l => l.status === "LOST");
      }
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.business_name?.toLowerCase().includes(q) ||
        l.contact_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.website?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, statusFilter, websiteFilter, quickFilter, searchQuery]);

  // Today Workspace logic
  const todayWorkspace = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = leads.filter(l => l.next_follow_up && l.next_follow_up < todayStr && l.status !== "WON" && l.status !== "LOST");
    const todayFollowUps = leads.filter(l => l.next_follow_up?.startsWith(todayStr));
    const highAttention = leads.filter(l => getAttentionIndicator(l)?.level === "HIGH" && l.status !== "WON" && l.status !== "LOST");
    
    const needsAttentionIds = new Set([...overdue.map(l => l.id), ...todayFollowUps.map(l => l.id), ...highAttention.map(l => l.id)]);
    const needsAttention = leads.filter(l => needsAttentionIds.has(l.id)).slice(0, 5); // Limit to top 5
    
    return { overdueCount: overdue.length, todayCount: todayFollowUps.length, needsAttention };
  }, [leads]);

  const handleEdit = (lead: MetricLead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const handleBulkStatus = async (status: LeadStatus) => {
    if (selectedLeads.size === 0) return;
    await bulkUpdateLeads(Array.from(selectedLeads), { status });
    setSelectedLeads(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedLeads.size} leads?`)) {
      await bulkDeleteLeads(Array.from(selectedLeads));
      setSelectedLeads(new Set());
    }
  };

  // Kanban Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("leadId", id);
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("leadId");
    if (id) {
      const lead = leads.find(l => l.id === id);
      if (lead && lead.status !== status) {
        // Optimistic update handled by hook internally upon successful save
        await updateLead(id, { status });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Save View
  const handleSaveView = async () => {
    const name = prompt("Name for this saved view:");
    if (!name) return;
    await addSavedView({
      name,
      filters: {
        statusFilter,
        websiteFilter,
        quickFilter,
        searchQuery
      }
    });
  };

  const applySavedView = (view: MetricSavedView) => {
    setStatusFilter(view.filters.statusFilter || "ALL");
    setWebsiteFilter(view.filters.websiteFilter || "ALL");
    setQuickFilter(view.filters.quickFilter || "ALL");
    setSearchQuery(view.filters.searchQuery || "");
    setShowSavedViewsMenu(false);
  };

  // Export
  const handleExportCSV = () => {
    const headers = ["Business Name", "Contact Name", "Email", "Phone", "Website", "Status", "Priority", "Next Follow-up", "Notes"];
    const rows = filteredLeads.map(l => [
      `"${l.business_name || ""}"`,
      `"${l.contact_name || ""}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.website || ""}"`,
      `"${l.status || ""}"`,
      `"${l.priority || ""}"`,
      `"${l.next_follow_up || ""}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "metric_tracker_leads.csv";
    link.click();
  };

  // Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || [];
        if (cols.length >= 1 && cols[0]) {
          await addLead({
            business_name: cols[0],
            contact_name: cols[1] || null,
            email: cols[2] || null,
            phone: cols[3] || null,
            website: cols[4] || null,
            has_website: !!cols[4],
            status: (Object.keys(STATUS_LABELS).includes(cols[5]) ? cols[5] : "NEW") as LeadStatus,
            priority: (["HOT", "WARM", "COLD"].includes(cols[6]) ? cols[6] : null) as LeadPriority,
            notes: cols[8] || null,
          });
          imported++;
        }
      }
      alert(`Imported ${imported} leads successfully.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-[var(--font-body)]">
      {/* Header */}
      <div className="px-6 md:px-12 py-6 border-b border-[var(--card-border)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display">Metric Tracker</h1>
            <p className="text-sm text-[var(--muted)]">Manage leads and outreach pipeline.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex bg-[var(--card)] border border-[var(--card-border)] rounded-md p-1">
              <button 
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded ${viewMode === "TABLE" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode("BOARD")}
                className={`p-1.5 rounded ${viewMode === "BOARD" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            
            <button 
              onClick={handleExportCSV}
              title="Export CSV"
              className="bg-[var(--card)] border border-[var(--card-border)] p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--muted)]"
            >
              <Download size={16} />
            </button>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              title="Import CSV"
              className="bg-[var(--card)] border border-[var(--card-border)] p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--muted)]"
            >
              <Upload size={16} />
            </button>
            
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              title="Tracker Settings"
              className="bg-[var(--card)] border border-[var(--card-border)] p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--muted)] ml-2"
            >
              <AlertCircle size={16} />
            </button>
            <button 
              onClick={handleAddNew}
              className="bg-[var(--foreground)] text-[var(--background)] px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:opacity-90 transition-opacity ml-2"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors w-48"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_LABELS).map(key => (
              <option key={key} value={key}>{STATUS_LABELS[key as LeadStatus]}</option>
            ))}
          </select>
          
          <select 
            value={websiteFilter}
            onChange={(e) => setWebsiteFilter(e.target.value as any)}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">All Websites</option>
            <option value="NO_WEBSITE">No Website</option>
            <option value="POOR">Poor Website</option>
            <option value="AVERAGE">Average Website</option>
            <option value="GOOD">Good Website</option>
            <option value="EXCELLENT">Excellent Website</option>
          </select>

          <div className="h-6 w-px bg-[var(--card-border)] mx-1" />

          {/* Quick Filters */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {["ALL", "TODAY", "OVERDUE", "UPCOMING", "HOT", "BOOKED", "WON", "LOST"].map((f) => (
              <button
                key={f}
                onClick={() => setQuickFilter(f as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  quickFilter === f 
                    ? "bg-[var(--foreground)] text-[var(--background)]" 
                    : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]"
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-[var(--card-border)] mx-1" />
          
          {/* Saved Views Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowSavedViewsMenu(!showSavedViewsMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              <Bookmark size={14} /> Views
            </button>
            {showSavedViewsMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--card-border)] rounded-lg shadow-xl z-20 py-2">
                <button onClick={handleSaveView} className="w-full text-left px-4 py-1.5 text-sm text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2">
                  <Plus size={14} /> Save Current View
                </button>
                {savedViews.length > 0 && <div className="h-px bg-[var(--card-border)] my-2" />}
                {savedViews.map(view => (
                  <div key={view.id} className="flex items-center justify-between px-4 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 group">
                    <button onClick={() => applySavedView(view)} className="text-sm truncate max-w-[120px] text-left text-[var(--muted)] group-hover:text-[var(--foreground)]">
                      {view.name}
                    </button>
                    <button onClick={() => deleteSavedView(view.id)} className="text-[var(--red)] opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 md:p-12 pt-6">
        {/* Today Workspace */}
        {todayWorkspace.needsAttention.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
              <Activity size={16} /> Today Workspace
              <span className="text-xs font-normal opacity-70 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{todayWorkspace.overdueCount} Overdue</span>
              <span className="text-xs font-normal opacity-70 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{todayWorkspace.todayCount} Follow-ups</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayWorkspace.needsAttention.map(lead => {
                const attention = getAttentionIndicator(lead);
                return (
                  <div key={lead.id} onClick={() => handleEdit(lead)} className="bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--accent)] rounded-lg p-4 cursor-pointer transition-colors relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium truncate">{lead.business_name}</div>
                      {attention && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${attention.level === "HIGH" ? "bg-[var(--red)]/10 text-[var(--red)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
                          {attention.level} Attention
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted)] mb-3">
                      {lead.next_action || "No next action specified"}
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-xs font-mono-data opacity-70">
                        {lead.next_follow_up ? formatDate(lead.next_follow_up) : "No follow-up date"}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLead(lead.id, { next_follow_up: null, next_action: null });
                        }}
                        className="text-xs font-medium text-[var(--green)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <CheckSquare size={12} /> Mark Done
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {preferences.daily_summary_enabled && (
              <div className="mt-6 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--surface-elevated)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">Daily Progress</h3>
                  <button 
                    onClick={() => {
                      const goal = prompt("Enter daily call goal:", preferences.daily_call_goal?.toString() || "20");
                      if (goal && !isNaN(parseInt(goal))) updatePreferences({ daily_call_goal: parseInt(goal) });
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
                  >
                    Edit Goal
                  </button>
                </div>
                
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const callsToday = analytics.recentActivities.filter(a => a.type === "CALL" && a.occurred_at.startsWith(todayStr)).length;
                  const goal = preferences.daily_call_goal || 20;
                  const percent = Math.min(100, Math.round((callsToday / goal) * 100));
                  return (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{callsToday} / {goal} Calls</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-[var(--card-border)] rounded-full h-2 overflow-hidden">
                        <div className="bg-[var(--green)] h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        <MetricAnalytics 
          leads={leads} 
          activities={analytics.recentActivities} 
          pitches={pitches}
          totalCalls={analytics.totalCalls} 
          connectedCalls={analytics.connectedCalls} 
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="text-[var(--muted)] text-sm">Loading leads...</div>
          </div>
        ) : error ? (
          <div className="text-[var(--red)] text-sm">{error}</div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[var(--card-border)] rounded-xl">
            <p className="text-[var(--muted)] mb-4">No leads yet. Add your first prospect to start tracking outreach.</p>
            <button 
              onClick={handleAddNew}
              className="bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--primary)] text-[var(--foreground)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + Add Lead
            </button>
          </div>
        ) : viewMode === "TABLE" ? (
          <div className="overflow-x-auto pb-32">
            {/* Bulk Actions Header */}
            <div className={`mb-4 flex items-center gap-3 transition-opacity ${selectedLeads.size > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <span className="text-sm font-medium bg-[var(--foreground)] text-[var(--background)] px-2 py-1 rounded">{selectedLeads.size} selected</span>
              
              <div className="flex items-center gap-2 border border-[var(--card-border)] rounded-md p-1 bg-[var(--card)]">
                <select 
                  onChange={(e) => handleBulkStatus(e.target.value as LeadStatus)}
                  value=""
                  className="bg-transparent text-xs outline-none px-2 cursor-pointer"
                >
                  <option value="" disabled>Change Status...</option>
                  {Object.keys(STATUS_LABELS).map(key => <option key={key} value={key}>{STATUS_LABELS[key as LeadStatus]}</option>)}
                </select>
                <div className="h-4 w-px bg-[var(--card-border)]" />
                <button onClick={handleBulkDelete} className="text-xs text-[var(--red)] hover:underline px-2 flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>

            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                  <th className="py-3 px-4 w-8">
                    <input 
                      type="checkbox" 
                      className="accent-[var(--accent)]" 
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Business</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Contact</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Priority</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Website</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Next Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => handleEdit(lead)}
                    className="border-b border-[var(--card-border)] hover:bg-[var(--card)]/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="accent-[var(--accent)]"
                        checked={selectedLeads.has(lead.id)} 
                        onChange={() => toggleSelect(lead.id)} 
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-[var(--foreground)] truncate max-w-[200px]">{lead.business_name}</div>
                        {getAttentionIndicator(lead) && <span title="High Attention Needed"><AlertCircle size={14} className="text-[var(--red)]" /></span>}
                      </div>
                      {lead.industry && <div className="text-xs text-[var(--muted)] truncate max-w-[200px]">{lead.industry}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[150px]">{lead.contact_name || "-"}</div>
                      {lead.email && <div className="text-xs text-[var(--muted)] truncate max-w-[150px]">{lead.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-medium border"
                        style={{ 
                          color: STATUS_COLORS[lead.status], 
                          borderColor: `color-mix(in srgb, ${STATUS_COLORS[lead.status]} 30%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[lead.status]} 10%, transparent)`
                        }}
                      >
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {lead.priority ? (
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ color: PRIORITY_COLORS[lead.priority] }}
                        >
                          {lead.priority}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {lead.has_website ? (
                        <a 
                          href={lead.website?.startsWith("http") ? lead.website : `https://${lead.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[var(--accent)] hover:underline truncate max-w-[150px] inline-block"
                        >
                          {lead.website || "Yes"}
                        </a>
                      ) : (
                        <span className="text-[var(--muted)]">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">
                      {lead.next_follow_up ? formatDate(lead.next_follow_up) : "-"}
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--muted)]">
                      No matching leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-32 items-start h-[600px]">
            {BOARD_COLUMNS.map(status => {
              const colLeads = filteredLeads.filter(l => l.status === status);
              return (
                <div 
                  key={status}
                  className="flex-shrink-0 w-72 bg-[var(--card)] border border-[var(--card-border)] rounded-lg flex flex-col max-h-full"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="p-3 border-b border-[var(--card-border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10 rounded-t-lg">
                    <span className="text-xs font-bold tracking-wider" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                    <span className="text-xs text-[var(--muted)] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                  </div>
                  <div className="p-2 overflow-y-auto flex-1 space-y-2">
                    {colLeads.map(lead => {
                      const attention = getAttentionIndicator(lead);
                      return (
                        <div 
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => handleEdit(lead)}
                          className="bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)] rounded p-3 cursor-grab active:cursor-grabbing text-sm shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium truncate block">{lead.business_name}</span>
                            {attention && <AlertCircle size={12} className="text-[var(--red)] shrink-0 ml-1 mt-0.5" />}
                          </div>
                          <div className="text-xs text-[var(--muted)] mb-2 flex justify-between">
                            <span className="truncate">{lead.priority || "No Priority"}</span>
                            <span>{lead.has_website ? (lead.website_quality || "Has Web") : "No Web"}</span>
                          </div>
                          {lead.next_follow_up && (
                            <div className="text-[10px] bg-black/5 dark:bg-white/5 inline-block px-1.5 py-0.5 rounded text-[var(--muted)]">
                              Follow-up: {formatDate(lead.next_follow_up)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tracker Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: "color-mix(in srgb, var(--background) 65%, transparent)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl flex flex-col p-6 relative">
            <button onClick={() => setIsSettingsModalOpen(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]">
              <X size={20} />
            </button>
            <h2 className="text-xl font-display mb-6">Tracker Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Browser Reminders</div>
                  <div className="text-xs text-[var(--muted)]">Receive notifications for overdue follow-ups</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={preferences.reminders_enabled} onChange={(e) => updatePreferences({ reminders_enabled: e.target.checked })} />
                  <div className="w-9 h-5 bg-[var(--card-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--green)]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Daily Summary Panel</div>
                  <div className="text-xs text-[var(--muted)]">Show daily progress towards your call goal</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={preferences.daily_summary_enabled} onChange={(e) => updatePreferences({ daily_summary_enabled: e.target.checked })} />
                  <div className="w-9 h-5 bg-[var(--card-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--green)]"></div>
                </label>
              </div>
              
              <div>
                <div className="font-medium mb-1">Daily Call Goal</div>
                <input 
                  type="number" 
                  value={preferences.daily_call_goal || 20} 
                  onChange={(e) => updatePreferences({ daily_call_goal: parseInt(e.target.value) || 20 })}
                  className="w-full bg-transparent border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button onClick={() => setIsSettingsModalOpen(false)} className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <LeadModal 
            lead={editingLead} 
            pitches={pitches}
            onClose={() => setIsModalOpen(false)} 
            fetchActivities={fetchActivities}
            addActivity={addActivity}
            addPitch={addPitch}
            onSave={async (data) => {
              if (editingLead) {
                await updateLead(editingLead.id, data);
              } else {
                await addLead(data);
              }
              setIsModalOpen(false);
            }}
            onDelete={async () => {
              if (editingLead && confirm("Are you sure you want to delete this lead?")) {
                await deleteLead(editingLead.id);
                setIsModalOpen(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LeadModal({ 
  lead, 
  pitches,
  onClose, 
  onSave, 
  onDelete,
  fetchActivities,
  addActivity,
  addPitch
}: { 
  lead: MetricLead | null; 
  pitches: MetricPitch[];
  onClose: () => void; 
  onSave: (data: Partial<MetricLead>) => Promise<void>; 
  onDelete: () => Promise<void>;
  fetchActivities: (id: string) => Promise<MetricActivity[]>;
  addActivity: (activity: Partial<MetricActivity>) => Promise<MetricActivity | null>;
  addPitch: (pitch: Partial<MetricPitch>) => Promise<MetricPitch | null>;
}) {
  const [formData, setFormData] = useState<Partial<MetricLead>>(lead || {
    status: "NEW",
    has_website: false
  });
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<MetricActivity[]>([]);
  const [logType, setLogType] = useState<ActivityType | "">("");
  const [logOutcome, setLogOutcome] = useState<CallOutcome | "">("");
  const [logNotes, setLogNotes] = useState("");
  const [logging, setLogging] = useState(false);
  const [showNewPitch, setShowNewPitch] = useState(false);
  const [newPitchName, setNewPitchName] = useState("");
  const [newPitchContent, setNewPitchContent] = useState("");

  const attention = lead ? getAttentionIndicator(lead as MetricLead) : null;

  useEffect(() => {
    if (lead) {
      fetchActivities(lead.id).then(setActivities);
    }
  }, [lead]);

  const handleLogActivity = async () => {
    if (!lead || !logType) return;
    setLogging(true);
    try {
      const act = await addActivity({
        lead_id: lead.id,
        type: logType,
        outcome: logOutcome || null,
        notes: logNotes || null,
        occurred_at: new Date().toISOString()
      });
      if (act) {
        setActivities([act, ...activities]);
      }
      setLogType("");
      setLogOutcome("");
      setLogNotes("");
      
      // Auto-update status if it makes sense
      if (logType === "CALL" && logOutcome === "CONNECTED") {
        setFormData(p => ({ ...p, status: "CONNECTED" }));
      } else if (logType === "CALL" && logOutcome === "BOOKED") {
        setFormData(p => ({ ...p, status: "CALL_BOOKED" }));
      }
    } finally {
      setLogging(false);
    }
  };

  const handleSavePitch = async () => {
    if (!newPitchName || !newPitchContent) return;
    try {
      const p = await addPitch({ name: newPitchName, content: newPitchContent });
      if (p) {
        setFormData(prev => ({ ...prev, pitch_id: p.id }));
        setShowNewPitch(false);
        setNewPitchName("");
        setNewPitchContent("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name) return;
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const inputClass = "w-full bg-transparent border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors";
  const labelClass = "block text-xs text-[var(--muted)] mb-1 uppercase tracking-wider";

  return (
    <motion.div
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "color-mix(in srgb, var(--background) 65%, transparent)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-4xl bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl flex flex-col max-h-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--card-border)] shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display">{lead ? "Lead Details" : "Add Lead"}</h2>
            {attention && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${attention.level === "HIGH" ? "bg-[var(--red)]/10 text-[var(--red)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
                {attention.level} Attention: {attention.reasons.join(", ")}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <form id="lead-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              
              {/* Quick Actions Bar */}
              {lead && (
                <div className="flex gap-2 flex-wrap">
                  {formData.phone && (
                    <a href={`tel:${formData.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 rounded-md text-xs font-medium hover:bg-[var(--green)]/20 transition-colors">
                      <Phone size={14} /> Call
                    </a>
                  )}
                  {formData.whatsapp && (
                    <a href={`https://wa.me/${formData.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-md text-xs font-medium hover:bg-[#25D366]/20 transition-colors">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  {formData.email && (
                    <a href={`mailto:${formData.email}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--foreground)]/10 text-[var(--foreground)] border border-[var(--foreground)]/20 rounded-md text-xs font-medium hover:bg-[var(--foreground)]/20 transition-colors">
                      <Mail size={14} /> Email
                    </a>
                  )}
                  <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Follow+up+with+${encodeURIComponent(formData.contact_name || formData.business_name || 'Lead')}&details=Lead+Follow+up`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-md text-xs font-medium hover:bg-[var(--accent)]/20 transition-colors">
                    <Calendar size={14} /> Cal Sync
                  </a>
                </div>
              )}
              
              {/* Quick Follow-Up Actions (Phase 2) */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className={labelClass}>Next Action</label>
                  <input name="next_action" value={formData.next_action || ""} onChange={handleChange} className={inputClass} placeholder="e.g. Call owner" />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Next Follow-up</label>
                  <input type="datetime-local" name="next_follow_up" value={formData.next_follow_up ? formData.next_follow_up.slice(0, 16) : ""} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
                </div>
              </div>

              {/* Business Group */}
            <div>
              <h3 className="text-sm font-medium mb-3 border-b border-[var(--card-border)] pb-1">BUSINESS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Business Name *</label>
                  <input required name="business_name" value={formData.business_name || ""} onChange={handleChange} className={inputClass} autoFocus />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <input name="industry" value={formData.industry || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input name="location" value={formData.location || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Source</label>
                  <input name="source" value={formData.source || ""} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Contact Group */}
            <div>
              <h3 className="text-sm font-medium mb-3 border-b border-[var(--card-border)] pb-1">CONTACT</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input name="contact_name" value={formData.contact_name || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <input name="contact_role" value={formData.contact_role || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input name="phone" value={formData.phone || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp</label>
                  <input name="whatsapp" value={formData.whatsapp || ""} onChange={handleChange} className={inputClass} placeholder="Include country code" />
                </div>
              </div>
            </div>

            {/* Qualification Group */}
            <div>
              <h3 className="text-sm font-medium mb-3 border-b border-[var(--card-border)] pb-1">QUALIFICATION</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" name="has_website" id="has_website" checked={!!formData.has_website} onChange={handleChange} className="w-4 h-4 accent-[var(--accent)]" />
                  <label htmlFor="has_website" className="text-sm">Has Website</label>
                </div>
                <div>
                  <label className={labelClass}>Website URL</label>
                  <input name="website" value={formData.website || ""} onChange={handleChange} className={inputClass} disabled={!formData.has_website} placeholder={!formData.has_website ? "Check 'Has Website' first" : "https://..."} />
                </div>
                <div>
                  <label className={labelClass}>Website Quality</label>
                  <select name="website_quality" value={formData.website_quality || ""} onChange={handleChange} className={inputClass} disabled={!formData.has_website}>
                    <option value="">Select...</option>
                    <option value="NONE">None</option>
                    <option value="POOR">Poor</option>
                    <option value="AVERAGE">Average</option>
                    <option value="GOOD">Good</option>
                    <option value="EXCELLENT">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Deal Value ($)</label>
                  <input type="number" step="0.01" name="deal_value" value={formData.deal_value || ""} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Pipeline Group */}
            <div>
              <h3 className="text-sm font-medium mb-3 border-b border-[var(--card-border)] pb-1">PIPELINE</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={formData.status || "NEW"} onChange={handleChange} className={inputClass}>
                    {Object.keys(STATUS_LABELS).map(key => (
                      <option key={key} value={key}>{STATUS_LABELS[key as LeadStatus]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select name="priority" value={formData.priority || ""} onChange={handleChange} className={inputClass}>
                    <option value="">None</option>
                    <option value="HOT">Hot</option>
                    <option value="WARM">Warm</option>
                    <option value="COLD">Cold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Group & Pitch (Phase 2) */}
            <div>
              <h3 className="text-sm font-medium mb-3 border-b border-[var(--card-border)] pb-1">NOTES & PITCH</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Assigned Pitch</label>
                    <button type="button" onClick={() => setShowNewPitch(!showNewPitch)} className="text-xs text-[var(--accent)] hover:underline">
                      {showNewPitch ? "Cancel" : "+ New Pitch"}
                    </button>
                  </div>
                  {showNewPitch ? (
                    <div className="space-y-2 bg-black/5 dark:bg-white/5 p-3 rounded mb-2">
                      <input placeholder="Pitch Name" value={newPitchName} onChange={e => setNewPitchName(e.target.value)} className={inputClass} />
                      <textarea placeholder="Pitch Content..." value={newPitchContent} onChange={e => setNewPitchContent(e.target.value)} className={inputClass} rows={3} />
                      <button type="button" disabled={!newPitchName || !newPitchContent} onClick={handleSavePitch} className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs py-1.5 font-medium rounded disabled:opacity-50">Save Pitch</button>
                    </div>
                  ) : (
                    <select name="pitch_id" value={formData.pitch_id || ""} onChange={handleChange} className={inputClass}>
                      <option value="">No Pitch Assigned</option>
                      {pitches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  {!showNewPitch && formData.pitch_id && (
                    <div className="mt-2 text-xs text-[var(--muted)] p-2 bg-black/5 dark:bg-white/5 rounded italic">
                      {pitches.find(p => p.id === formData.pitch_id)?.content || "Pitch preview..."}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea name="notes" value={formData.notes || ""} onChange={handleChange} className={inputClass} rows={4} />
                </div>
              </div>
            </div>
            </form>
          </div>

          {/* Phase 2: Activity Log & Timeline Sidebar */}
          {lead && (
            <div className="flex flex-col w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-[var(--card-border)] bg-[var(--card)]/50 shrink-0 overflow-hidden h-96 sm:h-auto">
              <div className="p-4 border-b border-[var(--card-border)]">
                <h3 className="text-sm font-medium mb-3">LOG ACTIVITY</h3>
                <div className="space-y-2">
                  <select value={logType} onChange={e => setLogType(e.target.value as any)} className={inputClass}>
                    <option value="">Select Activity...</option>
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="NOTE">Note</option>
                  </select>
                  {logType === "CALL" && (
                    <select value={logOutcome} onChange={e => setLogOutcome(e.target.value as any)} className={inputClass}>
                      <option value="">Outcome...</option>
                      <option value="CONNECTED">Connected</option>
                      <option value="BOOKED">Booked</option>
                      <option value="NO_ANSWER">No Answer</option>
                      <option value="BUSY">Busy</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                      <option value="CALL_BACK">Call Back</option>
                      <option value="WRONG_NUMBER">Wrong Number</option>
                    </select>
                  )}
                  <input placeholder="Notes (optional)" value={logNotes} onChange={e => setLogNotes(e.target.value)} className={inputClass} />
                  <button 
                    type="button"
                    disabled={!logType || logging} 
                    onClick={handleLogActivity}
                    className="w-full bg-[var(--foreground)] text-[var(--background)] py-1.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {logging ? "Saving..." : "Log Activity"}
                  </button>
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <h3 className="text-sm font-medium mb-3 text-[var(--muted)] flex justify-between">
                  TIMELINE
                  <span className="bg-black/10 dark:bg-white/10 px-1.5 rounded-full text-[10px]">{activities.length}</span>
                </h3>
                {activities.length === 0 ? (
                  <div className="text-xs text-[var(--muted)] italic">No activities recorded.</div>
                ) : (
                  <div className="space-y-4">
                    {activities.map(act => (
                      <div key={act.id} className="text-sm border-l-2 border-[var(--card-border)] pl-3 relative">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--card-border)]" />
                        <div className="flex items-center gap-1.5 font-medium">
                          {act.type === "CALL" ? <Phone size={12} className="text-[var(--accent)]" /> :
                           act.type === "EMAIL" ? <Mail size={12} className="text-[var(--foreground)]" /> :
                           act.type === "WHATSAPP" ? <MessageCircle size={12} className="text-[var(--green)]" /> :
                           act.type === "MEETING" ? <Calendar size={12} className="text-[#b48ee8]" /> :
                           <FileText size={12} className="text-[var(--muted)]" />}
                          {act.type} 
                          {act.outcome && <span className="text-[var(--muted)] font-normal ml-1">({act.outcome})</span>}
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{formatDate(act.occurred_at)}</div>
                        {act.notes && <div className="mt-1 text-xs bg-black/5 dark:bg-white/5 p-2 rounded">{act.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 border-t border-[var(--card-border)] flex items-center justify-between shrink-0 bg-[var(--background)] w-full">
          {lead ? (
            <button type="button" onClick={onDelete} className="text-sm text-[var(--red)] hover:bg-[var(--red)]/10 px-3 py-1.5 rounded-md transition-colors font-medium flex items-center gap-1">
              <Trash2 size={16} /> Delete
            </button>
          ) : <div></div>}
          
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[var(--muted)]/20 transition-colors">
              Cancel
            </button>
            <button type="submit" form="lead-form" disabled={saving || !formData.business_name} className="bg-[var(--foreground)] text-[var(--background)] px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
