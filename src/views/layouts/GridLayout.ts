import { Task } from '../../types';
import { TaskCard } from '../components/TaskCard';

export class GridLayout {
  private element: HTMLElement;
  private tasks: Task[] = [];

  constructor(tasks: Task[] = []) {
    this.tasks = tasks;
    this.element = this.createLayout();
  }

  private createLayout(): HTMLElement {
    const layout = document.createElement('div');
    layout.className = 'grid-layout';

    const grid = document.createElement('div');
    grid.className = 'task-grid';
    grid.id = 'task-grid';

    layout.appendChild(grid);

    return layout;
  }

  renderTasks(
    tasks: Task[], 
    onTaskClick: (taskId: string) => void, 
    onTaskUpdate: () => void,
    onToggleComplete: (taskId: string) => Promise<void>,
    onEditTask: (taskId: string) => void
  ): void {
    const grid = this.element.querySelector('#task-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (tasks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'grid-empty-state';
      
      const emptyIcon = document.createElement('div');
      emptyIcon.className = 'empty-icon';
      emptyIcon.textContent = '📋';
      
      const emptyText = document.createElement('p');
      emptyText.textContent = 'No tasks found';
      
      emptyState.appendChild(emptyIcon);
      emptyState.appendChild(emptyText);
      grid.appendChild(emptyState);
      return;
    }

    tasks.forEach(task => {
      const taskCard = new TaskCard(task, onToggleComplete, onEditTask, onTaskClick);
      const cardElement = taskCard.render();
      
      // Add click handler to view task
      cardElement.addEventListener('click', () => {
        onTaskClick(task.id);
      });
      
      grid.appendChild(cardElement);
    });
  }

  render(): HTMLElement {
    return this.element;
  }

  updateTasks(tasks: Task[]): void {
    this.tasks = tasks;
  }

  setGridColumns(columns: number): void {
    const grid = this.element.querySelector('.task-grid');
    if (grid instanceof HTMLElement) {
      grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
  }
}