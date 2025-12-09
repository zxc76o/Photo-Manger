/**
 * DropZone Component
 * Provides drag-and-drop and file input for importing photos
 * @module src/components/DropZone
 */

import { createElement } from '../utils/dom.js';
import { SUPPORTED_FORMATS } from '../utils/constants.js';

/**
 * DropZone component for file import
 */
export class DropZone {
  /**
   * Create a DropZone
   */
  constructor() {
    this.element = null;
    this.input = null;
    this.filesCallback = null;
    this.disabled = false;
  }

  /**
   * Register callback for file selection
   * @param {Function} callback - Called with array of files
   */
  onFiles(callback) {
    this.filesCallback = callback;
  }

  /**
   * Render the drop zone
   * @returns {HTMLElement}
   */
  render() {
    // Create file input
    this.input = createElement('input', {
      className: 'drop-zone__input',
      attrs: {
        type: 'file',
        accept: SUPPORTED_FORMATS.join(','),
        multiple: true
      }
    });

    // Create browse button
    const browseBtn = createElement('button', {
      className: 'drop-zone__browse-btn btn btn--primary',
      text: 'Browse Files',
      attrs: {
        type: 'button'
      }
    });

    // Create icon
    const icon = createElement('div', {
      className: 'drop-zone__icon',
      attrs: {
        'aria-hidden': 'true'
      }
    });
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    `;

    // Create instructions
    const instructions = createElement('p', {
      className: 'drop-zone__instructions',
      text: 'Drag and drop photos here'
    });

    const orText = createElement('span', {
      className: 'drop-zone__or',
      text: 'or'
    });

    // Create supported formats text
    const formats = createElement('p', {
      className: 'drop-zone__formats',
      text: 'Supported: JPEG, PNG, GIF, WebP, HEIC (max 50MB)'
    });

    // Create container
    this.element = createElement('div', {
      className: 'drop-zone',
      attrs: {
        role: 'region',
        'aria-label': 'File upload area',
        tabindex: '0'
      },
      children: [
        this.input,
        icon,
        instructions,
        orText,
        browseBtn,
        formats
      ]
    });

    // Attach event listeners
    this.attachEventListeners();

    return this.element;
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // File input change
    this.input.addEventListener('change', (e) => {
      if (this.disabled) return;
      const files = Array.from(e.target.files);
      if (files.length > 0 && this.filesCallback) {
        this.filesCallback(files);
      }
      // Reset input so same file can be selected again
      this.input.value = '';
    });

    // Browse button click
    const browseBtn = this.element.querySelector('.drop-zone__browse-btn');
    browseBtn.addEventListener('click', () => {
      if (!this.disabled) {
        this.input.click();
      }
    });

    // Drag events
    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.disabled) {
        this.element.classList.add('drop-zone--active');
      }
    });

    this.element.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (!this.disabled) {
        this.element.classList.add('drop-zone--active');
      }
    });

    this.element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.element.classList.remove('drop-zone--active');
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      this.element.classList.remove('drop-zone--active');
      
      if (this.disabled) return;
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && this.filesCallback) {
        this.filesCallback(files);
      }
    });

    // Keyboard support
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!this.disabled) {
          this.input.click();
        }
      }
    });
  }

  /**
   * Set disabled state
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    this.disabled = disabled;
    if (this.element) {
      this.element.classList.toggle('drop-zone--disabled', disabled);
      this.input.disabled = disabled;
      const browseBtn = this.element.querySelector('.drop-zone__browse-btn');
      if (browseBtn) {
        browseBtn.disabled = disabled;
      }
    }
  }

  /**
   * Get the element
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }
}
