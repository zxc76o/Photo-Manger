/**
 * Application Constants
 * @module utils/constants
 */

/** IndexedDB database name */
export const DB_NAME = 'PhotoAlbumDB';

/** IndexedDB database version */
export const DB_VERSION = 1;

/** Thumbnail configuration */
export const THUMBNAIL = {
  /** Maximum dimension in pixels */
  MAX_SIZE: 200,
  /** JPEG quality (0-1) */
  QUALITY: 0.7,
  /** Output format */
  FORMAT: 'image/jpeg'
};

/** Supported image formats */
export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic'
];

/** Maximum file size in bytes (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Date grouping granularity options */
export const DATE_GRANULARITY = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year'
};

/** Sort options */
export const SORT_OPTIONS = {
  ALBUMS: {
    CUSTOM: 'custom',
    DATE_ASC: 'date-asc',
    DATE_DESC: 'date-desc'
  },
  PHOTOS: {
    DATE_ASC: 'date-asc',
    DATE_DESC: 'date-desc',
    NAME: 'name'
  }
};

/** Default settings */
export const DEFAULT_SETTINGS = {
  albumDateGranularity: DATE_GRANULARITY.MONTH,
  theme: 'system',
  thumbnailSize: THUMBNAIL.MAX_SIZE,
  sortAlbumsBy: SORT_OPTIONS.ALBUMS.CUSTOM,
  sortPhotosBy: SORT_OPTIONS.PHOTOS.DATE_ASC
};
