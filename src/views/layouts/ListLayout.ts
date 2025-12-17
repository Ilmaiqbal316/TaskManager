import { Task } from '../../types';
import { DateUtils } from '../../utils/dateUtils';

export class ListLayout {
  private element: HTMLElement;
  private tasks: Task[] = [];

  constructor(tasks: Task[] = []) {
    this.tasks = tasks;
    this.element = this.createLayout();
  }

  private createLayout(): HTMLElement {
    const layout = document.createElement('div');
    layout.className = 'list-layout';

    // Create table structure
    const table = document.createElement('table');
    table.className = 'task-table';

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = [
      { text: '', class: 'col-checkbox' },
      { text: 'Title', class: 'col-title' },
      { text: 'Priority', class: 'col-priority' },
      { text: 'Status', class: 'col-status' },
      { text: 'Due Date', class: 'col-due-date' },
      { text: 'Tags', class: 'col-tags' },
      { text: 'Actions', class: 'col-actions' }
    ];

    headers.forEach(header => {
      const th = document.createElement('th');
      th.className = header.class;
      th.textContent = header.text;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    tbody.id = 'task-table-body';

    table.appendChild(tbody);

    layout.appendChild(table);

    return layout;
  }

  renderTasks(tasks: Task[], onTaskClick: (taskId: string) => void, onTaskUpdate: () => void): void {
    const tbody = this.element.querySelector('#task-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (tasks.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 7;
      emptyCell.className = 'empty-cell';
      emptyCell.textContent = 'No tasks found';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }

    tasks.forEach(task => {
      const row = this.createTableRow(task, onTaskClick, onTaskUpdate);
      tbody.appendChild(row);
    });
  }

  private createTableRow(
    task: Task,
    onTaskClick: (taskId: string) => void,
    onTaskUpdate: () => void
  ): HTMLTableRowElement {
    const row = document.createElement('tr');
    row.className = 'task-row';
    row.dataset.taskId = task.id;
    row.dataset.priority = task.priority;
    row.dataset.status = task.status;

    // Checkbox column
    const checkboxCell = document.createElement('td');
    checkboxCell.className = 'col-checkbox';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.status === 'completed';
    checkbox.addEventListener('change', onTaskUpdate);

    checkboxCell.appendChild(checkbox);

    // Title column
    const titleCell = document.createElement('td');
    titleCell.className = 'col-title';

    const titleLink = document.createElement('a');
    titleLink.href = '#';
    titleLink.className = 'task-title-link';
    titleLink.textContent = task.title;
    titleLink.addEventListener('click', (e) => {
      e.preventDefault();
      onTaskClick(task.id);
    });

    if (task.description) {
      titleLink.title = task.description;
    }

    titleCell.appendChild(titleLink);

    // Priority column
    const priorityCell = document.createElement('td');
    priorityCell.className = 'col-priority';

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${task.priority}`;
    priorityBadge.textContent = task.priority;

    priorityCell.appendChild(priorityBadge);

    // Status column
    const statusCell = document.createElement('td');
    statusCell.className = 'col-status';

    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${task.status}`;
    statusBadge.textContent = this.formatStatus(task.status);

    statusCell.appendChild(statusBadge);

    // Due date column
    const dueDateCell = document.createElement('td');
    dueDateCell.className = 'col-due-date';

    if (task.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = 'due-date';
      dueDate.textContent = DateUtils.formatDate(task.dueDate);
      
      if (DateUtils.isOverdue(task.dueDate) && task.status !== 'completed') {
        dueDate.classList.add('overdue');
      }
      
      dueDateCell.appendChild(dueDate);
    } else {
      dueDateCell.textContent = '—';
    }

    // Tags column
    const tagsCell = document.createElement('td');
    tagsCell.className = 'col-tags';

    if (task.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'tags-container';
      
      task.tags.slice(0, 3).forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
      });
      
      if (task.tags.length > 3) {
        const moreTag = document.createElement('span');
        moreTag.className = 'tag tag-more';
        moreTag.textContent = `+${task.tags.length - 3}`;
        tagsContainer.appendChild(moreTag);
      }
      
      tagsCell.appendChild(tagsContainer);
    }

    // Actions column
    const actionsCell = document.createElement('td');
    actionsCell.className = 'col-actions';

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'table-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon btn-edit';
    editBtn.innerHTML = '✎';
    editBtn.title = 'Edit task';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onTaskClick(task.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon btn-delete';
    deleteBtn.innerHTML = '🗑';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Delete functionality would be handled by parent
    });

    actionsContainer.appendChild(editBtn);
    actionsContainer.appendChild(deleteBtn);
    actionsCell.appendChild(actionsContainer);

    // Assemble row
    row.appendChild(checkboxCell);
    row.appendChild(titleCell);
    row.appendChild(priorityCell);
    row.appendChild(statusCell);
    row.appendChild(dueDateCell);
    row.appendChild(tagsCell);
    row.appendChild(actionsCell);

    return row;
  }

  private formatStatus(status: string): string {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  render(): HTMLElement {
    return this.element;
  }

  updateTasks(tasks: Task[]): void {
    this.tasks = tasks;
  }
}