export class DragDropManager {
  private dragSrcEl: HTMLElement | null = null;
  
  initialize(container: HTMLElement): void {
    const items = container.querySelectorAll('[draggable="true"]');
    
    items.forEach(item => {
      item.addEventListener('dragstart', this.handleDragStart.bind(this));
      item.addEventListener('dragover', this.handleDragOver.bind(this));
      item.addEventListener('drop', this.handleDrop.bind(this));
      item.addEventListener('dragend', this.handleDragEnd.bind(this));
    });
  }
  
  private handleDragStart(e: Event): void {
    const dragEvent = e as DragEvent;
    if (!dragEvent.target || !(dragEvent.target instanceof HTMLElement)) return;
    
    this.dragSrcEl = dragEvent.target;
    dragEvent.dataTransfer?.setData('text/html', dragEvent.target.outerHTML);
    dragEvent.dataTransfer!.effectAllowed = 'move';
    
    dragEvent.target.classList.add('dragging');
  }
  
  private handleDragOver(e: Event): void {
    const dragEvent = e as DragEvent;
    dragEvent.preventDefault();
    dragEvent.dataTransfer!.dropEffect = 'move';
  }
  
  private handleDrop(e: Event): void {
    const dragEvent = e as DragEvent;
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    
    if (this.dragSrcEl !== dragEvent.target && dragEvent.target instanceof HTMLElement) {
      // Remove dragged element
      this.dragSrcEl?.parentNode?.removeChild(this.dragSrcEl);
      
      // Insert at drop position
      const dropHTML = dragEvent.dataTransfer?.getData('text/html');
      if (dropHTML) {
        dragEvent.target.insertAdjacentHTML('beforebegin', dropHTML);
      }
      
      // Update task order in storage
      this.updateTaskOrder();
    }
  }
  
  private handleDragEnd(e: Event): void {
    const dragEvent = e as DragEvent;
    if (dragEvent.target instanceof HTMLElement) {
      dragEvent.target.classList.remove('dragging');
    }
  }
  
  private updateTaskOrder(): void {
    // This method should update the task order in your storage
    // Implementation depends on your data structure
    console.log('Task order updated');
  }
}