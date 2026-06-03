import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function TocView({ editor }: NodeViewProps) {
  // Gather headings from the editor doc
  const headings: { level: number; text: string; id: string }[] = [];
  try {
    const doc = editor.state.doc;
    doc.forEach((node) => {
      if (node.type.name === 'heading') {
        const text = node.textContent;
        if (text) {
          headings.push({
            level: (node.attrs as { level: number }).level,
            text,
            id: text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          });
        }
      }
    });
  } catch { /* ignore */ }

  const scrollTo = (text: string) => {
    const pm = document.querySelector('.ProseMirror');
    if (!pm) return;
    const headingEls = pm.querySelectorAll('h1, h2, h3');
    const target = Array.from(headingEls).find((el) => el.textContent?.trim() === text);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <NodeViewWrapper>
      <div className="toc-block" contentEditable={false}>
        <div className="toc-block-title">📑 Table of contents</div>
        {headings.length === 0 ? (
          <div className="toc-empty">Add headings to your page to build a table of contents.</div>
        ) : (
          <ul className="toc-list">
            {headings.map((h, i) => (
              <li
                key={i}
                className={`toc-item toc-h${h.level}`}
                style={{ paddingLeft: (h.level - 1) * 16 }}
                onClick={() => scrollTo(h.text)}
              >
                {h.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </NodeViewWrapper>
  );
}
