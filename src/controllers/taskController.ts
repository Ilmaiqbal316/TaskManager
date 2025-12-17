import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { 
  Task, 
  TaskCreateData, 
  TaskUpdateData,
  TaskFilters, 
  SortOption 
} from '../types';

export class TaskController {
  private tasks: Task[] = [];
  private storage: StorageService;
  private userId: string;
  
  constructor(userId: string) {
    console.log(`TaskController initialized for user: ${userId}`);
    this.storage = StorageService.getInstance();
    this.userId = userId;
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    await this.loadTasks();
  }
  
  private async loadTasks(): Promise<void> {
    try {
      const userKey = `tm_tasks_${this.userId}`;
      console.log(`Loading tasks with key: ${userKey}`);
      
      // First check localStorage directly
      const rawData = localStorage.getItem(userKey);
      console.log('Raw localStorage data:', rawData);
      
      const savedTasks = await this.storage.get<Task[]>(userKey);
      
      if (savedTasks && Array.isArray(savedTasks) && savedTasks.length > 0) {
        console.log(`Found ${savedTasks.length} saved tasks`);
        
        // Convert any date strings back to Date objects
        this.tasks = savedTasks.map(task => {
          // Create a properly typed task
          const processedTask: Task = {
            ...task,
            id: task.id || this.generateId(),
            userId: task.userId || this.userId,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            priority: ['low', 'medium', 'high'].includes(task.priority) 
              ? task.priority as 'low' | 'medium' | 'high' 
              : 'medium',
            status: ['todo', 'in-progress', 'completed'].includes(task.status)
              ? task.status as 'todo' | 'in-progress' | 'completed'
              : 'todo',
            dueDate: task.dueDate ? this.parseDate(task.dueDate) : null,
            createdAt: task.createdAt ? this.parseDate(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? this.parseDate(task.updatedAt) : new Date(),
            completedAt: task.completedAt ? this.parseDate(task.completedAt) : null,
            categoryId: task.categoryId || null,
            tags: Array.isArray(task.tags) ? task.tags : [],
            metadata: task.metadata || {
              estimatedTime: undefined,
              actualTime: undefined,
              attachments: [],
              recurring: undefined
            }
          };
          
          return processedTask;
        });
        
        console.log(`Successfully loaded ${this.tasks.length} tasks`);
      } else {
        console.log('No saved tasks found, starting with empty array');
        this.tasks = [];
        
        // Try creating sample tasks if none exist
        if (this.tasks.length === 0) {
          await this.createSampleTasks();
        }
      }
    } catch (error) {
      console.error('Error loading tasks from storage:', error);
      this.tasks = [];
    }
  }
  
  private parseDate(dateValue: any): Date {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    
    return new Date();
  }
  
  private async createSampleTasks(): Promise<void> {
    try {
      console.log('Creating sample tasks...');
      
      const sampleTasks: TaskCreateData[] = [
        {
          title: 'Welcome to Task Manager',
          description: 'This is your first task. Try creating more!',
          priority: 'medium',
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          tags: ['welcome', 'sample']
        },
        {
          title: 'Complete project setup',
          description: 'Set up the development environment and install dependencies',
          priority: 'high',
          dueDate: new Date().toISOString(), // Today
          tags: ['development', 'setup']
        },
        {
          title: 'Learn TypeScript',
          description: 'Study TypeScript basics and advanced features',
          priority: 'medium',
          dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          tags: ['learning', 'typescript']
        }
      ];
      
      for (const taskData of sampleTasks) {
        await this.createTask(taskData);
      }
      
      console.log('Sample tasks created successfully');
    } catch (error) {
      console.error('Failed to create sample tasks:', error);
    }
  }
  
  private async saveTasks(): Promise<void> {
    try {
      const userKey = `tm_tasks_${this.userId}`;
      console.log(`Saving ${this.tasks.length} tasks with key: ${userKey}`);
      
      // Make a deep copy to avoid reference issues
      const tasksToSave = this.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        completedAt: task.completedAt ? task.completedAt.toISOString() : null
      }));
      
