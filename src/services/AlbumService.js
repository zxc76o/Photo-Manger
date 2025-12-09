/**
 * Album Service
 * Business logic for album operations
 * @module src/services/AlbumService
 */

import { generateUUID } from '../utils/file.js';
import { EVENTS } from '../utils/eventBus.js';

/**
 * Album Service class
 * Handles all album-related business logic
 */
export class AlbumService {
  /**
   * Create a new AlbumService
   * @param {StorageService} storage - Storage service instance
   * @param {EventBus} eventBus - Event bus instance
   */
  constructor(storage, eventBus) {
    this.storage = storage;
    this.eventBus = eventBus;
  }

  /**
   * List all albums with optional sorting
   * @param {string} [sortBy='displayOrder'] - Sort option: 'displayOrder', 'date-asc', 'date-desc', 'name'
   * @returns {Promise<Array>} Array of album summaries
   */
  async listAlbums(sortBy = 'displayOrder') {
    const albums = await this.storage.getAllAlbums();
    
    // Enrich albums with cover thumbnails
    const enrichedAlbums = await Promise.all(
      albums.map(async (album) => {
        let coverThumbnail = null;
        
        if (album.coverPhotoId) {
          const photo = await this.storage.getPhotoById(album.coverPhotoId);
          if (photo && photo.thumbnail) {
            coverThumbnail = photo.thumbnail;
          }
        }
        
        return {
          ...album,
          coverThumbnail
        };
      })
    );
    
    // Sort albums
    return this.sortAlbums(enrichedAlbums, sortBy);
  }

  /**
   * Sort albums by specified criteria
   * @private
   * @param {Array} albums - Albums to sort
   * @param {string} sortBy - Sort option
   * @returns {Array} Sorted albums
   */
  sortAlbums(albums, sortBy) {
    const sorted = [...albums];
    
    switch (sortBy) {
      case 'date-asc':
        sorted.sort((a, b) => {
          const keyA = a.dateGroupKey || '';
          const keyB = b.dateGroupKey || '';
          return keyA.localeCompare(keyB);
        });
        break;
        
      case 'date-desc':
        sorted.sort((a, b) => {
          const keyA = a.dateGroupKey || '';
          const keyB = b.dateGroupKey || '';
          return keyB.localeCompare(keyA);
        });
        break;
        
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
        
      case 'displayOrder':
      default:
        sorted.sort((a, b) => a.displayOrder - b.displayOrder);
        break;
    }
    
    return sorted;
  }

