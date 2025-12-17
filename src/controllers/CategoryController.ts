import { StorageService } from '../services/StorageService';
import { ValidationService } from '../services/ValidationService';
import { NotificationService } from '../services/NotificationService';
import { Category } from '../types';

export class CategoryController {
  private categories: Category[] = [];
  private storage: StorageService;

  constructor(private userId: string) {
    this.storage = StorageService.getInstance();
    this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    const allCategories = await this.storage.get<Category[]>('tm_categories') || [];
    this.categories = allCategories.filter((cat: Category) => cat.userId === this.userId);
  }

  private generateId(): string {
    return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async saveCategories(): Promise<void> {
    const allCategories = await this.storage.get<Category[]>('tm_categories') || [];
    const otherCategories = allCategories.filter((cat: Category) => cat.userId !== this.userId);
    const updatedCategories = [...otherCategories, ...this.categories];
    await this.storage.save('tm_categories', updatedCategories);
  }

  async createCategory(name: string, color: string = '#4361ee', icon: string = '📁'): Promise<Category> {
    ValidationService.validateRequired(name, 'Category name');

    // Check for duplicate names
    if (this.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A category with this name already exists');
    }

    const category: Category = {
      id: this.generateId(),
      userId: this.userId,
      name,
      color,
      icon,
      createdAt: new Date()
    };

    this.categories.push(category);
    await this.saveCategories();

    NotificationService.showToast('Category created successfully', 'success');
    return category;
  }

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category> {
    const index = this.categories.findIndex(cat => cat.id === categoryId);
    if (index === -1) {
      throw new Error('Category not found');
    }

    // Check for duplicate names if name is being updated
    if (updates.name && updates.name !== this.categories[index].name) {
      if (this.categories.some(cat => 
        cat.id !== categoryId && 
        cat.name.toLowerCase() === updates.name!.toLowerCase()
      )) {
        throw new Error('A category with this name already exists');
      }
    }

    this.categories[index] = {
      ...this.categories[index],
      ...updates
    };

    await this.saveCategories();
    NotificationService.showToast('Category updated successfully', 'success');

    return this.categories[index];
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const index = this.categories.findIndex(cat => cat.id === categoryId);
    if (index === -1) {
      throw new Error('Category not found');
    }

    this.categories.splice(index, 1);
    await this.saveCategories();

    NotificationService.showToast('Category deleted successfully', 'success');
  }

  getCategoryById(categoryId: string): Category | undefined {
    return this.categories.find(cat => cat.id === categoryId);
  }

  getAllCategories(): Category[] {
    return [...this.categories];
  }

  getCategoriesWithCount(taskCounts: Map<string, number>): Array<Category & { taskCount: number }> {
    return this.categories.map(category => ({
      ...category,
      taskCount: taskCounts.get(category.id) || 0
    }));
  }

  async searchCategories(query: string): Promise<Category[]> {
    const searchLower = query.toLowerCase();
    return this.categories.filter(category => 
      category.name.toLowerCase().includes(searchLower)
    );
  }

  getDefaultCategories(): Category[] {
    return [
      {
        id: 'default-work',
        userId: this.userId,
        name: 'Work',
        color: '#4361ee',
        icon: '💼',
        createdAt: new Date()
      },
      {
        id: 'default-personal',
        userId: this.userId,
        name: 'Personal',
        color: '#20c997',
        icon: '🏠',
        createdAt: new Date()
      },
      {
        id: 'default-shopping',
        userId: this.userId,
        name: 'Shopping',
        color: '#fd7e14',
        icon: '🛒',
        createdAt: new Date()
      },
      {
        id: 'default-health',
        userId: this.userId,
        name: 'Health',
        color: '#e83e8c',
        icon: '❤️',
        createdAt: new Date()
      }
    ];
  }

  async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = this.getDefaultCategories();
    
    // Only add defaults if user has no categories
    if (this.categories.length === 0) {
      this.categories.push(...defaultCategories);
      await this.saveCategories();
    }
  }

  getCategoryColor(categoryId: string | null): string {
    if (!categoryId) return '#6c757d';
    
    const category = this.getCategoryById(categoryId);
    return category?.color || '#6c757d';
  }

  getCategoryIcon(categoryId: string | null): string {
    if (!categoryId) return '📄';
    
    const category = this.getCategoryById(categoryId);
    return category?.icon || '📄';
  }
}