import { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templates';
import type { Template, TemplateCategory } from '../data/templates';
import { TEMPLATE_THUMBS } from './TemplateThumb';
import { useToast } from './Toast';
import { NotionIcon } from './NotionIcon';
import { motion } from 'motion/react';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } }
};

export function Templates() {
  const createPage    = useStore((s) => s.createPage);
  const updatePage    = useStore((s) => s.updatePage);
  const navigate      = useStore((s) => s.navigate);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const { toast }     = useToast();

  // Read initial category from navigation state
  const navCategory = (() => {
    const av = useStore.getState().activeView;
    return av.type === 'templates' && (av as { type: 'templates'; category?: string }).category
      ? (av as { type: 'templates'; category?: string }).category as (TemplateCategory | 'All')
      : 'All';
  })();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>(navCategory);
  const [preview,  setPreview]  = useState<Template | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = category === 'All' || t.category === category;
    const matchQ   = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
                     t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const useTemplate = (template: Template) => {
    const pageId = createPage(null);
    updatePage(pageId, {
      title:   template.name,
      icon:    template.icon,
      cover:   template.cover,
      content: template.content,
    });
    toast(`Created from "${template.name}" template`);
    navigateToPage(pageId);
  };

  return (
    <div className="templates-page">
      {/* Header */}
      <div className="templates-header">
        <button
          className="topbar-btn"
          onClick={() => navigate({ type: 'home' })}
          style={{ marginRight: 8 }}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="templates-title">Templates</h1>
          <p className="templates-subtitle">{TEMPLATES.length} templates to get started instantly</p>
        </div>
      </div>

      <div className="templates-layout">
        {/* Left sidebar — categories */}
        <div className="templates-sidebar">
          <button
            className={`template-cat-btn ${category === 'All' ? 'active' : ''}`}
            onClick={() => setCategory('All')}
          >
            <span><NotionIcon icon="notion_folder" size="1.1em" /></span>
            <span>All templates</span>
            <span className="template-cat-count">{TEMPLATES.length}</span>
          </button>

          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className={`template-cat-btn ${category === cat.label ? 'active' : ''}`}
              onClick={() => setCategory(cat.label)}
            >
              <span><NotionIcon icon={cat.icon} size="1.1em" /></span>
              <span>{cat.label}</span>
              <span className="template-cat-count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="templates-main">
          {/* Search */}
          <div className="templates-search-wrap">
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              className="templates-search"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="templates-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600 }}>No templates found</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Try a different search or category</div>
            </div>
          ) : (
            <>
              {category === 'All' && !search && (
                TEMPLATE_CATEGORIES.map((cat) => {
                  const catTemplates = filtered.filter((t) => t.category === cat.label);
                  if (catTemplates.length === 0) return null;
                  return (
                    <div key={cat.label} className="template-section">
                      <div className="template-section-label">
                        <NotionIcon icon={cat.icon} size="1.1em" style={{ marginRight: 4 }} /> {cat.label}
                      </div>
                      <motion.div 
                        className="template-grid"
                        variants={gridVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {catTemplates.map((t) => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            onPreview={() => setPreview(t)}
                            onUse={() => useTemplate(t)}
                          />
                        ))}
                      </motion.div>
                    </div>
                  );
                })
              )}

              {(category !== 'All' || search) && (
                <motion.div 
                  className="template-grid"
                  variants={gridVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filtered.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onPreview={() => setPreview(t)}
                      onUse={() => useTemplate(t)}
                    />
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview panel */}
      {preview && (
        <TemplatePreview
          template={preview}
          onClose={() => setPreview(null)}
          onUse={() => { useTemplate(preview); setPreview(null); }}
        />
      )}
    </div>
  );
}

// ── Template card ──────────────────────────────────────────────────────────────

function TemplateCard({ template, onPreview, onUse }: {
  template: Template;
  onPreview: () => void;
  onUse: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="template-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPreview}
      variants={cardVariants}
    >
      {/* Cover — SVG document preview over gradient */}
      <div
        className="template-card-cover"
        style={{
          background: template.cover
            ? template.cover.value
            : 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-hover-strong) 100%)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {(() => {
          const ThumbComp = TEMPLATE_THUMBS[template.id];
          return ThumbComp
            ? <ThumbComp />
            : <span className="template-card-icon"><NotionIcon icon={template.icon} size="1.5em" /></span>;
        })()}
      </div>

      {/* Body */}
      <div className="template-card-body">
        <div className="template-card-name">{template.name}</div>
        <div className="template-card-desc">{template.description}</div>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div className="template-card-overlay">
          <button
            className="template-use-btn"
            onClick={(e) => { e.stopPropagation(); onUse(); }}
          >
            Use template
          </button>
          <button
            className="template-preview-btn"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
          >
            Preview
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function TemplatePreview({ template, onClose, onUse }: {
  template: Template;
  onClose: () => void;
  onUse: () => void;
}) {
  return (
    <>
      <div className="template-preview-backdrop" onClick={onClose} />
      <div className="template-preview-panel">
        {/* Header */}
        <div className="template-preview-header">
          <div>
            <div className="template-preview-name">
              <NotionIcon icon={template.icon} size="1.2em" style={{ marginRight: 6 }} /> {template.name}
            </div>
            <div className="template-preview-cat">{template.category}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="settings-btn primary" onClick={onUse}>
              Use template
            </button>
            <button className="topbar-btn" onClick={onClose} style={{ fontSize: 18, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Cover preview with SVG thumb */}
        <div style={{
          height: 160,
          background: template.cover ? template.cover.value : 'var(--bg-hover)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {(() => {
            const ThumbComp = TEMPLATE_THUMBS[template.id];
            return ThumbComp ? <ThumbComp /> : null;
          })()}
        </div>

        {/* Content preview */}
        <div className="template-preview-content">
          <div style={{ marginBottom: 8 }}><NotionIcon icon={template.icon} size="48px" /></div>
          <div className="template-preview-title">{template.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>{template.description}</div>

          <TemplateContentPreview content={template.content} />
        </div>
      </div>
    </>
  );
}

// ── Simplified content preview (renders TipTap JSON as plain text) ──────────

function TemplateContentPreview({ content }: { content: unknown }) {
  const lines = extractLines(content as { type: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown> });

  return (
    <div className="template-content-preview">
      {lines.slice(0, 20).map((line, i) => (
        <div key={i} className={`preview-line preview-line-${line.type}`}>
          {line.prefix && <span className="preview-prefix">{line.prefix}</span>}
          <span>{line.text}</span>
        </div>
      ))}
      {lines.length > 20 && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
          +{lines.length - 20} more lines…
        </div>
      )}
    </div>
  );
}

interface PreviewLine { type: string; text: string; prefix?: string }

function extractLines(node: { type: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown> } | null | undefined): PreviewLine[] {
  if (!node) return [];
  const lines: PreviewLine[] = [];

  const getText = (n: unknown): string => {
    const nd = n as { type?: string; text?: string; content?: unknown[] };
    if (!nd) return '';
    if (nd.type === 'text') return nd.text ?? '';
    return (nd.content ?? []).map(getText).join('');
  };

  const walk = (n: { type: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown> }) => {
    switch (n.type) {
      case 'heading': {
        const level = (n.attrs?.level as number) ?? 1;
        lines.push({ type: `h${level}`, text: getText(n), prefix: '#'.repeat(level) + ' ' });
        break;
      }
      case 'paragraph': {
        const t = getText(n);
        if (t.trim()) lines.push({ type: 'p', text: t });
        break;
      }
      case 'bulletList':
        (n.content ?? []).forEach((li) => {
          const nd = li as { type: string; content?: unknown[] };
          const t = nd.content?.map(getText).join('').trim() ?? '';
          if (t) lines.push({ type: 'bullet', text: t, prefix: '• ' });
        });
        break;
      case 'orderedList':
        (n.content ?? []).forEach((li, i) => {
          const nd = li as { type: string; content?: unknown[] };
          const t = nd.content?.map(getText).join('').trim() ?? '';
          if (t) lines.push({ type: 'numbered', text: t, prefix: `${i + 1}. ` });
        });
        break;
      case 'taskList':
        (n.content ?? []).forEach((li) => {
          const nd = li as { type: string; content?: unknown[]; attrs?: Record<string, unknown> };
          const t = nd.content?.map(getText).join('').trim() ?? '';
          const checked = nd.attrs?.checked;
          if (t) lines.push({ type: 'todo', text: t, prefix: checked ? '☑ ' : '☐ ' });
        });
        break;
      case 'blockquote': {
        const t = getText(n);
        if (t.trim()) lines.push({ type: 'quote', text: t, prefix: '" ' });
        break;
      }
      case 'horizontalRule':
        lines.push({ type: 'hr', text: '──────────────────' });
        break;
      case 'calloutBlock': {
        const emoji = n.attrs?.emoji as string ?? '💡';
        const t = getText(n);
        if (t.trim()) lines.push({ type: 'callout', text: t, prefix: emoji + ' ' });
        break;
      }
      default:
        (n.content ?? []).forEach((child) => walk(child as { type: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown> }));
    }
  };

  (node.content ?? []).forEach((child) => walk(child as { type: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown> }));
  return lines;
}
