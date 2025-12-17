import { Task } from '../../types';
import { DateUtils } from '../../utils/dateUtils';
import { DragDropManager } from '../../utils/dragDrop';

export class KanbanLayout {
  private element: HTMLElement;
  private dragDropManager: DragDropManager;

  constructor(private tasks: Task[] = []) {
    this.dragDropManager = new DragDropManager();
    this.element = this.createLayout();
  }

  private createLayout(): HTMLElement {
    const layout = document.createElement('div');
    layout.className = 'kanban-layout';

    const board = document.createElement('div');
    board.className = 'kanban-board';
    board.id = 'kanban-board';

    const columns = [
      { id: 'todo', title: 'To Do', color: '#6c757d' },
      { id: 'in-progress', title: 'In Progress', color: '#fd7e14' },
      { id: 'completed', title: 'Completed', color: '#28a745' }
    ];

    columns.forEach(column => {
      const columnElement = this.createColumn(column);
      board.appendChild(columnElement);
    });

    layout.appendChild(board);

    return layout;
  }

  private createColumn(column: { id: string; title: string; color: string }): HTMLElement {
    const columnElement = document.createElement('div');
    columnElement.className = 'kanban-column';
    columnElement.dataset.status = column.id;

    const header = document.createElement('div');
    header.className = 'kanban-column-header';
    header.style.borderTopColor = column.color;

    const title = document.createElement('h3');
    title.className = 'kanban-column-title';
    title.textContent = column.title;

    const count = document.createElement('span');
    count.className = 'kanban-column-count';
    count.textContent = '0';

    header.appendChild(title);
    header.appendChild(count);

    const body = document.createElement('div');
    body.className = 'kanban-column-body';
    body.dataset.status = column.id;

    // Make droppable
    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('drag-over');
    });

    body.addEventListener('dragleave', () => {
      body.classList.remove('drag-over');
    });

    body.addEventListener('drop', (e) => {
      e.preventDefault();
      body.classList.remove('drag-over');
    });

    columnElement.appendChild(header);
    columnElement.appendChild(body);

    return columnElement;
  }

     renderTasks(tasks: Task[], onTaskClick: (taskId: string) => void, onTaskUpdate?: () => void): void {
    this.tasks = tasks;
    
    const columns = ['todo', 'in-progress', 'completed'];
    
    columns.forEach(status => {
      const columnTasks = tasks.filter(task => task.status === status);
      const columnBody = this.element.querySelector(`[data-status="${status}"] .kanban-column-body`);
      const countElement = this.element.querySelector(`[data-status="${status}"] .kanban-column-count`);
      
      if (countElement) {
        countElement.textContent = columnTasks.length.toString();
      }
      
      if (columnBody) {
        columnBody.innerHTML = '';
        
        if (columnTasks.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.className = 'kanban-empty';
          emptyMessage.textContent = 'No tasks';
          columnBody.appendChild(emptyMessage);
        } else {
          columnTasks.forEach(task => {
            const card = this.createCard(task, onTaskClick);
            columnBody.appendChild(card);
          });
        }
      }
    });

    // Initialize drag and drop
    this.dragDropManager.initialize(this.element);
  }

  private createCard(task: Task, onTaskClick: (taskId: string) => void): HTMLElement {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.taskId = task.id;
    card.draggable = true;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('taskId', task.id);
      e.dataTransfer?.setData('status', task.status);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Header
    const header = document.createElement('div');
    header.className = 'kanban-card-header';

    const priority = document.createElement('span');
    priority.className = `kanban-card-priority priority-${task.priority}`;

    const menuBtn = document.createElement('button');
    menuBtn.className = 'kanban-card-menu';
    menuBtn.innerHTML = '⋯';
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show context menu
    });

    header.appendChild(priority);
    header.appendChild(menuBtn);

    // Content
    const content = document.createElement('div');
    content.className = 'kanban-card-content';

    const title = document.createElement('h4');
    title.className = 'kanban-card-title';
    title.textContent = task.title;

    if (task.description) {
      const description = document.createElement('p');
      description.className = 'kanban-card-description';
      description.textContent = task.description;
      content.appendChild(description);
    }

    content.appendChild(title);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'kanban-card-footer';

    if (task.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = 'kanban-card-due';
      dueDate.textContent = DateUtils.formatDate(task.dueDate);
      
      if (DateUtils.isOverdue(task.dueDate) && task.status !== 'completed') {
        dueDate.classList.add('overdue');
      }
      
      footer.appendChild(dueDate);
    }

    if (task.tags.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'kanban-card-tags';
      
      task.tags.slice(0, 2).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'kanban-card-tag';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
      });
      
      footer.appendChild(tags);
    }

    // Assemble card
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    // Click to view details
    card.addEventListener('click', () => {
      onTaskClick(task.id);
    });

    return card;
  }

  render(): HTMLElement {
    return this.element;
  }

  updateTasks(tasks: Task[]): void {
    this.tasks = tasks;
  }

   setOnDrop(callback: (taskId: string, newStatus: string) => void): void {
    const columns = this.element.querySelectorAll('.kanban-column-body');
    
    columns.forEach(column => {
      column.addEventListener('drop', (e: Event) => {
        const dragEvent = e as DragEvent;
        dragEvent.preventDefault();
        const taskId = dragEvent.dataTransfer?.getData('taskId');
        const target = dragEvent.target as HTMLElement;
        const columnBody = target.closest('.kanban-column-body');
        const newStatus = columnBody?.getAttribute('data-status');
        
        if (taskId && newStatus) {
          callback(taskId, newStatus);
        }
      });
    });
  }
}