      // Save using StorageService
      await this.storage.save(userKey, tasksToSave);
      console.log('Tasks saved successfully to localStorage');
      
      // Also save directly to localStorage as backup
      localStorage.setItem(userKey, JSON.stringify(tasksToSave));
      console.log('Tasks also saved directly to localStorage as backup');
      
      // Dispatch event to notify other components
      this.dispatchTasksChangedEvent();
      
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }
  
  // Dispatch event when tasks change
  private dispatchTasksChangedEvent(): void {
    console.log('TaskController: Dispatching tasks-changed event');
    
    // Create and dispatch custom event
    const event = new CustomEvent('tasks-changed', {
      detail: {
        userId: this.userId,
        timestamp: Date.now(),
        taskCount: this.tasks.length
      }
    });
    
    window.dispatchEvent(event);
    
    // Also dispatch storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: `tm_tasks_${this.userId}`,
      newValue: localStorage.getItem(`tm_tasks_${this.userId}`)
    }));
  }
  
  private generateId(): string {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private compareDates(a: Date | null, b: Date | null): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.getTime() - b.getTime();
  }
  
  private comparePriority(a: 'low' | 'medium' | 'high', b: 'low' | 'medium' | 'high'): number {
    const priorityMap = { low: 1, medium: 2, high: 3 };
    return priorityMap[b] - priorityMap[a];
  }
  
  async createTask(taskData: TaskCreateData): Promise<Task> {
    console.log('Creating new task with data:', taskData);
    
    // Validation
    if (!taskData.title?.trim()) {
      throw new Error('Task title is required');
    }
    
    // Ensure priority is valid
    const validPriority = taskData.priority || 'medium';
    if (!['low', 'medium', 'high'].includes(validPriority)) {
      throw new Error('Invalid priority value');
    }
    
    const task: Task = {
      id: this.generateId(),
      userId: this.userId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      priority: validPriority as 'low' | 'medium' | 'high',
      status: 'todo', // New tasks always start as 'todo'
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      categoryId: taskData.categoryId || null,
      tags: taskData.tags || [],
      metadata: taskData.metadata || {
        estimatedTime: undefined,
        actualTime: undefined,
        attachments: [],
        recurring: undefined
      }
    };
    
    console.log('Created task object:', task);
    
    this.tasks.push(task);
    
    try {
      await this.saveTasks();
      console.log('Task saved successfully, total tasks:', this.tasks.length);
      
      // Show success message
      this.showNotification('Task created successfully', 'success');
      
      return task;
    } catch (error) {
      // Rollback if save fails
      this.tasks.pop();
      console.error('Failed to save task, rollback performed:', error);
      throw new Error(`Failed to save task: ${error}`);
    }
  }
  
  async updateTask(taskId: string, updates: TaskUpdateData): Promise<Task> {
    console.log(`Updating task ${taskId} with:`, updates);
    
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const currentTask = this.tasks[index];
    console.log('Current task:', currentTask);
    
    // Create updated task
    const updatedTask: Task = {
      ...currentTask,
      updatedAt: new Date()
    };
    
    // Apply updates
    if ('title' in updates && updates.title !== undefined) {
      updatedTask.title = updates.title.trim();
    }
    
    if ('description' in updates && updates.description !== undefined) {
      updatedTask.description = updates.description.trim();
    }
    
    if ('priority' in updates && updates.priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(updates.priority)) {
        throw new Error('Invalid priority value');
      }
      updatedTask.priority = updates.priority as 'low' | 'medium' | 'high';
    }
    
    if ('status' in updates && updates.status !== undefined) {
      if (!['todo', 'in-progress', 'completed'].includes(updates.status)) {
        throw new Error('Invalid status value');
      }
      updatedTask.status = updates.status as 'todo' | 'in-progress' | 'completed';
    }
    
    if ('categoryId' in updates) {
      updatedTask.categoryId = updates.categoryId || null;
    }
    
    if ('tags' in updates && updates.tags !== undefined) {
      updatedTask.tags = updates.tags || [];
    }
    
    if ('metadata' in updates && updates.metadata !== undefined) {
      updatedTask.metadata = {
        ...updatedTask.metadata,
        ...updates.metadata
      };
    }
    
    // Handle date fields specifically
    if ('dueDate' in updates) {
      if (updates.dueDate === null || updates.dueDate === undefined) {
        updatedTask.dueDate = null;
      } else {
        updatedTask.dueDate = new Date(updates.dueDate);
      }
    }
    
    if ('completedAt' in updates) {
      if (updates.completedAt === null || updates.completedAt === undefined) {
        updatedTask.completedAt = null;
      } else {
        updatedTask.completedAt = new Date(updates.completedAt);
      }
    }
    
    console.log('Updated task:', updatedTask);
    
    this.tasks[index] = updatedTask;
    
    try {
      await this.saveTasks();
      console.log('Task update saved successfully');
      
      this.showNotification('Task updated successfully', 'success');
      
      return updatedTask;
    } catch (error) {
      // Rollback if save fails
      this.tasks[index] = currentTask;
      console.error('Failed to save updated task, rollback performed:', error);
      throw new Error(`Failed to update task: ${error}`);
    }
  }
  
  async deleteTask(taskId: string): Promise<void> {
    console.log(`Deleting task ${taskId}`);
    
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const deletedTask = this.tasks[index];
    console.log('Task to delete:', deletedTask);
    
    // Store for potential rollback
    const originalTasks = [...this.tasks];
    
    // Remove task
    this.tasks.splice(index, 1);
    
    try {
      await this.saveTasks();
      console.log('Task deletion saved successfully, remaining tasks:', this.tasks.length);
      
      this.showNotification('Task deleted successfully', 'success');
    } catch (error) {
      // Rollback if save fails
      this.tasks = originalTasks;
      console.error('Failed to save deletion, rollback performed:', error);
      throw new Error(`Failed to delete task: ${error}`);
    }
  }
  
  async toggleTaskCompletion(taskId: string): Promise<Task> {
    console.log(`Toggling completion for task ${taskId}`);
    
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date() : null;
    
    console.log(`Changing status from ${task.status} to ${newStatus}`);
    
    return this.updateTask(taskId, { 
      status: newStatus,
      completedAt 
    });
  }
  
  // Helper method to show notifications
  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    try {
      if (NotificationService && typeof (NotificationService as any).showToast === 'function') {
        (NotificationService as any).showToast(message, type);
      } else {
        // Fallback to console
        console.log(`${type.toUpperCase()}: ${message}`);
      }
    } catch (error) {
      console.log('Notification service not available:', error);
    }
  }
  
  // Query methods
  getTaskById(taskId: string): Task | undefined {
    return this.tasks.find(t => t.id === taskId);
  }
  
  getAllTasks(): Task[] {
    console.log(`Returning all ${this.tasks.length} tasks`);
    return [...this.tasks];
  }
  
  async searchTasks(query: string): Promise<Task[]> {
    if (!query.trim()) return this.getAllTasks();
    
    const searchLower = query.toLowerCase().trim();
    return this.tasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return this.tasks.filter(task => task.status === status);
  }
  
  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date();
    return this.tasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== 'completed'
    );
  }
  
  async getTodayTasks(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
  }
  
  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    
    return this.tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate > now && dueDate <= future;
    });
  }
  
  async sortTasks(tasks: Task[], sortBy: SortOption): Promise<Task[]> {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return this.compareDates(a.dueDate, b.dueDate);
        case 'priority':
          return this.comparePriority(a.priority, b.priority);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'updatedAt':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });
  }
  
  async filterTasks(filters: TaskFilters): Promise<Task[]> {
    return this.tasks.filter(task => {
      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !task.description.toLowerCase().includes(searchLower)) {
          return false;
        }
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
          const due = task.dueDate.getTime();
          const from = filters.dueDateRange.from?.getTime() || 0;
          const to = filters.dueDateRange.to?.getTime() || Infinity;
          
          if (due < from || due > to) return false;
        }
      }
      
      // Filter by tags
      if (filters.tags?.length) {
        if (!filters.tags.every((tag: string) => task.tags.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }
}