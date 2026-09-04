import React from 'react';

export type ClockStyleId = 'matrix' | 'digital' | 'minimal' | 'mono';

export interface ClockDefinition {
  id: ClockStyleId;
  name: string;
  description: string;
}

export const CLOCK_REGISTRY: Record<ClockStyleId, ClockDefinition> = {
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    description: 'Dot-matrix display'
  },
  digital: {
    id: 'digital',
    name: 'Digital',
    description: 'Clean numeric presentation'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple text time'
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    description: 'Technical monospace'
  }
};

export const getClock = (id: string): ClockDefinition => {
  return CLOCK_REGISTRY[id as ClockStyleId] || CLOCK_REGISTRY['matrix'];
};

export const AVAILABLE_CLOCKS = Object.values(CLOCK_REGISTRY);
