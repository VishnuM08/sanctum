export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverImage: string;
  lessons: Lesson[];
  progress: number; // 0-100
  status: 'not-started' | 'in-progress' | 'completed';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'exercise' | 'quiz';
  duration?: number; // in minutes
  content: string;
  resources: Resource[];
  completed: boolean;
  notes?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'link' | 'file' | 'code' | 'image';
  url: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[]; // course IDs
  icon: string;
  estimatedHours: number;
}
