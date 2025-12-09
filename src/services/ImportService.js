/**
 * Import Service
 * Handles photo file import, validation, and processing
 * @module src/services/ImportService
 */

import { EVENTS } from '../utils/eventBus.js';
import { validateImageType, formatFileSize } from '../utils/file.js';
import { getDateGroupKey, formatAlbumDate } from '../utils/date.js';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE, THUMBNAIL } from '../utils/constants.js';

/**
 * Import Service class
 * Handles file validation, processing, and import
 */
export class ImportService {
  /**
   * Create an ImportService
   * @param {AlbumService} albumService - Album service instance
   * @param {PhotoService} photoService - Photo service instance
   * @param {EventBus} eventBus - Event bus instance
   */
  constructor(albumService, photoService, eventBus) {
    this.albumService = albumService;
    this.photoService = photoService;
    this.eventBus = eventBus;
  }

  /**
   * Validate a file for import
   * @param {File} file - File to validate
   * @returns {{ valid: boolean, reason?: string }}
   */
  validateFile(file) {
    // Check file type using validateImageType utility
    const typeValidation = validateImageType(file);
    if (!typeValidation.valid) {
      return {
        valid: false,
        reason: typeValidation.error || `Unsupported file type: ${file.type || 'unknown'}`
      };
    }

    // Check file size (additional check, validateImageType also checks size)
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        reason: `File too large: ${formatFileSize(file.size)} (max ${formatFileSize(MAX_FILE_SIZE)})`
      };
    }

    return { valid: true };
  }

  /**
   * Process a file and extract metadata
   * @param {File} file - File to process
   * @returns {Promise<Object>} Processed photo data
   */
  async processFile(file) {
    // Get date from file
    const dateTaken = file.lastModified || Date.now();
    const dateSource = 'file';

    // Generate thumbnail
    const thumbnail = await this.generateThumbnail(file);

    // Get image dimensions
    const dimensions = await this.getImageDimensions(file);

    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      dateTaken,
      dateSource,
      width: dimensions.width,
      height: dimensions.height,
      thumbnail,
      originalFile: file
    };
  }

  /**
   * Generate thumbnail for an image file
   * @private
   * @param {File} file - Image file
   * @returns {Promise<Blob>} Thumbnail blob
   */
  async generateThumbnail(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate thumbnail dimensions
        let width = img.width;
        let height = img.height;
        const maxSize = THUMBNAIL.MAX_SIZE;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          THUMBNAIL.QUALITY
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Get image dimensions
   * @private
   * @param {File} file - Image file
   * @returns {Promise<{ width: number, height: number }>}
   */
  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Import multiple files
   * @param {File[]} files - Files to import
   * @param {Object} [options] - Import options
   * @param {string} [options.albumId] - Target album ID (auto-create if not specified)
   * @returns {Promise<{ success: Object[], failed: Object[] }>}
   */
  async importFiles(files, options = {}) {
    const success = [];
    const failed = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Emit progress
      this.eventBus.emit(EVENTS.IMPORT_PROGRESS, {
        current: i + 1,
        total,
        fileName: file.name
      });

      // Validate
      const validation = this.validateFile(file);
      if (!validation.valid) {
        failed.push({ file, reason: validation.reason });
        continue;
      }

      try {
        // Process file
        const photoData = await this.processFile(file);

        // Determine target album
        let albumId = options.albumId;

        if (!albumId) {
          // Auto-create album based on date
          const dateGroupKey = getDateGroupKey(new Date(photoData.dateTaken));
          const albumName = formatAlbumDate(new Date(photoData.dateTaken));
          const album = await this.albumService.findOrCreateAlbumByDateKey(dateGroupKey, albumName);
          albumId = album.id;
        }

        // Remove originalFile before saving (we don't store it)
        const { originalFile, ...dataToSave } = photoData;

        // Add photo to album
        const photo = await this.photoService.addPhoto(albumId, dataToSave);

        success.push({ file, photo, albumId });
      } catch (error) {
        failed.push({ file, reason: error.message });
      }
    }

    // Emit completion
    this.eventBus.emit(EVENTS.IMPORT_COMPLETE, { success, failed });

    return { success, failed };
  }
}