  /**
   * Get album details by ID
   * @param {string} albumId - Album ID
   * @returns {Promise<Object|null>} Album details or null if not found
   */
  async getAlbum(albumId) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      return null;
    }
    
    // Enrich with cover thumbnail
    let coverThumbnail = null;
    if (album.coverPhotoId) {
      const photo = await this.storage.getPhotoById(album.coverPhotoId);
      if (photo && photo.thumbnail) {
        coverThumbnail = photo.thumbnail;
      }
    }
    
    return {
      ...album,
      coverThumbnail
    };
  }

  /**
   * Create a new album
   * @param {string} name - Album name
   * @param {string} [dateGroupKey] - Optional date group key (YYYY-MM format)
   * @returns {Promise<Object>} Created album
   */
  async createAlbum(name, dateGroupKey = null) {
    const trimmedName = name.trim();
    
    // Get max display order
    const albums = await this.storage.getAllAlbums();
    const maxOrder = albums.reduce((max, a) => Math.max(max, a.displayOrder || 0), -1);
    
    const album = {
      id: generateUUID(),
      name: trimmedName,
      dateGroupKey,
      coverPhotoId: null,
      photoCount: 0,
      displayOrder: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await this.storage.saveAlbum(album);
    
    // Emit event
    this.eventBus.emit(EVENTS.ALBUM_CREATED, album);
    
    return album;
  }

  /**
   * Set album cover photo
   * @param {string} albumId - Album ID
   * @param {string} photoId - Photo ID to use as cover
   * @returns {Promise<Object>} Updated album
   */
  async setCoverPhoto(albumId, photoId) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      throw new Error(`Album not found: ${albumId}`);
    }
    
    album.coverPhotoId = photoId;
    album.updatedAt = Date.now();
    
    await this.storage.saveAlbum(album);
    
    // Emit event
    this.eventBus.emit(EVENTS.ALBUM_UPDATED, album);
    
    return album;
  }

  /**
   * Find existing album by date key or create new one
   * @param {string} dateGroupKey - Date group key (YYYY-MM format)
   * @param {string} name - Album name if creating new
   * @returns {Promise<Object>} Found or created album
   */
  async findOrCreateAlbumByDateKey(dateGroupKey, name) {
    const existing = await this.storage.getAlbumByDateKey(dateGroupKey);
    
    if (existing) {
      return existing;
    }
    
    return this.createAlbum(name, dateGroupKey);
  }

  /**
   * Update album photo count
   * @param {string} albumId - Album ID
   * @param {number} count - New photo count
   * @returns {Promise<void>}
   */
  async updatePhotoCount(albumId, count) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      throw new Error(`Album not found: ${albumId}`);
    }
    
    album.photoCount = count;
    album.updatedAt = Date.now();
    
    await this.storage.saveAlbum(album);
  }

  /**
   * Increment album photo count by 1
   * @param {string} albumId - Album ID
   * @returns {Promise<void>}
   */
  async incrementPhotoCount(albumId) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      throw new Error(`Album not found: ${albumId}`);
    }
    
    album.photoCount = (album.photoCount || 0) + 1;
    album.updatedAt = Date.now();
    
    await this.storage.saveAlbum(album);
  }

  /**
   * Decrement album photo count by 1 (min 0)
   * @param {string} albumId - Album ID
   * @returns {Promise<void>}
   */
  async decrementPhotoCount(albumId) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      throw new Error(`Album not found: ${albumId}`);
    }
    
    album.photoCount = Math.max(0, (album.photoCount || 0) - 1);
    album.updatedAt = Date.now();
    
    await this.storage.saveAlbum(album);
  }

  /**
   * Reorder album to a new position
   * @param {string} albumId - Album ID to move
   * @param {number} newPosition - New position (0-indexed)
   * @returns {Promise<void>}
   */
  async reorderAlbum(albumId, newPosition) {
    const albums = await this.storage.getAllAlbums();
    
    // Sort by current display order
    albums.sort((a, b) => a.displayOrder - b.displayOrder);
    
    // Find the album to move
    const currentIndex = albums.findIndex(a => a.id === albumId);
    
    if (currentIndex === -1) {
      // Album not found, do nothing
      return;
    }
    
    // Clamp new position to valid range
    const clampedPosition = Math.max(0, Math.min(newPosition, albums.length - 1));
    
    // If already at target position, do nothing
    if (currentIndex === clampedPosition) {
      return;
    }
    
    // Remove album from current position
    const [movedAlbum] = albums.splice(currentIndex, 1);
    
    // Insert at new position
    albums.splice(clampedPosition, 0, movedAlbum);
    
    // Update display orders for all albums
    const updates = albums.map((album, index) => ({
      ...album,
      displayOrder: index,
      updatedAt: Date.now()
    }));
    
    // Save all updated albums
    await Promise.all(updates.map(album => this.storage.saveAlbum(album)));
    
    // Emit event
    this.eventBus.emit(EVENTS.ALBUM_REORDERED, {
      albumId,
      newPosition: clampedPosition
    });
  }

  /**
   * Rename an album
   * @param {string} albumId - Album ID
   * @param {string} newName - New album name
   * @returns {Promise<Object>} Updated album
   */
  async renameAlbum(albumId, newName) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      throw new Error(`Album not found: ${albumId}`);
    }
    
    album.name = newName.trim();
    album.updatedAt = Date.now();
    
    await this.storage.saveAlbum(album);
    
    // Emit event
    this.eventBus.emit(EVENTS.ALBUM_UPDATED, album);
    
    return album;
  }

  /**
   * Delete an album
   * @param {string} albumId - Album ID
   * @param {Object} [options] - Delete options
   * @param {boolean} [options.deletePhotos=false] - Whether to delete photos in the album
   * @returns {Promise<void>}
   */
  async deleteAlbum(albumId, options = {}) {
    const album = await this.storage.getAlbumById(albumId);
    
    if (!album) {
      // Album doesn't exist, nothing to do
      return;
    }
    
    // Delete associated photos if requested
    if (options.deletePhotos) {
      const photos = await this.storage.getPhotosByAlbumId(albumId);
      await Promise.all(photos.map(photo => this.storage.deletePhoto(photo.id)));
    }
    
    // Delete the album
    await this.storage.deleteAlbum(albumId);
    
    // Emit event
    this.eventBus.emit(EVENTS.ALBUM_DELETED, { albumId });
  }
}
