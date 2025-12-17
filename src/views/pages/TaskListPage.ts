import { TaskController } from '../../controllers/taskController';
import { CategoryController } from '../../controllers/CategoryController';
import { Task, SortOption } from '../../types';
import { TaskCard } from '../components/TaskCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { TaskForm } from '../components/TaskForm';
import { Toast } from '../components/Toast';

export class TaskListPage {
  private element: HTMLElement;
  private taskController: TaskController;
  private categoryController: CategoryController;
  private modal: Modal;
  private currentLayout: 'list' | 'grid' | 'kanban' = 'list';
  private currentFilter = 'all';
  private currentSort: SortOption = 'createdAt';
  private isInitialized = false;

  constructor(userId: string, private onTaskClick: (taskId: string) => void) {
    this.taskController = new TaskController(userId);
    this.categoryController = new CategoryController(userId);
    this.modal = new Modal();
    this.element = this.createPage();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadTasks();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TaskListPage:', error);
      Toast.error('Failed to load tasks. Please refresh the page.');
    }
  }

  private createPage(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'task-list-page';

    // Header with controls
    const header = document.createElement('div');
    header.className = 'tasks-header';

    const titleSection = document.createElement('div');
    titleSection.className = 'tasks-title-section';

    const title = document.createElement('h1');
    title.className = 'tasks-title';
    title.textContent = 'All Tasks';

    const count = document.createElement('span');
    count.className = 'tasks-count';
    count.id = 'tasks-count';
    count.textContent = '0 tasks';

    titleSection.appendChild(title);
    titleSection.appendChild(count);

    const controls = document.createElement('div');
    controls.className = 'tasks-controls';

    // Layout toggle
    const layoutGroup = document.createElement('div');
    layoutGroup.className = 'control-group';

    const listLayoutBtn = document.createElement('button');
    listLayoutBtn.className = 'btn-icon layout-btn active';
    listLayoutBtn.innerHTML = '≡';
    listLayoutBtn.title = 'List view';
    listLayoutBtn.type = 'button';
    listLayoutBtn.addEventListener('click', () => this.setLayout('list'));

    const gridLayoutBtn = document.createElement('button');
    gridLayoutBtn.className = 'btn-icon layout-btn';
    gridLayoutBtn.innerHTML = '☷';
    gridLayoutBtn.title = 'Grid view';
    gridLayoutBtn.type = 'button';
    gridLayoutBtn.addEventListener('click', () => this.setLayout('grid'));

    const kanbanLayoutBtn = document.createElement('button');
    kanbanLayoutBtn.className = 'btn-icon layout-btn';
    kanbanLayoutBtn.innerHTML = '▯';
    kanbanLayoutBtn.title = 'Kanban view';
    kanbanLayoutBtn.type = 'button';
    kanbanLayoutBtn.addEventListener('click', () => this.setLayout('kanban'));

    layoutGroup.appendChild(listLayoutBtn);
    layoutGroup.appendChild(gridLayoutBtn);
    layoutGroup.appendChild(kanbanLayoutBtn);

    // Filter dropdown
    const filterGroup = document.createElement('div');
    filterGroup.className = 'control-group';

    const filterSelect = document.createElement('select');
    filterSelect.className = 'form-select';
    filterSelect.id = 'task-filter';

    const filterOptions = [
      { value: 'all', text: 'All Tasks' },
      { value: 'todo', text: 'To Do' },
      { value: 'in-progress', text: 'In Progress' },
      { value: 'completed', text: 'Completed' },
      { value: 'overdue', text: 'Overdue' },
      { value: 'today', text: 'Due Today' },
      { value: 'upcoming', text: 'Upcoming' }
    ];

    filterOptions.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.text;
      filterSelect.appendChild(optionEl);
    });

    filterSelect.value = this.currentFilter;
    filterSelect.addEventListener('change', (e) => {
      this.currentFilter = (e.target as HTMLSelectElement).value;
      this.loadTasks();
    });

    filterGroup.appendChild(filterSelect);

    // Sort dropdown
    const sortGroup = document.createElement('div');
    sortGroup.className = 'control-group';

    const sortSelect = document.createElement('select');
    sortSelect.className = 'form-select';
    sortSelect.id = 'task-sort';

    const sortOptions = [
      { value: 'createdAt', text: 'Date Created' },
      { value: 'dueDate', text: 'Due Date' },
      { value: 'priority', text: 'Priority' },
      { value: 'title', text: 'Title' },
      { value: 'updatedAt', text: 'Last Updated' }
    ];

    sortOptions.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.text;
      sortSelect.appendChild(optionEl);
    });

    sortSelect.value = this.currentSort;
    sortSelect.addEventListener('change', (e) => {
      this.currentSort = (e.target as HTMLSelectElement).value as SortOption;
      this.loadTasks();
    });

    sortGroup.appendChild(sortSelect);

    // Search input
    const searchGroup = document.createElement('div');
    searchGroup.className = 'control-group';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'form-input';
    searchInput.placeholder = 'Search tasks...';
    searchInput.id = 'task-search';

    let searchTimeout: number;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        this.loadTasks();
      }, 300);
    });

    searchGroup.appendChild(searchInput);

    // New task button
    const newTaskBtn = document.createElement('button');
    newTaskBtn.className = 'btn btn-primary';
    newTaskBtn.innerHTML = '+ New Task';
    newTaskBtn.type = 'button';
    newTaskBtn.addEventListener('click', () => this.showNewTaskForm());

    controls.appendChild(layoutGroup);
    controls.appendChild(filterGroup);
    controls.appendChild(sortGroup);
    controls.appendChild(searchGroup);
    controls.appendChild(newTaskBtn);

    header.appendChild(titleSection);
    header.appendChild(controls);

    // Tasks container
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container list-layout';
    tasksContainer.id = 'tasks-container';

    // Empty state (initially hidden)
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'tasks-empty-state';
    emptyState.style.display = 'none';

    const emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-icon';
    emptyIcon.textContent = '📋';

    const emptyTitle = document.createElement('h3');
    emptyTitle.textContent = 'No tasks found';

    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Create your first task to get started';

    const emptyAction = document.createElement('button');
    emptyAction.className = 'btn btn-primary';
    emptyAction.textContent = 'Create New Task';
    emptyAction.type = 'button';
    emptyAction.addEventListener('click', () => this.showNewTaskForm());

    emptyState.appendChild(emptyIcon);
    emptyState.appendChild(emptyTitle);
    emptyState.appendChild(emptyMessage);
    emptyState.appendChild(emptyAction);

    tasksContainer.appendChild(emptyState);

    // Assemble page
    page.appendChild(header);
    page.appendChild(tasksContainer);

    return page;
  }

  private async loadTasks(): Promise<void> {
    if (!this.element) return;

    const spinner = LoadingSpinner.showInline(this.element, 'Loading tasks...');
    const searchInput = this.element.querySelector<HTMLInputElement>('#task-search');
    const searchQuery = searchInput?.value || '';

    try {
      let tasks: Task[] = [];

      // Apply filters
      switch (this.currentFilter) {
        case 'todo':
          tasks = await this.taskController.getTasksByStatus('todo');
          break;
        case 'in-progress':
          tasks = await this.taskController.getTasksByStatus('in-progress');
          break;
        case 'completed':
          tasks = await this.taskController.getTasksByStatus('completed');
          break;
        case 'overdue':
          tasks = await this.taskController.getOverdueTasks();
          break;
        case 'today':
          tasks = await this.taskController.getTodayTasks();
          break;
        case 'upcoming':
          tasks = await this.taskController.getUpcomingTasks();
          break;
        default:
          tasks = this.taskController.getAllTasks();
          break;
      }

      // Apply search
      if (searchQuery.trim()) {
        tasks = await this.taskController.searchTasks(searchQuery);
      }

      // Apply sorting
      tasks = await this.taskController.sortTasks(tasks, this.currentSort);

      // Update count
      this.updateTaskCount(tasks.length);

      // Render tasks
      this.renderTasks(tasks);

    } catch (error) {
      console.error('Failed to load tasks:', error);
      Toast.error('Failed to load tasks');
      throw error;
    } finally {
      spinner.hide();
    }
  }

  private updateTaskCount(count: number): void {
    const countElement = this.element.querySelector('#tasks-count');
    if (countElement) {
      countElement.textContent = `${count} task${count !== 1 ? 's' : ''}`;
    }
  }

  private renderTasks(tasks: Task[]): void {
    const container = this.element.querySelector('#tasks-container');
    const emptyState = this.element.querySelector<HTMLElement>('#tasks-empty-state');
    
    if (!container) return;

    // Clear current tasks (keep empty state)
    const currentTasks = container.querySelectorAll('.task-item, .task-card, .kanban-column, .task-list, .task-grid, .kanban-board');
    currentTasks.forEach(task => {
      if (!(task instanceof HTMLElement) || !task.id.includes('empty')) {
        task.remove();
      }
    });

    // Show/hide empty state
    if (emptyState) {
      emptyState.style.display = tasks.length === 0 ? 'block' : 'none';
    }

    if (tasks.length === 0) return;

    // Render based on current layout
    switch (this.currentLayout) {
      case 'list':
        this.renderListLayout(tasks, container as HTMLElement);
        break;
      case 'grid':
        this.renderGridLayout(tasks, container as HTMLElement);
        break;
      case 'kanban':
        this.renderKanbanLayout(tasks, container as HTMLElement);
        break;
    }
  }

  private renderListLayout(tasks: Task[], container: HTMLElement): void {
    const list = document.createElement('div');
    list.className = 'task-list';

    tasks.forEach(task => {
      const taskItem = this.createListItem(task);
      list.appendChild(taskItem);
    });

    container.appendChild(list);
  }

  private createListItem(task: Task): HTMLElement {
    const item = document.createElement('div');
    item.className = 'task-item list-item';
    item.dataset.taskId = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.status === 'completed';
    checkbox.addEventListener('change', async () => {
      try {
        await this.taskController.toggleTaskCompletion(task.id);
        this.loadTasks();
      } catch (error) {
        console.error('Failed to toggle task completion:', error);
        Toast.error('Failed to update task');
      }
    });

    const content = document.createElement('div');
    content.className = 'task-item-content';

    const header = document.createElement('div');
    header.className = 'task-item-header';

    const title = document.createElement('h3');
    title.className = 'task-item-title';
    title.textContent = task.title;

    const priority = document.createElement('span');
    priority.className = `task-priority priority-${task.priority}`;
    priority.textContent = task.priority;

    header.appendChild(title);
    header.appendChild(priority);

    const description = document.createElement('p');
    description.className = 'task-item-description';
    description.textContent = task.description || 'No description';

    const footer = document.createElement('div');
    footer.className = 'task-item-footer';

    if (task.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = 'task-due-date';
      dueDate.textContent = new Date(task.dueDate).toLocaleDateString();
      
      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
      if (isOverdue) {
        dueDate.classList.add('overdue');
      }
      
      footer.appendChild(dueDate);
    }

    if (task.tags && task.tags.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'task-tags';
      
      task.tags.slice(0, 3).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'task-tag';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
      });
      
      footer.appendChild(tags);
    }

    content.appendChild(header);
    content.appendChild(description);
    content.appendChild(footer);

    const actions = document.createElement('div');
    actions.className = 'task-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.innerHTML = '✎';
    editBtn.title = 'Edit task';
    editBtn.type = 'button';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showEditTaskForm(task);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.innerHTML = '🗑';
    deleteBtn.title = 'Delete task';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDeleteTask(task);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(checkbox);
    item.appendChild(content);
    item.appendChild(actions);

    // Click to view details
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target !== checkbox && !target.closest('.btn-icon')) {
        this.onTaskClick(task.id);
      }
    });

    return item;
  }

  private renderGridLayout(tasks: Task[], container: HTMLElement): void {
    const grid = document.createElement('div');
    grid.className = 'task-grid';

    tasks.forEach(task => {
      const taskCard = new TaskCard(
        task,
        async (taskId: string) => {
          try {
            await this.taskController.toggleTaskCompletion(taskId);
            this.loadTasks();
          } catch (error) {
            console.error('Failed to toggle task completion:', error);
            Toast.error('Failed to update task');
          }
        },
        () => this.showEditTaskForm(task),
        (taskId: string) => this.onTaskClick(taskId)
      );
      const cardElement = taskCard.render();
      if (cardElement) {
        grid.appendChild(cardElement);
      }
    });

    container.appendChild(grid);
  }

  private renderKanbanLayout(tasks: Task[], container: HTMLElement): void {
    const kanban = document.createElement('div');
    kanban.className = 'kanban-board';

    // Define statuses for kanban board
    const statuses = [
      { id: 'todo', title: 'To Do', color: '#6c757d' },
      { id: 'in-progress', title: 'In Progress', color: '#fd7e14' },
      { id: 'completed', title: 'Completed', color: '#28a745' }
    ];

    statuses.forEach(status => {
      const column = document.createElement('div');
      column.className = 'kanban-column';
      column.dataset.status = status.id;

      const header = document.createElement('div');
      header.className = 'kanban-column-header';
      header.style.borderTopColor = status.color;

      const title = document.createElement('h3');
      title.className = 'kanban-column-title';
      title.textContent = status.title;

      const count = document.createElement('span');
      count.className = 'kanban-column-count';
      count.textContent = '0';

      header.appendChild(title);
      header.appendChild(count);

      const body = document.createElement('div');
      body.className = 'kanban-column-body';
      body.dataset.status = status.id;

      // Make column droppable
      body.addEventListener('dragover', (e) => {
        e.preventDefault();
        body.classList.add('drag-over');
      });

      body.addEventListener('dragleave', () => {
        body.classList.remove('drag-over');
      });

      body.addEventListener('drop', async (e) => {
        e.preventDefault();
        body.classList.remove('drag-over');
        
        const dragEvent = e as DragEvent;
        const taskId = dragEvent.dataTransfer?.getData('taskId');
        if (taskId) {
          try {
            await this.taskController.updateTask(taskId, { 
              status: status.id as 'todo' | 'in-progress' | 'completed' 
            });
            this.loadTasks();
            Toast.success(`Task moved to ${status.title}`);
          } catch (error) {
            console.error('Failed to move task:', error);
            Toast.error('Failed to move task');
          }
        }
      });

      column.appendChild(header);
      column.appendChild(body);
      kanban.appendChild(column);
    });

    // Populate columns with tasks
    statuses.forEach(status => {
      const columnTasks = tasks.filter(task => task.status === status.id);
      const columnBody = kanban.querySelector<HTMLElement>(`[data-status="${status.id}"] .kanban-column-body`);
      const countElement = kanban.querySelector<HTMLElement>(`[data-status="${status.id}"] .kanban-column-count`);
      
      if (countElement) {
        countElement.textContent = columnTasks.length.toString();
      }
      
      if (columnBody) {
        columnTasks.forEach(task => {
          const card = this.createKanbanCard(task);
          columnBody.appendChild(card);
        });
      }
    });

    container.appendChild(kanban);
  }

  private createKanbanCard(task: Task): HTMLElement {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.taskId = task.id;
    card.draggable = true;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      const dragEvent = e as DragEvent;
      dragEvent.dataTransfer?.setData('taskId', task.id);
      dragEvent.dataTransfer!.effectAllowed = 'move';
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    const title = document.createElement('div');
    title.className = 'kanban-card-title';
    title.textContent = task.title;

    const priority = document.createElement('div');
    priority.className = `kanban-card-priority priority-${task.priority}`;
    priority.title = `${task.priority} priority`;

    card.appendChild(title);
    card.appendChild(priority);

    // Click to view details
    card.addEventListener('click', () => {
      this.onTaskClick(task.id);
    });

    return card;
  }

  private setLayout(layout: 'list' | 'grid' | 'kanban'): void {
    this.currentLayout = layout;
    
    // Update active layout button
    const layoutBtns = this.element.querySelectorAll<HTMLButtonElement>('.layout-btn');
    layoutBtns.forEach(btn => btn.classList.remove('active'));
    
    const layoutMap = {
      'list': 0,
      'grid': 1,
      'kanban': 2
    };
    
    const targetBtn = layoutBtns[layoutMap[layout]];
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
    
    // Update container class
    const container = this.element.querySelector<HTMLElement>('#tasks-container');
    if (container) {
      container.className = 'tasks-container ' + layout + '-layout';
    }
    
    // Reload tasks with new layout
    this.loadTasks();
  }

  private async showNewTaskForm(): Promise<void> {
    try {
      // Get categories from category controller
      const categories = await this.categoryController.getAllCategories();
      
      const taskForm = new TaskForm(
        async (taskData) => {
          try {
            // Ensure required fields are present
            if (!taskData.title) {
              Toast.error('Title is required');
              return;
            }
            
            // Create a properly typed task creation data
            const createData = {
              title: taskData.title,
              description: taskData.description || '',
              priority: taskData.priority || 'medium',
              status: taskData.status || 'todo',
              // Convert Date to ISO string if it exists
              dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
              categoryId: taskData.categoryId,
              tags: taskData.tags || []
            };
            
            await this.taskController.createTask(createData);
            this.modal.close();
            this.loadTasks();
            Toast.success('Task created successfully');
          } catch (error) {
            console.error('Failed to create task:', error);
            Toast.error('Failed to create task');
          }
        },
        () => this.modal.close(),
        categories // Pass categories here
      );

      this.modal.open(taskForm.render(), {
        title: 'Create New Task',
        size: 'medium'
      });
    } catch (error) {
      console.error('Failed to load categories:', error);
      Toast.error('Failed to load categories');
    }
  }

  private async showEditTaskForm(task: Task): Promise<void> {
    try {
      // Get categories from category controller
      const categories = await this.categoryController.getAllCategories();
      
      const taskForm = new TaskForm(
        async (taskData) => {
          try {
            // Ensure required fields are present
            if (!taskData.title) {
              Toast.error('Title is required');
              return;
            }
            
            // Create a properly typed task update data
            const updateData = {
              title: taskData.title,
              description: taskData.description || '',
              priority: taskData.priority || task.priority,
              status: taskData.status || task.status,
              // Convert Date to ISO string if it exists
              dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined,
              categoryId: taskData.categoryId,
              tags: taskData.tags || []
            };
            
            await this.taskController.updateTask(task.id, updateData);
            this.modal.close();
            this.loadTasks();
            Toast.success('Task updated successfully');
          } catch (error) {
            console.error('Failed to update task:', error);
            Toast.error('Failed to update task');
          }
        },
        () => this.modal.close(),
        categories, // Pass categories here
        task // Pass existing task
      );

      this.modal.open(taskForm.render(), {
        title: 'Edit Task',
        size: 'medium'
      });
    } catch (error) {
      console.error('Failed to load categories:', error);
      Toast.error('Failed to load categories');
    }
  }

  private async confirmDeleteTask(task: Task): Promise<void> {
    const modal = new Modal();
    
    const confirmContent = document.createElement('div');
    confirmContent.className = 'confirm-dialog';
    
    const message = document.createElement('p');
    message.textContent = `Are you sure you want to delete "${task.title}"? This action cannot be undone.`;
    
    const actions = document.createElement('div');
    actions.className = 'confirm-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => modal.close());
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', async () => {
      try {
        await this.taskController.deleteTask(task.id);
        modal.close();
        this.loadTasks();
        Toast.success('Task deleted successfully');
      } catch (error) {
        console.error('Failed to delete task:', error);
        Toast.error('Failed to delete task');
      }
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(deleteBtn);
    
    confirmContent.appendChild(message);
    confirmContent.appendChild(actions);
    
    modal.open(confirmContent, {
      title: 'Confirm Delete',
      size: 'small'
    });
  }

  render(): HTMLElement {
    return this.element;
  }

  refresh(): void {
    if (this.isInitialized) {
      this.loadTasks();
    }
  }

  destroy(): void {
    // Cleanup event listeners if needed
    this.modal.close();
  }
}