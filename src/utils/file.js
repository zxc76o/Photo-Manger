/**
 * File Utilities
 * @module utils/file
 */

import { SUPPORTED_FORMATS, MAX_FILE_SIZE } from './constants.js';

/**
 * Generate a UUID v4
 * @returns {string}
 */
export function generateUUID() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a file is a supported image type
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageType(file) {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Invalid file' };
  }
  
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return { 
      valid: false, 
      error: `Unsupported image format. Use JPEG, PNG, GIF, WebP, or HEIC.` 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    return { 
      valid: false, 
      error: `File exceeds maximum size of ${maxMB}MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Get file extension from filename
 * @param {string} fileName - File name
 * @returns {string} - Lowercase extension without dot
 */
export function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }
  
  return fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Get MIME type from file extension
 * @param {string} extension - File extension (without dot)
 * @returns {string|null}
 */
export function getMimeType(extension) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heic'
  };
  
  return mimeTypes[extension.toLowerCase()] || null;
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @param {number} [decimals=1] - Decimal places
 * @returns {string}
 */
export function formatFileSize(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>}
 */
export function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read file as Data URL
 * @param {File} file - File to read
 * @returns {Promise<string>}
 */
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Create object URL for a blob and track for cleanup
 * @param {Blob} blob - Blob to create URL for
 * @returns {string}
 */
export function createObjectURL(blob) {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to free memory
 * @param {string} url - Object URL to revoke
 */
export function revokeObjectURL(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} fileName - File name for download
 */
export function downloadBlob(blob, fileName) {
  const url = createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  revokeObjectURL(url);
}

/**
 * Check if browser supports required file APIs
 * @returns {{supported: boolean, missing: string[]}}
 */
export function checkFileAPISupport() {
  const missing = [];
  
  if (typeof File === 'undefined') {
    missing.push('File');
  }
  if (typeof FileReader === 'undefined') {
    missing.push('FileReader');
  }
  if (typeof Blob === 'undefined') {
    missing.push('Blob');
  }
  if (typeof URL === 'undefined' || !URL.createObjectURL) {
    missing.push('URL.createObjectURL');
  }
  
  return {
    supported: missing.length === 0,
    missing
  };
}
