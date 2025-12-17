export class Toast {
  private static container: HTMLElement | null = null;
  private static toastCount = 0;

  static initialize(): void {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.className = 'toast-container';
      document.body.appendChild(Toast.container);
    }
  }

  static show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000): void {
    Toast.initialize();

    const toastId = `toast-${Date.now()}-${Toast.toastCount++}`;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    // Toast content
    const content = document.createElement('div');
    content.className = 'toast-content';

    // Icon based on type
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    
    switch (type) {
      case 'success': icon.textContent = '✓'; break;
      case 'error': icon.textContent = '✗'; break;
      case 'warning': icon.textContent = '⚠'; break;
      default: icon.textContent = 'ℹ'; break;
    }

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => Toast.remove(toastId));

    content.appendChild(icon);
    content.appendChild(messageEl);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    // Add to container
    Toast.container!.appendChild(toast);

    // Auto-remove after duration
    const autoRemove = setTimeout(() => {
      Toast.remove(toastId);
    }, duration);

    // Pause auto-remove on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(autoRemove);
    });

    toast.addEventListener('mouseleave', () => {
      setTimeout(() => {
        Toast.remove(toastId);
      }, duration);
    });

    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
  }

  static remove(toastId: string): void {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.classList.remove('show');
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300); // Match CSS transition duration
    }
  }

  static clearAll(): void {
    if (Toast.container) {
      const toasts = Toast.container.querySelectorAll('.toast');
      toasts.forEach(toast => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      });
    }
  }

  static success(message: string, duration?: number): void {
    Toast.show(message, 'success', duration);
  }

  static error(message: string, duration?: number): void {
    Toast.show(message, 'error', duration);
  }

  static info(message: string, duration?: number): void {
    Toast.show(message, 'info', duration);
  }

  static warning(message: string, duration?: number): void {
    Toast.show(message, 'warning', duration);
  }
}