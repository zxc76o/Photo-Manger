/**
 * Photo Album Organizer - Main Entry Point
 * @module main
 */

import './styles/main.css';
import './styles/utilities.css';
import './styles/components/album-card.css';
import './styles/components/album-grid.css';
import './styles/components/photo-card.css';
import './styles/components/photo-grid.css';
import './styles/components/drop-zone.css';
import './styles/components/import-progress.css';
import './styles/components/photo-preview.css';
import './styles/components/drag-drop.css';
import './styles/components/context-menu.css';
import './styles/components/dialog.css';
import { eventBus, EVENTS } from './utils/eventBus.js';
import { qs, clearElement, createElement } from './utils/dom.js';
import { StorageService } from './services/StorageService.js';
import { AlbumService } from './services/AlbumService.js';
import { PhotoService } from './services/PhotoService.js';
import { ImportService } from './services/ImportService.js';
import { AlbumGrid } from './components/AlbumGrid.js';
import { PhotoGrid } from './components/PhotoGrid.js';
import { DropZone } from './components/DropZone.js';
import { ImportProgress } from './components/ImportProgress.js';
import { PhotoPreview } from './components/PhotoPreview.js';
import { ContextMenu } from './components/ContextMenu.js';
import { Dialog } from './components/Dialog.js';

/**
 * Application state
 */
const appState = {
  currentView: 'albums', // 'albums' | 'photos'
  currentAlbumId: null,
  isLoading: false
};

/**
 * Service instances
 */
let storageService = null;
let albumService = null;
let photoService = null;
let importService = null;
let albumGrid = null;
let photoGrid = null;
let dropZone = null;
let importProgress = null;
let photoPreview = null;
let albumContextMenu = null;
let createAlbumDialog = null;
let renameAlbumDialog = null;
let deleteAlbumDialog = null;

/**
 * Initialize the application
 */
async function init() {
  console.log('Photo Album Organizer initializing...');
  
  // Set up event listeners
  setupEventListeners();
  
  // Check for stored theme preference
  initializeTheme();
  
  // Show loading state
  showLoading(true);
  
  try {
    // Initialize StorageService
    storageService = new StorageService();
    await storageService.init();
    
    // Initialize AlbumService
    albumService = new AlbumService(storageService, eventBus);
    
    // Initialize PhotoService
    photoService = new PhotoService(storageService, albumService, eventBus);
    
    // Initialize ImportService
    importService = new ImportService(albumService, photoService, eventBus);
    
    // Initialize ImportProgress
    initializeImportProgress();
    
    // Initialize PhotoPreview
    initializePhotoPreview();
    
    // Initialize Album Management (context menu & dialogs)
    initializeAlbumManagement();

    // Render album grid
    await renderAlbumView();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showError('Failed to load albums. Please refresh the page.');
  } finally {
    showLoading(false);
  }
}

/**
 * Render the album grid view
 */
async function renderAlbumView() {
  const mainContent = qs('.main-content');
  if (!mainContent) return;
  
  // Update header with create album button
  updateHeader('My Albums', false, { showCreateAlbum: true });
  
  // Clear existing content
  clearElement(mainContent);
  
  // Create drop zone for importing
  dropZone = new DropZone();
  const dropZoneElement = dropZone.render();
  mainContent.appendChild(dropZoneElement);
  
  // Handle file drops
  dropZone.onFiles((files) => handleImportFiles(files));
  
  // Create album grid container
  const container = document.createElement('div');
  container.id = 'album-grid-container';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Photo albums');
  mainContent.appendChild(container);
  
  // Destroy previous grid if exists
  if (albumGrid) {
    albumGrid.destroy();
  }
  
  // Create and render album grid
  albumGrid = new AlbumGrid({
    albumService,
    container,
    onAlbumClick: handleAlbumClick,
    onReorder: handleAlbumReorder,
    onContextMenu: showAlbumContextMenu
  });
  
  await albumGrid.render();
  
  // Set focus to first album card for keyboard navigation
  const firstCard = qs('.album-card', container);
  if (firstCard) {
    firstCard.focus();
  }
}

