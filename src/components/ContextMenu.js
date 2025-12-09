/**
 * Context Menu Component
 * Reusable dropdown menu for context actions
 * @module src/components/ContextMenu
 */

import { createElement } from '../utils/dom.js';

/**
 * Context Menu Component
 */
export class ContextMenu {
  /**
   * Create a ContextMenu instance
   * @param {Object} options - Menu options
   * @param {Array} options.items - Menu items
   * @param {Function} [options.onSelect] - Selection callback
   * @param {Function} [options.onShow] - Show callback
   * @param {Function} [options.onHide] - Hide callback
   */
  constructor(options) {
    this.items = options.items || [];
    this.onSelect = options.onSelect;
    this.onShow = options.onShow;
    this.onHide = options.onHide;
    this.element = null;
    this.isVisible = false;

    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Render the context menu
   * @returns {HTMLElement} Menu element
   */
  render() {
    this.element = createElement('div', {
      className: 'context-menu',
      attrs: {
        role: 'menu',
        'aria-hidden': 'true'
      }
    });

    const list = createElement('ul', {
      className: 'context-menu__list'
    });

    for (const item of this.items) {
      if (item.type === 'separator') {
        const separator = createElement('li', {
          className: 'context-menu__separator',
          attrs: {
            role: 'separator'
          }
        });
        list.appendChild(separator);
      } else {
        const menuItem = this.createMenuItem(item);
        list.appendChild(menuItem);
      }
    }

    this.element.appendChild(list);
    return this.element;
  }

  /**
   * Create a menu item element
   * @private
   * @param {Object} item - Item data
   * @returns {HTMLElement} Menu item element
   */
  createMenuItem(item) {
    const li = createElement('li', {
      className: 'context-menu__item',
      attrs: {
        role: 'menuitem',
        tabindex: '0',
        'data-action': item.id
      }
    });

    if (item.icon) {
      const icon = createElement('span', {
        className: 'context-menu__icon',
        text: item.icon
      });
      li.appendChild(icon);
    }

    const label = createElement('span', {
      className: 'context-menu__label',
      text: item.label
    });
    li.appendChild(label);

    if (item.shortcut) {
      const shortcut = createElement('span', {
        className: 'context-menu__shortcut',
        text: item.shortcut
      });
      li.appendChild(shortcut);
    }

    // Click handler
    li.addEventListener('click', () => {
      this.selectItem(item.id);
    });

    // Keyboard handler
    li.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.selectItem(item.id);
      }
    });

    return li;
  }

  /**
   * Select a menu item
   * @private
   * @param {string} itemId - Item ID
   */
  selectItem(itemId) {
    // Save context before hiding (hide() clears context)
    const savedContext = this.context;
    this.hide();
    if (this.onSelect) {
      this.onSelect(itemId, savedContext);
    }
  }

  /**
   * Show the menu at position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} [context] - Optional context data
   */
  show(x, y, context = null) {
    if (!this.element) return;

    this.context = context;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.classList.add('context-menu--visible');
    this.element.setAttribute('aria-hidden', 'false');
    this.isVisible = true;

    // Add document listeners
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeydown);

    // Focus first item
    const firstItem = this.element.querySelector('.context-menu__item');
    if (firstItem) {
      firstItem.focus();
    }

    if (this.onShow) {
      this.onShow(context);
    }
  }

  /**
   * Hide the menu
   */
  hide() {
    if (!this.element) return;

    this.element.classList.remove('context-menu--visible');
    this.element.setAttribute('aria-hidden', 'true');
    this.isVisible = false;
    this.context = null;

    // Remove document listeners
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeydown);

    if (this.onHide) {
      this.onHide();
    }
  }

  /**
   * Handle document click (close on outside click)
   * @private
   * @param {Event} event - Click event
   */
  handleDocumentClick(event) {
    if (this.element && !this.element.contains(event.target)) {
      this.hide();
    }
  }

  /**
   * Handle keyboard events
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.hide();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateItems(event.key === 'ArrowDown' ? 1 : -1);
    }
  }

  /**
   * Navigate between menu items
   * @private
   * @param {number} direction - Direction (1 or -1)
   */
  navigateItems(direction) {
    const items = Array.from(this.element.querySelectorAll('.context-menu__item'));
    const currentIndex = items.indexOf(document.activeElement);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;

    items[nextIndex].focus();
  }

  /**
   * Get current context
   * @returns {Object|null} Context data
   */
  getContext() {
    return this.context;
  }

  /**
   * Check if menu is visible
   * @returns {boolean} True if visible
   */
  isOpen() {
    return this.isVisible;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.hide();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
