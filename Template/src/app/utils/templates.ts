import { Block } from '../types/blocks';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'productivity' | 'personal' | 'work' | 'creative';
  blocks: Block[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch',
    icon: '📄',
    category: 'productivity',
    blocks: [
      { id: generateId(), type: 'text', content: '' }
    ]
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured meeting template',
    icon: '📋',
    category: 'work',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Meeting Notes' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'h2', content: 'Date & Time' },
      { id: generateId(), type: 'text', content: new Date().toLocaleDateString() },
      { id: generateId(), type: 'h2', content: 'Attendees' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Agenda' },
      { id: generateId(), type: 'numbered', content: '' },
      { id: generateId(), type: 'h2', content: 'Discussion Points' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'h2', content: 'Action Items' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Next Steps' },
      { id: generateId(), type: 'text', content: '' },
    ]
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Reflect on your day',
    icon: '📓',
    category: 'personal',
    blocks: [
      { id: generateId(), type: 'h1', content: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Morning Reflection' },
      { id: generateId(), type: 'text', content: 'How am I feeling today?' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'h2', content: 'Gratitude' },
      { id: generateId(), type: 'bullet', content: "I'm grateful for..." },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: "Today's Goals" },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Evening Reflection' },
      { id: generateId(), type: 'text', content: 'What went well today?' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'text', content: 'What could I improve?' },
      { id: generateId(), type: 'text', content: '' },
    ]
  },
  {
    id: 'todo-list',
    name: 'To-Do List',
    description: 'Track your tasks',
    icon: '✅',
    category: 'productivity',
    blocks: [
      { id: generateId(), type: 'h1', content: 'To-Do List' },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'High Priority' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Medium Priority' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Low Priority' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Completed' },
      { id: generateId(), type: 'todo', content: '', checked: true },
    ]
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Organize project details',
    icon: '🎯',
    category: 'work',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Project Name' },
      { id: generateId(), type: 'text', content: 'Brief project description' },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Overview' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'h2', content: 'Goals & Objectives' },
      { id: generateId(), type: 'numbered', content: '' },
      { id: generateId(), type: 'numbered', content: '' },
      { id: generateId(), type: 'h2', content: 'Timeline' },
      { id: generateId(), type: 'bullet', content: 'Start Date:' },
      { id: generateId(), type: 'bullet', content: 'End Date:' },
      { id: generateId(), type: 'bullet', content: 'Milestones:' },
      { id: generateId(), type: 'h2', content: 'Team Members' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Resources Needed' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Tasks' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Notes & Risks' },
      { id: generateId(), type: 'callout', content: '', calloutType: 'warning' },
    ]
  },
  {
    id: 'reading-list',
    name: 'Reading List',
    description: 'Track books and articles',
    icon: '📚',
    category: 'personal',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Reading List' },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Currently Reading' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Want to Read' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Completed' },
      { id: generateId(), type: 'todo', content: '', checked: true },
      { id: generateId(), type: 'h2', content: 'Reading Notes' },
      { id: generateId(), type: 'text', content: '' },
    ]
  },
  {
    id: 'recipe',
    name: 'Recipe',
    description: 'Organize your recipes',
    icon: '🍳',
    category: 'personal',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Recipe Name' },
      { id: generateId(), type: 'text', content: 'Brief description of the dish' },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Prep Time & Servings' },
      { id: generateId(), type: 'bullet', content: 'Prep time: 15 minutes' },
      { id: generateId(), type: 'bullet', content: 'Cook time: 30 minutes' },
      { id: generateId(), type: 'bullet', content: 'Servings: 4' },
      { id: generateId(), type: 'h2', content: 'Ingredients' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Instructions' },
      { id: generateId(), type: 'numbered', content: '' },
      { id: generateId(), type: 'numbered', content: '' },
      { id: generateId(), type: 'numbered', content: '' },
      { id: generateId(), type: 'h2', content: 'Notes & Tips' },
      { id: generateId(), type: 'callout', content: '', calloutType: 'info' },
    ]
  },
  {
    id: 'travel-itinerary',
    name: 'Travel Itinerary',
    description: 'Plan your trip',
    icon: '✈️',
    category: 'personal',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Trip to [Destination]' },
      { id: generateId(), type: 'text', content: 'Trip dates and overview' },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Flight Details' },
      { id: generateId(), type: 'bullet', content: 'Outbound:' },
      { id: generateId(), type: 'bullet', content: 'Return:' },
      { id: generateId(), type: 'h2', content: 'Accommodation' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'h2', content: 'Day 1' },
      { id: generateId(), type: 'bullet', content: 'Morning:' },
      { id: generateId(), type: 'bullet', content: 'Afternoon:' },
      { id: generateId(), type: 'bullet', content: 'Evening:' },
      { id: generateId(), type: 'h2', content: 'Packing List' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Important Info' },
      { id: generateId(), type: 'callout', content: 'Emergency contacts, addresses, confirmations', calloutType: 'warning' },
    ]
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Capture ideas freely',
    icon: '💡',
    category: 'creative',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Brainstorming Session' },
      { id: generateId(), type: 'text', content: 'Topic or problem to solve' },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Initial Thoughts' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Wild Ideas' },
      { id: generateId(), type: 'text', content: "No idea is too crazy!" },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Next Steps' },
      { id: generateId(), type: 'todo', content: '', checked: false },
    ]
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Reflect on your week',
    icon: '📊',
    category: 'productivity',
    blocks: [
      { id: generateId(), type: 'h1', content: 'Weekly Review' },
      { id: generateId(), type: 'text', content: new Date().toLocaleDateString() },
      { id: generateId(), type: 'divider', content: '' },
      { id: generateId(), type: 'h2', content: 'Wins This Week' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Challenges' },
      { id: generateId(), type: 'bullet', content: '' },
      { id: generateId(), type: 'h2', content: 'Lessons Learned' },
      { id: generateId(), type: 'text', content: '' },
      { id: generateId(), type: 'h2', content: 'Goals for Next Week' },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'todo', content: '', checked: false },
      { id: generateId(), type: 'h2', content: 'Notes' },
      { id: generateId(), type: 'text', content: '' },
    ]
  }
];