/**
 * Handle album card click
 * @param {string} albumId - Album ID
 */
function handleAlbumClick(albumId) {
  eventBus.emit(EVENTS.NAVIGATE_ALBUM, { albumId });
}

/**
 * Handle album reorder (drag-drop)
 * @param {string} albumId - Album ID that was moved
 * @param {number} newPosition - New position index
 */
async function handleAlbumReorder(albumId, newPosition) {
  try {
    await albumService.reorderAlbum(albumId, newPosition);
    // Refresh grid to show new order
    if (albumGrid) {
      await albumGrid.refresh();
    }
  } catch (error) {
    console.error('Failed to reorder album:', error);
  }
}

/**
 * Render the photo grid view
 * @param {string} albumId - Album ID
 */
async function renderPhotoView(albumId) {
  const mainContent = qs('.main-content');
  if (!mainContent) return;
  
  // Get album info for title
  const album = await albumService.getAlbum(albumId);
  if (!album) {
    showError('Album not found');
    eventBus.emit(EVENTS.NAVIGATE_HOME, {});
    return;
  }
  
  // Update header with album name and back button
  updateHeader(album.name, true);
  
  // Clear existing content
  clearElement(mainContent);
  
  // Create compact drop zone for importing to this album
  const compactDropZone = new DropZone();
  const dropZoneElement = compactDropZone.render();
  dropZoneElement.classList.add('drop-zone--compact');
  mainContent.appendChild(dropZoneElement);
  
  // Handle file drops - import to current album
  compactDropZone.onFiles((files) => handleImportFiles(files, albumId));
  
  // Create photo grid container
  const container = document.createElement('div');
  container.id = 'photo-grid-container';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', `Photos in ${album.name}`);
  mainContent.appendChild(container);
  
  // Destroy previous grid if exists
  if (photoGrid) {
    photoGrid.destroy();
  }
  
  // Create and render photo grid
  photoGrid = new PhotoGrid({
    photoService,
    albumId,
    container,
    onPhotoClick: handlePhotoClick
  });
  
  await photoGrid.render();
  
  // Set focus to first photo card for keyboard navigation
  const firstCard = qs('.photo-card', container);
  if (firstCard) {
    firstCard.focus();
  }
}

/**
 * Handle photo click - open photo preview
 * @param {string} photoId - Photo ID
 */
async function handlePhotoClick(photoId) {
  if (!photoPreview || !appState.currentAlbumId) return;
  
  try {
    const photos = await photoService.getPhotosByAlbum(appState.currentAlbumId);
    const index = photos.findIndex(p => p.id === photoId);
    
    if (index !== -1) {
      photoPreview.open(photos, index);
    }
  } catch (error) {
    console.error('Failed to open photo preview:', error);
  }
}

/**
 * Update header with title and back button
 * @param {string} title - Header title
 * @param {boolean} showBack - Show back button
 */
/**
 * Update header state
 * @param {string} title - Header title
 * @param {boolean} showBack - Show back button
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.showCreateAlbum] - Show create album button
 */
