import { useState, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Image as ImageIcon, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export function ImageBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const src     = node.attrs['src']     as string | null;
  const caption = node.attrs['caption'] as string ?? '';
  const align   = node.attrs['align']   as string ?? 'left';

  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [showInput, setShowInput] = useState(!src);
  const fileRef = useRef<HTMLInputElement>(null);

  const commitUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    updateAttributes({ src: u });
    setShowInput(false);
    setUrlError(false);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG 80% quality to ensure small payload size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          updateAttributes({ src: compressedDataUrl });
          setShowInput(false);
        } else {
          // Fallback if canvas fails
          updateAttributes({ src: e.target?.result as string });
          setShowInput(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (showInput || !src) {
    return (
      <NodeViewWrapper>
        <div
          className={`image-block-empty ${selected ? 'selected' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('image/')) handleFile(file);
          }}
        >
          <div className="image-block-icon"><ImageIcon size={28} /></div>
          <div className="image-block-hint">Drag & drop an image, or</div>
          <div className="image-block-inputs">
            <input
              className="filter-input"
              placeholder="Paste image URL..."
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && commitUrl()}
              style={urlError ? { borderColor: 'var(--danger)' } : {}}
            />
            <button
              className="settings-btn primary"
              style={{ padding: '5px 12px', fontSize: 13 }}
              onClick={commitUrl}
            >
              Embed link
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>or</span>
            <button
              className="settings-btn secondary"
              style={{ padding: '5px 12px', fontSize: 13 }}
              onClick={() => fileRef.current?.click()}
            >
              Upload
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        className={`image-block-container ${selected ? 'selected' : ''}`}
        style={{ textAlign: align as 'left' | 'center' | 'right' }}
      >
        {selected && (
          <div className="image-block-toolbar">
            <button
              className={`image-toolbar-btn ${align === 'left' ? 'active' : ''}`}
              onClick={() => updateAttributes({ align: 'left' })}
              title="Align left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              className={`image-toolbar-btn ${align === 'center' ? 'active' : ''}`}
              onClick={() => updateAttributes({ align: 'center' })}
              title="Align center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              className={`image-toolbar-btn ${align === 'right' ? 'active' : ''}`}
              onClick={() => updateAttributes({ align: 'right' })}
              title="Align right"
            >
              <AlignRight size={13} />
            </button>
            <div style={{ width: 1, height: 14, background: 'var(--border-strong)', margin: '0 2px' }} />
            <button
              className="image-toolbar-btn"
              onClick={() => { setShowInput(true); setUrlInput(''); }}
              title="Replace image"
            >
              Replace
            </button>
            <button
              className="image-toolbar-btn"
              onClick={deleteNode}
              title="Delete"
              style={{ color: 'var(--danger)' }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        <img
          src={src}
          alt={caption}
          style={{
            maxWidth: '100%',
            borderRadius: 4,
            display: 'block',
            margin: align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0',
          }}
          onError={() => { setShowInput(true); setUrlError(true); }}
        />

        <input
          className="image-caption-input"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </NodeViewWrapper>
  );
}
