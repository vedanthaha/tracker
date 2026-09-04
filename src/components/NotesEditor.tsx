import { useEditor, EditorContent, Editor, ReactNodeViewRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Link from '@tiptap/extension-link';
import { ResizableImage } from './editor/extensions/ResizableImage';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableToolbar } from './editor/extensions/TableToolbar';
import { TableGridPopover } from './editor/extensions/TableGridPopover';
import { common, createLowlight } from 'lowlight';
import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, CheckSquare, Undo, Redo, Heading1, Heading2, Heading3, Quote, Minus, Link as LinkIcon, Highlighter, Type, Superscript as SupIcon, Subscript as SubIcon, RemoveFormatting, Image as ImageIcon } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

import { FontSize } from './editor/extensions/FontSize';
import { LineHeight } from './editor/extensions/LineHeight';
import SlashCommand from './editor/extensions/SlashCommand';
import slashSuggestion from './editor/extensions/slashSuggestion';
import CodeBlockComponent from './editor/extensions/CodeBlockComponent';
import { uploadImageAsset } from '../lib/uploadImage';

const lowlight = createLowlight(common);

interface NotesEditorProps {
  content: any;
  onChange: (content: any) => void;
  noteId?: string;
}

const btnClass = (isActive: boolean) =>
  `p-1.5 rounded-md flex items-center justify-center transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]'
  }`;

const ColorPickerPopover = ({
  icon,
  isActive,
  presets,
  currentColor,
  onChange,
  onClear,
  isOpen,
  onToggle,
  onClose
}: {
  icon: React.ReactNode;
  isActive: boolean;
  presets: { name: string; value: string }[];
  currentColor: string;
  onChange: (val: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className={btnClass(isActive || isOpen)}
      >
        {icon}
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 p-3 rounded-xl shadow-xl border z-50 flex flex-col gap-3 w-[200px]"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
          onMouseDown={(e) => {
             e.preventDefault(); 
             e.stopPropagation();
          }}
        >
          <div className="flex flex-wrap gap-2">
            {presets.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onChange(c.value);
                }}
                className={`w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform ${currentColor === c.value ? 'ring-2 ring-primary ring-offset-1 ring-offset-transparent' : ''}`}
                style={{ background: c.value || 'transparent' }}
                title={c.name}
              />
            ))}
          </div>
          
          <div className="h-px w-full bg-white/10" />

          <div className="w-full">
             <HexColorPicker 
               color={currentColor || '#ffffff'} 
               onChange={onChange} 
               style={{ width: '100%', height: '120px' }} 
             />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
              onClose();
            }}
            className="w-full mt-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-white border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RemoveFormatting size={14} /> Clear Color
          </button>
        </div>
      )}
    </div>
  );
};

const divider = <div className="w-px h-5 mx-1" style={{ background: 'var(--card-border)' }} />;

const selectClass = "h-7 text-xs bg-transparent outline-none rounded-md px-1 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]";

