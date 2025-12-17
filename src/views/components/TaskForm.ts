import { Task, Category } from '../../types';
// Remove DateUtils import since it's not being used
// import { DateUtils } from '../../utils/DateUtils';

export class TaskForm {
  private element: HTMLElement;
  private categories: Category[] = [];

  constructor(
    private onSubmit: (taskData: Partial<Task>) => Promise<void>,
    private onCancel: () => void,
    categories: Category[],
    private existingTask?: Task
  ) {
    this.categories = categories || [];
    this.element = this.createForm();
  }

  private createForm(): HTMLElement {
    const form = document.createElement('div');
    form.className = 'task-form';

    // Title field
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';

    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'task-title';
    titleLabel.textContent = 'Title *';
    titleLabel.className = 'form-label';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'task-title';
    titleInput.className = 'form-input';
    titleInput.required = true;
    titleInput.placeholder = 'Enter task title';
    titleInput.value = this.existingTask?.title || '';

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);

    // Description field
    const descriptionGroup = document.createElement('div');
    descriptionGroup.className = 'form-group';

    const descriptionLabel = document.createElement('label');
    descriptionLabel.htmlFor = 'task-description';
    descriptionLabel.textContent = 'Description';
    descriptionLabel.className = 'form-label';

    const descriptionTextarea = document.createElement('textarea');
    descriptionTextarea.id = 'task-description';
    descriptionTextarea.className = 'form-input';
    descriptionTextarea.rows = 4;
    descriptionTextarea.placeholder = 'Enter task description';
    descriptionTextarea.value = this.existingTask?.description || '';

    descriptionGroup.appendChild(descriptionLabel);
    descriptionGroup.appendChild(descriptionTextarea);

    // Priority field
    const priorityGroup = document.createElement('div');
    priorityGroup.className = 'form-group';

    const priorityLabel = document.createElement('label');
    priorityLabel.htmlFor = 'task-priority';
    priorityLabel.textContent = 'Priority';
    priorityLabel.className = 'form-label';

    const prioritySelect = document.createElement('select');
    prioritySelect.id = 'task-priority';
    prioritySelect.className = 'form-select';

    const priorities = ['low', 'medium', 'high'];
    priorities.forEach(priority => {
      const option = document.createElement('option');
      option.value = priority;
      option.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
      option.selected = this.existingTask?.priority === priority;
      prioritySelect.appendChild(option);
    });

    priorityGroup.appendChild(priorityLabel);
    priorityGroup.appendChild(prioritySelect);

    // Status field (only for edit)
    let statusGroup: HTMLElement | null = null;
    if (this.existingTask) {
      statusGroup = document.createElement('div');
      statusGroup.className = 'form-group';

      const statusLabel = document.createElement('label');
      statusLabel.htmlFor = 'task-status';
      statusLabel.textContent = 'Status';
      statusLabel.className = 'form-label';

      const statusSelect = document.createElement('select');
      statusSelect.id = 'task-status';
      statusSelect.className = 'form-select';

      const statuses = ['todo', 'in-progress', 'completed'];
      statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
        option.selected = this.existingTask?.status === status;
        statusSelect.appendChild(option);
      });

      statusGroup.appendChild(statusLabel);
      statusGroup.appendChild(statusSelect);
    }

    // Due Date field
    const dueDateGroup = document.createElement('div');
    dueDateGroup.className = 'form-group';

    const dueDateLabel = document.createElement('label');
    dueDateLabel.htmlFor = 'task-due-date';
    dueDateLabel.textContent = 'Due Date';
    dueDateLabel.className = 'form-label';

    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    dueDateInput.id = 'task-due-date';
    dueDateInput.className = 'form-input';
    if (this.existingTask?.dueDate) {
      dueDateInput.value = new Date(this.existingTask.dueDate).toISOString().split('T')[0];
    }

    dueDateGroup.appendChild(dueDateLabel);
    dueDateGroup.appendChild(dueDateInput);

    // Category field (if categories exist)
    let categoryGroup: HTMLElement | null = null;
    if (this.categories.length > 0) {
      categoryGroup = document.createElement('div');
      categoryGroup.className = 'form-group';

      const categoryLabel = document.createElement('label');
      categoryLabel.htmlFor = 'task-category';
      categoryLabel.textContent = 'Category';
      categoryLabel.className = 'form-label';

      const categorySelect = document.createElement('select');
      categorySelect.id = 'task-category';
      categorySelect.className = 'form-select';

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'No category';
      defaultOption.selected = !this.existingTask?.categoryId;
      categorySelect.appendChild(defaultOption);

      this.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.selected = this.existingTask?.categoryId === category.id;
        categorySelect.appendChild(option);
      });

      categoryGroup.appendChild(categoryLabel);
      categoryGroup.appendChild(categorySelect);
    }

    // Tags field
    const tagsGroup = document.createElement('div');
    tagsGroup.className = 'form-group';

    const tagsLabel = document.createElement('label');
    tagsLabel.htmlFor = 'task-tags';
    tagsLabel.textContent = 'Tags (comma-separated)';
    tagsLabel.className = 'form-label';

    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.id = 'task-tags';
    tagsInput.className = 'form-input';
    tagsInput.placeholder = 'work, urgent, personal';
    tagsInput.value = this.existingTask?.tags?.join(', ') || '';

    tagsGroup.appendChild(tagsLabel);
    tagsGroup.appendChild(tagsInput);

    // Form actions
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.onCancel());

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary';
    submitButton.textContent = this.existingTask ? 'Update Task' : 'Create Task';
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    actions.appendChild(cancelButton);
    actions.appendChild(submitButton);

    // Assemble form
    form.appendChild(titleGroup);
    form.appendChild(descriptionGroup);
    form.appendChild(priorityGroup);
    if (statusGroup) {
      form.appendChild(statusGroup);
    }
    form.appendChild(dueDateGroup);
    if (categoryGroup) {
      form.appendChild(categoryGroup);
    }
    form.appendChild(tagsGroup);
    form.appendChild(actions);

    return form;
  }

  private async handleSubmit(): Promise<void> {
    const titleInput = this.element.querySelector<HTMLInputElement>('#task-title');
    const descriptionTextarea = this.element.querySelector<HTMLTextAreaElement>('#task-description');
    const prioritySelect = this.element.querySelector<HTMLSelectElement>('#task-priority');
    const statusSelect = this.element.querySelector<HTMLSelectElement>('#task-status');
    const dueDateInput = this.element.querySelector<HTMLInputElement>('#task-due-date');
    const categorySelect = this.element.querySelector<HTMLSelectElement>('#task-category');
    const tagsInput = this.element.querySelector<HTMLInputElement>('#task-tags');

    if (!titleInput || !titleInput.value.trim()) {
      alert('Title is required');
      return;
    }

    const taskData: Partial<Task> = {
      title: titleInput.value.trim(),
      description: descriptionTextarea?.value.trim() || '',
      priority: (prioritySelect?.value as Task['priority']) || 'medium',
      // Fix: Convert string to Date object
      dueDate: dueDateInput?.value ? new Date(dueDateInput.value) : undefined,
      categoryId: categorySelect?.value || undefined,
      tags: tagsInput?.value ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    // Only include status for existing tasks
    if (this.existingTask && statusSelect) {
      taskData.status = statusSelect.value as Task['status'];
    }

    await this.onSubmit(taskData);
  }

  render(): HTMLElement {
    return this.element;
  }
}