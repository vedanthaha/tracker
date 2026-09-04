import { useMemo, useState } from "react";
import { MetricLead, MetricActivity, MetricPitch } from "../hooks/useMetricLeads";
import { ChevronRight, ChevronDown } from "lucide-react";

export function MetricAnalytics({ leads, activities, pitches, totalCalls, connectedCalls }: { leads: MetricLead[], activities: MetricActivity[], pitches: MetricPitch[], totalCalls: number, connectedCalls: number }) {
  const [showPitches, setShowPitches] = useState(false);
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const booked = leads.filter(l => l.status === "CALL_BOOKED" || l.status === "CALL_COMPLETED").length;
    const won = leads.filter(l => l.status === "WON").length;
    
    // Rates
    const connectRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : "0.0";
    const bookingRate = connectedCalls > 0 ? ((booked / connectedCalls) * 100).toFixed(1) : "0.0";
    
    // Closed rate: won / (won + lost)
    const lost = leads.filter(l => l.status === "LOST").length;
    const closedOpps = won + lost;
    const closeRate = closedOpps > 0 ? ((won / closedOpps) * 100).toFixed(1) : "0.0";

    return { totalLeads, totalCalls, connectedCalls, booked, won, connectRate, bookingRate, closeRate };
  }, [leads, activities]);

  // Funnel data & conversions
  const funnel = useMemo(() => {
    const counts = {
      NEW: leads.filter(l => l.status === "NEW").length,
      CONTACTED: leads.filter(l => l.status === "CONTACTED").length,
      CONNECTED: leads.filter(l => l.status === "CONNECTED").length,
      INTERESTED: leads.filter(l => l.status === "INTERESTED").length,
      BOOKED: leads.filter(l => l.status === "CALL_BOOKED" || l.status === "CALL_COMPLETED").length,
      WON: leads.filter(l => l.status === "WON").length,
    };
    
    // Calculate conversions between stages
    const conversions = {
      contacted_rate: counts.NEW + counts.CONTACTED > 0 ? (counts.CONTACTED / Math.max(1, counts.NEW + counts.CONTACTED) * 100).toFixed(0) : "0",
      connected_rate: counts.CONTACTED > 0 ? (counts.CONNECTED / counts.CONTACTED * 100).toFixed(0) : "0",
      interested_rate: counts.CONNECTED > 0 ? (counts.INTERESTED / counts.CONNECTED * 100).toFixed(0) : "0",
      booked_rate: counts.INTERESTED > 0 ? (counts.BOOKED / counts.INTERESTED * 100).toFixed(0) : "0",
      won_rate: counts.BOOKED > 0 ? (counts.WON / counts.BOOKED * 100).toFixed(0) : "0",
    };

    return { counts, conversions };
  }, [leads]);
  
  const maxFunnel = Math.max(...Object.values(funnel.counts), 1);

  // Pitch performance
  const pitchPerformance = useMemo(() => {
    return pitches.map(pitch => {
      const pitchLeads = leads.filter(l => l.pitch_id === pitch.id);
      return {
        id: pitch.id,
        name: pitch.name,
        used: pitchLeads.length,
        connected: pitchLeads.filter(l => ["CONNECTED", "INTERESTED", "CALL_BOOKED", "CALL_COMPLETED", "PROPOSAL", "WON"].includes(l.status)).length,
        interested: pitchLeads.filter(l => ["INTERESTED", "CALL_BOOKED", "CALL_COMPLETED", "PROPOSAL", "WON"].includes(l.status)).length,
        booked: pitchLeads.filter(l => ["CALL_BOOKED", "CALL_COMPLETED", "PROPOSAL", "WON"].includes(l.status)).length,
        won: pitchLeads.filter(l => l.status === "WON").length,
      };
    }).sort((a, b) => b.used - a.used);
  }, [leads, pitches]);

  // 7-day activity data
  const activityData = useMemo(() => {
    const days: Record<string, { calls: number, emails: number, other: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = { calls: 0, emails: 0, other: 0 };
    }

    activities.forEach(a => {
      const dateStr = a.occurred_at.split('T')[0];
      if (days[dateStr]) {
        if (a.type === "CALL") days[dateStr].calls++;
        else if (a.type === "EMAIL") days[dateStr].emails++;
        else days[dateStr].other++;
      }
    });

    return Object.entries(days).map(([date, counts]) => {
      const d = new Date(date);
      return {
        label: `${d.getMonth()+1}/${d.getDate()}`,
        ...counts
      };
    });
  }, [activities]);

  const maxDaily = Math.max(...activityData.map(d => d.calls + d.emails + d.other), 1);

  return (
    <div className="mb-8 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 sm:p-6 overflow-hidden">
      {/* Primary Metrics */}
      <div className="flex flex-wrap gap-4 sm:gap-8 items-center justify-between border-b border-[var(--card-border)] pb-4 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display">{metrics.totalLeads}</span>
          <span className="text-sm text-[var(--muted)] uppercase tracking-wider">Leads</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display">{metrics.totalCalls}</span>
          <span className="text-sm text-[var(--muted)] uppercase tracking-wider">Calls</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display">{metrics.connectedCalls}</span>
          <span className="text-sm text-[var(--muted)] uppercase tracking-wider">Connected</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display">{metrics.booked}</span>
          <span className="text-sm text-[var(--muted)] uppercase tracking-wider">Booked</span>
        </div>
        <div className="flex items-baseline gap-2 text-[var(--green)]">
          <span className="text-3xl font-display">{metrics.won}</span>
          <span className="text-sm uppercase tracking-wider">Won</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rates */}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Conversion</div>
          <div className="flex justify-between items-center text-sm">
            <span>Connect Rate</span>
            <span className="font-medium">{metrics.connectRate}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Booking Rate</span>
            <span className="font-medium">{metrics.bookingRate}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Close Rate</span>
            <span className="font-medium text-[var(--green)]">{metrics.closeRate}%</span>
          </div>
        </div>

        {/* Funnel */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Pipeline Conversion</div>
          <div className="space-y-1">
            {Object.entries(funnel.counts).map(([stage, count], index, arr) => {
              const stageNames = Object.keys(funnel.counts);
              const isLast = index === stageNames.length - 1;
              const nextStageName = !isLast ? stageNames[index + 1] : null;
              
              let convRate = "0";
              if (stage === "NEW") convRate = funnel.conversions.contacted_rate;
              else if (stage === "CONTACTED") convRate = funnel.conversions.connected_rate;
              else if (stage === "CONNECTED") convRate = funnel.conversions.interested_rate;
              else if (stage === "INTERESTED") convRate = funnel.conversions.booked_rate;
              else if (stage === "BOOKED") convRate = funnel.conversions.won_rate;

              return (
                <div key={stage} className="flex flex-col">
                  <div className="flex items-center text-xs gap-2">
                    <span className="w-20 text-[var(--muted)] truncate">{stage === "BOOKED" ? "BOOKED" : stage}</span>
                    <div className="flex-1 h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-[var(--accent)] transition-all duration-500" 
                        style={{ width: `${(count / maxFunnel) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-medium">{count}</span>
                  </div>
                  {!isLast && (
                    <div className="flex items-center pl-20 pr-8 my-0.5 opacity-50">
                      <div className="w-0.5 h-3 bg-[var(--card-border)] ml-2"></div>
                      <span className="text-[9px] ml-2 font-mono">{convRate}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Performance Summary */}
        <div className="flex flex-col gap-2 h-full">
          <div className="text-sm font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Weekly Summary</div>
          {(() => {
            const now = new Date();
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            const fourteenDaysAgo = new Date(now);
            fourteenDaysAgo.setDate(now.getDate() - 14);
            
            const currentActivities = activities.filter(a => new Date(a.occurred_at) >= sevenDaysAgo);
            const prevActivities = activities.filter(a => {
              const d = new Date(a.occurred_at);
              return d >= fourteenDaysAgo && d < sevenDaysAgo;
            });
            
            const currentCalls = currentActivities.filter(a => a.type === "CALL").length;
            const prevCalls = prevActivities.filter(a => a.type === "CALL").length;
            const callsTrend = prevCalls === 0 ? (currentCalls > 0 ? 100 : 0) : Math.round(((currentCalls - prevCalls) / prevCalls) * 100);
            
            const currentConnected = currentActivities.filter(a => a.outcome === "CONNECTED").length;
            const prevConnected = prevActivities.filter(a => a.outcome === "CONNECTED").length;
            const connectedTrend = prevConnected === 0 ? (currentConnected > 0 ? 100 : 0) : Math.round(((currentConnected - prevConnected) / prevConnected) * 100);

            return (
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--muted)]">Calls (7d)</span>
                    <span className="font-medium text-lg">{currentCalls}</span>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${callsTrend >= 0 ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--red)]/10 text-[var(--red)]"}`}>
                    {callsTrend >= 0 ? "+" : ""}{callsTrend}% vs prev
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--muted)]">Connected (7d)</span>
                    <span className="font-medium text-lg">{currentConnected}</span>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${connectedTrend >= 0 ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--red)]/10 text-[var(--red)]"}`}>
                    {connectedTrend >= 0 ? "+" : ""}{connectedTrend}% vs prev
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      
      {/* Pitch Performance Accordion */}
      {pitchPerformance.length > 0 && (
        <div className="mt-6 border-t border-[var(--card-border)] pt-4">
          <button 
            onClick={() => setShowPitches(!showPitches)}
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] transition-colors w-full text-left"
          >
            {showPitches ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Pitch Performance
          </button>
          
          {showPitches && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {pitchPerformance.map(p => (
                <div key={p.id} className="bg-black/5 dark:bg-white/5 rounded-lg p-3 flex flex-col gap-2">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[var(--foreground)]">{p.used}</span>
                      <span>Used</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[var(--foreground)]">{p.connected}</span>
                      <span>Conn</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[var(--foreground)]">{p.interested}</span>
                      <span>Intr</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[var(--foreground)]">{p.booked}</span>
                      <span>Book</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[var(--green)]">{p.won}</span>
                      <span>Won</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
