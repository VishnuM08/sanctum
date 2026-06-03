# Notebook 2.0

A pixel-faithful **Notion-style workspace** built as a single-page React app — notes, databases, a calendar, an encrypted vault, an AI assistant, and 36 templates. Everything runs client-side and persists to the browser.

> Frontend prototype. All data lives in `localStorage`; there is no backend (yet).

## ✨ Features

### Editor
- Block editor (TipTap) with a `/` slash menu and 14 block types
- Headings, lists, to-dos, toggles, callouts, quotes, dividers
- Code blocks with syntax highlighting, image blocks, tables, table of contents
- `@mentions` to link pages (with hover preview), drag-to-reorder blocks
- Inline formatting bubble menu, find-in-page (Ctrl+F), word count & reading time

### Databases (5 views)
- **Table** (inline editing, column resize & rename, add-property dialog)
- **Board** (kanban with drag-and-drop)
- **Gallery**, **List**, and **Calendar**
- Working filters, multi-level sorts, row detail modal

### Workspace
- Nested page tree with drag-to-reorder at every level
- Favorites, recently visited, private & shared sections, full-text-ish search (Cmd+K)
- Workspace-wide **Master Calendar** aggregating every dated database item
- **36 templates** across Work / School / Life / Project Management
- Cover images, emoji picker, version history, backlinks
- Export to **Markdown** and **HTML**, import from Markdown

### 🔒 Encrypted Vault
- Real **AES-256-GCM** encryption via the Web Crypto API
- Master password → PBKDF2 (210k iterations) → a non-extractable key held only in memory
- Encrypted blobs are all that ever touch `localStorage`; auto-locks on inactivity
- Built-in crypto password generator + strength meter

### Polish
- Landing page with (simulated) Google sign-in
- Dark mode (system-aware), zen mode, keyboard-shortcut overlay, content density
- Spring animations, scroll-reveal, toast notifications, mobile-responsive layout

## 🛠 Tech Stack

| | |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| State | Zustand (with `persist`) |
| Editor | TipTap / ProseMirror |
| Drag & drop | @dnd-kit |
| Icons | Lucide React |
| Dates | date-fns |
| Crypto | Web Crypto API (`crypto.subtle`) |

## 🚀 Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## 📦 Notes & limitations

- **Storage:** everything is in `localStorage` — no sync, no multi-device, and subject to the browser's storage quota.
- **Auth:** the Google sign-in is *simulated* (no real OAuth) — it's a UI prototype.
- **AI:** the assistant runs in demo mode unless you add your own Anthropic API key in Settings → Connections.

## License

MIT
