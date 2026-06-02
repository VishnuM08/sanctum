import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Block, BlockType, CalloutType } from '../types/blocks';
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, ChevronRight, Quote, Minus, AlertCircle,
  Code, Image as ImageIcon, Trash2, Copy, GripVertical,
  Info, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { clsx } from 'clsx';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  autoFocus?: boolean;
}

const BLOCK_TYPES = [
  { type: 'text' as BlockType, label: 'Text', icon: Type, description: 'Plain text' },
  { type: 'h1' as BlockType, label: 'Heading 1', icon: Heading1, description: 'Large heading' },
  { type: 'h2' as BlockType, label: 'Heading 2', icon: Heading2, description: 'Medium heading' },
  { type: 'h3' as BlockType, label: 'Heading 3', icon: Heading3, description: 'Small heading' },
  { type: 'bullet' as BlockType, label: 'Bullet List', icon: List, description: 'Bulleted list' },
  { type: 'numbered' as BlockType, label: 'Numbered List', icon: ListOrdered, description: 'Numbered list' },
  { type: 'todo' as BlockType, label: 'To-do', icon: CheckSquare, description: 'Checkbox list' },
  { type: 'toggle' as BlockType, label: 'Toggle', icon: ChevronRight, description: 'Collapsible section' },
  { type: 'quote' as BlockType, label: 'Quote', icon: Quote, description: 'Block quote' },
  { type: 'divider' as BlockType, label: 'Divider', icon: Minus, description: 'Visual separator' },
  { type: 'callout' as BlockType, label: 'Callout', icon: AlertCircle, description: 'Highlighted box' },
  { type: 'code' as BlockType, label: 'Code', icon: Code, description: 'Code block' },
  { type: 'image' as BlockType, label: 'Image', icon: ImageIcon, description: 'Embed image' },
];

const CALLOUT_ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

