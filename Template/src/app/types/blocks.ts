export type BlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'toggle'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'code'
  | 'image'
  | 'table'
  | 'columns'
  | 'embed'
  | 'file';

export type CalloutType = 'info' | 'warning' | 'success' | 'error';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ColumnData {
  columns: Block[][];
  columnCount: 2 | 3;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // for todo blocks
  collapsed?: boolean; // for toggle blocks
  calloutType?: CalloutType; // for callout blocks
  language?: string; // for code blocks
  imageUrl?: string; // for image blocks
  tableData?: TableData; // for table blocks
  columnData?: ColumnData; // for column blocks
  embedUrl?: string; // for embed blocks (YouTube, Figma, etc.)
  fileUrl?: string; // for file blocks
  fileName?: string; // for file blocks
}

export type PageStatus = 'not-started' | 'in-progress' | 'completed' | 'archived';
export type PagePriority = 'low' | 'medium' | 'high';

export interface PageProperties {
  status?: PageStatus;
  priority?: PagePriority;
  dueDate?: string;
  owner?: string;
  customFields?: { [key: string]: string };
}

export interface PageVersion {
  id: string;
  timestamp: string;
  blocks: Block[];
  title: string;
}

export interface NotionPage {
  id: string;
  title: string;
  icon: string;
  coverImage: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  tags?: string[];
  aiGenerated?: boolean;
  aiSummary?: string;
  properties?: PageProperties;
  parentId?: string; // for nested pages
  linkedPages?: string[]; // IDs of pages this page links to
  backlinks?: string[]; // IDs of pages that link to this page
  versions?: PageVersion[]; // page history
  workspace?: string; // workspace ID
}
