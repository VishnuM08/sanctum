import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from './Toast';
import { markdownToTipTap } from '../utils/markdownToTipTap';

interface Props { onClose: () => void }

export function ImportModal({ onClose }: Props) {
  const createPage     = useStore((s) => s.createPage);
  const updatePage     = useStore((s) => s.updatePage);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const { toast }      = useToast();

  const [tab,     setTab]     = useState<'markdown' | 'text'>('markdown');
  const [mdText,  setMdText]  = useState('');
  const [title,   setTitle]   = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doImport = () => {
    if (!mdText.trim()) return;
    setLoading(true);
    try {
      const content = markdownToTipTap(mdText);
      // Extract title from first heading if no title given
      const finalTitle = title.trim() || (() => {
        const firstLine = mdText.split('\n').find((l) => l.trim());
        if (firstLine?.startsWith('#')) return firstLine.replace(/^#+\s+/, '').trim();
        return 'Imported page';
      })();

      const pageId = createPage(null);
      updatePage(pageId, { title: finalTitle, icon: '📥', content });
      toast(`Imported "${finalTitle}"`);
      navigateToPage(pageId);
      onClose();
    } catch {
      toast('Import failed — check the content format', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setMdText(text);
      if (!title) {
        // Guess title from filename
        setTitle(file.name.replace(/\.md$/i, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={15} />
            <span>Import</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflow: 'hidden' }}>
          {/* Format tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            {(['markdown', 'text'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '4px 12px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
                  background: tab === t ? 'var(--bg-hover-strong)' : 'transparent',
                  fontWeight: tab === t ? 600 : 400, color: 'var(--text-primary)',
                }}
              >
                {t === 'markdown' ? '📝 Markdown' : '📄 Plain text'}
              </button>
            ))}
          </div>

          {/* Title field */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Page title (optional — auto-detected from first heading)
            </label>
            <input
              className="settings-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My imported page"
            />
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tab === 'markdown' ? 'Paste Markdown' : 'Paste text'}
            </label>
            <textarea
              style={{
                flex: 1, padding: '10px 12px',
                border: '1px solid var(--border-strong)', borderRadius: 6,
                fontSize: 13, fontFamily: 'var(--font-mono)',
                resize: 'none', outline: 'none',
                background: 'var(--bg-hover)', color: 'var(--text-primary)',
                minHeight: 160,
              }}
              placeholder={tab === 'markdown'
                ? '# My Page\n\nPaste your Markdown content here...\n\n## Section\n- Item 1\n- Item 2\n\n- [ ] Task 1\n- [x] Done task'
                : 'Paste plain text here...'}
              value={mdText}
              onChange={(e) => setMdText(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div
            style={{
              border: '2px dashed var(--border-strong)', borderRadius: 8,
              padding: '12px', textAlign: 'center', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)',
              transition: 'border-color 150ms, background 150ms',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <FileText size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.5 }} />
            <span>Drop a <strong>.md</strong> file here or click to browse</span>
          </div>
          <input ref={fileRef} type="file" accept=".md,.txt,.markdown" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="settings-btn secondary" onClick={onClose}>Cancel</button>
          <button
            className="settings-btn primary"
            onClick={doImport}
            disabled={!mdText.trim() || loading}
          >
            {loading ? 'Importing…' : 'Import page'}
          </button>
        </div>
      </div>
    </div>
  );
}
