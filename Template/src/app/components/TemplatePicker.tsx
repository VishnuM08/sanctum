import { useState } from 'react';
import { PAGE_TEMPLATES, PageTemplate } from '../utils/templates';
import { X, FileText, Briefcase, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface TemplatePickerProps {
  onSelect: (template: PageTemplate) => void;
  onClose: () => void;
}

const CATEGORY_ICONS = {
  productivity: FileText,
  work: Briefcase,
  personal: User,
  creative: Sparkles,
};

const CATEGORY_LABELS = {
  productivity: 'Productivity',
  work: 'Work',
  personal: 'Personal',
  creative: 'Creative',
};

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(PAGE_TEMPLATES.map(t => t.category)));
  const filteredTemplates = selectedCategory
    ? PAGE_TEMPLATES.filter(t => t.category === selectedCategory)
    : PAGE_TEMPLATES;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Choose a Template</h2>
              <p className="text-sm text-muted-foreground mt-1">Start with a pre-built structure</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              All Templates
            </button>
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template, index) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="p-5 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-accent/50 transition-all text-left group animate-in slide-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg bg-secondary text-secondary-foreground">
                    {template.blocks.length} blocks
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">
                    {CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
