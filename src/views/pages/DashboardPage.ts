import { TaskController } from '../../controllers/taskController';
import { StatsController } from '../../controllers/statsController';
import { CategoryController } from '../../controllers/CategoryController';
import { Task } from '../../types';
import { DateUtils } from '../../utils/dateUtils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { TaskForm } from '../components/TaskForm';
import { Toast } from '../components/Toast';

export class DashboardPage {
  private element: HTMLElement;
  private taskController: TaskController;
  private statsController: StatsController;
  private categoryController: CategoryController;
  private modal: Modal;
  private userId: string;
  private isRefreshing: boolean = false;
  private tasksChangedHandler: (e: Event) => void;

  constructor(
    userId: string,
    private onTaskClick: (taskId: string) => void
  ) {
    this.userId = userId;
    this.taskController = new TaskController(userId);
    this.statsController = new StatsController([]);
    this.categoryController = new CategoryController(userId);
    this.modal = new Modal();
    
    // Create event handler
    this.tasksChangedHandler = this.handleTasksChanged.bind(this);
    
    this.element = this.createPage();
    this.loadData();
    
    // Listen for task change events
    this.setupEventListeners();
  }

  private createPage(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'dashboard-page';

    // Header section
    const header = document.createElement('div');
    header.className = 'dashboard-header';

    const welcome = document.createElement('div');
    welcome.className = 'dashboard-welcome';

    const title = document.createElement('h1');
    title.className = 'dashboard-title';
    title.textContent = 'Dashboard';

    const date = document.createElement('p');
    date.className = 'dashboard-date';
    date.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    welcome.appendChild(title);
    welcome.appendChild(date);

    const quickActions = document.createElement('div');
    quickActions.className = 'dashboard-actions';

    // Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-secondary';
    refreshBtn.id = 'dashboard-refresh-btn';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshBtn.title = 'Refresh dashboard';
    refreshBtn.addEventListener('click', () => this.handleManualRefresh());

    const newTaskBtn = document.createElement('button');
    newTaskBtn.className = 'btn btn-primary';
    newTaskBtn.innerHTML = '<i class="fas fa-plus"></i> New Task';
    newTaskBtn.addEventListener('click', () => this.showNewTaskForm());

    quickActions.appendChild(refreshBtn);
    quickActions.appendChild(newTaskBtn);

    header.appendChild(welcome);
    header.appendChild(quickActions);

    // Stats section
    const statsSection = document.createElement('div');
    statsSection.className = 'dashboard-stats';
    statsSection.id = 'stats-container';

    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'dashboard-content';

    // Left column: Today's tasks
    const todayColumn = document.createElement('div');
    todayColumn.className = 'dashboard-column';

    const todayHeader = document.createElement('div');
    todayHeader.className = 'column-header';

    const todayTitle = document.createElement('h2');
    todayTitle.textContent = "Today's Tasks";
    todayTitle.className = 'column-title';

    const todayCount = document.createElement('span');
    todayCount.className = 'column-count';
    todayCount.id = 'today-count';
    todayCount.textContent = '0';

    todayHeader.appendChild(todayTitle);
    todayHeader.appendChild(todayCount);

    const todayList = document.createElement('div');
    todayList.className = 'task-list-container';
    todayList.id = 'today-tasks';

    todayColumn.appendChild(todayHeader);
    todayColumn.appendChild(todayList);

    // Middle column: Upcoming tasks
    const upcomingColumn = document.createElement('div');
    upcomingColumn.className = 'dashboard-column';

    const upcomingHeader = document.createElement('div');
    upcomingHeader.className = 'column-header';

    const upcomingTitle = document.createElement('h2');
    upcomingTitle.textContent = 'Upcoming';
    upcomingTitle.className = 'column-title';

    const upcomingCount = document.createElement('span');
    upcomingCount.className = 'column-count';
    upcomingCount.id = 'upcoming-count';
    upcomingCount.textContent = '0';

    upcomingHeader.appendChild(upcomingTitle);
    upcomingHeader.appendChild(upcomingCount);

    const upcomingList = document.createElement('div');
    upcomingList.className = 'task-list-container';
    upcomingList.id = 'upcoming-tasks';

    upcomingColumn.appendChild(upcomingHeader);
    upcomingColumn.appendChild(upcomingList);

    // Right column: Recent activity
    const activityColumn = document.createElement('div');
    activityColumn.className = 'dashboard-column';

    const activityHeader = document.createElement('div');
    activityHeader.className = 'column-header';

    const activityTitle = document.createElement('h2');
    activityTitle.textContent = 'Recent Activity';
    activityTitle.className = 'column-title';

    const activitySubtitle = document.createElement('p');
    activitySubtitle.className = 'column-subtitle';
    activitySubtitle.textContent = 'From all tasks';

    activityHeader.appendChild(activityTitle);
    activityHeader.appendChild(activitySubtitle);

    const activityList = document.createElement('div');
    activityList.className = 'activity-list';
    activityList.id = 'activity-list';

    activityColumn.appendChild(activityHeader);
    activityColumn.appendChild(activityList);

    mainContent.appendChild(todayColumn);
    mainContent.appendChild(upcomingColumn);
    mainContent.appendChild(activityColumn);

    // Assemble page
    page.appendChild(header);
    page.appendChild(statsSection);
    page.appendChild(mainContent);

    return page;
  }

