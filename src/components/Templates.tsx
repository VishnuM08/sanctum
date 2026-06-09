import { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templates';
import type { Template, TemplateCategory } from '../data/templates';
import { TEMPLATE_THUMBS } from './TemplateThumb';
import { useToast } from './Toast';
import { NotionIcon } from './NotionIcon';
import { motion, AnimatePresence } from 'motion/react';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } }
};

export function Templates() {
  const createPage     = useStore((s) => s.createPage);
  const updatePage     = useStore((s) => s.updatePage);
  const navigate       = useStore((s) => s.navigate);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const { toast }      = useToast();

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

  const useTemplate = (t: Template | null) => {
    if (!t) return;
    const pageId = createPage(null);
    // Overwrite the content, title, icon, cover
    updatePage(pageId, {
      title: t.name,
      icon: t.icon,
      cover: t.cover,
      content: JSON.parse(JSON.stringify(t.content)),
    });
    toast(`Created page from "${t.name}"`);
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
      <AnimatePresence>
        {preview && (
          <TemplatePreview
            template={preview}
            onClose={() => setPreview(null)}
            onUse={() => { useTemplate(preview); setPreview(null); }}
          />
        )}
      </AnimatePresence>
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
      <motion.div
        className="template-preview-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="template-preview-panel"
        initial={{ x: '100%', opacity: 0.9 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.9 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      >
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
      </motion.div>
    </>
  );
}

// ── Rich document preview (renders TipTap JSON recursively) ──────────────────

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function TemplateContentPreview({ content }: { content: unknown }) {
  const docNode = content as TipTapNode;
  
  if (!docNode || !docNode.content) {
    return (
      <div className="template-content-preview">
        <span style={{ fontStyle: 'italic', color: 'var(--text-faint)' }}>Empty document</span>
      </div>
    );
  }

  return (
    <div className="template-content-preview">
      {renderContent(docNode.content)}
    </div>
  );
}

function renderText(node: TipTapNode): React.ReactNode {
  if (!node.text) return null;
  if (!node.marks || node.marks.length === 0) {
    return node.text;
  }
  
  // Wrap text recursively with formats
  let element: React.ReactNode = node.text;
  node.marks.forEach((mark) => {
    if (mark.type === 'bold') {
      element = <strong key={mark.type}>{element}</strong>;
    } else if (mark.type === 'italic') {
      element = <em key={mark.type}>{element}</em>;
    } else if (mark.type === 'strike') {
      element = <del key={mark.type}>{element}</del>;
    } else if (mark.type === 'underline') {
      element = <span key={mark.type} style={{ textDecoration: 'underline' }}>{element}</span>;
    } else if (mark.type === 'code') {
      element = <code key={mark.type} className="editor-code">{element}</code>;
    }
  });
  return element;
}

function renderContent(nodes?: TipTapNode[]): React.ReactNode {
  if (!nodes) return null;
  return nodes.map((node, i) => <NodeRenderer key={i} node={node} />);
}

function NodeRenderer({ node }: { node: TipTapNode }) {
  switch (node.type) {
    case 'text':
      return <>{renderText(node)}</>;
    case 'paragraph':
      return <p className="preview-p">{renderContent(node.content) || '\u00A0'}</p>;
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag className={`preview-h${level}`}>{renderContent(node.content)}</Tag>;
    }
    case 'blockquote':
      return (
        <blockquote className="preview-blockquote">
          {renderContent(node.content)}
        </blockquote>
      );
    case 'horizontalRule':
      return <hr className="preview-hr" />;
    case 'bulletList':
      return <ul className="preview-ul">{renderContent(node.content)}</ul>;
    case 'orderedList':
      return <ol className="preview-ol">{renderContent(node.content)}</ol>;
    case 'listItem':
      return <li className="preview-li">{renderContent(node.content)}</li>;
    case 'taskList':
      return <div className="preview-task-list">{renderContent(node.content)}</div>;
    case 'taskItem': {
      const checked = !!node.attrs?.checked;
      return (
        <div className="preview-task-item">
          <span className={`preview-task-checkbox ${checked ? 'checked' : ''}`}>
            {checked && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <div className={`preview-task-content ${checked ? 'completed' : ''}`}>
            {renderContent(node.content)}
          </div>
        </div>
      );
    }
    case 'calloutBlock': {
      const emoji = (node.attrs?.emoji as string) ?? '💡';
      return (
        <div className="callout-block preview-callout-block">
          <div className="callout-emoji-wrap">
            <span className="callout-emoji" style={{ cursor: 'default' }}>{emoji}</span>
          </div>
          <div className="callout-content preview-callout-content">
            {renderContent(node.content)}
          </div>
        </div>
      );
    }
    default:
      if (node.content) {
        return <>{renderContent(node.content)}</>;
      }
      return null;
  }
}
