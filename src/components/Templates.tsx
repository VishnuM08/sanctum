import { useState } from 'react';
import { Search, ArrowLeft, Clock, Sparkles, CheckCircle2, Bookmark, Tag, Layers, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templates';
import type { Template, TemplateCategory } from '../data/templates';
import { TEMPLATE_THUMBS } from './TemplateThumb';
import { useToast } from './Toast';
import { NotionIcon } from './NotionIcon';
import { motion, AnimatePresence } from 'motion/react';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 180 } }
};

// ── Dynamic template stats parser ──────────────────────────────────────────

interface TemplateStats {
  wordCount: number;
  readTime: number;
  complexity: 'Simple' | 'Medium' | 'Pro';
  counts: {
    todos: number;
    bullets: number;
    headings: number;
    callouts: number;
  };
  features: string[];
}

function getTemplateStats(content: any): TemplateStats {
  let wordCount = 0;
  let todos = 0;
  let bullets = 0;
  let headings = 0;
  let callouts = 0;

  function traverse(node: any) {
    if (!node) return;
    if (node.type === 'text' && typeof node.text === 'string') {
      wordCount += node.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if (node.type === 'taskItem') todos++;
    if (node.type === 'listItem') bullets++;
    if (node.type === 'heading') headings++;
    if (node.type === 'calloutBlock') callouts++;

    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);

  const readTime = Math.max(1, Math.ceil(wordCount / 180));
  
  // Complexity determination based on structure & length
  let complexity: 'Simple' | 'Medium' | 'Pro' = 'Simple';
  const totalElements = todos + bullets + headings + callouts;
  if (totalElements > 15 || wordCount > 250) {
    complexity = 'Pro';
  } else if (totalElements > 6 || wordCount > 100) {
    complexity = 'Medium';
  }

  // Detect featured nodes for premium tag badges
  const features: string[] = [];
  if (todos > 0) features.push('Checklist');
  if (bullets > 0) features.push('Lists');
  if (headings > 0) features.push('Sections');
  if (callouts > 0) features.push('Callouts');
  if (features.length === 0) features.push('Document');

  return {
    wordCount,
    readTime,
    complexity,
    counts: { todos, bullets, headings, callouts },
    features,
  };
}

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
          className="topbar-btn templates-back-btn"
          onClick={() => navigate({ type: 'home' })}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="templates-title">Templates</h1>
          <p className="templates-subtitle">Professional templates designed to streamline your workspace</p>
        </div>
      </div>

      <div className="templates-layout">
        {/* Left sidebar — categories */}
        <div className="templates-sidebar">
          <button
            className={`template-cat-btn ${category === 'All' ? 'active' : ''}`}
            onClick={() => setCategory('All')}
          >
            <span className="template-cat-icon-wrap"><NotionIcon icon="notion_folder" size="1.05em" /></span>
            <span className="template-cat-label">All templates</span>
            <span className="template-cat-count">{TEMPLATES.length}</span>
          </button>

          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className={`template-cat-btn ${category === cat.label ? 'active' : ''}`}
              onClick={() => setCategory(cat.label)}
            >
              <span className="template-cat-icon-wrap"><NotionIcon icon={cat.icon} size="1.05em" /></span>
              <span className="template-cat-label">{cat.label}</span>
              <span className="template-cat-count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="templates-main">
          {/* Search */}
          <div className="templates-search-wrap">
            <Search size={15} style={{ color: 'var(--text-placeholder)', flexShrink: 0 }} />
            <input
              className="templates-search"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="templates-search-kbd">Ctrl K</span>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="templates-empty">
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>No templates found</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Try a different search query or category</div>
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
                        <NotionIcon icon={cat.icon} size="1.1em" style={{ marginRight: 6 }} /> {cat.label}
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
  const stats = getTemplateStats(template.content);

  return (
    <motion.div
      className="template-card"
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
        <div className="template-card-cover-inner">
          {(() => {
            const ThumbComp = TEMPLATE_THUMBS[template.id];
            return ThumbComp
              ? <ThumbComp />
              : <span className="template-card-icon"><NotionIcon icon={template.icon} size="1.5em" /></span>;
          })()}
        </div>
        <div className="template-card-cover-tag">{stats.readTime} min read</div>
      </div>

      {/* Body */}
      <div className="template-card-body">
        <div className="template-card-header-row">
          <span className="template-card-icon-inline"><NotionIcon icon={template.icon} size="1.1em" /></span>
          <span className="template-card-name">{template.name}</span>
        </div>
        <div className="template-card-desc">{template.description}</div>
        
        {/* Sleek FANG-style slide-up action row */}
        <div className="template-card-actions">
          <button
            className="template-card-btn-use"
            onClick={(e) => { e.stopPropagation(); onUse(); }}
          >
            Use Template
          </button>
          <button
            className="template-card-btn-preview"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
          >
            Preview
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function TemplatePreview({ template, onClose, onUse }: {
  template: Template;
  onClose: () => void;
  onUse: () => void;
}) {
  const stats = getTemplateStats(template.content);

  return (
    <>
      <motion.div
        className="template-preview-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.div
        className="template-preview-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      >
        {/* Header */}
        <div className="template-preview-header">
          <div className="template-preview-header-meta">
            <div className="template-preview-name">
              <NotionIcon icon={template.icon} size="1.25em" style={{ marginRight: 6 }} /> {template.name}
            </div>
            <div className="template-preview-cat">{template.category}</div>
          </div>
          <div className="template-preview-header-actions">
            <button className="template-preview-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Dual Pane split container */}
        <div className="template-preview-dual-pane">
          {/* Left Pane: Document Canvas */}
          <div className="template-preview-left-canvas">
            {/* Embedded Page Cover */}
            <div className="template-preview-cover-banner" style={{
              background: template.cover ? template.cover.value : 'var(--bg-hover)',
              height: 140,
              width: '100%',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {(() => {
                const ThumbComp = TEMPLATE_THUMBS[template.id];
                return ThumbComp ? <div className="template-preview-banner-thumb"><ThumbComp /></div> : null;
              })()}
            </div>

            <div className="template-preview-document-body">
              <div className="template-preview-doc-icon"><NotionIcon icon={template.icon} size="48px" /></div>
              <h1 className="template-preview-doc-title">{template.name}</h1>
              <p className="template-preview-doc-desc">{template.description}</p>

              <TemplateContentPreview content={template.content} />
            </div>
          </div>

          {/* Right Pane: Sticky Details Sidebar */}
          <div className="template-preview-right-sidebar">
            <div className="preview-cta-card">
              <button className="preview-primary-use-btn" onClick={onUse}>
                <Sparkles size={14} style={{ marginRight: 6 }} /> Use this template
              </button>
              <p className="preview-cta-subtext">Instantly adds a ready-to-use page to your personal workspace.</p>
            </div>

            <div className="preview-sidebar-section">
              <h3 className="preview-sidebar-section-title">Template details</h3>
              <div className="preview-stats-grid">
                <div className="preview-stat-item">
                  <div className="preview-stat-label">Category</div>
                  <div className={`preview-category-pill cat-${template.category.toLowerCase().replace(/\s+/g, '-')}`}>
                    {template.category}
                  </div>
                </div>
                <div className="preview-stat-item">
                  <div className="preview-stat-label">Complexity</div>
                  <div className={`preview-complexity-pill tier-${stats.complexity.toLowerCase()}`}>
                    <Sparkles size={11} style={{ marginRight: 4, flexShrink: 0 }} /> {stats.complexity}
                  </div>
                </div>
                <div className="preview-stat-item">
                  <div className="preview-stat-label">Reading Time</div>
                  <div className="preview-stat-val-with-icon">
                    <Clock size={13} style={{ marginRight: 5, color: 'var(--text-muted)' }} />
                    <span>{stats.readTime} min read</span>
                  </div>
                </div>
                <div className="preview-stat-item">
                  <div className="preview-stat-label">Word Count</div>
                  <div className="preview-stat-val-with-icon">
                    <BookOpen size={13} style={{ marginRight: 5, color: 'var(--text-muted)' }} />
                    <span>{stats.wordCount} words</span>
                  </div>
                </div>
              </div>
            </div>

            {stats.features && stats.features.length > 0 && (
              <div className="preview-sidebar-section">
                <h3 className="preview-sidebar-section-title">Components included</h3>
                <div className="preview-features-list">
                  {stats.features.map((feat) => (
                    <div className="preview-feature-tag" key={feat}>
                      <CheckCircle2 size={13} className="preview-feature-check" />
                      <span>{feat} system</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="preview-sidebar-section info-callout">
              <AlertCircle size={14} className="info-callout-icon" />
              <div className="info-callout-text">
                Fully editable. Customize blocks, add lists, or attach notes after creating.
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Floating Action Bar */}
        <div className="template-preview-mobile-cta-wrap">
          <button className="preview-primary-use-btn mobile-cta" onClick={onUse}>
            <Sparkles size={14} style={{ marginRight: 6 }} /> Use Template
          </button>
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
