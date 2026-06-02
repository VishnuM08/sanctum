import { Note } from '../types';

interface Block {
  id: string;
  type: 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'todo' | 'toggle' | 'quote' | 'divider' | 'callout' | 'code' | 'image';
  content: string;
  properties?: {
    checked?: boolean;
    collapsed?: boolean;
    language?: string;
    calloutType?: 'info' | 'warning' | 'success' | 'error';
    url?: string;
  };
}

interface NoteMetadata {
  icon?: string | null;
  cover?: string | null;
  parentId?: string | null;
  blocks?: Block[];
}

const serializeNoteContent = (cleanContent: string, metadata: NoteMetadata): string => {
  return `<!-- metadata:${JSON.stringify(metadata)} -->${cleanContent}`;
};

export const initialNotesList: Note[] = [
  {
    id: 'init-projects-tasks',
    title: 'Projects & Tasks',
    content: serializeNoteContent('', {
      icon: '🛠️',
      cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200', // retro mainframe cover
      parentId: null,
      blocks: [
        { id: 'pt-h1', type: 'h1', content: 'Team Sprint Dashboard' },
        { id: 'pt-co', type: 'callout', content: 'This sprint tracker helps coordinate development tasks, assign owners, and track launch statuses.', properties: { calloutType: 'note' } },
        { id: 'pt-h2-1', type: 'h2', content: 'Current Sprint Priorities' },
        { id: 'pt-todo-1', type: 'todo', content: 'Implement JWT user authentication', properties: { checked: true } },
        { id: 'pt-todo-2', type: 'todo', content: 'Clean up double sidebar layout', properties: { checked: true } },
        { id: 'pt-todo-3', type: 'todo', content: 'Pre-populate Notion-style template lists', properties: { checked: false } },
        { id: 'pt-todo-4', type: 'todo', content: 'Test production build bundle compilation', properties: { checked: false } },
        { id: 'pt-h2-2', type: 'h2', content: 'Backlog Tasks' },
        { id: 'pt-b-1', type: 'bullet', content: 'Research Ollama LLM intent parsing models' },
        { id: 'pt-b-2', type: 'bullet', content: 'Refine CSS styling transitions for dark mode toggle' }
      ]
    }),
    aiGenerated: false,
    tags: ['projects', 'sprint'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  },
  {
    id: 'init-habit-tracker',
    title: 'Habit Tracker',
    content: serializeNoteContent('', {
      icon: '📅',
      cover: 'linear-gradient(135deg, #ffd1dc 0%, #ff8da1 100%)',
      parentId: null,
      blocks: [
        { id: 'ht-h1', type: 'h1', content: 'Daily Habit Streak Tracker' },
        { id: 'ht-co', type: 'callout', content: 'Consistency is key. Track your habits daily to build lasting routines.', properties: { calloutType: 'note' } },
        { id: 'ht-h2-1', type: 'h2', content: 'Morning Routine Streaks' },
        { id: 'ht-todo-1', type: 'todo', content: 'Drink 500ml water', properties: { checked: true } },
        { id: 'ht-todo-2', type: 'todo', content: '15 minutes morning stretching', properties: { checked: true } },
        { id: 'ht-todo-3', type: 'todo', content: 'Read 10 pages of a book', properties: { checked: false } },
        { id: 'ht-h2-2', type: 'h2', content: 'Productivity Habits' },
        { id: 'ht-todo-4', type: 'todo', content: 'Write code for at least 2 hours', properties: { checked: true } },
        { id: 'ht-todo-5', type: 'todo', content: 'Inbox Zero check-in', properties: { checked: false } },
        { id: 'ht-todo-6', type: 'todo', content: '10 minutes evening reflection journal', properties: { checked: false } }
      ]
    }),
    aiGenerated: false,
    tags: ['personal', 'habits'],
    createdAt: '2025-05-26T22:11:00.000Z', // May 26, 2025 10:11 PM
    updatedAt: '2025-05-26T22:11:00.000Z'
  },
  {
    id: 'init-weekly-todo',
    title: 'Weekly To-do List',
    content: serializeNoteContent('', {
      icon: '☑️',
      cover: 'url(https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=800)',
      parentId: null,
      blocks: [
        { id: 'wt-h1', type: 'h1', content: 'Week of March 24 - 30' },
        { id: 'wt-co', type: 'callout', content: 'A summary of prioritized tasks and deliverables for the current week.', properties: { calloutType: 'note' } },
        { id: 'wt-h2-1', type: 'h2', content: 'Monday' },
        { id: 'wt-todo-1', type: 'todo', content: 'Sync with design team on sidebar aesthetics', properties: { checked: true } },
        { id: 'wt-todo-2', type: 'todo', content: 'Complete API endpoint integrations for reminders', properties: { checked: true } },
        { id: 'wt-h2-2', type: 'h2', content: 'Tuesday' },
        { id: 'wt-todo-3', type: 'todo', content: 'Fix JWT cookie storage configurations', properties: { checked: true } },
        { id: 'wt-todo-4', type: 'todo', content: 'Draft technical specs for mobile drawer components', properties: { checked: true } },
        { id: 'wt-h2-3', type: 'h2', content: 'Wednesday' },
        { id: 'wt-todo-5', type: 'todo', content: 'Implement split-screen layout for editor', properties: { checked: false } },
        { id: 'wt-todo-6', type: 'todo', content: 'Prepare presentation slides for demo day', properties: { checked: false } }
      ]
    }),
    aiGenerated: false,
    tags: ['productivity', 'work'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  },
  {
    id: 'init-job-tracker',
    title: 'Job Application Tracker',
    content: serializeNoteContent('', {
      icon: '💼',
      cover: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
      parentId: null,
      blocks: [
        { id: 'jt-h1', type: 'h1', content: 'Career Search Pipeline' },
        { id: 'jt-co', type: 'callout', content: 'Keep track of active job openings, resume submissions, and interview loops.', properties: { calloutType: 'note' } },
        { id: 'jt-h2-1', type: 'h2', content: 'Active Pipeline' },
        { id: 'jt-todo-1', type: 'todo', content: 'Google - Software Engineer (Applied, Interviewing)', properties: { checked: true } },
        { id: 'jt-todo-2', type: 'todo', content: 'Stripe - Frontend Engineer (Technical Round)', properties: { checked: false } },
        { id: 'jt-todo-3', type: 'todo', content: 'Vercel - UI Engineer (Offer Stage)', properties: { checked: false } },
        { id: 'jt-h2-2', type: 'h2', content: 'Next Actions' },
        { id: 'jt-b-1', type: 'bullet', content: 'Follow up with Apple recruiter regarding team match call' },
        { id: 'jt-b-2', type: 'bullet', content: 'Refine personal portfolio project page list links' }
      ]
    }),
    aiGenerated: false,
    tags: ['career', 'tracker'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  },
  {
    id: 'init-personal-website',
    title: 'Personal Website',
    content: serializeNoteContent('', {
      icon: '🌐',
      cover: 'url(https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800)',
      parentId: null,
      blocks: [
        { id: 'pw-h1', type: 'h1', content: 'Personal Portfolio Design' },
        { id: 'pw-co', type: 'callout', content: 'Designing a clean, minimalist personal website to showcase projects.', properties: { calloutType: 'note' } },
        { id: 'pw-h2-1', type: 'h2', content: 'Tech Stack Decisions' },
        { id: 'pw-b-1', type: 'bullet', content: 'Framework: Next.js (App Router)' },
        { id: 'pw-b-2', type: 'bullet', content: 'Styling: Vanilla CSS & CSS Variables' },
        { id: 'pw-b-3', type: 'bullet', content: 'Hosting: Vercel' },
        { id: 'pw-h2-2', type: 'h2', content: 'Layout Structure' },
        { id: 'pw-todo-1', type: 'todo', content: 'Hero page with introductory headline', properties: { checked: true } },
        { id: 'pw-todo-2', type: 'todo', content: 'Projects grid displaying interactive apps', properties: { checked: false } },
        { id: 'pw-todo-3', type: 'todo', content: 'About me page listing developer timeline', properties: { checked: false } }
      ]
    }),
    aiGenerated: false,
    tags: ['website', 'projects'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  },
  {
    id: 'init-monthly-budget',
    title: 'Monthly Budget',
    content: serializeNoteContent('', {
      icon: '💰',
      cover: 'linear-gradient(135deg, #ffe5ec 0%, #ffb3c6 100%)',
      parentId: null,
      blocks: [
        { id: 'mb-h1', type: 'h1', content: 'Personal Finances Dashboard' },
        { id: 'mb-co', type: 'callout', content: 'Track monthly cash flows, expenses, and investment goals.', properties: { calloutType: 'note' } },
        { id: 'mb-h2-1', type: 'h2', content: 'Income Sources' },
        { id: 'mb-b-1', type: 'bullet', content: 'Primary Salary: $5,500' },
        { id: 'mb-b-2', type: 'bullet', content: 'Side projects: $450' },
        { id: 'mb-h2-2', type: 'h2', content: 'Fixed Expenses' },
        { id: 'mb-todo-1', type: 'todo', content: 'Rent / Housing: $1,600', properties: { checked: true } },
        { id: 'mb-todo-2', type: 'todo', content: 'Utilities & Wifi: $120', properties: { checked: true } },
        { id: 'mb-todo-3', type: 'todo', content: 'Subscriptions (Netflix, Spotify, GitHub): $45', properties: { checked: true } }
      ]
    }),
    aiGenerated: false,
    tags: ['finance', 'budget'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  },
  {
    id: 'init-meal-planner',
    title: 'Meal Planner',
    content: serializeNoteContent('', {
      icon: '🍳',
      cover: 'url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800)',
      parentId: null,
      blocks: [
        { id: 'mp-h1', type: 'h1', content: 'Weekly Meal Calendar' },
        { id: 'mp-co', type: 'callout', content: 'Plan meals to simplify grocery shopping and save time.', properties: { calloutType: 'note' } },
        { id: 'mp-h2-1', type: 'h2', content: 'Monday Plan' },
        { id: 'mp-b-1', type: 'bullet', content: 'Breakfast: Avocado toast with eggs' },
        { id: 'mp-b-2', type: 'bullet', content: 'Lunch: Quinoa salad with grilled chicken' },
        { id: 'mp-b-3', type: 'bullet', content: 'Dinner: Tomato basil pasta' },
        { id: 'mp-h2-2', type: 'h2', content: 'Tuesday Plan' },
        { id: 'mp-b-4', type: 'bullet', content: 'Breakfast: Greek yogurt with fresh berries' },
        { id: 'mp-b-5', type: 'bullet', content: 'Lunch: Leftover pasta' },
        { id: 'mp-b-6', type: 'bullet', content: 'Dinner: Salmon with roasted asparagus' }
      ]
    }),
    aiGenerated: false,
    tags: ['health', 'food'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  },
  {
    id: 'init-travel-planner',
    title: 'Travel Planner',
    content: serializeNoteContent('', {
      icon: '✈️',
      cover: 'url(https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=800)', // Cherry blossom
      parentId: null,
      blocks: [
        { id: 'tp-h1', type: 'h1', content: 'Spring Vacation: Tokyo, Japan' },
        { id: 'tp-co', type: 'callout', content: 'Planning a 7-day trip to Tokyo during the cherry blossom season!', properties: { calloutType: 'note' } },
        { id: 'tp-h2-1', type: 'h2', content: 'Key Reservations' },
        { id: 'tp-todo-1', type: 'todo', content: 'Flight tickets booked (ANA Airlines)', properties: { checked: true } },
        { id: 'tp-todo-2', type: 'todo', content: 'Hotel accommodations in Shinjuku', properties: { checked: true } },
        { id: 'tp-todo-3', type: 'todo', content: 'Ghibli Museum entry passes secured', properties: { checked: true } },
        { id: 'tp-h2-2', type: 'h2', content: 'Packing Checklist' },
        { id: 'tp-todo-4', type: 'todo', content: 'Passport & flight boarding passes', properties: { checked: false } },
        { id: 'tp-todo-5', type: 'todo', content: 'Universal power adapters', properties: { checked: false } },
        { id: 'tp-todo-6', type: 'todo', content: 'Comfortable walking shoes', properties: { checked: false } }
      ]
    }),
    aiGenerated: false,
    tags: ['travel', 'vacation'],
    createdAt: '2025-03-26T23:08:00.000Z', // March 26, 2025 11:08 PM
    updatedAt: '2025-03-26T23:08:00.000Z'
  }
];
