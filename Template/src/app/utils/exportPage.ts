import { NotionPage, Block } from '../types/blocks';

export function exportPageToMarkdown(page: NotionPage): string {
  let markdown = '';

  // Title
  markdown += `# ${page.title}\n\n`;

  // Metadata
  markdown += `*Created: ${new Date(page.createdAt).toLocaleDateString()}*\n`;
  markdown += `*Updated: ${new Date(page.updatedAt).toLocaleDateString()}*\n\n`;

  if (page.tags && page.tags.length > 0) {
    markdown += `Tags: ${page.tags.map(t => `#${t}`).join(' ')}\n\n`;
  }

  markdown += '---\n\n';

  // Blocks
  page.blocks.forEach(block => {
    markdown += blockToMarkdown(block);
  });

  return markdown;
}

function blockToMarkdown(block: Block): string {
  switch (block.type) {
    case 'h1':
      return `# ${block.content}\n\n`;
    case 'h2':
      return `## ${block.content}\n\n`;
    case 'h3':
      return `### ${block.content}\n\n`;
    case 'bullet':
      return `- ${block.content}\n`;
    case 'numbered':
      return `1. ${block.content}\n`;
    case 'todo':
      return `- [${block.checked ? 'x' : ' '}] ${block.content}\n`;
    case 'quote':
      return `> ${block.content}\n\n`;
    case 'code':
      return `\`\`\`${block.language || ''}\n${block.content}\n\`\`\`\n\n`;
    case 'divider':
      return '---\n\n';
    case 'callout':
      return `> **${block.calloutType?.toUpperCase()}:** ${block.content}\n\n`;
    case 'image':
      return `![Image](${block.imageUrl})\n\n`;
    case 'toggle':
      return `<details>\n<summary>${block.content}</summary>\n\n</details>\n\n`;
    case 'text':
    default:
      return `${block.content}\n\n`;
  }
}

export function downloadMarkdown(page: NotionPage) {
  const markdown = exportPageToMarkdown(page);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(page.title)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAllPagesToJSON(pages: NotionPage[]): string {
  return JSON.stringify(pages, null, 2);
}

export function downloadJSON(pages: NotionPage[], filename = 'pages-backup.json') {
  const json = exportAllPagesToJSON(pages);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    || 'untitled';
}
