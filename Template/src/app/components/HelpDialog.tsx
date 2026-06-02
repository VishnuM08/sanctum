import { X, Command, Keyboard } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'K'], description: 'Open global search' },
    { keys: ['Cmd/Ctrl', 'N'], description: 'Quick capture note' },
    { keys: ['Cmd/Ctrl', 'B'], description: 'Bold text (coming soon)' },
    { keys: ['Cmd/Ctrl', 'I'], description: 'Italic text (coming soon)' },
    { keys: ['Cmd/Ctrl', 'D'], description: 'Duplicate block' },
    { keys: ['Enter'], description: 'New block below' },
    { keys: ['Backspace'], description: 'Delete empty block' },
    { keys: ['/'], description: 'Open slash command menu' },
    { keys: ['Esc'], description: 'Close dialogs' },
  ];

  const features = [
    { name: '✅ Templates', description: '10 pre-built templates for common use cases' },
    { name: '✅ Global Search', description: 'Search across all pages, vault, and reminders' },
    { name: '✅ Block Editor', description: '13 block types with drag & drop' },
    { name: '✅ Slash Commands', description: 'Type / to quickly add any block' },
    { name: '✅ Cover Images', description: '13 beautiful cover options' },
    { name: '✅ Emoji Icons', description: '45+ emoji icons for pages' },
    { name: '✅ Auto-save', description: 'All changes saved automatically' },
    { name: '✅ AI Features', description: 'Auto-summaries and reminder extraction' },
    { name: '✅ Export', description: 'Export to Markdown or JSON' },
    { name: '✅ Quick Capture', description: 'Floating button for quick notes' },
    { name: '✅ Tag Filters', description: 'Filter pages by tags' },
    { name: '✅ Recent Pages', description: 'Quick access to recently viewed' },
    { name: '✅ Page History', description: 'Version tracking (10 versions saved)' },
    { name: '✅ Favorites', description: 'Star important pages' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Keyboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Help & Shortcuts</h2>
              <p className="text-sm text-muted-foreground">Learn how to use all features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)] grid md:grid-cols-2 gap-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Command className="w-5 h-5 text-primary" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <kbd
                        key={i}
                        className="px-2 py-1 bg-secondary rounded text-xs font-medium"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Available Features
            </h3>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <h4 className="text-sm font-medium mb-1">{feature.name}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
