/**
 * StorageService - IndexedDB wrapper for photo album data
 * @module services/StorageService
 */

import { DB_NAME, DB_VERSION } from '../utils/constants.js';

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} operation - The operation that failed
   * @param {Error} [cause] - The underlying error
   */
  constructor(message, operation, cause) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
    this.cause = cause;
  }
}

/**
 * StorageService provides low-level IndexedDB operations for albums, photos, and settings
 */
export class StorageService {
  /** @type {IDBDatabase|null} */
  #db = null;
  
  /** @type {boolean} */
  #initialized = false;

  /**
   * Initialize the database connection
   * @returns {Promise<void>}
   */
  async init() {
    if (this.#initialized && this.#db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new StorageError(
          'Failed to open database',
          'init',
          request.error
        ));
      };

      request.onsuccess = () => {
        this.#db = request.result;
        this.#initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create albums store
        if (!db.objectStoreNames.contains('albums')) {
          const albumStore = db.createObjectStore('albums', { keyPath: 'id' });
          albumStore.createIndex('displayOrder', 'displayOrder', { unique: false });
          albumStore.createIndex('dateGroupKey', 'dateGroupKey', { unique: false });
        }

        // Create photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('albumId', 'albumId', { unique: false });
          photoStore.createIndex('dateTaken', 'dateTaken', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
      this.#initialized = false;
    }
  }

  /**
   * Ensure database is initialized
   * @throws {StorageError}
   */
  #ensureDb() {
    if (!this.#db) {
      throw new StorageError('Database not initialized. Call init() first.', 'ensureDb');
    }
    return this.#db;
  }

  // ============ Album Operations ============

  /**
   * Get all albums
   * @returns {Promise<Album[]>}
   */
  async getAllAlbums() {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('albums', 'readonly');
      const store = transaction.objectStore('albums');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError(
        'Failed to get albums',
        'getAllAlbums',
        request.error
      ));
    });
  }

  /**
   * Get album by ID
   * @param {string} id - Album ID
   * @returns {Promise<Album|null>}
   */
  async getAlbumById(id) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('albums', 'readonly');
      const store = transaction.objectStore('albums');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new StorageError(
        `Failed to get album: ${id}`,
        'getAlbumById',
        request.error
      ));
    });
  }

  /**
   * Get album by date group key
   * @param {string} dateKey - Date key (e.g., "2025-01")
   * @returns {Promise<Album|null>}
   */
  async getAlbumByDateKey(dateKey) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('albums', 'readonly');
      const store = transaction.objectStore('albums');
      const index = store.index('dateGroupKey');
      const request = index.get(dateKey);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new StorageError(
        `Failed to get album by date key: ${dateKey}`,
        'getAlbumByDateKey',
        request.error
      ));
    });
  }

  /**
   * Save or update an album
   * @param {Album} album - Album to save
   * @returns {Promise<void>}
   */
  async saveAlbum(album) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('albums', 'readwrite');
      const store = transaction.objectStore('albums');
      const request = store.put(album);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(
        `Failed to save album: ${album.id}`,
        'saveAlbum',
        request.error
      ));
    });
  }

  /**
   * Delete an album
   * @param {string} id - Album ID
   * @returns {Promise<void>}
   */
  async deleteAlbum(id) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('albums', 'readwrite');
      const store = transaction.objectStore('albums');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(
        `Failed to delete album: ${id}`,
        'deleteAlbum',
        request.error
      ));
    });
  }

  // ============ Photo Operations ============

  /**
   * Get photos by album ID
   * @param {string} albumId - Album ID
   * @returns {Promise<Photo[]>}
   */
  async getPhotosByAlbumId(albumId) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('albumId');
      const request = index.getAll(albumId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError(
        `Failed to get photos for album: ${albumId}`,
        'getPhotosByAlbumId',
        request.error
      ));
    });
  }

  /**
   * Get photo by ID
   * @param {string} id - Photo ID
   * @returns {Promise<Photo|null>}
   */
  async getPhotoById(id) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new StorageError(
        `Failed to get photo: ${id}`,
        'getPhotoById',
        request.error
      ));
    });
  }

  /**
   * Save or update a photo
   * @param {Photo} photo - Photo to save
   * @returns {Promise<void>}
   */
  async savePhoto(photo) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.put(photo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(
        `Failed to save photo: ${photo.id}`,
        'savePhoto',
        request.error
      ));
    });
  }

  /**
   * Save multiple photos in a batch
   * @param {Photo[]} photos - Photos to save
   * @returns {Promise<void>}
   */
  async savePhotos(photos) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      const store = transaction.objectStore('photos');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError(
        'Failed to save photos batch',
        'savePhotos',
        transaction.error
      ));

      for (const photo of photos) {
        store.put(photo);
      }
    });
  }

  /**
   * Delete a photo
   * @param {string} id - Photo ID
   * @returns {Promise<void>}
   */
  async deletePhoto(id) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(
        `Failed to delete photo: ${id}`,
        'deletePhoto',
        request.error
      ));
    });
  }

  /**
   * Delete all photos in an album
   * @param {string} albumId - Album ID
   * @returns {Promise<void>}
   */
  async deletePhotosByAlbumId(albumId) {
    const db = this.#ensureDb();
    const photos = await this.getPhotosByAlbumId(albumId);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      const store = transaction.objectStore('photos');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError(
        `Failed to delete photos for album: ${albumId}`,
        'deletePhotosByAlbumId',
        transaction.error
      ));

      for (const photo of photos) {
        store.delete(photo.id);
      }
    });
  }

  // ============ Settings Operations ============

  /**
   * Get a setting value
   * @template T
   * @param {string} key - Setting key
   * @param {T} defaultValue - Default value if not found
   * @returns {Promise<T>}
   */
  async getSetting(key, defaultValue) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(new StorageError(
        `Failed to get setting: ${key}`,
        'getSetting',
        request.error
      ));
    });
  }

  /**
   * Set a setting value
   * @template T
   * @param {string} key - Setting key
   * @param {T} value - Setting value
   * @returns {Promise<void>}
   */
  async setSetting(key, value) {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(
        `Failed to set setting: ${key}`,
        'setSetting',
        request.error
      ));
    });
  }

  // ============ Bulk Operations ============

  /**
   * Clear all data from the database
   * @returns {Promise<void>}
   */
  async clearAllData() {
    const db = this.#ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['albums', 'photos', 'settings'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new StorageError(
        'Failed to clear all data',
        'clearAllData',
        transaction.error
      ));

      transaction.objectStore('albums').clear();
      transaction.objectStore('photos').clear();
      transaction.objectStore('settings').clear();
    });
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<{albums: number, photos: number, bytes: number}>}
   */
  async getStorageUsage() {
    const db = this.#ensureDb();
    
    const albums = await this.getAllAlbums();
    const photoCount = await new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new StorageError(
        'Failed to count photos',
        'getStorageUsage',
        request.error
      ));
    });

    // Estimate storage usage
    let bytes = 0;
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        bytes = estimate.usage || 0;
      }
    } catch {
      // Storage estimation not available
    }

    return {
      albums: albums.length,
      photos: photoCount,
      bytes
    };
  }
}

/**
 * @typedef {Object} Album
 * @property {string} id
 * @property {string} name
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string|null} coverPhotoId
 * @property {number} displayOrder
 * @property {number} photoCount
 * @property {string|null} dateGroupKey
 */

/**
 * @typedef {Object} Photo
 * @property {string} id
 * @property {string} albumId
 * @property {string} fileName
 * @property {number} fileSize
 * @property {string} mimeType
 * @property {number} dateTaken
 * @property {string} dateSource
 * @property {number} width
 * @property {number} height
 * @property {Blob} thumbnail
 * @property {number} importedAt
 */
