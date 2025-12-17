import { CategoryController } from '../../controllers/CategoryController';
import { TaskController } from '../../controllers/taskController';
import { Category } from '../../types';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export class CategoriesPage {
  private element: HTMLElement;
  private categoryController: CategoryController;
  private taskController: TaskController;
  private userId: string;
  private modal: Modal;
  private categories: Category[] = [];

  // Icon mapping for backwards compatibility
  private iconMap: {[key: string]: string} = {
    '📁': 'fas fa-folder',
    '💼': 'fas fa-briefcase',
    '🏠': 'fas fa-home',
    '🛒': 'fas fa-shopping-cart',
    '❤️': 'fas fa-heart',
    '🎓': 'fas fa-graduation-cap',
    '🚗': 'fas fa-car',
    '✈️': 'fas fa-plane',
    '🎮': 'fas fa-gamepad',
    '🎨': 'fas fa-paint-brush',
    '📚': 'fas fa-book',
    '🎵': 'fas fa-music',
    '🏃': 'fas fa-running',
    '🍳': 'fas fa-utensils',
    '🛠️': 'fas fa-tools',
    '💰': 'fas fa-money-bill-wave'
  };

  constructor(userId: string) {
    this.userId = userId;
    this.categoryController = new CategoryController(userId);
    this.taskController = new TaskController(userId);
    this.modal = new Modal();
    this.element = this.createPage();
    this.loadCategories();
  }

  private createPage(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'categories-page';

    // Header
    const header = document.createElement('div');
    header.className = 'categories-header';

    const titleSection = document.createElement('div');
    titleSection.className = 'categories-title-section';

    const title = document.createElement('h1');
    title.className = 'categories-title';
    title.textContent = 'Categories';

    const subtitle = document.createElement('p');
    subtitle.className = 'categories-subtitle';
    subtitle.textContent = 'Organize your tasks with categories';

    titleSection.appendChild(title);
    titleSection.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'categories-actions';

    const newCategoryBtn = document.createElement('button');
    newCategoryBtn.className = 'btn btn-primary';
    newCategoryBtn.innerHTML = '<i class="fas fa-plus"></i> New Category';
    newCategoryBtn.addEventListener('click', () => this.showNewCategoryForm());

    actions.appendChild(newCategoryBtn);

    header.appendChild(titleSection);
    header.appendChild(actions);

    // Categories container
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'categories-container';
    categoriesContainer.id = 'categories-container';

    // Empty state
    const emptyState = this.createEmptyState();
    categoriesContainer.appendChild(emptyState);

    page.appendChild(header);
    page.appendChild(categoriesContainer);

    return page;
  }

  private createEmptyState(): HTMLElement {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state categories-empty-state';
    emptyState.id = 'categories-empty-state';

    const emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-icon';
    emptyIcon.innerHTML = '<i class="fas fa-folder-open fa-3x"></i>';

    const emptyTitle = document.createElement('h3');
    emptyTitle.textContent = 'No categories yet';

    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Create your first category to organize tasks';

    const emptyAction = document.createElement('button');
    emptyAction.className = 'btn btn-primary';
    emptyAction.innerHTML = '<i class="fas fa-plus"></i> Create Category';
    emptyAction.addEventListener('click', () => this.showNewCategoryForm());

    emptyState.appendChild(emptyIcon);
    emptyState.appendChild(emptyTitle);
    emptyState.appendChild(emptyMessage);
    emptyState.appendChild(emptyAction);

    return emptyState;
  }

  private async loadCategories(): Promise<void> {
    const spinner = LoadingSpinner.showInline(this.element, 'Loading categories...');

    try {
      // Initialize default categories if none exist
      await this.categoryController.initializeDefaultCategories();
      
      // Load categories
      this.categories = this.categoryController.getAllCategories();
      
      // Load task counts for each category
      const tasks = this.taskController.getAllTasks();
      const taskCounts = new Map<string, number>();
      
      tasks.forEach(task => {
        if (task.categoryId) {
          taskCounts.set(task.categoryId, (taskCounts.get(task.categoryId) || 0) + 1);
        }
      });

      // Render categories
      this.renderCategories(taskCounts);

    } catch (error) {
      console.error('Failed to load categories:', error);
      Toast.error('Failed to load categories');
    } finally {
      spinner.hide();
    }
  }

  private renderCategories(taskCounts: Map<string, number>): void {
    const container = this.element.querySelector('#categories-container') as HTMLElement;
    const emptyState = this.element.querySelector('#categories-empty-state') as HTMLElement;
    
    if (!container) return;

    // Clear container (keep empty state)
    const currentCategories = container.querySelectorAll('.category-card');
    currentCategories.forEach(category => {
      if (!category.id.includes('empty')) {
        category.remove();
      }
    });

    // Show/hide empty state
    if (emptyState) {
      emptyState.style.display = this.categories.length === 0 ? 'flex' : 'none';
    }

    if (this.categories.length === 0) return;

    // Create categories grid
    const grid = document.createElement('div');
    grid.className = 'categories-grid';

    this.categories.forEach(category => {
      const taskCount = taskCounts.get(category.id) || 0;
      const categoryCard = this.createCategoryCard(category, taskCount);
      grid.appendChild(categoryCard);
    });

    container.appendChild(grid);
  }

  private createCategoryCard(category: Category, taskCount: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.categoryId = category.id;

    // Header with color
    const header = document.createElement('div');
    header.className = 'category-card-header';
    header.style.backgroundColor = category.color;
    header.style.color = this.getContrastColor(category.color);

    const icon = document.createElement('div');
    icon.className = 'category-card-icon';
    
    // Convert emoji to FontAwesome if needed
    let iconClass = category.icon;
    if (this.iconMap[category.icon]) {
      iconClass = this.iconMap[category.icon];
    } else if (!category.icon.includes('fa-')) {
      iconClass = 'fas fa-folder';
    }
    
    icon.innerHTML = `<i class="${iconClass}"></i>`;

    const name = document.createElement('h3');
    name.className = 'category-card-name';
    name.textContent = category.name;

    header.appendChild(icon);
    header.appendChild(name);

    // Content
    const content = document.createElement('div');
    content.className = 'category-card-content';

    const stats = document.createElement('div');
    stats.className = 'category-card-stats';

    const taskCountEl = document.createElement('div');
    taskCountEl.className = 'category-task-count';
    taskCountEl.innerHTML = `<i class="fas fa-tasks"></i> <strong>${taskCount}</strong> task${taskCount !== 1 ? 's' : ''}`;

    const createdDate = document.createElement('div');
    createdDate.className = 'category-created-date';
    createdDate.innerHTML = `<i class="far fa-calendar"></i> ${new Date(category.createdAt).toLocaleDateString()}`;

    stats.appendChild(taskCountEl);
    stats.appendChild(createdDate);

    content.appendChild(stats);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'category-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit category';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showEditCategoryForm(category);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.title = 'Delete category';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDeleteCategory(category);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    // Assemble card
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(actions);

    // Click to view category tasks
    card.addEventListener('click', () => {
      this.viewCategoryTasks(category);
    });

    return card;
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  private showNewCategoryForm(): void {
    const form = this.createCategoryForm();
    
    this.modal.open(form, {
      title: 'Create New Category',
      size: 'medium'
    });
  }

  private showEditCategoryForm(category: Category): void {
    const form = this.createCategoryForm(category);
    
    this.modal.open(form, {
      title: 'Edit Category',
      size: 'medium'
    });
  }

  private createCategoryForm(existingCategory?: Category): HTMLElement {
    const form = document.createElement('form');
    form.className = 'category-form';
    form.noValidate = true;

    // Name field
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';

    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'category-name';
    nameLabel.textContent = 'Name *';
    nameLabel.className = 'form-label';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'category-name';
    nameInput.name = 'name';
    nameInput.required = true;
    nameInput.placeholder = 'Enter category name';
    nameInput.value = existingCategory?.name || '';
    nameInput.className = 'form-input';

    const nameError = document.createElement('div');
    nameError.className = 'form-error';
    nameError.id = 'name-error';

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    nameGroup.appendChild(nameError);

    // Color field
    const colorGroup = document.createElement('div');
    colorGroup.className = 'form-group';

    const colorLabel = document.createElement('label');
    colorLabel.htmlFor = 'category-color';
    colorLabel.textContent = 'Color *';
    colorLabel.className = 'form-label';

    const colorContainer = document.createElement('div');
    colorContainer.className = 'color-picker-container';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'category-color';
    colorInput.name = 'color';
    colorInput.value = existingCategory?.color || '#4361ee';
    colorInput.className = 'color-input';

    const colorPreview = document.createElement('div');
    colorPreview.className = 'color-preview';
    colorPreview.style.backgroundColor = colorInput.value;

    colorInput.addEventListener('input', () => {
      colorPreview.style.backgroundColor = colorInput.value;
    });

    const colorHex = document.createElement('span');
    colorHex.className = 'color-hex';
    colorHex.textContent = colorInput.value;

    colorInput.addEventListener('input', () => {
      colorHex.textContent = colorInput.value;
    });

    colorContainer.appendChild(colorInput);
    colorContainer.appendChild(colorPreview);
    colorContainer.appendChild(colorHex);

    colorGroup.appendChild(colorLabel);
    colorGroup.appendChild(colorContainer);

    // Icon field
    const iconGroup = document.createElement('div');
    iconGroup.className = 'form-group';

    const iconLabel = document.createElement('label');
    iconLabel.textContent = 'Icon';
    iconLabel.className = 'form-label';

    const iconGrid = document.createElement('div');
    iconGrid.className = 'icon-grid';

    const icons = [
      'fas fa-folder',
      'fas fa-briefcase',
      'fas fa-home',
      'fas fa-shopping-cart',
      'fas fa-heart',
      'fas fa-graduation-cap',
      'fas fa-car',
      'fas fa-plane',
      'fas fa-gamepad',
      'fas fa-paint-brush',
      'fas fa-book',
      'fas fa-music',
      'fas fa-running',
      'fas fa-utensils',
      'fas fa-tools',
      'fas fa-money-bill-wave'
    ];

    // Convert existing icon if it's an emoji
    let existingIcon = existingCategory?.icon || 'fas fa-folder';
    if (this.iconMap[existingIcon]) {
      existingIcon = this.iconMap[existingIcon];
    } else if (existingIcon && !existingIcon.includes('fa-')) {
      existingIcon = 'fas fa-folder';
    }
    
    let selectedIcon = existingIcon;

    icons.forEach(iconClass => {
      const iconOption = document.createElement('div');
      iconOption.className = 'icon-option';
      if (iconClass === selectedIcon) {
        iconOption.classList.add('selected');
      }

      const iconButton = document.createElement('button');
      iconButton.type = 'button';
      iconButton.className = 'icon-button';
      iconButton.innerHTML = `<i class="${iconClass}"></i>`;
      iconButton.title = iconClass.replace('fas fa-', '').replace(/-/g, ' ');
      
      iconButton.addEventListener('click', () => {
        selectedIcon = iconClass;
        iconGrid.querySelectorAll('.icon-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        iconOption.classList.add('selected');
      });

      iconOption.appendChild(iconButton);
      iconGrid.appendChild(iconOption);
    });

    iconGroup.appendChild(iconLabel);
    iconGroup.appendChild(iconGrid);

    // Form actions
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancelBtn.addEventListener('click', () => this.modal.close());

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.innerHTML = existingCategory 
      ? '<i class="fas fa-save"></i> Update Category' 
      : '<i class="fas fa-plus"></i> Create Category';

    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);

    // Assemble form
    form.appendChild(nameGroup);
    form.appendChild(colorGroup);
    form.appendChild(iconGroup);
    form.appendChild(actions);

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = nameInput.value.trim();
      const color = colorInput.value;
      
      // Validation
      if (!name) {
        nameError.textContent = 'Category name is required';
        nameInput.focus();
        return;
      }

      try {
        if (existingCategory) {
          await this.categoryController.updateCategory(existingCategory.id, {
            name,
            color,
            icon: selectedIcon
          });
          Toast.success('Category updated successfully');
        } else {
          await this.categoryController.createCategory(name, color, selectedIcon);
          Toast.success('Category created successfully');
        }
        
        this.modal.close();
        this.loadCategories(); // Refresh categories
      } catch (error) {
        Toast.error((error as Error).message);
      }
    });

    return form;
  }

  private async confirmDeleteCategory(category: Category): Promise<void> {
    // Check if category has tasks
    const tasks = this.taskController.getAllTasks();
    const categoryTasks = tasks.filter(task => task.categoryId === category.id);
    
    const modal = new Modal();
    const confirmContent = document.createElement('div');
    confirmContent.className = 'confirm-dialog';
    
    let message = `Are you sure you want to delete "${category.name}"?`;
    
    if (categoryTasks.length > 0) {
      message += `\n\nThis category has ${categoryTasks.length} task${categoryTasks.length !== 1 ? 's' : ''}. Deleting it will remove the category from these tasks.`;
    }
    
    const warningIcon = document.createElement('div');
    warningIcon.className = 'warning-icon';
    warningIcon.innerHTML = '<i class="fas fa-exclamation-triangle fa-2x"></i>';
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.whiteSpace = 'pre-line';
    
    const actions = document.createElement('div');
    actions.className = 'confirm-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancelBtn.addEventListener('click', () => modal.close());
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Category';
    deleteBtn.addEventListener('click', async () => {
      try {
        // Remove category from tasks first
        if (categoryTasks.length > 0) {
          for (const task of categoryTasks) {
            await this.taskController.updateTask(task.id, { categoryId: null });
          }
        }
        
        await this.categoryController.deleteCategory(category.id);
        modal.close();
        this.loadCategories();
        Toast.success('Category deleted successfully');
      } catch (error) {
        Toast.error('Failed to delete category');
      }
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(deleteBtn);
    
    confirmContent.appendChild(warningIcon);
    confirmContent.appendChild(messageEl);
    confirmContent.appendChild(actions);
    
    modal.open(confirmContent, {
      title: 'Confirm Delete',
      size: 'small'
    });
  }

  private viewCategoryTasks(category: Category): void {
    Toast.info(`Viewing tasks in "${category.name}" category`);
    // In a real app, you would navigate to the task list with this filter
  }

  render(): HTMLElement {
    return this.element;
  }

  refresh(): void {
    this.loadCategories();
  }
}