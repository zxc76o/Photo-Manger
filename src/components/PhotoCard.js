/**
 * Photo Card Component
 * Displays a single photo as a clickable thumbnail
 * @module src/components/PhotoCard
 */

import { createElement } from '../utils/dom.js';

/**
 * Create a photo card element
 * @param {Object} options - Card options
 * @param {Object} options.photo - Photo data
 * @param {Function} options.onClick - Click handler
 * @param {Function} [options.onSelect] - Selection handler
 * @param {boolean} [options.selectable=false] - Enable selection mode
 * @param {boolean} [options.selected=false] - Current selection state
 * @returns {HTMLElement} Photo card element
 */
export function createPhotoCard({ photo, onClick, onSelect, selectable = false, selected = false }) {
  const card = createElement('article', {
    className: `photo-card${selected ? ' photo-card--selected' : ''}`,
    attrs: {
      'data-photo-id': photo.id,
      role: 'button',
      tabindex: '0',
      'aria-label': `Photo ${photo.fileName}`
    }
  });

  // Thumbnail container
  const thumbContainer = createElement('div', {
    className: 'photo-card__thumb'
  });

  // Thumbnail image
  if (photo.thumbnail) {
    const img = createElement('img', {
      className: 'photo-card__image',
      attrs: {
        src: URL.createObjectURL(photo.thumbnail),
        alt: photo.fileName,
        loading: 'lazy'
      }
    });
    thumbContainer.appendChild(img);
  } else {
    // Placeholder
    const placeholder = createElement('div', {
      className: 'photo-card__placeholder'
    });
    placeholder.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
    `;
    thumbContainer.appendChild(placeholder);
  }

  card.appendChild(thumbContainer);

  // Selection checkbox (if selectable)
  if (selectable) {
    const checkbox = createElement('div', {
      className: `photo-card__checkbox${selected ? ' photo-card__checkbox--checked' : ''}`,
      attrs: {
        role: 'checkbox',
        'aria-checked': String(selected),
        'aria-label': `Select ${photo.fileName}`
      }
    });
    checkbox.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
    card.appendChild(checkbox);

    // Prevent checkbox click from triggering card click
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(photo.id, !selected);
      }
    });
  }

  // Event handlers
  const handleClick = () => {
    if (onClick) {
      onClick(photo.id);
    }
  };

  const handleKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) {
        onClick(photo.id);
      }
    }
  };

  card.addEventListener('click', handleClick);
  card.addEventListener('keydown', handleKeydown);

  return card;
}

/**
 * PhotoCard class for lifecycle management
 */
export class PhotoCard {
  /**
   * Create a PhotoCard instance
   * @param {Object} options - Card options
   */
  constructor(options) {
    this.photo = options.photo;
    this.onClick = options.onClick;
    this.onSelect = options.onSelect;
    this.selectable = options.selectable || false;
    this.selected = options.selected || false;
    this.element = null;
    this.objectUrls = [];
  }

  /**
   * Render the card
   * @returns {HTMLElement} Card element
   */
  render() {
    this.element = createPhotoCard({
      photo: this.photo,
      onClick: this.onClick,
      onSelect: this.onSelect,
      selectable: this.selectable,
      selected: this.selected
    });

    // Track blob URL for cleanup
    if (this.photo.thumbnail) {
      const img = this.element.querySelector('.photo-card__image');
      if (img) {
        this.objectUrls.push(img.src);
      }
    }

    return this.element;
  }

  /**
   * Update selection state
   * @param {boolean} selected - New selection state
   */
  setSelected(selected) {
    this.selected = selected;
    
    if (this.element) {
      this.element.classList.toggle('photo-card--selected', selected);
      
      const checkbox = this.element.querySelector('.photo-card__checkbox');
      if (checkbox) {
        checkbox.classList.toggle('photo-card__checkbox--checked', selected);
        checkbox.setAttribute('aria-checked', String(selected));
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Revoke blob URLs
    this.objectUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls = [];

    // Remove element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
