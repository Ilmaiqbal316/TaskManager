import { Task } from '../../types';

export class TaskCard {
  private element: HTMLElement;
  
  constructor(
    private task: Task,
    private onToggleComplete: (taskId: string) => Promise<void>,
    private onEditTask: (taskId: string) => void,
    private onViewTask: (taskId: string) => void
  ) {
    this.element = this.createCard();
  }
  
  private formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    
    const now = new Date();
    const taskDate = new Date(date);
    
    // If within 24 hours, show relative time
    const diffInHours = (taskDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > -24) {
      if (diffInHours > 0 && diffInHours < 1) {
        return 'Due in less than an hour';
      } else if (diffInHours >= 1) {
        return `Due in ${Math.floor(diffInHours)} hours`;
      } else if (diffInHours > -1) {
        return 'Overdue by less than an hour';
      } else {
        return `Overdue by ${Math.floor(-diffInHours)} hours`;
      }
    }
    
    // Otherwise show formatted date
    return taskDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: taskDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
  
  private async handleToggleComplete(): Promise<void> {
    await this.onToggleComplete(this.task.id);
  }
  
  private handleEditTask(): void {
    this.onEditTask(this.task.id);
  }
  
  private createCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.priority = this.task.priority;
    card.dataset.status = this.task.status;
    card.draggable = true;
    
    // Priority indicator
    const priorityIndicator = document.createElement('div');
    priorityIndicator.className = `priority-indicator priority-${this.task.priority}`;
    
    // Content
    const content = document.createElement('div');
    content.className = 'task-content';
    
    const title = document.createElement('h3');
    title.textContent = this.task.title;
    
    const description = document.createElement('p');
    description.textContent = this.task.description;
    
    // Metadata
    const metadata = document.createElement('div');
    metadata.className = 'task-metadata';
    
    if (this.task.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = 'due-date';
      dueDate.textContent = this.formatDate(this.task.dueDate);
      
      // Overdue indicator
      if (new Date(this.task.dueDate) < new Date() && this.task.status !== 'completed') {
        dueDate.classList.add('overdue');
      }
      
      metadata.appendChild(dueDate);
    }
    
    // Tags
    if (this.task.tags && this.task.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'task-tags';
      
      this.task.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
      });
      
      metadata.appendChild(tagsContainer);
    }
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn-icon';
    completeBtn.innerHTML = this.task.status === 'completed' ? '✓' : '◯';
    completeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.handleToggleComplete();
    });
    completeBtn.title = this.task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleEditTask();
    });
    editBtn.title = 'Edit task';
    
    // Assemble
    content.appendChild(title);
    content.appendChild(description);
    
    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    
    card.appendChild(priorityIndicator);
    card.appendChild(content);
    card.appendChild(metadata);
    card.appendChild(actions);
    
    // Add click handler for viewing task details
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('btn-icon') && !target.closest('.btn-icon')) {
        this.onViewTask(this.task.id);
      }
    });
    
    return card;
  }
  
  render(): HTMLElement {
    return this.element;
  }
  
  getTask(): Task {
    return this.task;
  }
  
  updateTask(updatedTask: Task): void {
    this.task = updatedTask;
    const newCard = this.createCard();
    this.element.parentNode?.replaceChild(newCard, this.element);
    this.element = newCard;
  }
}