function updateHeader(title, showBack = false, options = {}) {
  const headerTitle = qs('.header__title');
  const backButton = qs('.header__back');
  const headerActions = qs('.header-actions');
  
  if (headerTitle) {
    headerTitle.textContent = title;
  }
  
  if (backButton) {
    backButton.classList.toggle('hidden', !showBack);
    backButton.setAttribute('aria-hidden', String(!showBack));
  }

  // Update header actions
  if (headerActions) {
    clearElement(headerActions);

    if (options.showCreateAlbum) {
      const createBtn = createElement('button', {
        className: 'header-action-btn',
        attrs: {
          'aria-label': 'Create new album',
          title: 'Create Album'
        }
      });
      createBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
      createBtn.addEventListener('click', showCreateAlbumDialog);
      headerActions.appendChild(createBtn);
    }
  }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
  // Navigation events
  eventBus.on(EVENTS.NAVIGATE_HOME, async () => {
    appState.currentView = 'albums';
    appState.currentAlbumId = null;
    await renderAlbumView();
  });
  
  eventBus.on(EVENTS.NAVIGATE_ALBUM, async ({ albumId }) => {
    appState.currentView = 'photos';
    appState.currentAlbumId = albumId;
    await renderPhotoView(albumId);
  });
  
  // Album events - refresh grid when albums change
  eventBus.on(EVENTS.ALBUM_CREATED, async () => {
    if (albumGrid && appState.currentView === 'albums') {
      await albumGrid.refresh();
    }
  });
  
  eventBus.on(EVENTS.ALBUM_UPDATED, async () => {
    if (albumGrid && appState.currentView === 'albums') {
      await albumGrid.refresh();
    }
  });
  
  // Photo events - refresh grid when photos change
  eventBus.on(EVENTS.PHOTO_ADDED, async () => {
    if (photoGrid && appState.currentView === 'photos') {
      await photoGrid.refresh();
    }
  });
  
  eventBus.on(EVENTS.PHOTO_DELETED, async () => {
    if (photoGrid && appState.currentView === 'photos') {
      await photoGrid.refresh();
    }
  });
  
  eventBus.on(EVENTS.PHOTO_MOVED, async () => {
    if (photoGrid && appState.currentView === 'photos') {
      await photoGrid.refresh();
    }
  });
  
  // Loading events
  eventBus.on(EVENTS.LOADING_START, () => showLoading(true));
  eventBus.on(EVENTS.LOADING_END, () => showLoading(false));
  
  // Error events
  eventBus.on(EVENTS.ERROR, ({ message }) => showError(message));
  
  // Keyboard navigation
  document.addEventListener('keydown', handleKeyDown);
  
  // Back button click
  const backButton = qs('.header__back');
  if (backButton) {
    backButton.addEventListener('click', () => {
      eventBus.emit(EVENTS.NAVIGATE_HOME, {});
    });
  }
}

/**
 * Handle keyboard events
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
  // Escape key to go back or close modals
  if (event.key === 'Escape') {
    const modal = document.getElementById('modal-container');
    if (!modal.classList.contains('hidden')) {
      // Close modal
      modal.classList.add('hidden');
      modal.innerHTML = '';
    } else if (appState.currentView === 'photos') {
      // Navigate back to albums
      eventBus.emit(EVENTS.NAVIGATE_HOME, {});
    }
  }
}

/**
 * Initialize theme based on user preference
 */
function initializeTheme() {
  // Check for stored preference
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme && storedTheme !== 'system') {
    document.documentElement.setAttribute('data-theme', storedTheme);
  }
}

/**
 * Initialize import progress overlay
 */
function initializeImportProgress() {
  importProgress = new ImportProgress(eventBus);
  const element = importProgress.render();
  document.body.appendChild(element);
}

/**
 * Initialize photo preview modal
 */
function initializePhotoPreview() {
  photoPreview = new PhotoPreview();
  const element = photoPreview.render();
  document.body.appendChild(element);
}

/**
 * Initialize album management dialogs
 */
function initializeAlbumManagement() {
  // Album context menu
  albumContextMenu = new ContextMenu({
    items: [
      { id: 'rename', label: 'Rename Album', icon: '✏️' },
      { id: 'set-cover', label: 'Set Cover Photo', icon: '🖼️' },
      { type: 'separator' },
      { id: 'delete', label: 'Delete Album', icon: '🗑️' }
    ],
    onSelect: handleAlbumMenuAction
  });
  document.body.appendChild(albumContextMenu.render());

  // Create album dialog
  createAlbumDialog = new Dialog({
    title: 'Create New Album',
    type: 'prompt',
    inputPlaceholder: 'Album name',
    confirmText: 'Create',
    onConfirm: handleCreateAlbum
  });
  document.body.appendChild(createAlbumDialog.render());

  // Rename album dialog
  renameAlbumDialog = new Dialog({
    title: 'Rename Album',
    type: 'prompt',
    inputPlaceholder: 'New name',
    confirmText: 'Rename',
    onConfirm: handleRenameAlbum
  });
  document.body.appendChild(renameAlbumDialog.render());

  // Delete album dialog
  deleteAlbumDialog = new Dialog({
    title: 'Delete Album',
    message: 'Are you sure you want to delete this album? This action cannot be undone.',
    type: 'confirm',
    confirmText: 'Delete',
    danger: true,
    onConfirm: handleDeleteAlbum
  });
  document.body.appendChild(deleteAlbumDialog.render());
}

