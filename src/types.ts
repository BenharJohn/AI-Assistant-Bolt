export interface Task {
  id: number;
  created_at: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
  parent_task_id?: number;
  subtasks?: Task[];
}

export interface JournalEntry {
  id: number;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface FlashcardSet {
  id: number;
  created_at: string;
  topic: string;
}

export interface Flashcard {
  id: number;
  created_at: string;
  question: string;
  answer: string;
  set_id: number;
}