import { useEffect, useRef, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { BlockMenu } from './BlockMenu';

interface HandlePos {
  top: number;
  left: number;
  blockPos: number;
  blockHeight: number;
  blockEl: HTMLElement;
}

interface DropLine {
  top: number;
  left: number;
  width: number;
}

interface Props {
  editor: Editor | null;
  scrollContainer: HTMLElement | null;
}

const DRAG_KEY = 'application/pm-block-json';

export function DragHandle({ editor, scrollContainer }: Props) {
  const [pos,      setPos]      = useState<HandlePos | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropLine, setDropLine] = useState<DropLine | null>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ from: number; to: number; nodeSize: number } | null>(null);

  const getContainer = useCallback(() => {
    if (!editor) return null;
    return editor.view.dom.closest('.page-container') as HTMLElement | null;
  }, [editor]);

  const findBlock = useCallback((clientY: number): HTMLElement | null => {
    if (!editor) return null;
    const editorEl = editor.view.dom as HTMLElement;
    for (const child of Array.from(editorEl.children)) {
      const r = child.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return child as HTMLElement;
    }
    return null;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const view = editor.view;
    const editorEl = view.dom as HTMLElement;
    const container = editorEl.closest('.page-container') as HTMLElement | null;
    if (!container) return;
    container.style.position = 'relative';

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const block = findBlock(e.clientY);
        if (!block) { setPos(null); return; }
        const br = block.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        try {
          const blockPos = view.posAtDOM(block, 0);
          setPos({ top: br.top - cr.top, left: br.left - cr.left, blockPos, blockHeight: br.height, blockEl: block });
        } catch { setPos(null); }
      });
    };
    const onLeave = () => { if (!menuOpen) setPos(null); };
    const onScroll = () => { if (!menuOpen) setPos(null); };

    // ── Drop handler on editor ─────────────────────────────────────────────
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes(DRAG_KEY)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const container2 = getContainer();
      if (!container2) return;
      const block = findBlock(e.clientY);
      if (block) {
        const br = block.getBoundingClientRect();
        const cr = container2.getBoundingClientRect();
        const isBottom = e.clientY > br.top + br.height / 2;
        setDropLine({
          top: (isBottom ? br.bottom : br.top) - cr.top,
          left: br.left - cr.left,
          width: br.width,
        });
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDropLine(null);
      const data = e.dataTransfer?.getData(DRAG_KEY);
      if (!data || !draggingRef.current) return;
      try {
        const { nodeJson, from, nodeSize } = JSON.parse(data);
        const targetBlock = findBlock(e.clientY);
        if (!targetBlock) return;
        let targetPos = view.posAtDOM(targetBlock, 0);
        const targetBr = targetBlock.getBoundingClientRect();
        const isBottom = e.clientY > targetBr.top + targetBr.height / 2;
        const $target = view.state.doc.resolve(targetPos);
        const nodeEnd = from + nodeSize;
        let insertAt = isBottom ? $target.after(1) : $target.before(1);
        // Adjust if inserting after the source block
        if (insertAt > from) insertAt -= nodeSize;

        const tr = view.state.tr;
        tr.delete(from, nodeEnd);
        const adjustedInsert = insertAt <= from ? insertAt : insertAt - nodeSize;
        const { schema } = view.state;
        const node = schema.nodeFromJSON(nodeJson);
        if (node) tr.insert(adjustedInsert, node);
        view.dispatch(tr);
      } catch (err) { console.warn('DnD error', err); }
      draggingRef.current = null;
    };
    const onDragLeave = () => setDropLine(null);

    editorEl.addEventListener('mousemove', onMove);
    editorEl.addEventListener('mouseleave', onLeave);
    editorEl.addEventListener('dragover', onDragOver);
    editorEl.addEventListener('drop', onDrop);
    editorEl.addEventListener('dragleave', onDragLeave);
    scrollContainer?.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      editorEl.removeEventListener('mousemove', onMove);
      editorEl.removeEventListener('mouseleave', onLeave);
      editorEl.removeEventListener('dragover', onDragOver);
      editorEl.removeEventListener('drop', onDrop);
      editorEl.removeEventListener('dragleave', onDragLeave);
      scrollContainer?.removeEventListener('scroll', onScroll);
    };
  }, [editor, scrollContainer, menuOpen, findBlock, getContainer]);

  if (!editor || !pos) return (
    <>
      {dropLine && (
        <div
          style={{
            position: 'absolute',
            top: dropLine.top - 1,
            left: dropLine.left,
            width: dropLine.width,
            height: 2,
            background: 'var(--accent)',
            borderRadius: 1,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );

  const $pos = editor.state.doc.resolve(pos.blockPos);
  const nodePos = $pos.before(1);

  const insertBelow = () => {
    const $p = editor.state.doc.resolve(pos.blockPos);
    const insertAt = $p.after(1);
    editor.chain().focus().insertContentAt(insertAt, { type: 'paragraph' }).setTextSelection(insertAt + 1).run();
    setPos(null);
  };

  const handleDragStart = (e: React.DragEvent) => {
    try {
      const { state } = editor;
      const node = state.doc.nodeAt(nodePos);
      if (!node) return;
      const json = node.toJSON();
      const payload = JSON.stringify({ nodeJson: json, from: nodePos, nodeSize: node.nodeSize });
      e.dataTransfer.setData(DRAG_KEY, payload);
      e.dataTransfer.effectAllowed = 'move';
      draggingRef.current = { from: nodePos, to: nodePos + node.nodeSize, nodeSize: node.nodeSize };
      // Ghost image
      const ghost = document.createElement('div');
      ghost.style.cssText = 'position:absolute;top:-9999px;background:var(--bg-hover);padding:8px 12px;border-radius:6px;font-size:13px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      ghost.textContent = pos.blockEl.textContent?.slice(0, 60) ?? 'Block';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 16);
      setTimeout(() => ghost.remove(), 0);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div
        ref={wrapRef}
        className="drag-handle-wrap"
        style={{ top: pos.top + Math.min(4, pos.blockHeight / 2 - 12), left: pos.left - 52 }}
      >
        <button
          className="drag-handle-btn"
          title="Add block below"
          onMouseDown={(e) => { e.preventDefault(); insertBelow(); }}
        >
          +
        </button>
        <button
          className="drag-handle-btn drag-handle-grip"
          title="Drag to reorder, click for menu"
          draggable
          onDragStart={handleDragStart}
          onMouseDown={(e) => {
            // Only open menu on click (not drag start)
            e.preventDefault();
            setMenuOpen(true);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="5" cy="3" r="1" fill="currentColor" />
            <circle cx="9" cy="3" r="1" fill="currentColor" />
            <circle cx="5" cy="7" r="1" fill="currentColor" />
            <circle cx="9" cy="7" r="1" fill="currentColor" />
            <circle cx="5" cy="11" r="1" fill="currentColor" />
            <circle cx="9" cy="11" r="1" fill="currentColor" />
          </svg>
        </button>

        {menuOpen && (
          <BlockMenu
            editor={editor}
            nodePos={nodePos}
            onClose={() => { setMenuOpen(false); setPos(null); }}
          />
        )}
      </div>

      {/* Drop insertion line */}
      {dropLine && (
        <div
          style={{
            position: 'absolute',
            top: dropLine.top - 1,
            left: dropLine.left,
            width: dropLine.width,
            height: 2,
            background: 'var(--accent)',
            borderRadius: 1,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
