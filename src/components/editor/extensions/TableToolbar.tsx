import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Trash2, MoreHorizontal, ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, Heading } from 'lucide-react';

const btnClass = (disabled: boolean, danger: boolean = false) =>
  `p-1.5 rounded-md flex items-center justify-center transition-colors text-xs font-medium ${
    disabled 
      ? 'text-[var(--muted)]/50 cursor-not-allowed' 
      : danger 
        ? 'text-red-500 hover:bg-red-500/10' 
        : 'text-[var(--foreground)] hover:bg-[var(--muted)]/20'
  }`;

export const TableToolbar = ({ editor }: { editor: Editor }) => {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMore) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMore]);

  if (!editor) return null;

  const divider = <div className="w-px h-4 bg-[var(--border)] mx-1" />;

  return (
    <BubbleMenu 
      editor={editor} 
      pluginKey="tableBubbleMenu"
      shouldShow={({ editor }) => editor.isActive('table')}
      // @ts-ignore
      tippyOptions={{ placement: 'bottom', duration: 100 }}
      className="flex items-center gap-1 p-1 rounded-lg shadow-lg border relative z-50" 
      style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
    >
      <button onClick={() => editor.chain().focus().addRowBefore().run()} className={btnClass(false)} title="Add Row Above">
        +Row ↑
      </button>
      <button onClick={() => editor.chain().focus().addRowAfter().run()} className={btnClass(false)} title="Add Row Below">
        +Row ↓
      </button>
      <button onClick={() => editor.chain().focus().addColumnBefore().run()} className={btnClass(false)} title="Add Column Left">
        +Col ←
      </button>
      <button onClick={() => editor.chain().focus().addColumnAfter().run()} className={btnClass(false)} title="Add Column Right">
        +Col →
      </button>
      
      {divider}
      
      <button 
        onClick={() => editor.chain().focus().toggleHeaderRow().run()} 
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors text-xs font-medium ${editor.isActive('table', { headerRow: true }) ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)] hover:bg-[var(--muted)]/20'}`} 
        title="Toggle Header Row"
      >
        <Heading size={14} className="mr-1" /> Row
      </button>

      <button 
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()} 
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors text-xs font-medium ${editor.isActive('table', { headerColumn: true }) ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)] hover:bg-[var(--muted)]/20'}`} 
        title="Toggle Header Column"
      >
        <Heading size={14} className="mr-1" /> Col
      </button>

      {divider}

      <div className="relative" ref={moreRef}>
        <button 
          onClick={() => setShowMore(!showMore)} 
          className={btnClass(false)} 
          title="More Actions"
        >
          <MoreHorizontal size={14} />
        </button>

        {showMore && (
          <div className="absolute top-full mt-1 right-0 p-1 bg-[var(--card)] border border-[var(--card-border)] rounded-md shadow-xl flex flex-col gap-1 min-w-[140px] z-50">
            <button 
              onClick={() => { editor.chain().focus().deleteRow().run(); setShowMore(false); }} 
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors w-full text-left"
            >
              Delete Row
            </button>
            <button 
              onClick={() => { editor.chain().focus().deleteColumn().run(); setShowMore(false); }} 
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors w-full text-left"
            >
              Delete Column
            </button>
            
            <div className="h-px w-full bg-[var(--border)] my-0.5" />
            
            <button 
              onClick={() => { editor.chain().focus().mergeCells().run(); setShowMore(false); }} 
              disabled={!editor.can().mergeCells()}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--muted)]/20 disabled:text-[var(--muted)]/50 disabled:hover:bg-transparent rounded-md transition-colors w-full text-left"
            >
              Merge Cells
            </button>
            <button 
              onClick={() => { editor.chain().focus().splitCell().run(); setShowMore(false); }} 
              disabled={!editor.can().splitCell()}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--muted)]/20 disabled:text-[var(--muted)]/50 disabled:hover:bg-transparent rounded-md transition-colors w-full text-left"
            >
              Split Cell
            </button>
            
            <div className="h-px w-full bg-[var(--border)] my-0.5" />
            
            <button 
              onClick={() => { editor.chain().focus().deleteTable().run(); setShowMore(false); }} 
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors w-full text-left font-medium"
            >
              <Trash2 size={12} /> Delete Table
            </button>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
};
