import { 
  CompletionStats, 
  PriorityStats, 
  ProductivityData, 
  Task,
  Category 
} from '../types';

export class StatsController {
  constructor(private tasks: Task[]) {}
  
  getCompletionStats(): CompletionStats {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
    const todo = this.tasks.filter(t => t.status === 'todo').length;
    
    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }
  
  getPriorityDistribution(): PriorityStats {
    return {
      high: this.tasks.filter(t => t.priority === 'high').length,
      medium: this.tasks.filter(t => t.priority === 'medium').length,
      low: this.tasks.filter(t => t.priority === 'low').length
    };
  }
  
  getProductivityTrend(days: number = 30): ProductivityData[] {
    const trend: ProductivityData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dayTasks = this.tasks.filter(task => {
        const taskDate = task.completedAt ? new Date(task.completedAt) : null;
        return taskDate && taskDate >= startOfDay && taskDate <= endOfDay;
      });
      
      const points = dayTasks.reduce((sum, task) => {
        return sum + (task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1);
      }, 0);
      
      trend.push({
        date: date.toISOString().split('T')[0],
        completed: dayTasks.length,
        points
      });
    }
    
    return trend;
  }
  
  getCategoryStats(categories: Category[]): Array<{category: Category; count: number; percentage: number}> {
    const categoryMap = new Map<string, number>();
    let categorizedCount = 0;
    
    this.tasks.forEach(task => {
      if (task.categoryId) {
        const count = categoryMap.get(task.categoryId) || 0;
        categoryMap.set(task.categoryId, count + 1);
        categorizedCount++;
      }
    });
    
    const uncategorizedCount = this.tasks.length - categorizedCount;
    
    const result = categories.map(category => {
      const count = categoryMap.get(category.id) || 0;
      return {
        category,
        count,
        percentage: this.tasks.length > 0 ? Math.round((count / this.tasks.length) * 100) : 0
      };
    });
    
    // Add uncategorized entry
    if (uncategorizedCount > 0) {
      result.push({
        category: { id: 'uncategorized', name: 'Uncategorized', color: '#808080', icon: '📁', userId: '', createdAt: new Date() },
        count: uncategorizedCount,
        percentage: Math.round((uncategorizedCount / this.tasks.length) * 100)
      });
    }
    
    return result;
  }
  
  getTagStats(): Map<string, number> {
    const stats = new Map<string, number>();
    
    this.tasks.forEach(task => {
      task.tags.forEach(tag => {
        stats.set(tag, (stats.get(tag) || 0) + 1);
      });
    });
    
    return stats;
  }
  
  getAverageCompletionTime(): number {
    const completedTasks = this.tasks.filter(t => 
      t.status === 'completed' && t.createdAt && t.completedAt
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime();
      const completed = new Date(task.completedAt!).getTime();
      return sum + (completed - created);
    }, 0);
    
    // Return average in hours (rounded to 1 decimal)
    return Math.round((totalTime / completedTasks.length / (1000 * 60 * 60)) * 10) / 10;
  }
  
  getCompletionTimeByPriority(): {[key: string]: number} {
    const priorityTimes: {[key: string]: {total: number; count: number}} = {
      high: { total: 0, count: 0 },
      medium: { total: 0, count: 0 },
      low: { total: 0, count: 0 }
    };
    
    this.tasks.forEach(task => {
      if (task.status === 'completed' && task.createdAt && task.completedAt) {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.completedAt!).getTime();
        const timeDiff = completed - created;
        
        priorityTimes[task.priority].total += timeDiff;
        priorityTimes[task.priority].count += 1;
      }
    });
    
    const result: {[key: string]: number} = {};
    
    Object.entries(priorityTimes).forEach(([priority, data]) => {
      result[priority] = data.count > 0 
        ? Math.round(data.total / data.count / (1000 * 60 * 60 * 24)) // in days
        : 0;
    });
    
    return result;
  }
  
  getMonthlyCompletionStats(): Array<{month: string; completed: number; created: number}> {
    const monthlyStats = new Map<string, {completed: number; created: number}>();
    
    // Initialize with last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyStats.set(monthKey, { completed: 0, created: 0 });
    }
    
    // Count completions and creations
    this.tasks.forEach(task => {
      const createdDate = new Date(task.createdAt);
      const createdMonthKey = createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const existing = monthlyStats.get(createdMonthKey);
      if (existing) {
        existing.created += 1;
        monthlyStats.set(createdMonthKey, existing);
      }
      
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const completedMonthKey = completedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        const completedExisting = monthlyStats.get(completedMonthKey);
        if (completedExisting) {
          completedExisting.completed += 1;
          monthlyStats.set(completedMonthKey, completedExisting);
        }
      }
    });
    
    return Array.from(monthlyStats.entries()).map(([month, stats]) => ({
      month,
      completed: stats.completed,
      created: stats.created
    }));
  }
  
  getDailyActivity(): Array<{hour: number; count: number}> {
    const hourlyStats = Array.from({length: 24}, (_, i) => ({ hour: i, count: 0 }));
    
    this.tasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hourlyStats[hour].count += 1;
      }
    });
    
    return hourlyStats;
  }
  
  getStreakInfo(): {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
  } {
    const completedDates = this.tasks
      .filter(task => task.completedAt)
      .map(task => {
        const date = new Date(task.completedAt!);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      })
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (completedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    }
    
    // Remove duplicates and sort
    const uniqueDates = Array.from(new Set(completedDates.map(d => d.getTime())))
      .map(t => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from most recent date
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      if (i === uniqueDates.length - 1) {
        const diffDays = Math.floor((today.getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          currentStreak = 1;
          // Check consecutive days backwards
          for (let j = i - 1; j >= 0; j--) {
            const prevDiff = Math.floor(
              (uniqueDates[j + 1].getTime() - uniqueDates[j].getTime()) / (1000 * 60 * 60 * 24)
            );
            if (prevDiff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }
      
      // Calculate longest streak
      if (i > 0) {
        const diffDays = Math.floor(
          (uniqueDates[i].getTime() - uniqueDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      currentStreak,
      longestStreak,
      lastActivityDate: uniqueDates[uniqueDates.length - 1]
    };
  }
  
  getTaskCompletionRateOverTime(): Array<{date: string; completionRate: number}> {
    const monthlyRates: Array<{date: string; completionRate: number}> = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const monthTasks = this.tasks.filter(task => 
        new Date(task.createdAt) >= startOfMonth && 
        new Date(task.createdAt) <= endOfMonth
      );
      
      const completedTasks = monthTasks.filter(task => task.status === 'completed').length;
      const completionRate = monthTasks.length > 0 
        ? Math.round((completedTasks / monthTasks.length) * 100) 
        : 0;
      
      monthlyRates.push({
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        completionRate
      });
    }
    
    return monthlyRates;
  }
  
  getMostProductiveDay(): {day: string; count: number} {
    const dayStats = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
    };
    
    this.tasks.forEach(task => {
      if (task.completedAt) {
        const dayName = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
        dayStats[dayName as keyof typeof dayStats] += 1;
      }
    });
    
    let mostProductiveDay = 'Monday';
    let maxCount = 0;
    
    Object.entries(dayStats).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveDay = day;
      }
    });
    
    return { day: mostProductiveDay, count: maxCount };
  }
  
  getEstimatedVsActualTime(): {estimated: number; actual: number; difference: number} {
    let totalEstimated = 0;
    let totalActual = 0;
    let taskCount = 0;
    
    this.tasks.forEach(task => {
      if (task.metadata?.estimatedTime && task.metadata?.actualTime) {
        totalEstimated += task.metadata.estimatedTime;
        totalActual += task.metadata.actualTime;
        taskCount++;
      }
    });
    
    return {
      estimated: taskCount > 0 ? Math.round(totalEstimated / taskCount) : 0,
      actual: taskCount > 0 ? Math.round(totalActual / taskCount) : 0,
      difference: taskCount > 0 ? Math.round((totalActual - totalEstimated) / taskCount) : 0
    };
  }
  
  generatePerformanceReport(): {
    summary: CompletionStats;
    productivityTrend: ProductivityData[];
    priorityDistribution: PriorityStats;
    categoryStats: Array<{category: Category; count: number; percentage: number}>;
    averageCompletionTime: number;
    streakInfo: {currentStreak: number; longestStreak: number; lastActivityDate: Date | null};
    mostProductiveDay: {day: string; count: number};
    timeComparison: {estimated: number; actual: number; difference: number};
  } {
    return {
      summary: this.getCompletionStats(),
      productivityTrend: this.getProductivityTrend(14), // Last 14 days
      priorityDistribution: this.getPriorityDistribution(),
      categoryStats: this.getCategoryStats([]), // Pass empty categories or fetch from somewhere
      averageCompletionTime: this.getAverageCompletionTime(),
      streakInfo: this.getStreakInfo(),
      mostProductiveDay: this.getMostProductiveDay(),
      timeComparison: this.getEstimatedVsActualTime()
    };
  }
}