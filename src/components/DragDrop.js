/**
 * DragDrop Utility
 * Provides drag-and-drop functionality for reordering
 * @module src/components/DragDrop
 */

/**
 * DragDrop static utility class
 */
export class DragDrop {
  /**
   * Make an element draggable
   * @param {HTMLElement} element - Element to make draggable
   * @param {Object} data - Data to transfer during drag
   * @param {Object} [options] - Options
   * @param {Function} [options.onDragStart] - Called when drag starts
   * @param {Function} [options.onDragEnd] - Called when drag ends
   */
  static makeDraggable(element, data, options = {}) {
    element.setAttribute('draggable', 'true');

    element.addEventListener('dragstart', (event) => {
      element.classList.add('dragging');
      
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
      }

      if (options.onDragStart) {
        options.onDragStart(data, event);
      }
    });

    element.addEventListener('dragend', (event) => {
      element.classList.remove('dragging');

      if (options.onDragEnd) {
        options.onDragEnd(event);
      }
    });
  }

  /**
   * Make an element a drop zone
   * @param {HTMLElement} element - Element to make a drop zone
   * @param {Object} options - Options
   * @param {Function} options.onDrop - Called when item is dropped
   * @param {Function} [options.onDragEnter] - Called when drag enters
   * @param {Function} [options.onDragLeave] - Called when drag leaves
   * @param {Function} [options.onDragOver] - Called during drag over
   */
  static makeDropZone(element, options) {
    element.addEventListener('dragover', (event) => {
      event.preventDefault();
      
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }

      if (options.onDragOver) {
        options.onDragOver(event);
      }
    });

    element.addEventListener('dragenter', (event) => {
      element.classList.add('drag-over');

      if (options.onDragEnter) {
        options.onDragEnter(event);
      }
    });

    element.addEventListener('dragleave', (event) => {
      element.classList.remove('drag-over');

      if (options.onDragLeave) {
        options.onDragLeave(event);
      }
    });

    element.addEventListener('drop', (event) => {
      event.preventDefault();
      element.classList.remove('drag-over');

      let data = {};
      if (event.dataTransfer) {
        try {
          data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (e) {
          // Invalid JSON
        }
      }

      if (options.onDrop) {
        options.onDrop(data, event);
      }
    });
  }

  /**
   * Create a drop indicator element
   * @returns {HTMLElement} Drop indicator element
   */
  static createDropIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    return indicator;
  }

  /**
   * Show drop indicator at position
   * @param {HTMLElement} indicator - Indicator element
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static showIndicator(indicator, x, y) {
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    indicator.classList.add('visible');
  }

  /**
   * Hide drop indicator
   * @param {HTMLElement} indicator - Indicator element
   */
  static hideIndicator(indicator) {
    indicator.classList.remove('visible');
  }

  /**
   * Calculate drop position based on mouse coordinates
   * @param {HTMLElement[]} items - Array of sortable items
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {number} Drop position index
   */
  static getDropPosition(items, mouseX, mouseY) {
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      
      if (mouseX < centerX) {
        return i;
      }
    }
    return items.length;
  }

  /**
   * Setup sortable container with drag-and-drop reordering
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options
   * @param {string} options.itemSelector - Selector for draggable items
   * @param {Function} options.onReorder - Called when items are reordered (fromIndex, toIndex)
   * @param {Function} [options.getItemId] - Function to get item ID from element
   */
  static setupSortable(container, options) {
    const { itemSelector, onReorder, getItemId } = options;
    let draggedIndex = null;
    let indicator = DragDrop.createDropIndicator();
    container.appendChild(indicator);

    const getItems = () => Array.from(container.querySelectorAll(itemSelector));

    // Make items draggable
    const setupItems = () => {
      const items = getItems();
      items.forEach((item, index) => {
        const itemId = getItemId ? getItemId(item) : index;
        
        DragDrop.makeDraggable(item, { id: itemId, index }, {
          onDragStart: () => {
            draggedIndex = index;
          },
          onDragEnd: () => {
            draggedIndex = null;
            DragDrop.hideIndicator(indicator);
          }
        });
      });
    };

    // Make container a drop zone
    DragDrop.makeDropZone(container, {
      onDragOver: (event) => {
        const items = getItems();
        const dropIndex = DragDrop.getDropPosition(items, event.clientX, event.clientY);
        
        if (dropIndex < items.length) {
          const targetRect = items[dropIndex].getBoundingClientRect();
          DragDrop.showIndicator(indicator, targetRect.left, targetRect.top);
        } else if (items.length > 0) {
          const lastRect = items[items.length - 1].getBoundingClientRect();
          DragDrop.showIndicator(indicator, lastRect.right, lastRect.top);
        }
      },
      onDrop: (data, event) => {
        if (draggedIndex === null) return;
        
        const items = getItems();
        const dropIndex = DragDrop.getDropPosition(items, event.clientX, event.clientY);
        
        if (draggedIndex !== dropIndex && onReorder) {
          onReorder(draggedIndex, dropIndex, data);
        }
        
        DragDrop.hideIndicator(indicator);
      }
    });

    setupItems();

    // Return function to re-setup items (after DOM changes)
    return setupItems;
  }
}
