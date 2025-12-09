/**
 * Album Grid Component
 * Displays albums in a responsive grid layout
 * @module src/components/AlbumGrid
 */

import { createElement, qs, clearElement } from '../utils/dom.js';
import { createAlbumCard, AlbumCard } from './AlbumCard.js';
import { createEmptyState } from './EmptyState.js';
import { DragDrop } from './DragDrop.js';

/**
 * Album Grid Component
 * Manages rendering and interaction of album cards
 */
export class AlbumGrid {
  /**
   * Create an AlbumGrid instance
   * @param {Object} options - Grid options
   * @param {AlbumService} options.albumService - Album service instance
   * @param {HTMLElement} options.container - Container element
   * @param {Function} options.onAlbumClick - Album click handler
   * @param {Function} [options.onReorder] - Reorder callback (albumId, newPosition)
   * @param {Function} [options.onContextMenu] - Context menu callback (albumId, x, y)
   * @param {string} [options.sortBy='displayOrder'] - Sort option
   * @param {boolean} [options.enableDragDrop=true] - Enable drag-drop reordering
   */
  constructor({ albumService, container, onAlbumClick, onReorder, onContextMenu, sortBy = 'displayOrder', enableDragDrop = true }) {
    this.albumService = albumService;
    this.container = container;
    this.onAlbumClick = onAlbumClick;
    this.onReorder = onReorder;
    this.onContextMenu = onContextMenu;
    this.sortBy = sortBy;
    this.enableDragDrop = enableDragDrop;
    this.cards = [];
    this.gridElement = null;
    this.albums = [];
    this.refreshDragDrop = null;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  /**
   * Render the album grid
   * @returns {Promise<void>}
   */
  async render() {
    // Clear container
    clearElement(this.container);
    this.destroyCards();

    // Fetch albums
    this.albums = await this.albumService.listAlbums(this.sortBy);

    // Show empty state if no albums
    if (this.albums.length === 0) {
      const emptyState = createEmptyState({
        title: 'No albums yet',
        message: 'Import photos to create your first album',
        icon: 'albums'
      });
      this.container.appendChild(emptyState);
      return;
    }

    // Create grid container
    this.gridElement = createElement('div', {
      className: 'album-grid sortable-container',
      attrs: {
        role: 'list',
        'aria-label': 'Photo albums'
      }
    });

    // Create album cards
    for (const album of this.albums) {
      const cardWrapper = createElement('div', {
        className: 'album-grid__item',
        attrs: {
          role: 'listitem',
          'data-album-id': album.id
        }
      });

      const card = new AlbumCard({
        album,
        onClick: this.onAlbumClick
      });

      cardWrapper.appendChild(card.render());
      this.gridElement.appendChild(cardWrapper);
      this.cards.push(card);
    }

    this.container.appendChild(this.gridElement);

    // Setup context menu if callback provided
    if (this.onContextMenu) {
      this.gridElement.addEventListener('contextmenu', this.handleContextMenu);
    }

    // Setup drag-drop if enabled and not sorting by date
    if (this.enableDragDrop && this.sortBy === 'displayOrder' && this.onReorder) {
      this.setupDragDrop();
      this.setupKeyboardReordering();
    }
  }

  /**
   * Handle context menu on album cards
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  handleContextMenu(event) {
    const cardWrapper = event.target.closest('.album-grid__item');
    if (!cardWrapper) return;

    event.preventDefault();
    const albumId = cardWrapper.dataset.albumId;
    if (albumId && this.onContextMenu) {
      this.onContextMenu(albumId, event.clientX, event.clientY);
    }
  }

  /**
   * Setup drag-drop reordering
   * @private
   */
  setupDragDrop() {
    if (!this.gridElement) return;

    this.refreshDragDrop = DragDrop.setupSortable(this.gridElement, {
      itemSelector: '.album-grid__item',
      getItemId: (element) => element.dataset.albumId,
      onReorder: (fromIndex, toIndex, data) => {
        if (this.onReorder && data.id) {
          // Adjust toIndex if dragging forward
          const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
          this.onReorder(data.id, adjustedIndex);
        }
      }
    });
  }

  /**
   * Setup keyboard reordering (Alt+Arrow keys)
   * @private
   */
  setupKeyboardReordering() {
    if (!this.gridElement) return;
    this.gridElement.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Handle keyboard reordering
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    // Only handle Alt+Arrow keys
    if (!event.altKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const focusedElement = document.activeElement;
    const cardWrapper = focusedElement.closest('.album-grid__item');
    if (!cardWrapper) return;

    const albumId = cardWrapper.dataset.albumId;
    const currentIndex = this.albums.findIndex(a => a.id === albumId);
    if (currentIndex === -1) return;

    event.preventDefault();

    let newIndex;
    if (event.key === 'ArrowLeft') {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(this.albums.length - 1, currentIndex + 1);
    }

    if (newIndex !== currentIndex && this.onReorder) {
      this.onReorder(albumId, newIndex);
    }
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
    if (this.gridElement) {
      this.gridElement.removeEventListener('keydown', this.handleKeydown);
      this.gridElement.removeEventListener('contextmenu', this.handleContextMenu);
    }
    this.destroyCards();
    clearElement(this.container);
    this.gridElement = null;
    this.refreshDragDrop = null;
    this.albums = [];
  }
}
