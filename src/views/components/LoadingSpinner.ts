export class LoadingSpinner {
  private element: HTMLElement;
  private message: string;

  constructor(message: string = 'Loading...') {
    this.message = message;
    this.element = this.createSpinner();
  }

  private createSpinner(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'loading-spinner-container';

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

    // Create spinner circles
    for (let i = 0; i < 12; i++) {
      const circle = document.createElement('div');
      circle.className = 'loading-circle';
      spinner.appendChild(circle);
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'loading-message';
    messageEl.textContent = this.message;

    container.appendChild(spinner);
    container.appendChild(messageEl);

    return container;
  }

  show(parent?: HTMLElement): void {
    if (parent) {
      parent.appendChild(this.element);
    } else {
      // Show as overlay
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.appendChild(this.element);
      document.body.appendChild(overlay);
    }
  }

 hide(): void {
  if (this.element.parentNode) {
    // If it's inside an overlay, remove the overlay
    const parent = this.element.parentNode;
    if (parent instanceof HTMLElement && parent.classList.contains('loading-overlay')) {
      document.body.removeChild(parent);
    } else {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

  setMessage(message: string): void {
    this.message = message;
    const messageEl = this.element.querySelector('.loading-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  static showFullscreen(message: string = 'Loading...'): LoadingSpinner {
    const spinner = new LoadingSpinner(message);
    spinner.show();
    return spinner;
  }

  static showInline(parent: HTMLElement, message: string = 'Loading...'): LoadingSpinner {
    const spinner = new LoadingSpinner(message);
    spinner.show(parent);
    return spinner;
  }
}