export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  categoryId: string | null;
  tags: string[];
  metadata: {
    estimatedTime?: number;
    actualTime?: number;
    attachments?: string[];
    recurring?: RecurringPattern;
  };
}

export default Task;