import { useMemo } from "react";
import { MetricLead, MetricActivity } from "../hooks/useMetricLeads";

export function MetricAnalytics({ leads, activities, totalCalls, connectedCalls }: { leads: MetricLead[], activities: MetricActivity[], totalCalls: number, connectedCalls: number }) {
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

  // Funnel data
  const funnel = useMemo(() => {
    return {
      NEW: leads.filter(l => l.status === "NEW").length,
      CONTACTED: leads.filter(l => l.status === "CONTACTED").length,
      CONNECTED: leads.filter(l => l.status === "CONNECTED").length,
      INTERESTED: leads.filter(l => l.status === "INTERESTED").length,
      BOOKED: leads.filter(l => l.status === "CALL_BOOKED" || l.status === "CALL_COMPLETED").length,
      WON: leads.filter(l => l.status === "WON").length,
    };
  }, [leads]);
  
  const maxFunnel = Math.max(...Object.values(funnel), 1);

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
          <div className="text-sm font-medium uppercase tracking-wider text-[var(--muted)] mb-1">Pipeline</div>
          {Object.entries(funnel).map(([stage, count]) => (
            <div key={stage} className="flex items-center text-xs gap-2">
              <span className="w-20 text-[var(--muted)]">{stage === "BOOKED" ? "BOOKED" : stage}</span>
              <div className="flex-1 h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-[var(--accent)] transition-all duration-500" 
                  style={{ width: `${(count / maxFunnel) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-medium">{count}</span>
            </div>
          ))}
        </div>

        {/* 7-Day Chart */}
        <div className="flex flex-col gap-2 h-full justify-end">
          <div className="text-sm font-medium uppercase tracking-wider text-[var(--muted)] mb-1">7-Day Outreach</div>
          <div className="flex-1 flex items-end gap-1 sm:gap-2 h-24 pt-2 border-b border-[var(--card-border)] pb-1">
            {activityData.map(day => {
              const total = day.calls + day.emails + day.other;
              return (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex flex-col justify-end h-full relative" style={{ height: "100%" }}>
                    <div className="w-full bg-[var(--foreground)] opacity-20" style={{ height: `${(day.other / maxDaily) * 100}%` }} />
                    <div className="w-full bg-[var(--accent)] opacity-60" style={{ height: `${(day.emails / maxDaily) * 100}%` }} />
                    <div className="w-full bg-[var(--accent)]" style={{ height: `${(day.calls / maxDaily) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--muted)]">{day.label}</span>
                  {/* Tooltip */}
                  {total > 0 && (
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-[var(--foreground)] text-[var(--background)] text-xs rounded px-2 py-1 pointer-events-none transition-opacity whitespace-nowrap z-10">
                      {day.calls} calls, {day.emails} emails
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
