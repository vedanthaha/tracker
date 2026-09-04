import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function CodeBlockComponent({ node, updateAttributes, extension }: any) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="relative group rounded-xl overflow-hidden my-4" style={{ background: 'color-mix(in srgb, var(--foreground) 5%, transparent)', border: '1px solid var(--card-border)' }}>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <select
          contentEditable={false}
          className="text-xs bg-transparent outline-none cursor-pointer rounded-md px-1 py-1"
          style={{ color: 'var(--muted)' }}
          value={node.attrs.language || 'text'}
          onChange={(event) => updateAttributes({ language: event.target.value })}
        >
          <option value="null">auto</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="json">JSON</option>
          <option value="bash">Bash</option>
          <option value="sql">SQL</option>
          <option value="markdown">Markdown</option>
        </select>
        <button
          contentEditable={false}
          className="p-1.5 rounded-md transition-colors"
          style={{ background: 'color-mix(in srgb, var(--foreground) 10%, transparent)', color: 'var(--muted)' }}
          onClick={copy}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="!mt-0 !mb-0 p-4 !bg-transparent text-sm font-mono-data" style={{ color: 'var(--foreground)' }}>
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
}
