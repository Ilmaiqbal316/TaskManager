export class DateUtils {
  static normalizeDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return date;
  }
  
  static formatDate(date: Date | string | null): string {
    if (!date) return 'No due date';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    // If it's today
    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    }
    
    // If it's tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    // If it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (taskDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    // Calculate days difference
    const daysDiff = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0 && daysDiff <= 7) {
      return `In ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
    }
    
    if (daysDiff < 0 && daysDiff >= -7) {
      return `${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} ago`;
    }
    
    // Otherwise format normally
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
  
  static isOverdue(date: Date | string | null): boolean {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;
    
    return d < new Date();
  }
  
  static isToday(date: Date | string | null): boolean {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;
    
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }
  
  static isTomorrow(date: Date | string | null): boolean {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return (
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
    );
  }
  
  static daysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  static addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  static getStartOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  
  static getEndOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
  
  static formatDateTime(date: Date | string | null): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  static getDaysFromNow(date: Date | string | null): number {
    if (!date) return 0;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 0;
    
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  static isValidDate(date: Date | string | null): boolean {
    if (!date) return false;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(d.getTime());
  }
}