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

export const initialNotesList: Note[] = [];
