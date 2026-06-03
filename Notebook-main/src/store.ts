import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  Page, Database, Workspace, UserProfile, AppSettings,
  AppView, SettingsSection, DatabaseCellValue, InboxItem, PageSnapshot,
  VaultEntry, EncryptedVaultEntry, VaultMeta,
} from './types';
import {
  deriveKey, generateSalt, makeVerifier, checkVerifier,
  encryptString, decryptString,
} from './utils/vaultCrypto';

/**
 * The derived AES key lives ONLY in this module-level variable — never in the
 * persisted store, never in localStorage. On reload it's gone and the vault
 * locks automatically.
 */
let vaultKey: CryptoKey | null = null;

// ── Seed helpers ──────────────────────────────────────────────────────────────

function makePage(overrides: Partial<Page> & { id?: string }): Page {
  return {
    id: overrides.id ?? nanoid(),
    title: '',
    icon: '📄',
    content: null,
    parentId: null,
    children: [],
    isExpanded: false,
    isFavorite: false,
    isDeleted: false,
    isPublished: false,
    isLocked: false,
    isPrivate: false,
    font: 'default',
    isFullWidth: false,
    isSmallText: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function seedInboxItems(gettingStartedId: string, websiteId: string): InboxItem[] {
  const now = Date.now();
  return [
    { id: nanoid(), type: 'reminder',  title: 'Redesign homepage due today',             pageId: websiteId,       time: now - 1_800_000, read: false },
    { id: nanoid(), type: 'mention',   title: 'Bob mentioned you in "Fix login bug"',     pageId: websiteId,       time: now - 3_600_000, read: false },
    { id: nanoid(), type: 'edit',      title: 'Getting Started was updated',               pageId: gettingStartedId,time: now - 7_200_000, read: false },
    { id: nanoid(), type: 'reminder',  title: 'Performance audit due in 2 days',           pageId: websiteId,       time: now - 10_000_000, read: true },
    { id: nanoid(), type: 'comment',   title: 'Alice commented on Project Brief',           pageId: gettingStartedId,time: now - 14_400_000, read: true },
  ];
}

function makeDatabase(overrides: Partial<Database> & Pick<Database, 'title' | 'properties' | 'rows'>): Database {
  const tableViewId = nanoid();
  return {
    id: nanoid(),
    icon: '🗄️',
    views: [
      { id: tableViewId, name: 'Table', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Board', type: 'board', groupByPropertyId: undefined, sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Gallery', type: 'gallery', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'List', type: 'list', sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    activeViewId: tableViewId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function row(values: Record<string, DatabaseCellValue>, order: number): Database['rows'][0] {
  return { id: nanoid(), values, order };
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

function buildSeedData() {
  // IDs
  const gettingStartedId = nanoid();
  const quickStartId = nanoid();
  const shortcutsId = nanoid();
  const projectsId = nanoid();
  const websiteId = nanoid();
  const marketingId = nanoid();
  const personalId = nanoid();
  const readingId = nanoid();
  const goalsId = nanoid();

  // DB IDs
  const taskDbId = nanoid();
  const sprintDbId = nanoid();
  const bookDbId = nanoid();

  // DB property IDs for tasks
  const taskStatusPropId = nanoid();
  const taskPriorityPropId = nanoid();
  const taskDuePropId = nanoid();
  const taskAssigneePropId = nanoid();
  const taskTagsPropId = nanoid();
  const taskProgressPropId = nanoid();

  // DB property IDs for sprint
  const sprintStatusPropId = nanoid();
  const sprintPriorityPropId = nanoid();
  const sprintAssigneePropId = nanoid();

  // DB property IDs for books
  const bookAuthorPropId = nanoid();
  const bookGenrePropId = nanoid();
  const bookRatingPropId = nanoid();
  const bookReadPropId = nanoid();
  const bookNotesPropId = nanoid();

  const gettingStartedContent = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Welcome to Notebook 2.0 👋' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Your all-in-one workspace for notes, tasks, and databases. Explore the sidebar or create a new page to get started.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Key features' }] },
      {
        type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich text editor with slash commands (type /)' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested pages and page hierarchy' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Databases: Table, Board, Gallery, List views' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dark mode with system preference detection' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quick search with Cmd+K' }] }] },
        ],
      },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Getting started checklist' }] },
      {
        type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create your first page' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Try the slash command (type / on a new line)' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Open a database and add a row' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enable dark mode in Settings' }] }] },
        ],
      },
      {
        type: 'blockquote', content: [{
          type: 'paragraph', content: [
            { type: 'text', text: '💡 Pro tip: Press ' },
            { type: 'text', text: 'Cmd+K', marks: [{ type: 'code' }] },
            { type: 'text', text: ' to quickly search and navigate.' },
          ],
        }],
      },
      { type: 'horizontalRule' },
      { type: 'paragraph', content: [{ type: 'text', text: 'Happy writing! ✨' }] },
    ],
  };

  const websiteContent = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Website Redesign Project' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Complete redesign of the marketing website with modern design system and improved performance.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Goals' }] },
      {
        type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Improve page load speed by 40%' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Modernize visual design' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add dark mode support' }] }] },
        ],
      },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Timeline' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Q1 2025: Design system • Q2 2025: Development • Q3 2025: Launch' }] },
    ],
  };

  const pages: Page[] = [
    makePage({
      id: gettingStartedId,
      title: 'Getting Started',
      icon: '👋',
      content: gettingStartedContent,
      isFavorite: true,
      isExpanded: true,
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 50 },
      children: [quickStartId, shortcutsId],
    }),
    makePage({
      id: quickStartId,
      title: 'Quick Start Guide',
      icon: '🚀',
      parentId: gettingStartedId,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quick Start Guide' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Start writing anywhere on the page. Use the slash (/) command to insert blocks.' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Block types available' }] },
          {
            type: 'numberedList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Text — plain paragraph text' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Heading 1, 2, 3 — section headers' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet list and Numbered list' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'To-do list — checkboxes' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Toggle — collapsible content' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Callout — highlighted note' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Code — syntax highlighted code block' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote — blockquote' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Divider — horizontal rule' }] }] },
            ],
          },
        ],
      },
    }),
    makePage({
      id: shortcutsId,
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      parentId: gettingStartedId,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Keyboard Shortcuts' }] },
          {
            type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Cmd+K' }, { type: 'text', text: ' — Search / Quick navigation' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Cmd+B' }, { type: 'text', text: ' — Bold text' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Cmd+I' }, { type: 'text', text: ' — Italic text' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Cmd+U' }, { type: 'text', text: ' — Underline text' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '/' }, { type: 'text', text: ' — Open slash command menu' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Tab' }, { type: 'text', text: ' — Indent list item' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Shift+Tab' }, { type: 'text', text: ' — Outdent list item' }] }] },
            ],
          },
        ],
      },
    }),
    makePage({
      id: projectsId,
      title: 'My Projects',
      icon: '📁',
      isExpanded: true,
      isFavorite: true,
      children: [websiteId, marketingId],
    }),
    makePage({
      id: websiteId,
      title: 'Website Redesign',
      icon: '🌐',
      parentId: projectsId,
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', position: 50 },
      content: websiteContent,
      databaseId: taskDbId,
    }),
    makePage({
      id: marketingId,
      title: 'Marketing Campaign',
      icon: '📣',
      parentId: projectsId,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Q1 Marketing Campaign' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Launch campaign for the new product release targeting enterprise customers.' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Channels' }] },
          {
            type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Email campaign setup' }] }] },
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Social media calendar' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Paid ads configuration' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Influencer outreach' }] }] },
            ],
          },
        ],
      },
    }),
    makePage({
      id: personalId,
      title: 'Personal',
      icon: '🏠',
      isExpanded: true,
      children: [readingId, goalsId],
    }),
    makePage({
      id: readingId,
      title: 'Reading List',
      icon: '📚',
      parentId: personalId,
      databaseId: bookDbId,
    }),
    makePage({
      id: goalsId,
      title: 'Goals 2025',
      icon: '🎯',
      parentId: personalId,
      isFavorite: true,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2025 Goals' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🏃 Health & Fitness' }] },
          {
            type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Run a 5K under 25 minutes' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Meditate 10 minutes daily' }] }] },
            ],
          },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '💻 Professional' }] },
          {
            type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Launch side project' }] }] },
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Learn TypeScript deeply' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write 12 blog posts' }] }] },
            ],
          },
        ],
      },
    }),
  ];

  // ── Task Database ──────────────────────────────────────────────────────────
  const taskBoardViewId = nanoid();
  const taskDb: Database = makeDatabase({
    id: taskDbId,
    title: 'Project Tasks',
    icon: '✅',
    views: [
      { id: nanoid(), name: 'All Tasks', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: taskBoardViewId, name: 'By Status', type: 'board', groupByPropertyId: taskStatusPropId, sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Calendar', type: 'calendar', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Gallery', type: 'gallery', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'List', type: 'list', sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    activeViewId: taskBoardViewId,
    properties: [
      { id: 'title', name: 'Name', type: 'title', width: 260, hidden: false },
      {
        id: taskStatusPropId, name: 'Status', type: 'select', width: 130, hidden: false,
        options: [
          { id: nanoid(), name: 'Not Started', color: 'gray' },
          { id: nanoid(), name: 'In Progress', color: 'blue' },
          { id: nanoid(), name: 'Review', color: 'yellow' },
          { id: nanoid(), name: 'Done', color: 'green' },
        ],
      },
      {
        id: taskPriorityPropId, name: 'Priority', type: 'select', width: 110, hidden: false,
        options: [
          { id: nanoid(), name: 'Low', color: 'gray' },
          { id: nanoid(), name: 'Medium', color: 'yellow' },
          { id: nanoid(), name: 'High', color: 'orange' },
          { id: nanoid(), name: 'Urgent', color: 'red' },
        ],
      },
      { id: taskDuePropId, name: 'Due Date', type: 'date', width: 130, hidden: false },
      { id: taskAssigneePropId, name: 'Assignee', type: 'text', width: 110, hidden: false },
      {
        id: taskTagsPropId, name: 'Tags', type: 'multiSelect', width: 180, hidden: false,
        options: [
          { id: nanoid(), name: 'Frontend', color: 'blue' },
          { id: nanoid(), name: 'Backend', color: 'purple' },
          { id: nanoid(), name: 'Design', color: 'pink' },
          { id: nanoid(), name: 'QA', color: 'green' },
          { id: nanoid(), name: 'DevOps', color: 'orange' },
        ],
      },
      { id: taskProgressPropId, name: 'Progress', type: 'number', width: 90, hidden: false },
    ],
    rows: [
      row({ title: 'Redesign homepage', [taskStatusPropId]: 'In Progress', [taskPriorityPropId]: 'High', [taskDuePropId]: '2025-02-15', [taskAssigneePropId]: 'Alice', [taskTagsPropId]: ['Frontend', 'Design'], [taskProgressPropId]: 60 }, 0),
      row({ title: 'Fix login bug', [taskStatusPropId]: 'Done', [taskPriorityPropId]: 'Urgent', [taskDuePropId]: '2025-01-30', [taskAssigneePropId]: 'Bob', [taskTagsPropId]: ['Backend', 'QA'], [taskProgressPropId]: 100 }, 1),
      row({ title: 'Add OAuth support', [taskStatusPropId]: 'In Progress', [taskPriorityPropId]: 'High', [taskDuePropId]: '2025-02-20', [taskAssigneePropId]: 'Charlie', [taskTagsPropId]: ['Backend'], [taskProgressPropId]: 40 }, 2),
      row({ title: 'Update documentation', [taskStatusPropId]: 'Not Started', [taskPriorityPropId]: 'Low', [taskDuePropId]: '2025-03-01', [taskAssigneePropId]: 'Diana', [taskTagsPropId]: [], [taskProgressPropId]: 0 }, 3),
      row({ title: 'Database optimization', [taskStatusPropId]: 'Review', [taskPriorityPropId]: 'Medium', [taskDuePropId]: '2025-02-10', [taskAssigneePropId]: 'Bob', [taskTagsPropId]: ['Backend', 'DevOps'], [taskProgressPropId]: 85 }, 4),
      row({ title: 'Mobile responsive fixes', [taskStatusPropId]: 'In Progress', [taskPriorityPropId]: 'High', [taskDuePropId]: '2025-02-18', [taskAssigneePropId]: 'Alice', [taskTagsPropId]: ['Frontend'], [taskProgressPropId]: 55 }, 5),
      row({ title: 'Email notifications', [taskStatusPropId]: 'Not Started', [taskPriorityPropId]: 'Medium', [taskDuePropId]: '2025-03-10', [taskAssigneePropId]: 'Charlie', [taskTagsPropId]: ['Backend'], [taskProgressPropId]: 0 }, 6),
      row({ title: 'Analytics dashboard', [taskStatusPropId]: 'In Progress', [taskPriorityPropId]: 'Medium', [taskDuePropId]: '2025-02-22', [taskAssigneePropId]: 'Diana', [taskTagsPropId]: ['Frontend'], [taskProgressPropId]: 30 }, 7),
      row({ title: 'CI/CD pipeline setup', [taskStatusPropId]: 'Done', [taskPriorityPropId]: 'High', [taskDuePropId]: '2025-01-25', [taskAssigneePropId]: 'Eve', [taskTagsPropId]: ['DevOps'], [taskProgressPropId]: 100 }, 8),
      row({ title: 'API rate limiting', [taskStatusPropId]: 'Review', [taskPriorityPropId]: 'Medium', [taskDuePropId]: '2025-02-12', [taskAssigneePropId]: 'Bob', [taskTagsPropId]: ['Backend'], [taskProgressPropId]: 90 }, 9),
      row({ title: 'Dark mode implementation', [taskStatusPropId]: 'Done', [taskPriorityPropId]: 'Low', [taskDuePropId]: '2025-01-20', [taskAssigneePropId]: 'Alice', [taskTagsPropId]: ['Frontend', 'Design'], [taskProgressPropId]: 100 }, 10),
      row({ title: 'Performance audit', [taskStatusPropId]: 'Not Started', [taskPriorityPropId]: 'High', [taskDuePropId]: '2025-03-05', [taskAssigneePropId]: 'Charlie', [taskTagsPropId]: ['Frontend', 'Backend'], [taskProgressPropId]: 0 }, 11),
    ],
  });

  // ── Sprint Board Database ──────────────────────────────────────────────────
  const sprintBoardViewId = nanoid();
  const sprintDuePropId = nanoid();
  const sprintDb: Database = makeDatabase({
    id: sprintDbId,
    title: 'Sprint Board',
    icon: '🏃',
    views: [
      { id: nanoid(), name: 'Table', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: sprintBoardViewId, name: 'Board', type: 'board', groupByPropertyId: sprintStatusPropId, sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Calendar', type: 'calendar', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'List', type: 'list', sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    activeViewId: sprintBoardViewId,
    properties: [
      { id: 'title', name: 'Task', type: 'title', width: 240, hidden: false },
      {
        id: sprintStatusPropId, name: 'Status', type: 'select', width: 130, hidden: false,
        options: [
          { id: nanoid(), name: 'Backlog', color: 'gray' },
          { id: nanoid(), name: 'To Do', color: 'blue' },
          { id: nanoid(), name: 'In Progress', color: 'yellow' },
          { id: nanoid(), name: 'Done', color: 'green' },
        ],
      },
      {
        id: sprintPriorityPropId, name: 'Priority', type: 'select', width: 110, hidden: false,
        options: [
          { id: nanoid(), name: 'Low', color: 'gray' },
          { id: nanoid(), name: 'Medium', color: 'yellow' },
          { id: nanoid(), name: 'High', color: 'red' },
        ],
      },
      { id: sprintAssigneePropId, name: 'Assignee', type: 'text', width: 110, hidden: false },
      { id: sprintDuePropId, name: 'Due Date', type: 'date', width: 120, hidden: false },
    ],
    rows: [
      row({ title: 'Explore new frameworks', [sprintStatusPropId]: 'Backlog', [sprintPriorityPropId]: 'Low', [sprintAssigneePropId]: '', [sprintDuePropId]: '2025-02-28' }, 0),
      row({ title: 'Research competitor features', [sprintStatusPropId]: 'Backlog', [sprintPriorityPropId]: 'Medium', [sprintAssigneePropId]: '', [sprintDuePropId]: '2025-02-28' }, 1),
      row({ title: 'Refactor auth module', [sprintStatusPropId]: 'To Do', [sprintPriorityPropId]: 'High', [sprintAssigneePropId]: 'Bob', [sprintDuePropId]: '2025-02-10' }, 2),
      row({ title: 'Add search functionality', [sprintStatusPropId]: 'To Do', [sprintPriorityPropId]: 'Medium', [sprintAssigneePropId]: 'Alice', [sprintDuePropId]: '2025-02-14' }, 3),
      row({ title: 'Write unit tests', [sprintStatusPropId]: 'To Do', [sprintPriorityPropId]: 'Medium', [sprintAssigneePropId]: 'Charlie', [sprintDuePropId]: '2025-02-17' }, 4),
      row({ title: 'Fix pagination bug', [sprintStatusPropId]: 'In Progress', [sprintPriorityPropId]: 'High', [sprintAssigneePropId]: 'Bob', [sprintDuePropId]: '2025-02-07' }, 5),
      row({ title: 'Improve loading performance', [sprintStatusPropId]: 'In Progress', [sprintPriorityPropId]: 'High', [sprintAssigneePropId]: 'Alice', [sprintDuePropId]: '2025-02-12' }, 6),
      row({ title: 'Design system updates', [sprintStatusPropId]: 'In Progress', [sprintPriorityPropId]: 'Medium', [sprintAssigneePropId]: 'Diana', [sprintDuePropId]: '2025-02-20' }, 7),
      row({ title: 'Setup monitoring', [sprintStatusPropId]: 'Done', [sprintPriorityPropId]: 'High', [sprintAssigneePropId]: 'Eve', [sprintDuePropId]: '2025-01-31' }, 8),
      row({ title: 'Deploy to staging', [sprintStatusPropId]: 'Done', [sprintPriorityPropId]: 'Medium', [sprintAssigneePropId]: 'Charlie', [sprintDuePropId]: '2025-02-03' }, 9),
    ],
  });

  // ── Book Gallery Database ──────────────────────────────────────────────────
  const bookGalleryViewId = nanoid();
  const bookDb: Database = makeDatabase({
    id: bookDbId,
    title: 'Book Collection',
    icon: '📚',
    views: [
      { id: nanoid(), name: 'Table', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: bookGalleryViewId, name: 'Gallery', type: 'gallery', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'List', type: 'list', sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    activeViewId: bookGalleryViewId,
    properties: [
      { id: 'title', name: 'Title', type: 'title', width: 240, hidden: false },
      { id: bookAuthorPropId, name: 'Author', type: 'text', width: 180, hidden: false },
      {
        id: bookGenrePropId, name: 'Genre', type: 'select', width: 120, hidden: false,
        options: [
          { id: nanoid(), name: 'Technical', color: 'blue' },
          { id: nanoid(), name: 'Sci-Fi', color: 'purple' },
          { id: nanoid(), name: 'Non-fiction', color: 'green' },
          { id: nanoid(), name: 'Biography', color: 'orange' },
          { id: nanoid(), name: 'Fiction', color: 'pink' },
        ],
      },
      { id: bookRatingPropId, name: 'Rating', type: 'number', width: 80, hidden: false },
      { id: bookReadPropId, name: 'Read', type: 'checkbox', width: 70, hidden: false },
      { id: bookNotesPropId, name: 'Notes', type: 'text', width: 220, hidden: false },
    ],
    rows: [
      row({ title: 'The Pragmatic Programmer', [bookAuthorPropId]: 'David Thomas, Andrew Hunt', [bookGenrePropId]: 'Technical', [bookRatingPropId]: 5, [bookReadPropId]: true, [bookNotesPropId]: 'Essential reading for every developer.' }, 0),
      row({ title: 'Clean Code', [bookAuthorPropId]: 'Robert C. Martin', [bookGenrePropId]: 'Technical', [bookRatingPropId]: 4.5, [bookReadPropId]: true, [bookNotesPropId]: 'Great principles, some examples feel dated.' }, 1),
      row({ title: 'Dune', [bookAuthorPropId]: 'Frank Herbert', [bookGenrePropId]: 'Sci-Fi', [bookRatingPropId]: 5, [bookReadPropId]: true, [bookNotesPropId]: 'Epic world-building.' }, 2),
      row({ title: 'Sapiens', [bookAuthorPropId]: 'Yuval Noah Harari', [bookGenrePropId]: 'Non-fiction', [bookRatingPropId]: 4.5, [bookReadPropId]: true, [bookNotesPropId]: 'Changed my perspective on human history.' }, 3),
      row({ title: 'The Design of Everyday Things', [bookAuthorPropId]: 'Don Norman', [bookGenrePropId]: 'Technical', [bookRatingPropId]: 4, [bookReadPropId]: false, [bookNotesPropId]: 'On my reading list.' }, 4),
      row({ title: 'Thinking, Fast and Slow', [bookAuthorPropId]: 'Daniel Kahneman', [bookGenrePropId]: 'Non-fiction', [bookRatingPropId]: 5, [bookReadPropId]: false, [bookNotesPropId]: 'Next up.' }, 5),
    ],
  });

  return {
    pages,
    databases: [taskDb, sprintDb, bookDb],
    topLevelPageIds: [gettingStartedId, projectsId, personalId],
  };
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface StoreState {
  pages: Page[];
  databases: Database[];
  topLevelPageIds: string[];
  workspace: Workspace;
  user: UserProfile;
  settings: AppSettings;
  activeView: AppView;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  searchOpen: boolean;
  zenMode: boolean;
  shortcutsOpen: boolean;
  aiKey: string;
  visitHistory: string[];         // recently visited page IDs (newest first, max 8)
  inboxItems: InboxItem[];
  inboxOpen: boolean;

  // Vault — persisted: meta + encrypted blobs. NOT persisted: unlocked flag + entries.
  vaultMeta: VaultMeta;
  vaultEncrypted: EncryptedVaultEntry[];
  vaultUnlocked: boolean;          // transient
  vaultEntries: VaultEntry[];      // transient — decrypted only while unlocked

  // Auth (simulated — no real OAuth)
  isAuthenticated: boolean;

  // Page actions
  createPage: (parentId?: string | null) => string;
  updatePage: (id: string, patch: Partial<Omit<Page, 'id'>>) => void;
  deletePage: (id: string) => void;
  restorePage: (id: string) => void;
  permanentlyDeletePage: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleExpanded: (id: string) => void;
  movePage: (id: string, newParentId: string | null, afterId?: string) => void;

  // Navigation
  navigate: (view: AppView) => void;
  navigateToPage: (id: string) => void;
  navigateToSettings: (section?: SettingsSection) => void;

  // Database actions
  updateDatabase: (id: string, patch: Partial<Omit<Database, 'id'>>) => void;
  addDatabaseRow: (databaseId: string, values?: Record<string, DatabaseCellValue>) => string;
  updateDatabaseRow: (databaseId: string, rowId: string, values: Record<string, DatabaseCellValue>) => void;
  deleteDatabaseRow: (databaseId: string, rowId: string) => void;
  setDatabaseView: (databaseId: string, viewId: string) => void;
  moveBoardRow: (databaseId: string, rowId: string, newGroupValue: string, groupPropertyId: string) => void;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateWorkspace: (patch: Partial<Workspace>) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  setSearchOpen: (open: boolean) => void;
  toggleZenMode: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setAiKey: (key: string) => void;
  logVisit: (id: string) => void;
  reorderTopLevelPages: (newOrder: string[]) => void;
  reorderChildren: (parentId: string, newOrder: string[]) => void;
  reorderFavorites: (newOrder: string[]) => void;
  favoriteOrder: string[];
  setPagePrivate: (id: string, isPrivate: boolean) => void;
  setPageExpiry: (id: string, expiresAt?: number) => void;
  saveSnapshot: (id: string, wordCount: number) => void;
  setPageTags: (id: string, tags: string[]) => void;
  setPageAiSummary: (id: string, summary: string) => void;
  getDailyNoteId: () => string; // finds or creates today's daily note
  setInboxOpen: (open: boolean) => void;
  markInboxRead: () => void;

  // Vault actions
  setupVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  resetVault: () => void;
  addVaultEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVaultEntry: (id: string, patch: Partial<Omit<VaultEntry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteVaultEntry: (id: string) => void;
  setVaultAutoLock: (minutes: number) => void;

  // Auth actions
  signIn: (profile?: Partial<UserProfile>) => void;
  signOut: () => void;

  // Database view filters/sorts
  updateDatabaseViewFilters: (databaseId: string, viewId: string, filters: import('./types').DatabaseFilterConfig[]) => void;
  updateDatabaseViewSorts: (databaseId: string, viewId: string, sorts: import('./types').DatabaseSortConfig[]) => void;

  // Internal
  _loadSeed: (data: ReturnType<typeof buildSeedData>) => void;

  // Selectors (not persisted)
  getPage: (id: string) => Page | undefined;
  getDatabase: (id: string) => Database | undefined;
  getPagePath: (id: string) => Page[];
  getChildPages: (parentId: string | null) => Page[];
  getFavoritePages: () => Page[];
  getDeletedPages: () => Page[];
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      pages: [],
      databases: [],
      topLevelPageIds: [],
      workspace: {
        id: nanoid(),
        name: 'My Workspace',
        icon: '🏢',
        plan: 'free',
      },
      user: {
        id: nanoid(),
        name: 'You',
        email: 'you@example.com',
        avatar: '🧑',
        color: '#2383e2',
      },
      settings: {
        theme: 'light',
        density: 'default',
        typewriterMode: false,
      },
      activeView: { type: 'home' },
      sidebarCollapsed: false,
      sidebarWidth: 240,
      searchOpen: false,
      zenMode: false,
      shortcutsOpen: false,
      aiKey: '',
      visitHistory: [],
      inboxItems: [],
      inboxOpen: false,
      favoriteOrder: [],

      vaultMeta: { initialized: false, salt: '', verifier: '', autoLockMinutes: 5 },
      vaultEncrypted: [],
      vaultUnlocked: false,
      vaultEntries: [],

      isAuthenticated: false,

      // ── Page actions ─────────────────────────────────────────────────────

      createPage: (parentId = null) => {
        const id = nanoid();
        const page: Page = {
          id,
          title: '',
          icon: '📄',
          content: null,
          parentId,
          children: [],
          isExpanded: false,
          isFavorite: false,
          isDeleted: false,
          isPublished: false,
          isLocked: false,
          isPrivate: false,
          font: 'default',
          isFullWidth: false,
          isSmallText: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => {
          const newPages = [...s.pages, page];
          let newTopLevel = s.topLevelPageIds;
          let updatedPages = newPages;
          if (parentId) {
            updatedPages = newPages.map((p) =>
              p.id === parentId
                ? { ...p, children: [...p.children, id], isExpanded: true }
                : p,
            );
          } else {
            newTopLevel = [id, ...s.topLevelPageIds];
          }
          return { pages: updatedPages, topLevelPageIds: newTopLevel };
        });
        get().navigate({ type: 'page', id });
        return id;
      },

      updatePage: (id, patch) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        }));
      },

      deletePage: (id) => {
        const page = get().pages.find((p) => p.id === id);
        if (!page) return;
        const deleteRecursive = (pid: string, pages: Page[]): Page[] =>
          pages.map((p) => {
            if (p.id === pid) return { ...p, isDeleted: true, deletedAt: Date.now() };
            if (p.children.includes(pid)) {
              return { ...p, children: p.children.filter((c) => c !== pid) };
            }
            return p;
          }).flatMap((p) =>
            p.id === pid
              ? [p, ...get().pages.filter((c) => p.children.includes(c.id)).flatMap((c) =>
                deleteRecursive(c.id, pages)
              )]
              : [p]
          );
        set((s) => {
          const updated = s.pages.map((p) => {
            if (p.id === id) return { ...p, isDeleted: true, deletedAt: Date.now() };
            if (p.children.includes(id)) return { ...p, children: p.children.filter((c) => c !== id) };
            return p;
          });
          const newTopLevel = s.topLevelPageIds.filter((tid) => tid !== id);
          const view = s.activeView;
          const newView: AppView = view.type === 'page' && view.id === id ? { type: 'home' } : view;
          return { pages: updated, topLevelPageIds: newTopLevel, activeView: newView };
        });
      },

      restorePage: (id) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === id);
          if (!page) return s;
          const updated = s.pages.map((p) =>
            p.id === id ? { ...p, isDeleted: false, deletedAt: undefined } : p,
          );
          const parentId = page.parentId;
          if (!parentId) {
            return { pages: updated, topLevelPageIds: [id, ...s.topLevelPageIds] };
          }
          const parentExists = updated.find((p) => p.id === parentId && !p.isDeleted);
          if (!parentExists) {
            return {
              pages: updated.map((p) => p.id === id ? { ...p, parentId: null } : p),
              topLevelPageIds: [id, ...s.topLevelPageIds],
            };
          }
          return {
            pages: updated.map((p) =>
              p.id === parentId ? { ...p, children: [...p.children, id] } : p,
            ),
          };
        });
      },

      permanentlyDeletePage: (id) => {
        set((s) => ({
          pages: s.pages.filter((p) => p.id !== id),
        }));
      },

      toggleFavorite: (id) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === id);
          const adding = !page?.isFavorite;
          const newOrder = adding
            ? [id, ...s.favoriteOrder.filter((f) => f !== id)]
            : s.favoriteOrder.filter((f) => f !== id);
          return {
            pages: s.pages.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p),
            favoriteOrder: newOrder,
          };
        });
      },

      toggleExpanded: (id) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, isExpanded: !p.isExpanded } : p,
          ),
        }));
      },

      movePage: (id, newParentId, _afterId) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === id);
          if (!page) return s;
          const oldParentId = page.parentId;
          let pages = s.pages.map((p) => {
            if (p.id === oldParentId) return { ...p, children: p.children.filter((c) => c !== id) };
            if (p.id === newParentId) return { ...p, children: [...p.children, id] };
            if (p.id === id) return { ...p, parentId: newParentId };
            return p;
          });
          let topLevelPageIds = s.topLevelPageIds;
          if (!oldParentId) topLevelPageIds = topLevelPageIds.filter((t) => t !== id);
          if (!newParentId) topLevelPageIds = [id, ...topLevelPageIds];
          return { pages, topLevelPageIds };
        });
      },

      // ── Navigation ───────────────────────────────────────────────────────

      navigate: (view) => set({ activeView: view }),
      navigateToPage: (id) => {
        set((s) => {
          const hist = [id, ...s.visitHistory.filter((v) => v !== id)].slice(0, 8);
          return { activeView: { type: 'page', id }, visitHistory: hist };
        });
      },
      navigateToSettings: (section = 'account') =>
        set({ activeView: { type: 'settings', section } }),

      // ── Database actions ─────────────────────────────────────────────────

      updateDatabase: (id, patch) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id === id ? { ...db, ...patch, updatedAt: Date.now() } : db,
          ),
        }));
      },

      addDatabaseRow: (databaseId, values = {}) => {
        const id = nanoid();
        set((s) => ({
          databases: s.databases.map((db) => {
            if (db.id !== databaseId) return db;
            const maxOrder = db.rows.reduce((m, r) => Math.max(m, r.order), -1);
            return {
              ...db,
              rows: [...db.rows, { id, values: { title: '', ...values }, order: maxOrder + 1 }],
              updatedAt: Date.now(),
            };
          }),
        }));
        return id;
      },

      updateDatabaseRow: (databaseId, rowId, values) => {
        set((s) => ({
          databases: s.databases.map((db) => {
            if (db.id !== databaseId) return db;
            return {
              ...db,
              rows: db.rows.map((r) =>
                r.id === rowId ? { ...r, values: { ...r.values, ...values } } : r,
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deleteDatabaseRow: (databaseId, rowId) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id === databaseId
              ? { ...db, rows: db.rows.filter((r) => r.id !== rowId) }
              : db,
          ),
        }));
      },

      setDatabaseView: (databaseId, viewId) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id === databaseId ? { ...db, activeViewId: viewId } : db,
          ),
        }));
      },

      moveBoardRow: (databaseId, rowId, newGroupValue, groupPropertyId) => {
        set((s) => ({
          databases: s.databases.map((db) => {
            if (db.id !== databaseId) return db;
            return {
              ...db,
              rows: db.rows.map((r) =>
                r.id === rowId
                  ? { ...r, values: { ...r.values, [groupPropertyId]: newGroupValue } }
                  : r,
              ),
            };
          }),
        }));
      },

      // ── Database view filter/sort ────────────────────────────────────────

      updateDatabaseViewFilters: (databaseId, viewId, filters) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id !== databaseId ? db : {
              ...db,
              views: db.views.map((v) => v.id !== viewId ? v : { ...v, filters }),
            },
          ),
        }));
      },

      updateDatabaseViewSorts: (databaseId, viewId, sorts) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id !== databaseId ? db : {
              ...db,
              views: db.views.map((v) => v.id !== viewId ? v : { ...v, sorts }),
            },
          ),
        }));
      },

      // ── Internal seed loader ─────────────────────────────────────────────

      _loadSeed: (data: ReturnType<typeof buildSeedData>) => {
        const inboxItems = seedInboxItems(data.topLevelPageIds[0], data.topLevelPageIds[1] ?? data.topLevelPageIds[0]);
        set({
          pages: data.pages,
          databases: data.databases,
          topLevelPageIds: data.topLevelPageIds,
          activeView: { type: 'page', id: data.topLevelPageIds[0] },
          inboxItems,
        });
      },

      // ── Settings ─────────────────────────────────────────────────────────

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateWorkspace: (patch) => set((s) => ({ workspace: { ...s.workspace, ...patch } })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(480, w)) }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
      setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
      setAiKey: (key) => set({ aiKey: key }),
      logVisit: (id) => set((s) => ({ visitHistory: [id, ...s.visitHistory.filter((v) => v !== id)].slice(0, 8) })),
      reorderTopLevelPages: (newOrder) => set({ topLevelPageIds: newOrder }),

      reorderChildren: (parentId, newOrder) =>
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === parentId ? { ...p, children: newOrder } : p,
          ),
        })),

      reorderFavorites: (newOrder) => set({ favoriteOrder: newOrder }),
      setPagePrivate: (id, isPrivate) =>
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, isPrivate } : p) })),
      setPageExpiry: (id, expiresAt) =>
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, expiresAt } : p) })),

      saveSnapshot: (id, wordCount) => {
        const page = get().pages.find((p) => p.id === id);
        if (!page) return;
        const snap: PageSnapshot = {
          id: nanoid(),
          content: page.content,
          title: page.title,
          savedAt: Date.now(),
          wordCount,
        };
        set((s) => ({
          pages: s.pages.map((p) => p.id === id ? {
            ...p,
            snapshots: [snap, ...(p.snapshots ?? [])].slice(0, 20),
          } : p),
        }));
      },

      setPageTags: (id, tags) =>
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, tags } : p) })),

      setPageAiSummary: (id, summary) =>
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, aiSummary: summary } : p) })),

      getDailyNoteId: () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const title = `Daily Note — ${today}`;
        const existing = get().pages.find((p) => p.title === title && !p.isDeleted);
        if (existing) {
          get().navigateToPage(existing.id);
          return existing.id;
        }
        const id = get().createPage(null);
        get().updatePage(id, {
          title,
          icon: '📅',
          content: {
            type: 'doc',
            content: [
              { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: today }] },
              { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🌅 Morning intentions' }] },
              { type: 'paragraph' },
              { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '✅ Today\'s focus' }] },
              { type: 'taskList', content: [
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              ]},
              { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🌙 Evening reflection' }] },
              { type: 'paragraph' },
            ],
          },
        });
        return id;
      },
      setInboxOpen: (open) => set({ inboxOpen: open }),
      markInboxRead: () => set((s) => ({ inboxItems: s.inboxItems.map((i) => ({ ...i, read: true })) })),

      // ── Vault actions ─────────────────────────────────────────────────────

      setupVault: async (masterPassword) => {
        const salt = generateSalt();
        const key = await deriveKey(masterPassword, salt);
        const verifier = await makeVerifier(key);
        vaultKey = key;
        set({
          vaultMeta: { initialized: true, salt, verifier, autoLockMinutes: get().vaultMeta.autoLockMinutes },
          vaultUnlocked: true,
          vaultEntries: [],
          vaultEncrypted: [],
        });
      },

      unlockVault: async (masterPassword) => {
        const { vaultMeta, vaultEncrypted } = get();
        if (!vaultMeta.initialized) return false;
        const key = await deriveKey(masterPassword, vaultMeta.salt);
        const ok = await checkVerifier(vaultMeta.verifier, key);
        if (!ok) return false;
        // Decrypt all entries into memory
        const entries: VaultEntry[] = [];
        for (const e of vaultEncrypted) {
          try {
            const json = await decryptString(e.blob, key);
            entries.push(JSON.parse(json) as VaultEntry);
          } catch { /* skip corrupt entry */ }
        }
        entries.sort((a, b) => b.updatedAt - a.updatedAt);
        vaultKey = key;
        set({ vaultUnlocked: true, vaultEntries: entries });
        return true;
      },

      lockVault: () => {
        vaultKey = null;
        set({ vaultUnlocked: false, vaultEntries: [] }); // wipe plaintext from memory
      },

      resetVault: () => {
        vaultKey = null;
        set({
          vaultMeta: { initialized: false, salt: '', verifier: '', autoLockMinutes: 5 },
          vaultEncrypted: [],
          vaultUnlocked: false,
          vaultEntries: [],
        });
      },

      addVaultEntry: async (entry) => {
        if (!vaultKey) return;
        const now = Date.now();
        const full: VaultEntry = { ...entry, id: nanoid(), createdAt: now, updatedAt: now };
        const blob = await encryptString(JSON.stringify(full), vaultKey);
        set((s) => ({
          vaultEntries: [full, ...s.vaultEntries],
          vaultEncrypted: [{ id: full.id, blob, createdAt: now, updatedAt: now }, ...s.vaultEncrypted],
        }));
      },

      updateVaultEntry: async (id, patch) => {
        if (!vaultKey) return;
        const existing = get().vaultEntries.find((e) => e.id === id);
        if (!existing) return;
        const updated: VaultEntry = { ...existing, ...patch, updatedAt: Date.now() };
        const blob = await encryptString(JSON.stringify(updated), vaultKey);
        set((s) => ({
          vaultEntries: s.vaultEntries.map((e) => e.id === id ? updated : e),
          vaultEncrypted: s.vaultEncrypted.map((e) => e.id === id ? { ...e, blob, updatedAt: updated.updatedAt } : e),
        }));
      },

      deleteVaultEntry: (id) => {
        set((s) => ({
          vaultEntries: s.vaultEntries.filter((e) => e.id !== id),
          vaultEncrypted: s.vaultEncrypted.filter((e) => e.id !== id),
        }));
      },

      setVaultAutoLock: (minutes) =>
        set((s) => ({ vaultMeta: { ...s.vaultMeta, autoLockMinutes: minutes } })),

      // ── Auth (simulated) ──────────────────────────────────────────────────

      signIn: (profile) =>
        set((s) => ({
          isAuthenticated: true,
          user: profile ? { ...s.user, ...profile } : s.user,
        })),

      signOut: () => {
        // Lock the vault on sign-out so decrypted data is wiped from memory.
        vaultKey = null;
        set({ isAuthenticated: false, vaultUnlocked: false, vaultEntries: [], activeView: { type: 'home' } });
      },

      // ── Selectors ────────────────────────────────────────────────────────

      getPage: (id) => get().pages.find((p) => p.id === id),
      getDatabase: (id) => get().databases.find((db) => db.id === id),
      getPagePath: (id) => {
        const pages = get().pages;
        const path: Page[] = [];
        let current = pages.find((p) => p.id === id);
        while (current) {
          path.unshift(current);
          current = current.parentId
            ? pages.find((p) => p.id === current!.parentId)
            : undefined;
        }
        return path;
      },
      getChildPages: (parentId) =>
        get().pages.filter((p) => p.parentId === parentId && !p.isDeleted),
      getFavoritePages: () =>
        get().pages.filter((p) => p.isFavorite && !p.isDeleted),
      getDeletedPages: () =>
        get().pages.filter((p) => p.isDeleted),
    }),
    {
      name: 'notebook-2.0-v4',
      // SECURITY: never persist the decrypted vault entries or the unlocked flag.
      // Only the encrypted blobs + meta (salt/verifier) reach localStorage.
      // Transient UI flags are also dropped so the app always boots clean/locked.
      partialize: (state) => {
        const { vaultUnlocked, vaultEntries, searchOpen, inboxOpen, shortcutsOpen, zenMode, ...rest } = state;
        void vaultUnlocked; void vaultEntries; void searchOpen;
        void inboxOpen; void shortcutsOpen; void zenMode;
        return rest as typeof state;
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.pages.length === 0) {
          const seed = buildSeedData();
          // Call the store action so Zustand's set() is used (triggers persistence)
          state._loadSeed(seed);
        }
        // Vault always boots locked — the key is gone after reload by design.
        if (state) {
          state.vaultUnlocked = false;
          state.vaultEntries = [];
        }
      },
    },
  ),
);