  private setupEventListeners(): void {
    // Listen for task change events
    window.addEventListener('tasks-changed', this.tasksChangedHandler);
    
    // Also listen for storage events (for cross-tab updates)
    window.addEventListener('storage', (e) => {
      if (e.key === `tm_tasks_${this.userId}`) {
        console.log('Dashboard: Storage changed, refreshing...');
        this.smartRefresh();
      }
    });
  }

  private removeEventListeners(): void {
    window.removeEventListener('tasks-changed', this.tasksChangedHandler);
  }

  private handleTasksChanged(e: Event): void {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.userId === this.userId) {
      console.log('Dashboard: Tasks changed event received');
      this.smartRefresh();
    }
  }

  private async handleManualRefresh(): Promise<void> {
    const refreshBtn = this.element.querySelector('#dashboard-refresh-btn') as HTMLButtonElement;
    if (refreshBtn) {
      // Add spinning animation
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      refreshBtn.disabled = true;
      
      await this.refresh();
      
      // Restore button after 1 second
      setTimeout(() => {
        refreshBtn.innerHTML = originalHTML;
        refreshBtn.disabled = false;
      }, 1000);
    } else {
      await this.refresh();
    }
  }

  private async loadData(): Promise<void> {
    console.log('Dashboard: Starting data load...');
    const spinner = LoadingSpinner.showInline(this.element, 'Loading dashboard...');
    this.isRefreshing = true;

    try {
      // Load ALL tasks first
      console.log('Dashboard: Loading all tasks...');
      const allTasks = await this.taskController.getAllTasks();
      console.log(`Dashboard: Loaded ${allTasks.length} tasks`);

      if (!Array.isArray(allTasks)) {
        console.error('Dashboard: getAllTasks did not return an array:', allTasks);
        throw new Error('Failed to load tasks: Invalid data format');
      }

      // Initialize stats with all tasks
      this.statsController = new StatsController(allTasks);

      // Update stats
      this.updateStats();

      // Load today's tasks
      console.log('Dashboard: Loading today tasks...');
      let todayTasks: Task[] = [];
      try {
        todayTasks = await this.taskController.getTodayTasks();
        console.log(`Dashboard: Today tasks: ${todayTasks.length}`);
      } catch (error) {
        console.warn('Dashboard: Falling back to manual today task filtering', error);
        todayTasks = this.filterTodayTasks(allTasks);
      }
      
      this.renderTaskList(todayTasks, 'today-tasks');
      this.updateCounter('today-count', todayTasks.length);

      // Load upcoming tasks
      console.log('Dashboard: Loading upcoming tasks...');
      let upcomingTasks: Task[] = [];
      try {
        upcomingTasks = await this.taskController.getUpcomingTasks();
        console.log(`Dashboard: Upcoming tasks: ${upcomingTasks.length}`);
      } catch (error) {
        console.warn('Dashboard: Falling back to manual upcoming task filtering', error);
        upcomingTasks = this.filterUpcomingTasks(allTasks);
      }
      
      this.renderTaskList(upcomingTasks, 'upcoming-tasks');
      this.updateCounter('upcoming-count', upcomingTasks.length);

      // Get recent activity from ALL tasks
      console.log('Dashboard: Getting recent activity...');
      const recentActivity = this.getRecentActivity(allTasks);
      console.log(`Dashboard: Recent activity items: ${recentActivity.length}`);
      this.renderActivityList(recentActivity);

    } catch (error) {
      console.error('Dashboard: Failed to load dashboard data:', error);
      Toast.error('Failed to load dashboard data. Please try again.');
      
      // Show empty states
      this.renderTaskList([], 'today-tasks');
      this.renderTaskList([], 'upcoming-tasks');
      this.renderActivityList([]);
    } finally {
      spinner.hide();
      this.isRefreshing = false;
    }
  }

  private async smartRefresh(): Promise<void> {
    if (this.isRefreshing) {
      console.log('Dashboard: Already refreshing, skipping...');
      return;
    }
    
    console.log('Dashboard: Smart refresh triggered');
    this.isRefreshing = true;
    
    try {
      // Quick refresh - only reload tasks and update UI
      const allTasks = await this.taskController.getAllTasks();
      
      // Update stats
      this.statsController = new StatsController(allTasks);
      this.updateStats();
      
      // Update today's tasks
      const todayTasks = this.filterTodayTasks(allTasks);
      this.renderTaskList(todayTasks, 'today-tasks');
      this.updateCounter('today-count', todayTasks.length);
      
      // Update upcoming tasks
      const upcomingTasks = this.filterUpcomingTasks(allTasks);
      this.renderTaskList(upcomingTasks, 'upcoming-tasks');
      this.updateCounter('upcoming-count', upcomingTasks.length);
      
      // Update recent activity
      const recentActivity = this.getRecentActivity(allTasks);
      this.renderActivityList(recentActivity);
      
      console.log('Dashboard: Smart refresh completed');
    } catch (error) {
      console.error('Dashboard: Smart refresh failed:', error);
      // Don't show toast for auto-refresh failures
    } finally {
      this.isRefreshing = false;
    }
  }

  private async refresh(): Promise<void> {
    console.log('Dashboard: Full refresh triggered');
    await this.loadData();
    Toast.success('Dashboard refreshed');
  }

  private filterTodayTasks(tasks: Task[]): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      try {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate >= today && dueDate < tomorrow;
      } catch (error) {
        console.warn('Error parsing task due date:', task.dueDate);
        return false;
      }
    });
  }

  private filterUpcomingTasks(tasks: Task[]): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      try {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate > today && dueDate <= nextWeek;
      } catch (error) {
        console.warn('Error parsing task due date:', task.dueDate);
        return false;
      }
    });
  }

  private getRecentActivity(tasks: Task[]): Task[] {
    if (!tasks || tasks.length === 0) {
      return [];
    }
    
    console.log('Dashboard: Processing recent activity from', tasks.length, 'tasks');
    
    // Filter to only include tasks updated in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentTasks = tasks.filter(task => {
      try {
        if (!task.updatedAt) {
          return false;
        }
        
        const taskUpdatedAt = new Date(task.updatedAt);
        if (isNaN(taskUpdatedAt.getTime())) {
          return false;
        }
        
        return taskUpdatedAt > oneWeekAgo;
      } catch (error) {
        console.warn('Error processing task date:', task.id, error);
        return false;
      }
    });
    
    console.log('Dashboard: Found', recentTasks.length, 'recent tasks');
    
    // Sort by most recently updated and take top 5
    const sortedTasks = recentTasks.sort((a, b) => {
      try {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });
    
    return sortedTasks.slice(0, 5);
  }

  private updateStats(): void {
    const statsContainer = this.element.querySelector('#stats-container');
    if (!statsContainer) {
      console.error('Dashboard: Stats container not found');
      return;
    }

    try {
      const stats = this.statsController.getCompletionStats();
      const priorityStats = this.statsController.getPriorityDistribution();
      
      console.log('Dashboard: Stats calculated:', stats, priorityStats);
      
      statsContainer.innerHTML = '';

      // Create stats grid
      const statsGrid = document.createElement('div');
      statsGrid.className = 'stats-grid';

      // Completion rate
      const completionCard = this.createStatCard(
        'Completion Rate',
        `${Math.round(stats.completionRate)}%`,
        'primary',
        `${stats.completed}/${stats.total} tasks completed`
      );

      // Total tasks
      const totalCard = this.createStatCard(
        'Total Tasks',
        stats.total.toString(),
        'secondary',
        'All tasks in your list'
      );

      // Pending tasks
      const pendingCard = this.createStatCard(
        'Pending',
        (stats.todo + stats.inProgress).toString(),
        'warning',
        'Tasks to be done'
      );

      // High priority tasks
      const highPriorityCard = this.createStatCard(
        'High Priority',
        priorityStats.high.toString(),
        'danger',
        'Urgent tasks'
      );

      statsGrid.appendChild(completionCard);
      statsGrid.appendChild(totalCard);
      statsGrid.appendChild(pendingCard);
      statsGrid.appendChild(highPriorityCard);

      statsContainer.appendChild(statsGrid);
    } catch (error) {
      console.error('Dashboard: Error updating stats:', error);
      statsContainer.innerHTML = '<p class="error-message">Unable to load statistics</p>';
    }
  }

  private createStatCard(
    title: string,
    value: string,
    type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info',
    description: string
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = `stat-card stat-${type}`;

    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = value;

    const titleEl = document.createElement('div');
    titleEl.className = 'stat-title';
    titleEl.textContent = title;

    const descEl = document.createElement('div');
    descEl.className = 'stat-desc';
    descEl.textContent = description;

    card.appendChild(valueEl);
    card.appendChild(titleEl);
    card.appendChild(descEl);

    return card;
  }

  private renderTaskList(tasks: Task[], containerId: string): void {
    const container = this.element.querySelector(`#${containerId}`);
    if (!container) {
      console.error(`Dashboard: Container #${containerId} not found`);
      return;
    }

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (!tasks || tasks.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-state';
      
      if (containerId === 'today-tasks') {
        emptyMessage.textContent = 'No tasks due today. Great job!';
      } else {
        emptyMessage.textContent = 'No upcoming tasks.';
      }
      
      container.appendChild(emptyMessage);
      return;
    }

    // Create a list wrapper
    const listWrapper = document.createElement('div');
    listWrapper.className = 'task-list';
    
    tasks.forEach(task => {
      try {
        const taskItem = this.createTaskItem(task);
        listWrapper.appendChild(taskItem);
      } catch (error) {
        console.error('Dashboard: Error creating task item:', error, task);
      }
    });
    
    container.appendChild(listWrapper);
  }

  private createTaskItem(task: Task): HTMLElement {
    const item = document.createElement('div');
    item.className = 'dashboard-task-item';
    item.dataset.taskId = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.status === 'completed';
    checkbox.addEventListener('change', async () => {
      try {
        await this.taskController.toggleTaskCompletion(task.id);
        // Event will trigger auto-refresh
        Toast.success('Task updated');
      } catch (error) {
        console.error('Failed to toggle task completion:', error);
        Toast.error('Failed to update task');
      }
    });

    const content = document.createElement('div');
    content.className = 'task-item-content';

    const title = document.createElement('div');
    title.className = 'task-item-title';
    title.textContent = task.title || 'Untitled Task';

    const meta = document.createElement('div');
    meta.className = 'task-item-meta';

    const priority = document.createElement('span');
    priority.className = `task-priority priority-${task.priority}`;
    priority.textContent = task.priority || 'medium';

    if (task.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = 'task-due-date';
      
      try {
        const date = new Date(task.dueDate);
        dueDate.textContent = DateUtils.formatDate(date);
        
        const isOverdue = date < new Date() && task.status !== 'completed';
        if (isOverdue) {
          dueDate.classList.add('overdue');
        }
      } catch (error) {
        dueDate.textContent = 'Invalid date';
        console.warn('Invalid due date:', task.dueDate);
      }
      
      meta.appendChild(dueDate);
    }

    meta.appendChild(priority);

    content.appendChild(title);
    content.appendChild(meta);

    item.appendChild(checkbox);
    item.appendChild(content);

    // Click to view details (excluding checkbox)
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target !== checkbox && target.tagName !== 'INPUT') {
        this.onTaskClick(task.id);
      }
    });

    return item;
  }

  private renderActivityList(tasks: Task[]): void {
    const container = this.element.querySelector('#activity-list');
    if (!container) {
      console.error('Dashboard: Activity list container not found');
      return;
    }

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (!tasks || tasks.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-state';
      emptyMessage.textContent = 'No recent activity';
      container.appendChild(emptyMessage);
      return;
    }

    tasks.forEach(task => {
      try {
        const activityItem = this.createActivityItem(task);
        container.appendChild(activityItem);
      } catch (error) {
        console.error('Dashboard: Error creating activity item:', error, task);
      }
    });
  }

  private createActivityItem(task: Task): HTMLElement {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.dataset.taskId = task.id;

    const icon = document.createElement('div');
    icon.className = 'activity-icon';
    
    try {
      if (task.status === 'completed') {
        icon.textContent = '✓';
        icon.classList.add('activity-completed');
      } else if (task.updatedAt && task.createdAt) {
        const updated = new Date(task.updatedAt);
        const created = new Date(task.createdAt);
        
        if (!isNaN(updated.getTime()) && !isNaN(created.getTime()) && 
            updated.getTime() !== created.getTime()) {
          icon.textContent = '✎';
          icon.classList.add('activity-updated');
        } else {
          icon.textContent = '+';
          icon.classList.add('activity-created');
        }
      } else {
        icon.textContent = '+';
        icon.classList.add('activity-created');
      }
    } catch (error) {
      icon.textContent = 'ℹ';
      icon.classList.add('activity-info');
    }

    const content = document.createElement('div');
    content.className = 'activity-content';

    const action = document.createElement('div');
    action.className = 'activity-action';

    let actionText = 'Task activity';
    try {
      if (task.status === 'completed') {
        actionText = 'Task completed';
      } else if (task.updatedAt && task.createdAt) {
        const updated = new Date(task.updatedAt);
        const created = new Date(task.createdAt);
        
        if (!isNaN(updated.getTime()) && !isNaN(created.getTime()) && 
            updated.getTime() !== created.getTime()) {
          actionText = 'Task updated';
        } else {
          actionText = 'Task created';
        }
      } else {
        actionText = 'Task created';
      }
    } catch (error) {
      console.warn('Error determining activity type:', error);
    }

    action.textContent = actionText;

    const title = document.createElement('div');
    title.className = 'activity-title';
    title.textContent = task.title || 'Untitled Task';

    const time = document.createElement('div');
    time.className = 'activity-time';
    
    try {
      let dateToShow: Date | null = null;
      
      if (task.updatedAt) {
        dateToShow = new Date(task.updatedAt);
      } else if (task.createdAt) {
        dateToShow = new Date(task.createdAt);
      }
      
      if (dateToShow && !isNaN(dateToShow.getTime())) {
        time.textContent = DateUtils.formatDateTime(dateToShow);
      } else {
        time.textContent = 'Recently';
      }
    } catch (error) {
      time.textContent = 'Recently';
    }

    content.appendChild(action);
    content.appendChild(title);
    content.appendChild(time);

    item.appendChild(icon);
    item.appendChild(content);

    // Make activity items clickable to view task
    item.addEventListener('click', () => {
      this.onTaskClick(task.id);
    });

    return item;
  }

  private updateCounter(elementId: string, count: number): void {
    const counter = this.element.querySelector(`#${elementId}`);
    if (counter) {
      counter.textContent = count.toString();
    } else {
      console.warn(`Dashboard: Counter element #${elementId} not found`);
    }
  }

  private async showNewTaskForm(): Promise<void> {
    try {
      // Get categories from category controller
      const categories = await this.categoryController.getAllCategories();
      
      const taskForm = new TaskForm(
        async (taskData) => {
          try {
            if (!taskData.title || taskData.title.trim() === '') {
              Toast.error('Title is required');
              return;
            }
            
            const createData = {
              title: taskData.title.trim(),
              description: taskData.description?.trim() || '',
              priority: taskData.priority || 'medium',
              status: taskData.status || 'todo',
              dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
              categoryId: taskData.categoryId,
              tags: taskData.tags || []
            };
            
            console.log('Dashboard: Creating task with data:', createData);
            await this.taskController.createTask(createData);
            this.modal.close();
            // Event will trigger auto-refresh
            Toast.success('Task created successfully');
          } catch (error) {
            console.error('Dashboard: Failed to create task:', error);
            Toast.error('Failed to create task. Please try again.');
          }
        },
        () => this.modal.close(),
        categories
      );

      this.modal.open(taskForm.render(), {
        title: 'Create New Task',
        size: 'medium'
      });
    } catch (error) {
      console.error('Dashboard: Failed to load categories:', error);
      Toast.error('Failed to load categories');
    }
  }

  render(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.modal.close();
    this.removeEventListeners();
  }
}