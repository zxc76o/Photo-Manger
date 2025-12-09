/**
 * Photo Service
 * Business logic for photo operations
 * @module src/services/PhotoService
 */

import { generateUUID } from '../utils/file.js';
import { EVENTS } from '../utils/eventBus.js';

/**
 * Photo Service class
 * Handles all photo-related business logic
 */
export class PhotoService {
  /**
   * Create a new PhotoService
   * @param {StorageService} storage - Storage service instance
   * @param {AlbumService} albumService - Album service instance
   * @param {EventBus} eventBus - Event bus instance
   */
  constructor(storage, albumService, eventBus) {
    this.storage = storage;
    this.albumService = albumService;
    this.eventBus = eventBus;
  }

  /**
   * Get all photos for an album
   * @param {string} albumId - Album ID
   * @param {string} [sortBy='date-desc'] - Sort option
   * @returns {Promise<Array>} Array of photos
   */
  async getPhotosByAlbum(albumId, sortBy = 'date-desc') {
    const photos = await this.storage.getPhotosByAlbumId(albumId);
    return this.sortPhotos(photos, sortBy);
  }

  /**
   * Sort photos by specified criteria
   * @private
   * @param {Array} photos - Photos to sort
   * @param {string} sortBy - Sort option
   * @returns {Array} Sorted photos
   */
  sortPhotos(photos, sortBy) {
    const sorted = [...photos];
    
    switch (sortBy) {
      case 'date-asc':
        sorted.sort((a, b) => a.dateTaken - b.dateTaken);
        break;
        
      case 'date-desc':
      default:
        sorted.sort((a, b) => b.dateTaken - a.dateTaken);
        break;
        
      case 'name':
        sorted.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
    }
    
    return sorted;
  }

  /**
   * Get photo by ID
   * @param {string} photoId - Photo ID
   * @returns {Promise<Object|null>} Photo or null if not found
   */
  async getPhoto(photoId) {
    return this.storage.getPhotoById(photoId);
  }

  /**
   * Add a photo to an album
   * @param {string} albumId - Album ID
   * @param {Object} photoData - Photo data (without id and albumId)
   * @returns {Promise<Object>} Created photo
   */
  async addPhoto(albumId, photoData) {
    const photo = {
      id: generateUUID(),
      albumId,
      ...photoData,
      importedAt: Date.now()
    };
    
    await this.storage.savePhoto(photo);
    
    // Update album photo count
    await this.albumService.incrementPhotoCount(albumId);
    
    // Set as cover if first photo
    const album = await this.albumService.getAlbum(albumId);
    if (!album.coverPhotoId) {
      await this.albumService.setCoverPhoto(albumId, photo.id);
    }
    
    // Emit event
    this.eventBus.emit(EVENTS.PHOTO_ADDED, { photo, albumId });
    
    return photo;
  }

  /**
   * Add multiple photos to an album
   * @param {string} albumId - Album ID
   * @param {Array} photosData - Array of photo data
   * @returns {Promise<Array>} Created photos
   */
  async addPhotos(albumId, photosData) {
    const photos = [];
    
    for (const data of photosData) {
      const photo = await this.addPhoto(albumId, data);
      photos.push(photo);
    }
    
    return photos;
  }

  /**
   * Delete a photo
   * @param {string} photoId - Photo ID
   * @returns {Promise<void>}
   */
  async deletePhoto(photoId) {
    const photo = await this.storage.getPhotoById(photoId);
    
    if (!photo) {
      return;
    }
    
    const albumId = photo.albumId;
    
    await this.storage.deletePhoto(photoId);
    
    // Update album photo count
    await this.albumService.decrementPhotoCount(albumId);
    
    // If this was the cover photo, set a new one
    const album = await this.albumService.getAlbum(albumId);
    if (album && album.coverPhotoId === photoId) {
      const remainingPhotos = await this.storage.getPhotosByAlbumId(albumId);
      if (remainingPhotos.length > 0) {
        await this.albumService.setCoverPhoto(albumId, remainingPhotos[0].id);
      } else {
        await this.albumService.setCoverPhoto(albumId, null);
      }
    }
    
    // Emit event
    this.eventBus.emit(EVENTS.PHOTO_DELETED, { photoId, albumId });
  }

  /**
   * Move a photo to another album
   * @param {string} photoId - Photo ID
   * @param {string} targetAlbumId - Target album ID
   * @returns {Promise<Object>} Updated photo
   */
  async movePhoto(photoId, targetAlbumId) {
    const photo = await this.storage.getPhotoById(photoId);
    
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }
    
    const sourceAlbumId = photo.albumId;
    
    // Update photo's album
    photo.albumId = targetAlbumId;
    await this.storage.savePhoto(photo);
    
    // Update album photo counts
    await this.albumService.decrementPhotoCount(sourceAlbumId);
    await this.albumService.incrementPhotoCount(targetAlbumId);
    
    // Handle cover photo for source album
    const sourceAlbum = await this.albumService.getAlbum(sourceAlbumId);
    if (sourceAlbum && sourceAlbum.coverPhotoId === photoId) {
      const remainingPhotos = await this.storage.getPhotosByAlbumId(sourceAlbumId);
      if (remainingPhotos.length > 0) {
        await this.albumService.setCoverPhoto(sourceAlbumId, remainingPhotos[0].id);
      } else {
        await this.albumService.setCoverPhoto(sourceAlbumId, null);
      }
    }
    
    // Set as cover for target album if it has none
    const targetAlbum = await this.albumService.getAlbum(targetAlbumId);
    if (targetAlbum && !targetAlbum.coverPhotoId) {
      await this.albumService.setCoverPhoto(targetAlbumId, photoId);
    }
    
    // Emit event
    this.eventBus.emit(EVENTS.PHOTO_MOVED, { photo, sourceAlbumId, targetAlbumId });
    
    return photo;
  }
}
