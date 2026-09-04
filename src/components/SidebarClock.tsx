import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClock } from "../context/ClockContext";

const MATRICES: Record<string, number[][]> = {
  "0": [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,1,1],
    [1,0,1,0,1],
    [1,1,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ],
  "1": [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0]
  ],
  "2": [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,1,1,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1]
  ],
  "3": [
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,0]
  ],
  "4": [
    [0,0,0,1,1],
    [0,0,1,0,1],
    [0,1,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1]
  ],
  "5": [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ],
  "6": [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ],
  "7": [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [0,1,0,0,0],
    [0,1,0,0,0]
  ],
  "8": [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ],
  "9": [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0]
  ],
  ":": [
    [0,0,0],
    [0,1,0],
    [0,1,0],
    [0,0,0],
    [0,1,0],
    [0,1,0],
    [0,0,0]
  ],
  " ": [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0]
  ]
};

function DotMatrixDigit({ matrix }: { matrix: number[][] }) {
  return (
    <div className="flex flex-col gap-[2px]">
      {matrix.map((row, r) => (
        <div key={r} className="flex gap-[2px]">
          {row.map((val, c) => (
            <div
              key={c}
              className="w-[3.5px] h-[3.5px] rounded-full"
              style={{
                backgroundColor: "var(--foreground)",
                opacity: val ? 0.95 : 0.06,
                boxShadow: val ? "0 0 4px rgba(255,255,255,0.2)" : "none",
                transition: "opacity 0.6s ease"
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SidebarClock({ collapsed }: { collapsed: boolean }) {
  const [now, setNow] = useState(new Date());
  const { activeClock } = useClock();

  useEffect(() => {
    const msUntilNextMinute = 60000 - (now.getTime() % 60000);
    const timeout = window.setTimeout(() => {
      setNow(new Date());
    }, msUntilNextMinute);

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []); // Run once, syncs to minute, then ticks every minute

  let hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hStr = hours.toString();
  // Pad with space if single digit to keep it stable, or pad with zero.
  // The reference uses no leading zero, so space.
  const h1 = hStr.length === 2 ? hStr[0] : " ";
  const h2 = hStr.length === 2 ? hStr[1] : hStr[0];

  const mStr = now.getMinutes().toString().padStart(2, "0");
  const m1 = mStr[0];
  const m2 = mStr[1];

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dayName = days[now.getDay()];
  const dateNum = now.getDate().toString().padStart(2, "0");
  const monthName = months[now.getMonth()];

  const dateString = `${dayName} · ${dateNum} ${monthName}`;
  const accessibleString = `Current local time: ${hours}:${mStr} ${ampm}, ${dayName} ${monthName} ${dateNum}`;

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 0.95 }}
          animate={{ opacity: 1, height: "auto", scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="mx-3 mb-3 p-3 pt-4 pb-3 rounded-lg flex-shrink-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "color-mix(in srgb, var(--foreground) 2%, transparent)", border: "1px solid var(--card-border)" }}
          aria-label={accessibleString}
        >
          {activeClock.id === 'matrix' && (
            <>
              <div className="flex items-end gap-2 mb-3">
                <div className="flex gap-1">
                  <DotMatrixDigit matrix={MATRICES[h1]} />
                  <DotMatrixDigit matrix={MATRICES[h2]} />
                  <div className="mx-0.5"><DotMatrixDigit matrix={MATRICES[":"]} /></div>
                  <DotMatrixDigit matrix={MATRICES[m1]} />
                  <DotMatrixDigit matrix={MATRICES[m2]} />
                </div>
                <div className="font-mono text-[10px] tracking-wider mb-0.5" style={{ color: "var(--muted)" }}>{ampm}</div>
              </div>
              <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                {dateString}
              </div>
            </>
          )}

          {activeClock.id === 'digital' && (
            <div className="flex flex-col items-center">
              <div className="text-3xl font-display font-medium tracking-tight mb-1" style={{ color: "var(--foreground)" }}>
                {hStr}:{mStr}
              </div>
              <div className="text-xs font-body tracking-wide uppercase" style={{ color: "var(--muted)" }}>
                {dayName}, {monthName} {dateNum}
              </div>
            </div>
          )}

          {activeClock.id === 'minimal' && (
            <div className="flex flex-col items-center">
              <div className="text-xl font-body font-light mb-1" style={{ color: "var(--foreground)" }}>
                {hStr}:{mStr} <span className="text-sm opacity-60">{ampm}</span>
              </div>
              <div className="text-xs font-body opacity-50">
                {dayName}, {monthName} {dateNum}
              </div>
            </div>
          )}

          {activeClock.id === 'mono' && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full flex justify-between items-center text-sm font-mono border-b pb-1 mb-1" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <span>SYS.TIME</span>
                <span>{hStr.padStart(2, '0')}:{mStr}</span>
              </div>
              <div className="w-full flex justify-between items-center text-xs font-mono" style={{ color: "var(--muted)" }}>
                <span>DATE</span>
                <span>{now.getFullYear()}-{now.getMonth()+1}-{dateNum}</span>
              </div>
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
