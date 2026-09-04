import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClockDefinition, getClock, AVAILABLE_CLOCKS } from '../lib/clock/registry';
import { supabase } from '../lib/supabase';
import { useApp } from './AppContext';

interface ClockContextType {
  activeClock: ClockDefinition;
  setClockId: (id: string) => Promise<void>;
  availableClocks: ClockDefinition[];
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);
const CLOCK_STORAGE_KEY = 'dailys-active-clock-id';

export const ClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [activeClock, setActiveClock] = useState<ClockDefinition>(getClock('matrix'));

  useEffect(() => {
    const saved = localStorage.getItem(CLOCK_STORAGE_KEY);
    if (saved) setActiveClock(getClock(saved));
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchPref = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('active_clock_id')
          .eq('user_id', user.id)
          .single();
        if (data && data.active_clock_id) {
          setActiveClock(getClock(data.active_clock_id));
          localStorage.setItem(CLOCK_STORAGE_KEY, data.active_clock_id);
        }
      } catch (err) {
        console.log("Could not load clock preference", err);
      }
    };
    fetchPref();
  }, [user]);

  const setClockId = async (id: string) => {
    const clock = getClock(id);
    setActiveClock(clock);
    localStorage.setItem(CLOCK_STORAGE_KEY, clock.id);

    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            active_clock_id: clock.id 
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error("Failed to save clock preference", err);
      }
    }
  };

  return (
    <ClockContext.Provider value={{ activeClock, setClockId, availableClocks: AVAILABLE_CLOCKS }}>
      {children}
    </ClockContext.Provider>
  );
};

export const useClock = () => {
  const context = useContext(ClockContext);
  if (context === undefined) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
};