/**
 * Handle album context menu action
 * @param {string} actionId - Action ID
 * @param {Object} context - Context data
 */
async function handleAlbumMenuAction(actionId, context) {
  if (!context || !context.albumId) return;

  const albumId = context.albumId;

  switch (actionId) {
    case 'rename':
      const album = await albumService.getAlbum(albumId);
      if (album) {
        renameAlbumDialog.setValue(album.name);
        renameAlbumDialog.albumId = albumId;
        renameAlbumDialog.show();
      }
      break;
    case 'set-cover':
      // TODO: Implement set cover photo
      console.log('Set cover photo for album:', albumId);
      break;
    case 'delete':
      deleteAlbumDialog.albumId = albumId;
      deleteAlbumDialog.show();
      break;
  }
}

/**
 * Handle create album
 * @param {string} name - Album name
 */
async function handleCreateAlbum(name) {
  if (!name || !name.trim()) return;

  try {
    await albumService.createAlbum(name.trim());
    if (albumGrid) {
      await albumGrid.refresh();
    }
  } catch (error) {
    console.error('Failed to create album:', error);
  }
}

/**
 * Handle rename album
 * @param {string} newName - New album name
 */
async function handleRenameAlbum(newName) {
  if (!newName || !newName.trim() || !renameAlbumDialog.albumId) return;

  try {
    await albumService.renameAlbum(renameAlbumDialog.albumId, newName.trim());
    if (albumGrid) {
      await albumGrid.refresh();
    }
  } catch (error) {
    console.error('Failed to rename album:', error);
  }
}

/**
 * Handle delete album
 */
async function handleDeleteAlbum() {
  if (!deleteAlbumDialog.albumId) return;

  try {
    await albumService.deleteAlbum(deleteAlbumDialog.albumId, { deletePhotos: true });
    if (albumGrid) {
      await albumGrid.refresh();
    }
  } catch (error) {
    console.error('Failed to delete album:', error);
  }
}

/**
 * Show create album dialog
 */
function showCreateAlbumDialog() {
  if (createAlbumDialog) {
    createAlbumDialog.setValue('');
    createAlbumDialog.show();
  }
}

/**
 * Show album context menu
 * @param {string} albumId - Album ID
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function showAlbumContextMenu(albumId, x, y) {
  if (albumContextMenu) {
    albumContextMenu.show(x, y, { albumId });
  }
}

/**
 * Handle file import
 * @param {File[]} files - Files to import
 * @param {string} [albumId] - Optional target album ID
 */
async function handleImportFiles(files, albumId = null) {
  if (!importService || files.length === 0) return;
  
  // Show progress
  if (importProgress) {
    importProgress.show();
  }
  
  try {
    const options = albumId ? { albumId } : {};
    const result = await importService.importFiles(files, options);
    
    // Refresh album grid if on albums view
    if (appState.currentView === 'albums' && albumGrid) {
      await albumGrid.refresh();
    }
    
    // Refresh photo grid if on photos view
    if (appState.currentView === 'photos' && photoGrid) {
      await photoGrid.refresh();
    }
    
    return result;
  } catch (error) {
    console.error('Import failed:', error);
    eventBus.emit(EVENTS.ERROR, { message: 'Failed to import files' });
  }
}

/**
 * Show or hide loading indicator
 * @param {boolean} show
 */
function showLoading(show) {
  appState.isLoading = show;
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

/**
 * Show error message to user
 * @param {string} message
 */
function showError(message) {
  console.error('Error:', message);
  // TODO: Implement proper error UI component
  alert(message);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
export { appState, init, showLoading, showError };