export function BlockEditor({ blocks, onChange, autoFocus = false }: BlockEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState<number | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [draggedBlock, setDraggedBlock] = useState<number | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLTextAreaElement | HTMLInputElement | null }>({});

  const filteredBlockTypes = BLOCK_TYPES.filter(bt =>
    bt.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const updateBlock = (index: number, updates: Partial<Block>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    onChange(newBlocks.length > 0 ? newBlocks : [createEmptyBlock()]);
  };

  const duplicateBlock = (index: number) => {
    const newBlocks = [...blocks];
    const blockToCopy = { ...blocks[index], id: generateId() };
    newBlocks.splice(index + 1, 0, blockToCopy);
    onChange(newBlocks);
  };

  const createEmptyBlock = (type: BlockType = 'text'): Block => ({
    id: generateId(),
    type,
    content: '',
    ...(type === 'todo' && { checked: false }),
    ...(type === 'toggle' && { collapsed: false }),
    ...(type === 'callout' && { calloutType: 'info' as CalloutType }),
    ...(type === 'code' && { language: 'javascript' }),
  });

  const addBlock = (index: number, type: BlockType = 'text') => {
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, createEmptyBlock(type));
    onChange(newBlocks);
    setTimeout(() => {
      const nextBlock = newBlocks[index + 1];
      inputRefs.current[nextBlock.id]?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    const block = blocks[index];

    if (e.key === 'Enter' && !e.shiftKey) {
      if (showSlashMenu !== null) return;
      if (block.type === 'divider') return;

      e.preventDefault();
      addBlock(index);
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(index);
      if (index > 0) {
        inputRefs.current[blocks[index - 1].id]?.focus();
      }
    }

    if (e.key === '/' && block.content === '') {
      setShowSlashMenu(index);
      setSlashFilter('');
    }
  };

  const handleContentChange = (index: number, content: string) => {
    if (content.startsWith('/') && showSlashMenu === index) {
      setSlashFilter(content.slice(1));
    } else if (showSlashMenu === index && !content.startsWith('/')) {
      setShowSlashMenu(null);
    }
    updateBlock(index, { content });
  };

  const selectBlockType = (index: number, type: BlockType) => {
    updateBlock(index, { type, content: '' });
    setShowSlashMenu(null);
    setSlashFilter('');
    setTimeout(() => {
      inputRefs.current[blocks[index].id]?.focus();
    }, 0);
  };

  const handleDragStart = (index: number) => {
    setDraggedBlock(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlock === null || draggedBlock === index) return;

    const newBlocks = [...blocks];
    const draggedItem = newBlocks[draggedBlock];
    newBlocks.splice(draggedBlock, 1);
    newBlocks.splice(index, 0, draggedItem);
    onChange(newBlocks);
    setDraggedBlock(index);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  const cycleCalloutType = (index: number) => {
    const block = blocks[index];
    const types: CalloutType[] = ['info', 'warning', 'success', 'error'];
    const currentIndex = types.indexOf(block.calloutType || 'info');
    const nextType = types[(currentIndex + 1) % types.length];
    updateBlock(index, { calloutType: nextType });
  };

  const renderBlock = (block: Block, index: number) => {
    const commonClasses = "w-full bg-transparent resize-none outline-none";

    switch (block.type) {
      case 'h1':
        return (
          <input
            ref={el => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={e => handleContentChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            placeholder="Heading 1"
            className={clsx(commonClasses, "text-4xl font-bold")}
          />
        );

      case 'h2':
        return (
          <input
            ref={el => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={e => handleContentChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            placeholder="Heading 2"
            className={clsx(commonClasses, "text-3xl font-bold")}
          />
        );

      case 'h3':
        return (
          <input
            ref={el => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={e => handleContentChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            placeholder="Heading 3"
            className={clsx(commonClasses, "text-2xl font-bold")}
          />
        );

      case 'bullet':
        return (
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2.5 flex-shrink-0" />
            <textarea
              ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
              value={block.content}
              onChange={e => handleContentChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="List item"
              className={clsx(commonClasses, "flex-1")}
              rows={1}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'numbered':
        return (
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground mt-0.5 flex-shrink-0">{index + 1}.</span>
            <textarea
              ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
              value={block.content}
              onChange={e => handleContentChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="List item"
              className={clsx(commonClasses, "flex-1")}
              rows={1}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'todo':
        return (
          <div className="flex items-start gap-3">
            <button
              onClick={() => updateBlock(index, { checked: !block.checked })}
              className="mt-1 flex-shrink-0"
            >
              <CheckSquare className={clsx("w-5 h-5", block.checked ? "text-primary" : "text-muted-foreground")} />
            </button>
            <textarea
              ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
              value={block.content}
              onChange={e => handleContentChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="To-do"
              className={clsx(commonClasses, "flex-1", block.checked && "line-through text-muted-foreground")}
              rows={1}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'toggle':
        return (
          <div>
            <div className="flex items-start gap-2">
              <button
                onClick={() => updateBlock(index, { collapsed: !block.collapsed })}
                className="mt-1 flex-shrink-0"
              >
                <ChevronRight className={clsx("w-5 h-5 text-muted-foreground transition-transform", !block.collapsed && "rotate-90")} />
              </button>
              <textarea
                ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
                value={block.content}
                onChange={e => handleContentChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(e, index)}
                placeholder="Toggle"
                className={clsx(commonClasses, "flex-1 font-medium")}
                rows={1}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-primary pl-4 py-2">
            <textarea
              ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
              value={block.content}
              onChange={e => handleContentChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="Quote"
              className={clsx(commonClasses, "italic text-muted-foreground")}
              rows={1}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'divider':
        return <div className="w-full h-px bg-border my-2" />;

      case 'callout':
        const CalloutIcon = CALLOUT_ICONS[block.calloutType || 'info'];
        const calloutColors = {
          info: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
          warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
          success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
          error: 'bg-red-500/10 border-red-500/20 text-red-600',
        };
        return (
          <div className={clsx("p-4 rounded-xl border-2 flex items-start gap-3", calloutColors[block.calloutType || 'info'])}>
            <button onClick={() => cycleCalloutType(index)} className="flex-shrink-0 mt-0.5">
              <CalloutIcon className="w-5 h-5" />
            </button>
            <textarea
              ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
              value={block.content}
              onChange={e => handleContentChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="Callout text"
              className={clsx(commonClasses, "flex-1")}
              rows={1}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'code':
        return (
          <div className="bg-muted/50 rounded-xl p-4 font-mono text-sm">
            <textarea
              ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
              value={block.content}
              onChange={e => handleContentChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="// Code"
              className={clsx(commonClasses, "font-mono")}
              rows={3}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {block.imageUrl ? (
              <img src={block.imageUrl} alt="Block" className="w-full rounded-xl" />
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Enter image URL</p>
              </div>
            )}
            <input
              ref={el => inputRefs.current[block.id] = el}
              type="text"
              value={block.imageUrl || ''}
              onChange={e => updateBlock(index, { imageUrl: e.target.value })}
              onKeyDown={e => handleKeyDown(e, index)}
              placeholder="Paste image URL"
              className={clsx(commonClasses, "text-sm")}
            />
          </div>
        );

      default:
        return (
          <textarea
            ref={el => inputRefs.current[block.id] = el as HTMLTextAreaElement}
            value={block.content}
            onChange={e => handleContentChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            placeholder="Type '/' for commands"
            className={commonClasses}
            rows={1}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        );
    }
  };

  useEffect(() => {
    if (autoFocus && blocks.length > 0) {
      inputRefs.current[blocks[0].id]?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={clsx(
            "group relative",
            draggedBlock === index && "opacity-50"
          )}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={e => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-2">
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-1 flex-shrink-0"
              onMouseDown={e => e.preventDefault()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex-1 min-w-0">
              {renderBlock(block, index)}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
              <button
                onClick={() => duplicateBlock(index)}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                title="Duplicate"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => deleteBlock(index)}
                className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>

          {/* Slash Command Menu */}
          {showSlashMenu === index && (
            <div className="absolute left-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-3 py-2">BLOCKS</p>
                {filteredBlockTypes.map(bt => {
                  const Icon = bt.icon;
                  return (
                    <button
                      key={bt.type}
                      onClick={() => selectBlockType(index, bt.type)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{bt.label}</p>
                        <p className="text-xs text-muted-foreground">{bt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
