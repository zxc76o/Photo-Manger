/**
 * Dialog Component
 * Reusable modal dialog for confirmations and prompts
 * @module src/components/Dialog
 */

import { createElement } from '../utils/dom.js';

/**
 * Dialog Component
 */
export class Dialog {
  /**
   * Create a Dialog instance
   * @param {Object} options - Dialog options
   * @param {string} options.title - Dialog title
   * @param {string} [options.message] - Dialog message
   * @param {string} [options.type='confirm'] - Dialog type: 'confirm' or 'prompt'
   * @param {string} [options.confirmText='OK'] - Confirm button text
   * @param {string} [options.cancelText='Cancel'] - Cancel button text
   * @param {string} [options.inputPlaceholder=''] - Input placeholder for prompt
   * @param {string} [options.inputValue=''] - Initial input value
   * @param {boolean} [options.danger=false] - Whether this is a dangerous action
   * @param {Function} [options.onConfirm] - Confirm callback
   * @param {Function} [options.onCancel] - Cancel callback
   */
  constructor(options) {
    this.title = options.title;
    this.message = options.message || '';
    this.type = options.type || 'confirm';
    this.confirmText = options.confirmText || 'OK';
    this.cancelText = options.cancelText || 'Cancel';
    this.inputPlaceholder = options.inputPlaceholder || '';
    this.inputValue = options.inputValue || '';
    this.danger = options.danger || false;
    this.onConfirm = options.onConfirm;
    this.onCancel = options.onCancel;
    
    this.element = null;
    this.input = null;
    this.isVisible = false;

    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Render the dialog
   * @returns {HTMLElement} Dialog element
   */
  render() {
    this.element = createElement('div', {
      className: 'dialog',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'dialog-title'
      }
    });

    // Backdrop
    const backdrop = createElement('div', {
      className: 'dialog__backdrop'
    });
    backdrop.addEventListener('click', () => this.cancel());

    // Content
    const content = createElement('div', {
      className: 'dialog__content'
    });

    // Header
    const header = createElement('header', {
      className: 'dialog__header'
    });

    const title = createElement('h2', {
      className: 'dialog__title',
      text: this.title,
      attrs: {
        id: 'dialog-title'
      }
    });
    header.appendChild(title);

    // Body
    const body = createElement('div', {
      className: 'dialog__body'
    });

    if (this.message) {
      const message = createElement('p', {
        className: 'dialog__message',
        text: this.message
      });
      body.appendChild(message);
    }

    if (this.type === 'prompt') {
      this.input = createElement('input', {
        className: 'dialog__input',
        attrs: {
          type: 'text',
          placeholder: this.inputPlaceholder,
          value: this.inputValue
        }
      });

      // Submit on Enter
      this.input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.confirm();
        }
      });

      body.appendChild(this.input);
    }

    // Footer with buttons
    const footer = createElement('footer', {
      className: 'dialog__footer'
    });

    const cancelBtn = createElement('button', {
      className: 'dialog__button dialog__button--cancel',
      text: this.cancelText,
      attrs: {
        type: 'button'
      }
    });
    cancelBtn.addEventListener('click', () => this.cancel());

    const confirmBtn = createElement('button', {
      className: `dialog__button dialog__button--confirm ${this.danger ? 'dialog__button--danger' : ''}`,
      text: this.confirmText,
      attrs: {
        type: 'button'
      }
    });
    confirmBtn.addEventListener('click', () => this.confirm());

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);

    this.element.appendChild(backdrop);
    this.element.appendChild(content);

    return this.element;
  }

  /**
   * Show the dialog
   */
  show() {
    if (!this.element) return;

    // Reset input value
    if (this.input) {
      this.input.value = this.inputValue;
    }

    this.element.classList.add('dialog--visible');
    this.isVisible = true;

    // Add keyboard listener
    document.addEventListener('keydown', this.handleKeydown);

    // Focus input or confirm button
    requestAnimationFrame(() => {
      if (this.input) {
        this.input.focus();
        this.input.select();
      } else {
        const confirmBtn = this.element.querySelector('.dialog__button--confirm');
        if (confirmBtn) confirmBtn.focus();
      }
    });
  }

  /**
   * Hide the dialog
   */
  hide() {
    if (!this.element) return;

    this.element.classList.remove('dialog--visible');
    this.isVisible = false;

    // Remove keyboard listener
    document.removeEventListener('keydown', this.handleKeydown);
  }

  /**
   * Handle keyboard events
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.cancel();
    }
  }

  /**
   * Confirm action
   */
  confirm() {
    if (!this.isVisible) return; // Prevent double execution
    
    const value = this.type === 'prompt' && this.input ? this.input.value : undefined;
    this.hide();
    
    if (this.onConfirm) {
      if (value !== undefined) {
        this.onConfirm(value);
      } else {
        this.onConfirm();
      }
    }
  }

  /**
   * Cancel action
   */
  cancel() {
    if (!this.isVisible) return; // Prevent double execution
    
    this.hide();
    
    if (this.onCancel) {
      this.onCancel();
    }
  }

  /**
   * Get input value
   * @returns {string} Input value
   */
  getValue() {
    return this.input ? this.input.value : '';
  }

  /**
   * Set input value
   * @param {string} value - New value
   */
  setValue(value) {
    this.inputValue = value;
    if (this.input) {
      this.input.value = value;
    }
  }

  /**
   * Check if dialog is visible
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
    this.input = null;
  }
}