const COLORS = [
  { name: 'Default', value: '' },
  { name: 'Muted', value: 'var(--muted)' },
  { name: 'Accent', value: 'var(--accent)' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

const HIGHLIGHTS = [
  { name: 'None', value: '' },
  { name: 'Yellow', value: 'rgba(250, 204, 21, 0.4)' },
  { name: 'Green', value: 'rgba(74, 222, 128, 0.4)' },
  { name: 'Blue', value: 'rgba(96, 165, 250, 0.4)' },
  { name: 'Purple', value: 'rgba(192, 132, 252, 0.4)' },
  { name: 'Pink', value: 'rgba(244, 114, 182, 0.4)' },
  { name: 'Red', value: 'rgba(248, 113, 113, 0.4)' },
];

const FONTS = [
  { name: 'Default Font', value: '' },
  { name: 'System Sans', value: 'var(--font-body)' },
  { name: 'System Serif', value: 'var(--font-display)' },
  { name: 'System Mono', value: 'var(--font-mono)' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];
const LINE_HEIGHTS = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

const FloatingMenu = ({ editor }: { editor: Editor }) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [activePopover, setActivePopover] = useState<'text' | 'highlight' | null>(null);

  if (!editor) return null;

  const handleLink = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (linkUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      } else {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      setShowLinkInput(false);
      setLinkUrl('');
    } else if (e.key === 'Escape') {
      setShowLinkInput(false);
      setLinkUrl('');
      editor.commands.focus();
    }
  };

  return (
    <BubbleMenu 
      editor={editor} 
      shouldShow={({ state, editor }) => {
        if (state.selection.empty) return false;
        if (editor.isActive('resizableImage')) return false;
        return true;
      }}
      className="flex items-center gap-1 p-1 rounded-lg shadow-lg border" 
      style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
    >
      {showLinkInput ? (
        <div className="flex items-center px-2 py-1 gap-2">
          <input
            type="url"
            placeholder="Paste URL & press Enter..."
            className="bg-transparent outline-none text-sm w-48"
            style={{ color: 'var(--foreground)' }}
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLink}
            autoFocus
          />
          <button onClick={() => setShowLinkInput(false)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Cancel</button>
        </div>
      ) : (
        <>
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}><Bold size={14} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}><Italic size={14} /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))}><UnderlineIcon size={14} /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))}><Strikethrough size={14} /></button>
          
          {divider}
          
          <ColorPickerPopover 
            icon={<Type size={14} />}
            isActive={editor.isActive('textStyle', { color: /.*/ })}
            presets={COLORS}
            currentColor={editor.getAttributes('textStyle').color || ''}
            onChange={(val) => val ? editor.chain().focus().setColor(val).run() : editor.chain().focus().unsetColor().run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
            isOpen={activePopover === 'text'}
            onToggle={() => setActivePopover(p => p === 'text' ? null : 'text')}
            onClose={() => setActivePopover(null)}
          />
          
          <ColorPickerPopover 
            icon={<Highlighter size={14} />}
            isActive={editor.isActive('highlight')}
            presets={HIGHLIGHTS}
            currentColor={editor.getAttributes('highlight').color || ''}
            onChange={(val) => val ? editor.chain().focus().setHighlight({ color: val }).run() : editor.chain().focus().unsetHighlight().run()}
            onClear={() => editor.chain().focus().unsetHighlight().run()}
            isOpen={activePopover === 'highlight'}
            onToggle={() => setActivePopover(p => p === 'highlight' ? null : 'highlight')}
            onClose={() => setActivePopover(null)}
          />

          <button onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            setLinkUrl(previousUrl || '');
            setShowLinkInput(true);
          }} className={btnClass(editor.isActive('link'))}><LinkIcon size={14} /></button>

          {divider}
          <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={btnClass(false)} title="Clear Formatting"><RemoveFormatting size={14} /></button>
        </>
      )}
    </BubbleMenu>
  );
};

const MenuBar = ({ editor, setIsUploading }: { editor: Editor, setIsUploading: (val: boolean) => void }) => {
  if (!editor) {
    return null;
  }

  return (
    <div
      className="flex flex-col px-4 py-2"
      style={{
        borderBottom: '1px solid var(--card-border)',
        background: 'color-mix(in srgb, var(--foreground) 2%, transparent)',
      }}
    >
      <div className="flex items-center gap-1 flex-wrap mb-2">
        <select 
          className={selectClass}
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={e => e.target.value ? editor.chain().focus().setFontFamily(e.target.value).run() : editor.chain().focus().unsetFontFamily().run()}
        >
          {FONTS.map(f => (
            <option key={f.name} value={f.value}>{f.name}</option>
          ))}
        </select>
        
        <select 
          className={selectClass}
          value={parseInt(editor.getAttributes('textStyle').fontSize) || ''}
          onChange={e => e.target.value ? editor.chain().focus().setFontSize(`${e.target.value}px`).run() : editor.chain().focus().unsetFontSize().run()}
        >
          <option value="">Size</option>
          {FONT_SIZES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select 
          className={selectClass}
          value={editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || ''}
          onChange={e => e.target.value ? editor.chain().focus().setLineHeight(e.target.value).run() : editor.chain().focus().unsetLineHeight().run()}
        >
          <option value="">Spacing</option>
          {LINE_HEIGHTS.map(lh => (
            <option key={lh} value={lh}>{lh.toFixed(2)}</option>
          ))}
        </select>

        {divider}

        <button onClick={() => editor.chain().focus().toggleSuperscript().run()} className={btnClass(editor.isActive('superscript'))} title="Superscript">
          <SupIcon size={14} />
        </button>
        <button onClick={() => editor.chain().focus().toggleSubscript().run()} className={btnClass(editor.isActive('subscript'))} title="Subscript">
          <SubIcon size={14} />
        </button>
        
        {divider}

        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnClass(false)} title="Undo"><Undo size={14} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnClass(false)} title="Redo"><Redo size={14} /></button>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1"><Heading1 size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2"><Heading2 size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3"><Heading3 size={14} /></button>

        {divider}

        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold"><Bold size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><Italic size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><UnderlineIcon size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Strikethrough"><Strikethrough size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={btnClass(editor.isActive('code'))} title="Inline Code"><Code size={14} /></button>

        {divider}

        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft size={14} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center"><AlignCenter size={14} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight size={14} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btnClass(editor.isActive({ textAlign: 'justify' }))} title="Justify"><AlignJustify size={14} /></button>

        {divider}

        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List"><List size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Ordered List"><ListOrdered size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive('taskList'))} title="Task List"><CheckSquare size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote"><Quote size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code Block"><Code size={14} /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Divider"><Minus size={14} /></button>

        {divider}

        <TableGridPopover 
          className={btnClass(false)}
          onSelect={(rows, cols) => {
            editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
          }} 
        />

        {divider}

        <button onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/png, image/jpeg, image/webp, image/gif';
          input.onchange = async () => {
            if (input.files?.length) {
              const file = input.files[0];
              const noteId = editor.extensionManager.extensions.find((e: any) => e.name === 'resizableImage')?.options.noteId;
              if (noteId) {
                try {
                  setIsUploading(true);
                  const data = await uploadImageAsset(file, noteId);
                  editor.chain().focus().setResizableImage({
                    src: data.publicUrl,
                    assetId: data.assetId,
                    alt: data.alt
                  }).run();
                } catch (e) {
                  console.error('Image upload failed', e);
                  alert('Image upload failed. Please try again.');
                } finally {
                  setIsUploading(false);
                }
              }
            }
          };
          input.click();
        }} className={btnClass(false)} title="Insert Image"><ImageIcon size={14} /></button>
      </div>
    </div>
  );
};

