/**
 * Photo Grid Component
 * Displays photos in a responsive grid layout
 * @module src/components/PhotoGrid
 */

import { createElement, qs, clearElement } from '../utils/dom.js';
import { PhotoCard } from './PhotoCard.js';
import { createEmptyState } from './EmptyState.js';

/**
 * Photo Grid Component
 * Manages rendering and interaction of photo cards
 */
export class PhotoGrid {
  /**
   * Create a PhotoGrid instance
   * @param {Object} options - Grid options
   * @param {PhotoService} options.photoService - Photo service instance
   * @param {string} options.albumId - Album ID
   * @param {HTMLElement} options.container - Container element
   * @param {Function} options.onPhotoClick - Photo click handler
   * @param {boolean} [options.selectable=false] - Enable selection mode
   * @param {string} [options.sortBy='date-desc'] - Sort option
   */
  constructor({ photoService, albumId, container, onPhotoClick, selectable = false, sortBy = 'date-desc' }) {
    this.photoService = photoService;
    this.albumId = albumId;
    this.container = container;
    this.onPhotoClick = onPhotoClick;
    this.selectable = selectable;
    this.sortBy = sortBy;
    this.cards = [];
    this.selectedIds = new Set();
    this.gridElement = null;
  }

  /**
   * Render the photo grid
   * @returns {Promise<void>}
   */
  async render() {
    // Clear container
    clearElement(this.container);
    this.destroyCards();

    // Fetch photos
    const photos = await this.photoService.getPhotosByAlbum(this.albumId, this.sortBy);

    // Show empty state if no photos
    if (photos.length === 0) {
      const emptyState = createEmptyState({
        title: 'No photos yet',
        message: 'Drag and drop photos here to add them to this album',
        icon: 'photos'
      });
      this.container.appendChild(emptyState);
      return;
    }

    // Create grid container
    this.gridElement = createElement('div', {
      className: 'photo-grid',
      attrs: {
        role: 'list',
        'aria-label': 'Photos'
      }
    });

    // Create photo cards
    for (const photo of photos) {
      const cardWrapper = createElement('div', {
        className: 'photo-grid__item',
        attrs: {
          role: 'listitem'
        }
      });

      const card = new PhotoCard({
        photo,
        onClick: this.onPhotoClick,
        onSelect: this.selectable ? this.handleSelect.bind(this) : null,
        selectable: this.selectable,
        selected: this.selectedIds.has(photo.id)
      });

      cardWrapper.appendChild(card.render());
      this.gridElement.appendChild(cardWrapper);
      this.cards.push(card);
    }

    this.container.appendChild(this.gridElement);
  }

  /**
   * Handle photo selection
   * @private
   * @param {string} photoId - Photo ID
   * @param {boolean} selected - Selection state
   */
  handleSelect(photoId, selected) {
    if (selected) {
      this.selectedIds.add(photoId);
    } else {
      this.selectedIds.delete(photoId);
    }

    // Update card visual state
    const card = this.cards.find(c => c.photo.id === photoId);
    if (card) {
      card.setSelected(selected);
    }
  }

  /**
   * Get selected photo IDs
   * @returns {string[]} Selected photo IDs
   */
  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.selectedIds.clear();
    this.cards.forEach(card => card.setSelected(false));
  }

  /**
   * Select all photos
   */
  selectAll() {
    this.cards.forEach(card => {
      this.selectedIds.add(card.photo.id);
      card.setSelected(true);
    });
  }

  /**
   * Enable/disable selection mode
   * @param {boolean} enabled - Selection mode state
   */
  setSelectable(enabled) {
    this.selectable = enabled;
    if (!enabled) {
      this.clearSelection();
    }
    // Re-render to update UI
    this.render();
  }

  /**
   * Refresh the grid with updated data
   * @returns {Promise<void>}
   */
  async refresh() {
    await this.render();
  }

  /**
   * Update sort order and re-render
   * @param {string} sortBy - New sort option
   * @returns {Promise<void>}
   */
  async setSortBy(sortBy) {
    this.sortBy = sortBy;
    await this.render();
  }

  /**
   * Destroy all cards and clean up resources
   */
  destroyCards() {
    for (const card of this.cards) {
      card.destroy();
    }
    this.cards = [];
  }

  /**
   * Clean up the grid
   */
  destroy() {
    this.destroyCards();
    this.selectedIds.clear();
    clearElement(this.container);
    this.gridElement = null;
  }
}
