/**
 * PhotoPreview Component
 * Full-screen photo preview with navigation
 * @module src/components/PhotoPreview
 */

import { createElement } from '../utils/dom.js';

/**
 * PhotoPreview component for viewing photos in full screen
 */
export class PhotoPreview {
  /**
   * Create a PhotoPreview
   */
  constructor() {
    this.element = null;
    this.imageContainer = null;
    this.imageEl = null;
    this.filenameEl = null;
    this.counterEl = null;
    this.prevBtn = null;
    this.nextBtn = null;
    
    this.photos = [];
    this.currentIndex = 0;
    this.isOpen = false;
    this.closeCallback = null;
    this.currentBlobUrl = null;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Register close callback
   * @param {Function} callback
   */
  onClose(callback) {
    this.closeCallback = callback;
  }

  /**
   * Render the preview component
   * @returns {HTMLElement}
   */
  render() {
    // Close button
    const closeBtn = createElement('button', {
      className: 'photo-preview__close',
      attrs: {
        type: 'button',
        'aria-label': 'Close preview'
      }
    });
    closeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    // Previous button
    this.prevBtn = createElement('button', {
      className: 'photo-preview__nav photo-preview__nav--prev',
      attrs: {
        type: 'button',
        'aria-label': 'Previous photo'
      }
    });
    this.prevBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    `;

    // Next button
    this.nextBtn = createElement('button', {
      className: 'photo-preview__nav photo-preview__nav--next',
      attrs: {
        type: 'button',
        'aria-label': 'Next photo'
      }
    });
    this.nextBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    // Image element
    this.imageEl = createElement('img', {
      className: 'photo-preview__image',
      attrs: {
        alt: 'Photo preview'
      }
    });

    // Image container
    this.imageContainer = createElement('div', {
      className: 'photo-preview__image-container',
      children: [this.imageEl]
    });

    // Filename
    this.filenameEl = createElement('p', {
      className: 'photo-preview__filename',
      text: ''
    });

    // Counter
    this.counterEl = createElement('span', {
      className: 'photo-preview__counter',
      text: ''
    });

    // Info bar
    const infoBar = createElement('div', {
      className: 'photo-preview__info',
      children: [this.filenameEl, this.counterEl]
    });

    // Main container
    this.element = createElement('div', {
      className: 'photo-preview photo-preview--hidden',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Photo preview'
      },
      children: [
        closeBtn,
        this.prevBtn,
        this.imageContainer,
        this.nextBtn,
        infoBar
      ]
    });

    // Attach event listeners
    this.attachEventListeners(closeBtn);

    return this.element;
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners(closeBtn) {
    closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    
    // Click on backdrop to close
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element || e.target === this.imageContainer) {
        this.close();
      }
    });
  }

  /**
   * Handle keyboard events
   * @private
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
    }
  }

  /**
   * Open preview with photos
   * @param {Object[]} photos - Array of photo objects
   * @param {number} index - Starting index
   */
  open(photos, index = 0) {
    this.photos = photos;
    this.currentIndex = index;
    this.isOpen = true;

    // Show element
    this.element.classList.remove('photo-preview--hidden');
    
    // Add keyboard listener
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Update display
    this.updateDisplay();
    this.updateNavButtons();
  }

  /**
   * Close preview
   */
  close() {
    this.isOpen = false;
    this.element.classList.add('photo-preview--hidden');
    
    // Remove keyboard listener
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clean up blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    // Call close callback
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  /**
   * Navigate to next photo
   */
  next() {
    if (this.photos.length <= 1) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.updateDisplay();
  }

  /**
   * Navigate to previous photo
   */
  prev() {
    if (this.photos.length <= 1) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this.updateDisplay();
  }

  /**
   * Get current photo index
   * @returns {number}
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Update the display with current photo
   * @private
   */
  updateDisplay() {
    const photo = this.photos[this.currentIndex];
    if (!photo) return;

    // Clean up previous blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }

    // Create blob URL for thumbnail (or full image if available)
    const imageBlob = photo.originalFile || photo.thumbnail;
    if (imageBlob) {
      this.currentBlobUrl = URL.createObjectURL(imageBlob);
      this.imageEl.src = this.currentBlobUrl;
    }

    // Update filename
    this.filenameEl.textContent = photo.fileName || 'Unknown';

    // Update counter
    this.counterEl.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;

    // Update alt text
    this.imageEl.alt = photo.fileName || 'Photo preview';
  }

  /**
   * Update navigation button states
   * @private
   */
  updateNavButtons() {
    const hasMultiple = this.photos.length > 1;
    this.prevBtn.disabled = !hasMultiple;
    this.nextBtn.disabled = !hasMultiple;
  }

  /**
   * Get the element
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }
}
