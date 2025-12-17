import { StorageService } from './StorageService';
import { Task, Category, User } from '../types';

export class ExportService {
  private storage: StorageService;

  constructor() {
    this.storage = StorageService.getInstance();
  }

  async exportAllData(userId: string): Promise<string> {
    try {
      // Get all user data
      const tasks = await this.getUserTasks(userId);
      const categories = await this.getUserCategories(userId);
      const user = await this.getUser(userId);

      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          username: user?.username
        },
        metadata: {
          taskCount: tasks.length,
          categoryCount: categories.length
        },
        data: {
          tasks,
          categories
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Failed to export data: ${(error as Error).message}`);
    }
  }

  async exportTasks(userId: string): Promise<string> {
    try {
      const tasks = await this.getUserTasks(userId);
      
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        taskCount: tasks.length,
        tasks
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Failed to export tasks: ${(error as Error).message}`);
    }
  }

  async exportCategories(userId: string): Promise<string> {
    try {
      const categories = await this.getUserCategories(userId);
      
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        categoryCount: categories.length,
        categories
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Failed to export categories: ${(error as Error).message}`);
    }
  }

  private async getUserTasks(userId: string): Promise<Task[]> {
    const allTasks = await this.storage.get<Task[]>('tm_tasks') || [];
    return allTasks.filter(task => task.userId === userId);
  }

  private async getUserCategories(userId: string): Promise<Category[]> {
    const allCategories = await this.storage.get<Category[]>('tm_categories') || [];
    return allCategories.filter(category => category.userId === userId);
  }

  private async getUser(userId: string): Promise<User | undefined> {
    const users = await this.storage.get<User[]>('tm_users') || [];
    return users.find(user => user.id === userId);
  }

  async downloadExport(data: string, filename: string = 'task-manager-export.json'): Promise<void> {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  async importData(jsonData: string, userId: string): Promise<{
    tasks: number;
    categories: number;
  }> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.version || !data.data) {
        throw new Error('Invalid export file format');
      }

      let importedTasks = 0;
      let importedCategories = 0;

      // Import tasks
      if (data.data.tasks && Array.isArray(data.data.tasks)) {
        const existingTasks = await this.storage.get<Task[]>('tm_tasks') || [];
        const otherTasks = existingTasks.filter(task => task.userId !== userId);
        
        const tasksToImport = data.data.tasks.map((task: Task) => ({
          ...task,
          userId, // Reassign to current user
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // New ID to avoid conflicts
        }));

        await this.storage.save('tm_tasks', [...otherTasks, ...tasksToImport]);
        importedTasks = tasksToImport.length;
      }

      // Import categories
      if (data.data.categories && Array.isArray(data.data.categories)) {
        const existingCategories = await this.storage.get<Category[]>('tm_categories') || [];
        const otherCategories = existingCategories.filter(cat => cat.userId !== userId);
        
        const categoriesToImport = data.data.categories.map((category: Category) => ({
          ...category,
          userId, // Reassign to current user
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // New ID to avoid conflicts
        }));

        await this.storage.save('tm_categories', [...otherCategories, ...categoriesToImport]);
        importedCategories = categoriesToImport.length;
      }

      return {
        tasks: importedTasks,
        categories: importedCategories
      };
    } catch (error) {
      throw new Error(`Failed to import data: ${(error as Error).message}`);
    }
  }

  async generateBackup(): Promise<string> {
    try {
      const allData: Record<string, any> = {};
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('tm_')) {
          allData[key] = localStorage.getItem(key);
        }
      });
      
      const backupData = {
        version: '1.0.0',
        backedUpAt: new Date().toISOString(),
        itemCount: Object.keys(allData).length,
        data: allData
      };
      
      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      throw new Error(`Failed to generate backup: ${(error as Error).message}`);
    }
  }

  async restoreBackup(backupData: string): Promise<void> {
    try {
      const data = JSON.parse(backupData);
      
      if (!data.version || !data.data) {
        throw new Error('Invalid backup file format');
      }
      
      // Clear existing data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('tm_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Restore backup
      Object.entries(data.data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      });
    } catch (error) {
      throw new Error(`Failed to restore backup: ${(error as Error).message}`);
    }
  }
}