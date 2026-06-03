import type { JSONContent } from '@tiptap/react';

function marks(text: string, nodeMarks: JSONContent['marks']): string {
  if (!nodeMarks) return text;
  let t = text;
  for (const mark of nodeMarks) {
    switch (mark.type) {
      case 'bold':      t = `**${t}**`; break;
      case 'italic':    t = `*${t}*`; break;
      case 'underline': t = `<u>${t}</u>`; break;
      case 'strike':    t = `~~${t}~~`; break;
      case 'code':      t = `\`${t}\``; break;
      case 'link':      t = `[${t}](${mark.attrs?.href ?? ''})`; break;
    }
  }
  return t;
}

function node(n: JSONContent, indent = 0): string {
  const ch = () => n.content?.map((c) => node(c, indent)).join('') ?? '';
  const pad = '  '.repeat(indent);

  switch (n.type) {
    case 'doc':          return (n.content?.map((c) => node(c, indent)).join('\n') ?? '').trimEnd() + '\n';
    case 'paragraph':    return ch() + '\n';
    case 'hardBreak':    return '\n';
    case 'text':         return marks(n.text ?? '', n.marks);
    case 'heading': {
      const level = (n.attrs as { level: number })?.level ?? 1;
      return '#'.repeat(level) + ' ' + ch() + '\n';
    }
    case 'bulletList':
      return (n.content?.map((li) => `${pad}- ${node(li, indent + 1).trim()}`).join('\n') ?? '') + '\n';
    case 'orderedList':
      return (n.content?.map((li, i) => `${pad}${i + 1}. ${node(li, indent + 1).trim()}`).join('\n') ?? '') + '\n';
    case 'listItem':
      return n.content?.map((c) => node(c, indent)).join('').trim() ?? '';
    case 'taskList':
      return (n.content?.map((li) => {
        const checked = (li.attrs as { checked: boolean })?.checked ? 'x' : ' ';
        return `${pad}- [${checked}] ${node(li, indent + 1).trim()}`;
      }).join('\n') ?? '') + '\n';
    case 'taskItem':
      return n.content?.map((c) => node(c, indent)).join('').trim() ?? '';
    case 'blockquote':
      return ch().split('\n').map((l) => `> ${l}`).join('\n') + '\n';
    case 'codeBlock': {
      const lang = (n.attrs as { language?: string })?.language ?? '';
      return `\`\`\`${lang}\n${ch()}\`\`\`\n`;
    }
    case 'horizontalRule': return '---\n';
    case 'table':
      return nodeTable(n) + '\n';
    default:
      return ch();
  }
}

function nodeTable(n: JSONContent): string {
  const rows = n.content ?? [];
  const lines: string[] = [];
  rows.forEach((row, ri) => {
    const cells = (row.content ?? []).map((cell) =>
      node(cell).trim().replace(/\n/g, ' '),
    );
    lines.push('| ' + cells.join(' | ') + ' |');
    if (ri === 0) {
      lines.push('|' + cells.map(() => ' --- ').join('|') + '|');
    }
  });
  return lines.join('\n');
}

export function exportToMarkdown(title: string, icon: string, content: unknown): string {
  const header = icon ? `${icon} ${title}\n${'='.repeat(title.length + 3)}\n\n` : `# ${title}\n\n`;
  if (!content) return header;
  try {
    return header + node(content as JSONContent);
  } catch {
    return header + '*(could not export content)*\n';
  }
}

export function downloadMarkdown(title: string, icon: string, content: unknown): void {
  const md = exportToMarkdown(title, icon, content);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