export default function NotesEditor({ content, onChange, noteId }: NotesEditorProps) {
  const isUpdatingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);

  const getSafeContent = (rawContent: any) => {
    if (!rawContent) return '';
    if (typeof rawContent === 'string' && !rawContent.startsWith('{')) {
      return `<p>${rawContent.replace(/\n/g, '<br>')}</p>`;
    }
    return rawContent;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false, // We'll use the lowlight one
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({
        lowlight,
        defaultLanguage: 'text',
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FontSize,
      LineHeight,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
      }),
      ResizableImage.configure({
        noteId,
        onUploadStart: () => setIsUploading(true),
        onUploadEnd: () => setIsUploading(false),
      }),
      SlashCommand.configure({
        suggestion: slashSuggestion,
      }),
    ],
    content: getSafeContent(content),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-full min-h-[calc(100vh-320px)]',
      },
    },
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && content && !isUpdatingRef.current) {
      const safeContent = getSafeContent(content);
      editor.commands.setContent(safeContent, false as any);
    }
    isUpdatingRef.current = false;
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <MenuBar editor={editor} setIsUploading={setIsUploading} />
      {editor && <FloatingMenu editor={editor} />}
      
      {isUploading && (
        <div className="absolute inset-0 bg-[var(--background)]/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-[var(--foreground)]">Uploading image...</span>
          </div>
        </div>
      )}
      
      <style>{`
        .ProseMirror {
          font-family: var(--font-body, 'Inter', sans-serif);
          color: var(--foreground);
          line-height: 1.7;
        }
        .ProseMirror p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
          font-family: var(--font-display, 'Instrument Serif', serif);
          color: var(--foreground);
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .ProseMirror h1 { font-size: 2.25rem; line-height: 1.2; }
        .ProseMirror h2 { font-size: 1.875rem; line-height: 1.2; }
        .ProseMirror h3 { font-size: 1.5rem; line-height: 1.3; }
        .ProseMirror h4 { font-size: 1.25rem; line-height: 1.4; }
        .ProseMirror blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: var(--muted);
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--card-border);
          margin: 2rem 0;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          margin-top: 0.2rem;
          cursor: pointer;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror code {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          background: color-mix(in srgb, var(--foreground) 10%, transparent);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .ProseMirror pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        .ProseMirror a {
          color: var(--accent);
          text-decoration: underline;
          cursor: pointer;
        }
        .ProseMirror-focused {
          outline: none;
        }
        .tippy-box {
          background-color: transparent !important;
        }
      `}</style>

      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 md:py-8">
        <FloatingMenu editor={editor} />
        <TableToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
