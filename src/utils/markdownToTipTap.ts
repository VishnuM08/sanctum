import type { JSONContent } from '@tiptap/react';

/** Convert a Markdown string into a TipTap-compatible JSON document */
export function markdownToTipTap(md: string): JSONContent {
  const lines = md.split('\n');
  const nodes: JSONContent[] = [];
  let i = 0;

  const inlineMarks = (raw: string): JSONContent[] => {
    const parts: JSONContent[] = [];
    const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) parts.push({ type: 'text', text: raw.slice(last, m.index) });
      if (m[2]) parts.push({ type: 'text', text: m[2], marks: [{ type: 'bold' }] });
      else if (m[3]) parts.push({ type: 'text', text: m[3], marks: [{ type: 'italic' }] });
      else if (m[4]) parts.push({ type: 'text', text: m[4], marks: [{ type: 'code' }] });
      else if (m[5]) parts.push({ type: 'text', text: m[5], marks: [{ type: 'link', attrs: { href: m[6] } }] });
      last = m.index + m[0].length;
    }
    if (last < raw.length) parts.push({ type: 'text', text: raw.slice(last) });
    return parts.length ? parts : [{ type: 'text', text: raw }];
  };

  const p = (text: string): JSONContent => ({
    type: 'paragraph',
    content: inlineMarks(text),
  });

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      nodes.push({ type: 'heading', attrs: { level: hMatch[1].length }, content: inlineMarks(hMatch[2]) });
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push({ type: 'horizontalRule' });
      i++; continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({ type: 'codeBlock', attrs: { language: lang }, content: [{ type: 'text', text: codeLines.join('\n') }] });
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push({ type: 'blockquote', content: [p(line.slice(2))] });
      i++; continue;
    }

    // Task list
    const todoMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
    if (todoMatch) {
      const items: JSONContent[] = [];
      while (i < lines.length) {
        const tm = lines[i].match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
        if (!tm) break;
        items.push({ type: 'taskItem', attrs: { checked: tm[1] !== ' ' }, content: [{ type: 'paragraph', content: inlineMarks(tm[2]) }] });
        i++;
      }
      nodes.push({ type: 'taskList', content: items });
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      const items: JSONContent[] = [];
      while (i < lines.length) {
        const bm = lines[i].match(/^[-*]\s+(.*)/);
        if (!bm || lines[i].match(/^[-*]\s+\[/)) break;
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: inlineMarks(bm[1]) }] });
        i++;
      }
      nodes.push({ type: 'bulletList', content: items });
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      const items: JSONContent[] = [];
      while (i < lines.length) {
        const nm = lines[i].match(/^\d+\.\s+(.*)/);
        if (!nm) break;
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: inlineMarks(nm[1]) }] });
        i++;
      }
      nodes.push({ type: 'orderedList', content: items });
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Plain paragraph
    nodes.push(p(line));
    i++;
  }

  return { type: 'doc', content: nodes.length ? nodes : [{ type: 'paragraph' }] };
}
