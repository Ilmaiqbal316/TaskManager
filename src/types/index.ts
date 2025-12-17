// Core interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  profile: {
    avatar?: string;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
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

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
}

// Recurring pattern interface (define it here)
export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
}

export interface TaskMetadata {
  estimatedTime?: number;
  actualTime?: number;
  attachments?: string[];
  recurring?: RecurringPattern;
}

// Data transfer objects
export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TaskCreateData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  categoryId?: string | null;
  tags?: string[];
  metadata?: TaskMetadata;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in-progress' | 'completed';
  dueDate?: Date | string | null;  // Changed: allow string or Date
  categoryId?: string | null;
  tags?: string[];
  metadata?: TaskMetadata;
  completedAt?: Date | null;  // Added: for completion tracking
}

// Filter and sort types
export interface TaskFilters {
  search?: string;
  status?: 'all' | 'todo' | 'in-progress' | 'completed';
  priority?: 'all' | 'low' | 'medium' | 'high';
  categoryId?: string | 'all';
  dueDateRange?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
}

export type SortOption = 'dueDate' | 'priority' | 'title' | 'createdAt' | 'updatedAt';

// Stats types
export interface CompletionStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
}

export interface PriorityStats {
  high: number;
  medium: number;
  low: number;
}

export interface ProductivityData {
  date: string;
  completed: number;
  points: number;
}

// Theme types
export interface ThemeColors {
  [key: string]: string;
}

export const lightTheme: ThemeColors = {
  'primary-color': '#4361ee',
  'secondary-color': '#3f37c9',
  'background-color': '#f8f9fa',
  'surface-color': '#ffffff',
  'text-color': '#212529',
  'text-secondary': '#6c757d',
  'border-color': '#dee2e6',
  'success-color': '#4cc9f0',
  'warning-color': '#f72585',
  'danger-color': '#7209b7'
};

export const darkTheme: ThemeColors = {
  'primary-color': '#4895ef',
  'secondary-color': '#4361ee',
  'background-color': '#121212',
  'surface-color': '#1e1e1e',
  'text-color': '#e9ecef',
  'text-secondary': '#adb5bd',
  'border-color': '#495057',
  'success-color': '#4cc9f0',
  'warning-color': '#f72585',
  'danger-color': '#7209b7'
};