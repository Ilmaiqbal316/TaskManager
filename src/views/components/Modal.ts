export class Modal {
  private element: HTMLElement;
  private overlay: HTMLElement;
  private content: HTMLElement;
  private isOpen = false;

  constructor() {
    this.overlay = this.createOverlay();
    this.content = this.createContent();
    this.element = this.createModal();
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => this.close());
    return overlay;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'modal-content';
    return content;
  }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.appendChild(this.overlay);
    modal.appendChild(this.content);
    return modal;
  }

  open(content?: HTMLElement | string, options: {
    title?: string;
    showClose?: boolean;
    size?: 'small' | 'medium' | 'large';
  } = {}): void {
    if (this.isOpen) return;

    const { title, showClose = true, size = 'medium' } = options;
    
    // Clear previous content
    this.content.innerHTML = '';

    // Add size class
    this.content.className = `modal-content modal-${size}`;

    // Create modal header if title provided
    if (title) {
      const header = document.createElement('div');
      header.className = 'modal-header';

      const titleElement = document.createElement('h2');
      titleElement.className = 'modal-title';
      titleElement.textContent = title;

      header.appendChild(titleElement);

      if (showClose) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
      }

      this.content.appendChild(header);
    }

    // Add content
    if (content) {
      const body = document.createElement('div');
      body.className = 'modal-body';
      
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.appendChild(content);
      }
      
      this.content.appendChild(body);
    }

    // Add to document
    document.body.appendChild(this.element);
    
    // Add open class with slight delay for animation
    setTimeout(() => {
      this.element.classList.add('open');
      this.isOpen = true;
    }, 10);
  }

  close(): void {
    if (!this.isOpen) return;

    this.element.classList.remove('open');
    
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.isOpen = false;
    }, 300); // Match CSS transition duration
  }

  setContent(content: HTMLElement | string): void {
    const body = this.content.querySelector('.modal-body');
    if (body) {
      body.innerHTML = '';
      
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.appendChild(content);
      }
    }
  }

  setTitle(title: string): void {
    const titleElement = this.content.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  addFooter(buttons: HTMLElement[]): void {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    buttons.forEach(button => {
      footer.appendChild(button);
    });

    this.content.appendChild(footer);
  }

  isModalOpen(): boolean {
    return this.isOpen;
  }
}