import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, Maximize, Trash2, Replace, Link as LinkIcon, Unlink } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

/**
 * Displays and edits an image within a Tiptap node view.
 *
 * Supports resizing, alignment, aspect-ratio control, captions, alt text, image replacement, and deletion.
 *
 * @param node - The image node and its attributes.
 * @param selected - Whether the image is currently selected.
 * @param extension - The image extension configuration.
 */
export default function ImageComponent({ node, updateAttributes, deleteNode, selected, extension }: NodeViewProps) {
  const { src, alt, caption, width, height, keepRatio, align } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  
  // Local state during drag for smooth updates without hammering Tiptap
  const [currentWidth, setCurrentWidth] = useState<number | null>(width || null);
  const [currentHeight, setCurrentHeight] = useState<number | null>(height || null);

  const alignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
    full: 'w-full'
  }[align as string] || 'mx-auto';

  // Sync from props
  useEffect(() => {
    if (!isResizing) {
      setCurrentWidth(width || null);
      setCurrentHeight(height || null);
    }
  }, [width, height, isResizing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeHandle) return;
      e.preventDefault();
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newWidth = initialWidth;
      let newHeight = initialHeight;

      if (keepRatio) {
        // Proportional resize (corners)
        const ratio = initialWidth / initialHeight;
        
        let delta = 0;
        if (resizeHandle.includes('e')) delta = dx;
        else if (resizeHandle.includes('w')) delta = -dx;
        
        // If dragged more vertically than horizontally, use vertical delta
        if (Math.abs(dy) > Math.abs(dx)) {
          if (resizeHandle.includes('s')) delta = dy * ratio;
          else if (resizeHandle.includes('n')) delta = -dy * ratio;
        }

        newWidth = Math.max(50, initialWidth + delta);
        newHeight = newWidth / ratio;
      } else {
        // Free resize
        if (resizeHandle.includes('e')) newWidth = initialWidth + dx;
        if (resizeHandle.includes('w')) newWidth = initialWidth - dx;
        if (resizeHandle.includes('s')) newHeight = initialHeight + dy;
        if (resizeHandle.includes('n')) newHeight = initialHeight - dy;
        
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);
      }

      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
        // Persist to Tiptap
        updateAttributes({ width: currentWidth, height: currentHeight });
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, startX, startY, initialWidth, initialHeight, keepRatio, currentWidth, currentHeight, updateAttributes]);

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setStartX(e.clientX);
    setStartY(e.clientY);
    
    // Use actual dimensions if not set
    if (imgRef.current) {
      const w = currentWidth || imgRef.current.offsetWidth;
      const h = currentHeight || imgRef.current.offsetHeight;
      setInitialWidth(w);
      setInitialHeight(h);
      setCurrentWidth(w);
      setCurrentHeight(h);
    }
  };

  const handleClass = "absolute bg-[var(--card)] border border-[var(--primary)] pointer-events-auto transition-transform hover:scale-125 z-10 shadow-sm";
  const cornerClass = `${handleClass} w-3 h-3 rounded-sm`;
  const edgeClass = `${handleClass} rounded-full bg-[var(--background)] opacity-90`;

  // Object fit depends on ratio setting
  const objectFitClass = keepRatio ? 'object-contain' : 'object-fill';

  const handleDragStart = (e: React.DragEvent) => {
    if (e.dataTransfer && containerRef.current) {
      e.dataTransfer.setDragImage(containerRef.current, 0, 0);
    }
  };

  return (
    <NodeViewWrapper 
      onDragStart={handleDragStart}
      className={`relative py-4 max-w-full flex ${alignmentClass === 'w-full' ? 'w-full' : ''} ${alignmentClass === 'mr-auto' ? 'justify-start' : alignmentClass === 'ml-auto' ? 'justify-end' : 'justify-center'}`}
    >
      <div 
        ref={containerRef}
        data-drag-handle
        className={`relative group ${selected ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)] rounded-sm' : ''} cursor-grab active:cursor-grabbing`}
        style={{ 
          width: align === 'full' ? '100%' : currentWidth ? `${currentWidth}px` : 'auto',
          height: align === 'full' ? 'auto' : currentHeight ? `${currentHeight}px` : 'auto'
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className={`block rounded-md max-w-full h-full w-full pointer-events-none ${objectFitClass}`}
        />
        
        {/* Resize Handles */}
        {selected && align !== 'full' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corners (Always visible) */}
            <div className={`${cornerClass} -top-1.5 -left-1.5 cursor-nwse-resize`} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
            <div className={`${cornerClass} -top-1.5 -right-1.5 cursor-nesw-resize`} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
            <div className={`${cornerClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
            <div className={`${cornerClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`} onMouseDown={(e) => handleResizeStart(e, 'se')} />
            
            {/* Edges (Only visible when free resize) */}
            {!keepRatio && (
              <>
                <div className={`${edgeClass} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1.5 cursor-ns-resize`} onMouseDown={(e) => handleResizeStart(e, 'n')} />
                <div className={`${edgeClass} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-1.5 cursor-ns-resize`} onMouseDown={(e) => handleResizeStart(e, 's')} />
                <div className={`${edgeClass} left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-4 cursor-ew-resize`} onMouseDown={(e) => handleResizeStart(e, 'w')} />
                <div className={`${edgeClass} right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-4 cursor-ew-resize`} onMouseDown={(e) => handleResizeStart(e, 'e')} />
              </>
            )}
          </div>
        )}

        {/* Toolbar */}
        {selected && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-md bg-[var(--card)] border border-[var(--card-border)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20" contentEditable={false}>
            <button onClick={() => updateAttributes({ keepRatio: !keepRatio })} className={`p-1.5 rounded transition-colors ${keepRatio ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-[var(--muted)]/20 text-[var(--muted)]'}`} title={keepRatio ? "Keep Ratio (ON)" : "Keep Ratio (OFF)"}>
              {keepRatio ? <LinkIcon size={14} /> : <Unlink size={14} />}
            </button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button onClick={() => updateAttributes({ align: 'left' })} className={`p-1.5 rounded hover:bg-[var(--muted)]/20 text-[var(--foreground)] ${align === 'left' ? 'bg-[var(--muted)]/20' : ''}`} title="Align Left"><AlignLeft size={14} /></button>
            <button onClick={() => updateAttributes({ align: 'center' })} className={`p-1.5 rounded hover:bg-[var(--muted)]/20 text-[var(--foreground)] ${align === 'center' ? 'bg-[var(--muted)]/20' : ''}`} title="Align Center"><AlignCenter size={14} /></button>
            <button onClick={() => updateAttributes({ align: 'right' })} className={`p-1.5 rounded hover:bg-[var(--muted)]/20 text-[var(--foreground)] ${align === 'right' ? 'bg-[var(--muted)]/20' : ''}`} title="Align Right"><AlignRight size={14} /></button>
            <button onClick={() => updateAttributes({ align: 'full', width: null, height: null })} className={`p-1.5 rounded hover:bg-[var(--muted)]/20 text-[var(--foreground)] ${align === 'full' ? 'bg-[var(--muted)]/20' : ''}`} title="Full Width"><Maximize size={14} /></button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            
            <button onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/png, image/jpeg, image/webp, image/gif';
              input.onchange = async () => {
                if (input.files?.length) {
                  const file = input.files[0];
                  const noteId = extension.options.noteId;
                  if (noteId) {
                    try {
                      extension.options.onUploadStart?.();
                      const { uploadImageAsset } = await import('../../../lib/uploadImage');
                      const data = await uploadImageAsset(file, noteId);
                      updateAttributes({
                        src: data.publicUrl,
                        assetId: data.assetId,
                        alt: data.alt,
                        width: data.width,
                        height: data.height
                      });
                    } catch (e) {
                      console.error('Image replace failed', e);
                      alert('Failed to replace image.');
                    } finally {
                      extension.options.onUploadEnd?.();
                    }
                  }
                }
              };
              input.click();
            }} className="p-1.5 rounded hover:bg-[var(--muted)]/20 text-[var(--foreground)] transition-colors" title="Replace"><Replace size={14} /></button>
            
            <button onClick={() => deleteNode()} className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
          </div>
        )}

        {/* Caption */}
        <input
          type="text"
          placeholder="Write a caption..."
          className={`w-full text-center text-sm text-[var(--muted)] bg-transparent outline-none mt-2 placeholder:text-[var(--muted)]/50 ${caption ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'} transition-opacity`}
          value={caption || ''}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
        />
        
        {/* Alt text field (only shown when selected) */}
        {selected && (
           <input
             type="text"
             placeholder="Alt text (for accessibility)"
             className="absolute -bottom-8 left-0 right-0 text-center text-xs text-[var(--muted)] bg-[var(--card)] border border-[var(--card-border)] rounded px-2 py-1 outline-none shadow-sm z-10"
             value={alt || ''}
             onChange={(e) => updateAttributes({ alt: e.target.value })}
           />
        )}
      </div>
    </NodeViewWrapper>
  );
}
