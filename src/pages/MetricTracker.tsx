import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Edit3, X, Filter, Phone, Mail, MessageCircle, Calendar, FileText, Activity } from "lucide-react";
import { useMetricLeads, MetricLead, LeadStatus, LeadPriority, WebsiteQuality, MetricActivity, ActivityType, CallOutcome, MetricPitch } from "../hooks/useMetricLeads";
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

export default function MetricTracker() {
  const { leads, pitches, analytics, loading, error, addLead, updateLead, deleteLead, fetchActivities, addActivity, addPitch } = useMetricLeads();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [quickFilter, setQuickFilter] = useState<"ALL"|"TODAY"|"OVERDUE"|"UPCOMING"|"HOT"|"BOOKED"|"WON"|"LOST">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<MetricLead | null>(null);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (statusFilter !== "ALL") {
      result = result.filter(l => l.status === statusFilter);
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
  }, [leads, statusFilter, quickFilter, searchQuery]);

  const handleEdit = (lead: MetricLead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-[var(--font-body)]">
      {/* Header */}
      <div className="px-6 md:px-12 py-6 border-b border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">Metric Tracker</h1>
          <p className="text-sm text-[var(--muted)]">Manage leads and outreach pipeline.</p>
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <button 
            onClick={handleAddNew}
            className="bg-[var(--foreground)] text-[var(--background)] px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 md:p-12">
        <MetricAnalytics 
          leads={leads} 
          activities={analytics.recentActivities} 
          totalCalls={analytics.totalCalls} 
          connectedCalls={analytics.connectedCalls} 
        />
        
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
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
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--foreground)] truncate max-w-[200px]">{lead.business_name}</div>
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
                    <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                      No matching leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
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
        className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl flex flex-col max-h-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--card-border)] shrink-0">
          <h2 className="text-xl font-display">{lead ? "Edit Lead" : "Add Lead"}</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="lead-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            
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
          <div className="hidden sm:flex flex-col w-72 border-l border-[var(--card-border)] bg-[var(--card)]/50 shrink-0 overflow-hidden">
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
