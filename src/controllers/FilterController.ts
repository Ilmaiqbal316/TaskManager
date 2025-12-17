import { Task, TaskFilters, SortOption, Category } from '../types';
import { DateUtils } from '../utils/dateUtils';

export class FilterController {
  private tasks: Task[] = [];
  private categories: Category[] = [];

  constructor(tasks: Task[] = [], categories: Category[] = []) {
    this.tasks = tasks;
    this.categories = categories;
  }

  setTasks(tasks: Task[]): void {
    this.tasks = tasks;
  }

  setCategories(categories: Category[]): void {
    this.categories = categories;
  }

  filterTasks(filters: TaskFilters): Task[] {
    return this.tasks.filter(task => {
      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Filter by status
      if (filters.status && filters.status !== 'all') {
        if (task.status !== filters.status) return false;
      }

      // Filter by priority
      if (filters.priority && filters.priority !== 'all') {
        if (task.priority !== filters.priority) return false;
      }

      // Filter by category
      if (filters.categoryId && filters.categoryId !== 'all') {
        if (task.categoryId !== filters.categoryId) return false;
      }

      // Filter by due date range
      if (filters.dueDateRange) {
        if (task.dueDate) {
          const due = new Date(task.dueDate).getTime();
          const from = filters.dueDateRange.from?.getTime() || 0;
          const to = filters.dueDateRange.to?.getTime() || Infinity;
          
          if (due < from || due > to) return false;
        } else if (filters.dueDateRange.from || filters.dueDateRange.to) {
          // If task has no due date but range is specified, exclude it
          return false;
        }
      }

      // Filter by tags
      if (filters.tags?.length) {
        if (!filters.tags.every(tag => task.tags.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }

  sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return this.compareDates(a.dueDate, b.dueDate);
        case 'priority':
          return this.comparePriority(a.priority, b.priority);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  }

  private compareDates(a: Date | null, b: Date | null): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  }

  private comparePriority(a: 'low' | 'medium' | 'high', b: 'low' | 'medium' | 'high'): number {
    const priorityMap = { low: 1, medium: 2, high: 3 };
    return priorityMap[b] - priorityMap[a];
  }

  // Advanced filtering methods
  filterByDateRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= startDate && due <= endDate;
    });
  }

  filterOverdue(tasks: Task[]): Task[] {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed'
    );
  }

  filterToday(tasks: Task[]): Task[] {
    const today = DateUtils.getStartOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= today && due < tomorrow;
    });
  }

  filterUpcoming(tasks: Task[], days: number = 7): Task[] {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due > now && due <= future;
    });
  }

  filterByCategory(tasks: Task[], categoryId: string): Task[] {
    return tasks.filter(task => task.categoryId === categoryId);
  }

  filterByTags(tasks: Task[], tags: string[]): Task[] {
    return tasks.filter(task => 
      tags.every(tag => task.tags.includes(tag))
    );
  }

  filterByStatus(tasks: Task[], status: Task['status']): Task[] {
    return tasks.filter(task => task.status === status);
  }

  filterByPriority(tasks: Task[], priority: Task['priority']): Task[] {
    return tasks.filter(task => task.priority === priority);
  }

  searchTasks(tasks: Task[], query: string): Task[] {
    const searchLower = query.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Grouping methods
  groupByStatus(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {
      'todo': [],
      'in-progress': [],
      'completed': []
    };

    tasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });

    return groups;
  }

  groupByPriority(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {
      'high': [],
      'medium': [],
      'low': []
    };

    tasks.forEach(task => {
      groups[task.priority].push(task);
    });

    return groups;
  }

  groupByCategory(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {
      'uncategorized': []
    };

    // Initialize with categories
    this.categories.forEach(category => {
      groups[category.id] = [];
    });

    tasks.forEach(task => {
      if (task.categoryId && groups[task.categoryId]) {
        groups[task.categoryId].push(task);
      } else {
        groups['uncategorized'].push(task);
      }
    });

    return groups;
  }

  groupByDueDate(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {
      'overdue': [],
      'today': [],
      'tomorrow': [],
      'this-week': [],
      'next-week': [],
      'future': [],
      'no-date': []
    };

    const now = new Date();
    const today = DateUtils.getStartOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    tasks.forEach(task => {
      if (!task.dueDate) {
        groups['no-date'].push(task);
        return;
      }

      const due = new Date(task.dueDate);

      if (due < now && task.status !== 'completed') {
        groups['overdue'].push(task);
      } else if (due >= today && due < tomorrow) {
        groups['today'].push(task);
      } else if (due >= tomorrow && due < DateUtils.addDays(today, 2)) {
        groups['tomorrow'].push(task);
      } else if (due >= tomorrow && due < nextWeek) {
        groups['this-week'].push(task);
      } else if (due >= nextWeek && due < twoWeeks) {
        groups['next-week'].push(task);
      } else {
        groups['future'].push(task);
      }
    });

    return groups;
  }

  // Statistics methods
  getFilterStats(filters: TaskFilters): {
    total: number;
    filtered: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const filteredTasks = this.filterTasks(filters);
    
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    filteredTasks.forEach(task => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    });

    return {
      total: this.tasks.length,
      filtered: filteredTasks.length,
      byStatus,
      byPriority
    };
  }
}