import React, { useState, useRef, useEffect } from 'react';
import { Table as TableIcon } from 'lucide-react';

export const TableGridPopover = ({ onSelect, className }: { onSelect: (r: number, c: number) => void, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const maxRows = 10;
  const maxCols = 10;

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        title="Insert Table"
      >
        <TableIcon size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 p-3 bg-[var(--card)] border border-[var(--card-border)] rounded-md shadow-xl flex flex-col gap-2 min-w-[200px]">
          <div className="text-xs text-[var(--muted)] text-center font-mono font-medium">
            {hovered.r > 0 ? `${hovered.c} × ${hovered.r}` : 'Insert Table'}
          </div>
          <div 
            className="flex flex-col gap-1" 
            onMouseLeave={() => setHovered({ r: 0, c: 0 })}
          >
            {Array.from({ length: maxRows }).map((_, r) => (
              <div key={r} className="flex gap-1">
                {Array.from({ length: maxCols }).map((_, c) => (
                  <div
                    key={c}
                    onMouseEnter={() => setHovered({ r: r + 1, c: c + 1 })}
                    onClick={() => {
                      onSelect(r + 1, c + 1);
                      setIsOpen(false);
                    }}
                    className={`w-4 h-4 border rounded-sm cursor-pointer transition-colors ${
                      r < hovered.r && c < hovered.c 
                        ? 'bg-[var(--primary)] border-[var(--primary)]' 
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
