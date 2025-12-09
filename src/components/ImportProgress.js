/**
 * ImportProgress Component
 * Shows import progress with progress bar and status
 * @module src/components/ImportProgress
 */

import { createElement } from '../utils/dom.js';
import { EVENTS } from '../utils/eventBus.js';

/**
 * ImportProgress component for showing import status
 */
export class ImportProgress {
  /**
   * Create an ImportProgress
   * @param {EventBus} eventBus - Event bus instance
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.element = null;
    this.progressFill = null;
    this.statusText = null;
    this.filenameText = null;
    this.hideTimeout = null;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    this.eventBus.on(EVENTS.IMPORT_PROGRESS, (data) => {
      this.update(data);
    });

    this.eventBus.on(EVENTS.IMPORT_COMPLETE, (data) => {
      this.showResults(data);
    });
  }

  /**
   * Render the progress component
   * @returns {HTMLElement}
   */
  render() {
    // Create progress bar fill
    this.progressFill = createElement('div', {
      className: 'import-progress__fill',
      attrs: {
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': '0'
      }
    });

    // Create progress bar container
    const progressBar = createElement('div', {
      className: 'import-progress__bar',
      children: [this.progressFill]
    });

    // Create filename text
    this.filenameText = createElement('p', {
      className: 'import-progress__filename',
      text: ''
    });

    // Create status text
    this.statusText = createElement('p', {
      className: 'import-progress__status',
      text: 'Preparing import...'
    });

    // Create title
    const title = createElement('h3', {
      className: 'import-progress__title',
      text: 'Importing Photos'
    });

    // Create container
    this.element = createElement('div', {
      className: 'import-progress import-progress--hidden',
      attrs: {
        role: 'dialog',
        'aria-label': 'Import progress',
        'aria-modal': 'true'
      },
      children: [
        createElement('div', {
          className: 'import-progress__content',
          children: [
            title,
            progressBar,
            this.filenameText,
            this.statusText
          ]
        })
      ]
    });

    return this.element;
  }

  /**
   * Show the progress overlay
   */
  show() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.element) {
      this.element.classList.remove('import-progress--hidden');
      this.element.classList.remove('import-progress--complete');
      this.progressFill.style.width = '0%';
      this.progressFill.setAttribute('aria-valuenow', '0');
      this.statusText.textContent = 'Preparing import...';
      this.filenameText.textContent = '';
    }
  }

  /**
   * Hide the progress overlay
   */
  hide() {
    if (this.element) {
      this.element.classList.add('import-progress--hidden');
    }
  }

  /**
   * Update progress
   * @param {Object} data - Progress data
   * @param {number} data.current - Current file index
   * @param {number} data.total - Total files
   * @param {string} data.fileName - Current filename
   */
  update(data) {
    if (!this.element) return;

    const { current, total, fileName } = data;
    const percent = Math.round((current / total) * 100);

    this.progressFill.style.width = `${percent}%`;
    this.progressFill.setAttribute('aria-valuenow', percent.toString());
    this.statusText.textContent = `Importing ${current} of ${total}...`;
    this.filenameText.textContent = fileName;
  }

  /**
   * Show import results
   * @param {Object} data - Results data
   * @param {Array} data.success - Successfully imported files
   * @param {Array} data.failed - Failed files
   */
  showResults(data) {
    if (!this.element) return;

    const { success, failed } = data;
    this.element.classList.add('import-progress--complete');
    
    // Set progress to 100%
    this.progressFill.style.width = '100%';
    this.progressFill.setAttribute('aria-valuenow', '100');
    this.filenameText.textContent = '';

    if (failed.length === 0) {
      this.statusText.textContent = `Successfully imported ${success.length} photo${success.length !== 1 ? 's' : ''}!`;
    } else {
      this.statusText.textContent = `Imported ${success.length} photo${success.length !== 1 ? 's' : ''}, ${failed.length} failed`;
    }

    // Auto-hide after delay
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Get the element
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }
}
