import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BlockEditor } from '../components/BlockEditor';
import { CoverImagePicker } from '../components/CoverImagePicker';
import { IconPicker } from '../components/IconPicker';
import { TemplatePicker } from '../components/TemplatePicker';
import { GlobalSearch } from '../components/GlobalSearch';
import { HelpDialog } from '../components/HelpDialog';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { NotionPage, Block } from '../types/blocks';
import { Plus, Search, Star, Clock, MoreHorizontal, Trash2, FileText, Sparkles, ArrowLeft, Zap, History, Tag, Filter, Download, Copy, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateAISummary, extractReminders } from '../utils/mockAI';
import { downloadMarkdown, downloadJSON } from '../utils/exportPage';
import { clsx } from 'clsx';
import { PageTemplate } from '../utils/templates';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200&h=400&fit=crop';

export function Notes() {
  const [pages, setPages] = useLocalStorage<NotionPage[]>('notion-pages', []);
  const [reminders, setReminders] = useLocalStorage<any[]>('reminders', []);
  const [recentPages, setRecentPages] = useLocalStorage<string[]>('recent-pages', []);
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageToDelete, setPageToDelete] = useState<NotionPage | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPageOptions, setShowPageOptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allTags = Array.from(new Set(pages.flatMap(p => p.tags || [])));

  const filteredPages = pages.filter(page => {
    const matchesSearch = searchQuery === '' || (
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.blocks.some(block => block.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      page.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => page.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const createNewPage = () => {
    setShowTemplatePicker(true);
  };

  const createPageFromTemplate = (template: PageTemplate) => {
    const newPage: NotionPage = {
      id: Date.now().toString(),
      title: template.id === 'blank' ? 'Untitled' : template.name,
      icon: template.icon,
      coverImage: DEFAULT_COVER,
      blocks: template.blocks.map(b => ({ ...b, id: generateId() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: false,
      tags: [],
      versions: [],
    };
    setPages([newPage, ...pages]);
    setSelectedPage(newPage);
    setShowTemplatePicker(false);
    addToRecentPages(newPage.id);
    toast.success(`${template.name} created!`);
  };

  const addToRecentPages = (pageId: string) => {
    const updated = [pageId, ...recentPages.filter(id => id !== pageId)].slice(0, 10);
    setRecentPages(updated);
  };

  const openPage = (page: NotionPage) => {
    setSelectedPage(page);
    addToRecentPages(page.id);
  };

  const savePageVersion = (page: NotionPage) => {
    const version = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      blocks: JSON.parse(JSON.stringify(page.blocks)),
      title: page.title,
    };

    const versions = page.versions || [];
    // Keep last 10 versions
    const updatedVersions = [version, ...versions].slice(0, 10);

    return updatedVersions;
  };

  const updatePage = (updates: Partial<NotionPage>, saveVersion = false) => {
    if (!selectedPage) return;

    const updatedPage = {
      ...selectedPage,
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(saveVersion && { versions: savePageVersion(selectedPage) }),
    };

    const updatedPages = pages.map(p =>
      p.id === selectedPage.id ? updatedPage : p
    );
    setPages(updatedPages);
    setSelectedPage(updatedPage);

    // Auto-save notification
    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
      saveIndicator.classList.remove('opacity-0');
      setTimeout(() => {
        saveIndicator.classList.add('opacity-0');
      }, 2000);
    }
  };

  const updateBlocks = (blocks: Block[]) => {
    updatePage({ blocks });

    // Generate AI summary from all text blocks
    const allText = blocks.filter(b => b.type !== 'divider' && b.type !== 'image').map(b => b.content).join('\n');
    if (allText.length > 50) {
      const summary = generateAISummary(allText);
      updatePage({ aiSummary: summary });

      // Extract reminders
      const extractedReminders = extractReminders(allText, selectedPage?.id || '');
      if (extractedReminders.length > 0) {
        const newReminders = extractedReminders.map(r => ({
          id: Date.now().toString() + Math.random(),
          ...r,
          aiGenerated: true,
          fired: false,
          noteId: selectedPage?.id,
          createdAt: new Date().toISOString(),
        }));
        setReminders([...reminders, ...newReminders]);
        toast.success(`${extractedReminders.length} reminder(s) extracted!`);
      }
    }
  };

  const deletePage = () => {
    if (!pageToDelete) return;
    setPages(pages.filter(p => p.id !== pageToDelete.id));
    if (selectedPage?.id === pageToDelete.id) {
      setSelectedPage(null);
    }
    setPageToDelete(null);
    toast.success('Page deleted');
  };

  const toggleFavorite = (pageId: string) => {
    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, favorite: !p.favorite } : p
    );
    setPages(updatedPages);
    if (selectedPage?.id === pageId) {
      setSelectedPage({ ...selectedPage, favorite: !selectedPage.favorite });
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const pageDate = new Date(date);
    const diff = now.getTime() - pageDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return pageDate.toLocaleDateString();
  };

  // Page View
  if (selectedPage) {
    return (
      <div className="space-y-0 -mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 animate-in fade-in duration-500">
        {/* Cover Image */}
        <CoverImagePicker
          currentCover={selectedPage.coverImage}
          onSelect={(cover) => updatePage({ coverImage: cover })}
        />

        {/* Page Content */}
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8 pb-16">
          {/* Back Button */}
          <button
            onClick={() => setSelectedPage(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all pages
          </button>

          {/* Header Actions */}
          <div className="flex items-center justify-end gap-2 mb-6">
            <button
              onClick={() => {
                if (selectedPage.versions && selectedPage.versions.length > 0) {
                  toast.info(`${selectedPage.versions.length} version(s) saved`);
                } else {
                  toast.info('No previous versions');
                }
              }}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="Page history"
            >
              <Clock className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => toggleFavorite(selectedPage.id)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title={selectedPage.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={clsx("w-5 h-5", selectedPage.favorite ? "fill-primary text-primary" : "text-muted-foreground")} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowPageOptions(!showPageOptions)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>

              {showPageOptions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPageOptions(false)}
                  />
                  <div className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-xl z-20 py-1 min-w-[200px] animate-in slide-in-up">
                    <button
                      onClick={() => {
                        downloadMarkdown(selectedPage);
                        setShowPageOptions(false);
                        toast.success('Page exported as Markdown!');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export as Markdown
                    </button>
                    <button
                      onClick={() => {
                        const markdown = selectedPage.blocks.map(b => b.content).join('\n');
                        navigator.clipboard.writeText(markdown);
                        setShowPageOptions(false);
                        toast.success('Content copied to clipboard!');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        const newPage = { ...selectedPage, id: Date.now().toString(), title: `${selectedPage.title} (Copy)` };
                        setPages([newPage, ...pages]);
                        setShowPageOptions(false);
                        toast.success('Page duplicated!');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate Page
                    </button>
                    <button
                      onClick={() => {
                        setPageToDelete(selectedPage);
                        setShowPageOptions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Page
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-8">
            <IconPicker
              currentIcon={selectedPage.icon}
              onSelect={(icon) => updatePage({ icon })}
            />
            <input
              type="text"
              value={selectedPage.title}
              onChange={(e) => updatePage({ title: e.target.value })}
              className="flex-1 text-5xl font-bold bg-transparent border-none outline-none"
              placeholder="Untitled"
            />
          </div>

          {/* AI Summary */}
          {selectedPage.aiSummary && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 mb-6">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">AI Summary</p>
                <p className="text-sm text-muted-foreground">{selectedPage.aiSummary}</p>
              </div>
            </div>
          )}

          {/* Block Editor */}
          <BlockEditor
            blocks={selectedPage.blocks}
            onChange={updateBlocks}
            autoFocus={false}
          />

          {/* Auto-save indicator */}
          <div
            id="save-indicator"
            className="fixed bottom-8 right-8 px-4 py-2 bg-card border border-border rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none"
          >
            <p className="text-sm text-muted-foreground">All changes saved</p>
          </div>
        </div>
      </div>
    );
  }

  // Pages List View
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Pages
          </h1>
          <p className="text-muted-foreground">
            {pages.length} total page{pages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(true)}
            className="px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all flex items-center gap-2"
            title="Help & Shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Help</span>
          </button>
          <button
            onClick={createNewPage}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Page
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>

      {/* Favorites */}
      {pages.some(p => p.favorite) && !searchQuery && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <h3 className="font-semibold">Favorites</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pages.filter(p => p.favorite).map((page, index) => (
              <PageCard
                key={page.id}
                page={page}
                index={index}
                onClick={() => setSelectedPage(page)}
                onDelete={() => setPageToDelete(page)}
                onToggleFavorite={() => toggleFavorite(page.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Pages */}
      <div>
        {!searchQuery && pages.some(p => p.favorite) && (
          <h3 className="font-semibold mb-4">All Pages</h3>
        )}
        {filteredPages.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">
              {searchQuery ? 'No pages found' : 'No pages yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first page to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={createNewPage}
                className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Page
              </button>
            )}
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPages.map((page, index) => (
              <PageCard
                key={page.id}
                page={page}
                index={index}
                onClick={() => openPage(page)}
                onDelete={() => setPageToDelete(page)}
                onToggleFavorite={() => toggleFavorite(page.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by tags:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                if (selectedTags.includes(tag)) {
                  setSelectedTags(selectedTags.filter(t => t !== tag));
                } else {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm font-medium transition-all flex items-center gap-1",
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Recent Pages Sidebar (Desktop) */}
      {recentPages.length > 0 && !searchQuery && (
        <div className="hidden lg:block">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Recent Pages</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentPages.slice(0, 5).map(pageId => {
              const page = pages.find(p => p.id === pageId);
              if (!page) return null;
              return (
                <button
                  key={page.id}
                  onClick={() => openPage(page)}
                  className="flex-shrink-0 w-48 p-3 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-accent/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{page.icon}</span>
                    <h4 className="font-medium truncate text-sm group-hover:text-primary transition-colors">
                      {page.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(page.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Capture Button */}
      <button
        onClick={() => setShowQuickCapture(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full shadow-2xl shadow-primary/40 hover:shadow-3xl hover:shadow-primary/60 hover:scale-110 transition-all flex items-center justify-center z-40 animate-in bounce-in"
        title="Quick Capture (Cmd/Ctrl + N)"
      >
        <Zap className="w-6 h-6" />
      </button>

      {/* Template Picker */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={createPageFromTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Global Search */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={(pageId) => {
          const page = pages.find(p => p.id === pageId);
          if (page) openPage(page);
        }}
      />

      {/* Quick Capture Dialog */}
      {showQuickCapture && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowQuickCapture(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Quick Capture</h3>
            <textarea
              placeholder="Type your quick note here... (Press Cmd/Ctrl + Enter to save)"
              className="w-full h-32 px-4 py-3 rounded-xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              autoFocus
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  const content = e.currentTarget.value.trim();
                  if (content) {
                    const newPage: NotionPage = {
                      id: Date.now().toString(),
                      title: content.split('\n')[0].slice(0, 50) || 'Quick Note',
                      icon: '⚡',
                      coverImage: DEFAULT_COVER,
                      blocks: [
                        { id: generateId(), type: 'text', content }
                      ],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      favorite: false,
                      tags: ['quick-capture'],
                    };
                    setPages([newPage, ...pages]);
                    setShowQuickCapture(false);
                    toast.success('Quick note captured!');
                  }
                }
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Press <kbd className="px-2 py-1 bg-secondary rounded text-xs">Cmd/Ctrl + Enter</kbd> to save
            </p>
          </div>
        </div>
      )}

      {/* Help Dialog */}
      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={pageToDelete !== null}
        onClose={() => setPageToDelete(null)}
        onConfirm={deletePage}
        title="Delete Page"
        description="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

interface PageCardProps {
  page: NotionPage;
  index: number;
  onClick: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  formatDate: (date: string) => string;
}

function PageCard({ page, index, onClick, onDelete, onToggleFavorite, formatDate }: PageCardProps) {
  const [showActions, setShowActions] = useState(false);

  const previewText = page.blocks
    .filter(b => b.content && b.type !== 'divider' && b.type !== 'image')
    .map(b => b.content)
    .join(' ')
    .slice(0, 150);

  return (
    <Card
      hover
      className="flex flex-col group cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onClick}
    >
      {/* Cover Preview */}
      <div className="h-32 -mx-4 -mt-4 mb-4 rounded-t-xl overflow-hidden">
        <img
          src={page.coverImage}
          alt="Cover"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{page.icon}</span>
          <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
            {page.title}
          </h4>
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(false);
                }}
              />
              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl z-20 py-1 min-w-[140px] animate-in slide-in-up">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm"
                >
                  <Star className={clsx("w-4 h-4", page.favorite && "fill-primary text-primary")} />
                  {page.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {previewText && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {previewText}
        </p>
      )}

      {page.aiSummary && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 mb-4">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground line-clamp-2">{page.aiSummary}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
        <span className="text-xs text-muted-foreground">{formatDate(page.updatedAt)}</span>
        {page.favorite && <Star className="w-4 h-4 text-primary fill-primary" />}
      </div>
    </Card>
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
