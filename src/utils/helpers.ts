import { Task, Category } from '../types';

export class Helpers {
  // UUID generation
  static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Deep clone object
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // Debounce function
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get initials from name
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // Generate random color
  static generateRandomColor(): string {
    const colors = [
      '#4361ee', '#3a0ca3', '#7209b7', '#f72585',
      '#4cc9f0', '#4895ef', '#560bad', '#b5179e',
      '#f15bb5', '#9b5de5', '#00bbf9', '#00f5d4',
      '#ff9e00', '#ff6d00', '#ff0054', '#390099'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Calculate completion percentage
  static calculateCompletion(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }

  // Group tasks by date
  static groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = new Date(task.dueDate).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(task);
      } else {
        if (!groups['No date']) {
          groups['No date'] = [];
        }
        groups['No date'].push(task);
      }
    });
    
    return groups;
  }

  // Calculate task statistics
  static calculateTaskStats(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    
    const priorityStats = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };
    
    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priorityStats
    };
  }

  // Sort categories by task count
  static sortCategoriesByTaskCount(categories: Category[], taskCounts: Map<string, number>): Category[] {
    return [...categories].sort((a, b) => {
      const countA = taskCounts.get(a.id) || 0;
      const countB = taskCounts.get(b.id) || 0;
      return countB - countA;
    });
  }

  // Escape HTML
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Parse query string
  static parseQueryString(query: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    query
      .replace('?', '')
      .split('&')
      .forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    
    return params;
  }

  // Build query string
  static buildQueryString(params: Record<string, any>): string {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return query ? `?${query}` : '';
  }

  // Copy to clipboard
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }

  // Download file
  static downloadFile(content: string, filename: string, type: string = 'text/plain'): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // Check if running on mobile
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if running on touch device
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Generate password
  static generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Validate URL
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get time ago string
  static getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'just now';
  }

  // Truncate text
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Capitalize first letter
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Format number with commas
  static formatNumber(num: number): string {
    return num.toLocaleString();
  }

  // Get browser storage quota
  static async getStorageQuota(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        return {
          used: usage || 0,
          total: quota || 0,
          percentage: quota ? Math.round(((usage || 0) / quota) * 100) : 0
        };
      } catch {
        // Fallback values
        return { used: 0, total: 0, percentage: 0 };
      }
    }
    return { used: 0, total: 0, percentage: 0 };
  }
}