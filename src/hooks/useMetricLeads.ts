import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useApp } from "../context/AppContext";

export type LeadStatus = "NEW" | "CONTACTED" | "CONNECTED" | "INTERESTED" | "CALL_BOOKED" | "CALL_COMPLETED" | "PROPOSAL" | "WON" | "LOST" | "NO_RESPONSE" | "NOT_INTERESTED";
export type LeadPriority = "HOT" | "WARM" | "COLD";
export type WebsiteQuality = "NONE" | "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";
export type ActivityType = "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "NOTE" | "STATUS_CHANGE";
export type CallOutcome = "NO_ANSWER" | "BUSY" | "CONNECTED" | "INTERESTED" | "NOT_INTERESTED" | "CALL_BACK" | "BOOKED" | "WRONG_NUMBER";

export interface MetricLead {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  has_website: boolean;
  website_quality: WebsiteQuality | null;
  location: string | null;
  industry: string | null;
  source: string | null;
  status: LeadStatus;
  priority: LeadPriority | null;
  pitch: string | null;
  pitch_variant: string | null;
  pitch_id: string | null;
  next_action: string | null;
  next_follow_up: string | null;
  last_contacted: string | null;
  notes: string | null;
  deal_value: number | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricActivity {
  id: string;
  user_id: string;
  lead_id: string;
  type: ActivityType;
  outcome: CallOutcome | string | null;
  occurred_at: string;
  duration: number | null;
  notes: string | null;
  created_at: string;
}

export interface MetricPitch {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useMetricLeads() {
  const { user } = useApp();
  const [leads, setLeads] = useState<MetricLead[]>([]);
  const [pitches, setPitches] = useState<MetricPitch[]>([]);
  const [analytics, setAnalytics] = useState<{ recentActivities: MetricActivity[], totalCalls: number, connectedCalls: number }>({ recentActivities: [], totalCalls: 0, connectedCalls: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchPitches();
      fetchAnalyticsData();
    } else {
      setLeads([]);
      setPitches([]);
      setAnalytics({ recentActivities: [], totalCalls: 0, connectedCalls: 0 });
      setLoading(false);
    }
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("metric_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from("metric_pitches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPitches(data || []);
    } catch (err: any) {
      console.error("Error fetching pitches:", err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      // 1. Fetch total calls
      const { count: totalCalls } = await supabase
        .from("metric_activities")
        .select("*", { count: "exact", head: true })
        .eq("type", "CALL");
        
      // 2. Fetch connected calls
      const { count: connectedCalls } = await supabase
        .from("metric_activities")
        .select("*", { count: "exact", head: true })
        .eq("type", "CALL")
        .eq("outcome", "CONNECTED");
        
      // 3. Fetch last 7 days activities
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentActivities } = await supabase
        .from("metric_activities")
        .select("*")
        .gte("occurred_at", sevenDaysAgo.toISOString())
        .order("occurred_at", { ascending: false });
        
      setAnalytics({
        totalCalls: totalCalls || 0,
        connectedCalls: connectedCalls || 0,
        recentActivities: recentActivities || []
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const addLead = async (lead: Partial<MetricLead>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("metric_leads")
        .insert([{ ...lead, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      setLeads([data, ...leads]);
      return data;
    } catch (err: any) {
      console.error("Error adding lead:", err);
      throw err;
    }
  };

  const updateLead = async (id: string, updates: Partial<MetricLead>) => {
    try {
      const { data, error } = await supabase
        .from("metric_leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      setLeads(leads.map(l => l.id === id ? data : l));
      return data;
    } catch (err: any) {
      console.error("Error updating lead:", err);
      throw err;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("metric_leads")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      setLeads(leads.filter(l => l.id !== id));
    } catch (err: any) {
      console.error("Error deleting lead:", err);
      throw err;
    }
  };

  const fetchActivities = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from("metric_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("occurred_at", { ascending: false });
      
      if (error) throw error;
      return data as MetricActivity[];
    } catch (err) {
      console.error("Error fetching activities:", err);
      return [];
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("metric_activities")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MetricActivity[];
    } catch (err) {
      console.error("Error fetching recent activities:", err);
      return [];
    }
  };

  const addActivity = async (activity: Partial<MetricActivity>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("metric_activities")
        .insert([{ ...activity, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      fetchAnalyticsData(); // Refresh analytics
      return data as MetricActivity;
    } catch (err) {
      console.error("Error adding activity:", err);
      throw err;
    }
  };

  const addPitch = async (pitch: Partial<MetricPitch>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("metric_pitches")
        .insert([{ ...pitch, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      setPitches([data, ...pitches]);
      return data;
    } catch (err) {
      console.error("Error adding pitch:", err);
      throw err;
    }
  };

  const updatePitch = async (id: string, updates: Partial<MetricPitch>) => {
    try {
      const { data, error } = await supabase
        .from("metric_pitches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      setPitches(pitches.map(p => p.id === id ? data : p));
      return data;
    } catch (err: any) {
      console.error("Error updating pitch:", err);
      throw err;
    }
  };

  const deletePitch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("metric_pitches")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      setPitches(pitches.filter(p => p.id !== id));
    } catch (err: any) {
      console.error("Error deleting pitch:", err);
      throw err;
    }
  };

  return {
    leads,
    pitches,
    analytics,
    loading,
    error,
    addLead,
    updateLead,
    deleteLead,
    fetchActivities,
    fetchRecentActivities,
    addActivity,
    addPitch,
    updatePitch,
    deletePitch,
    refresh: () => {
      fetchLeads();
      fetchPitches();
      fetchAnalyticsData();
    }
  };
}
