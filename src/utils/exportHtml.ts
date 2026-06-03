/** Export a TipTap page to a self-contained HTML file and trigger download */
export function exportToHtml(title: string, icon: string, htmlContent: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${icon} ${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.55;
      color: #37352f;
      background: #fff;
      max-width: 900px;
      margin: 0 auto;
      padding: 60px 96px 120px;
    }
    h1 { font-size: 40px; font-weight: 700; margin: 0 0 24px; letter-spacing: -0.02em; }
    h2 { font-size: 24px; font-weight: 600; margin: 24px 0 8px; letter-spacing: -0.015em; }
    h3 { font-size: 20px; font-weight: 600; margin: 20px 0 6px; }
    p { margin: 4px 0; padding: 3px 0; }
    ul, ol { padding-left: 26px; margin: 4px 0; }
    li > p { margin: 0; padding: 2px 0; }
    blockquote { border-left: 3px solid #37352f; padding: 4px 0 4px 14px; margin: 8px 0; color: #6b6b6b; }
    hr { border: none; border-top: 1px solid #e9e9e7; margin: 16px 0; }
    code { font-family: "SFMono-Regular", Consolas, monospace; font-size: 0.875em; background: #f7f7f5; padding: 2px 5px; border-radius: 3px; color: #e03e3e; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 16px 18px; border-radius: 6px; overflow-x: auto; margin: 8px 0; font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; line-height: 1.6; }
    pre code { background: transparent; color: inherit; padding: 0; }
    a { color: #2383e2; text-decoration: underline; text-underline-offset: 2px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    td, th { border: 1px solid #e9e9e7; padding: 7px 10px; font-size: 14px; }
    th { background: #f7f7f5; font-weight: 600; }
    input[type="checkbox"] { accent-color: #2383e2; width: 15px; height: 15px; margin-right: 8px; }
    .task-item { display: flex; align-items: flex-start; gap: 8px; padding: 2px 0; }
    .task-item.done > * { text-decoration: line-through; opacity: 0.5; }
    @media (max-width: 768px) { body { padding: 24px 20px 60px; } h1 { font-size: 28px; } }
  </style>
</head>
<body>
  <h1>${icon} ${title}</h1>
  ${htmlContent}
  <footer style="margin-top:60px;padding-top:20px;border-top:1px solid #e9e9e7;font-size:12px;color:#9b9a97;">
    Exported from Notebook on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
  </footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${(title || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
