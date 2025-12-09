/**
 * Album Card Component
 * Displays a single album as a clickable card
 * @module src/components/AlbumCard
 */

import { createElement } from '../utils/dom.js';

/**
 * Create an album card element
 * @param {Object} options - Card options
 * @param {Object} options.album - Album data
 * @param {Function} options.onClick - Click handler
 * @returns {HTMLElement} Album card element
 */
export function createAlbumCard({ album, onClick }) {
  const card = createElement('article', {
    className: 'album-card',
    attrs: {
      'data-album-id': album.id,
      role: 'button',
      tabindex: '0',
      'aria-label': `${album.name}, ${album.photoCount} photos`
    }
  });

  // Cover image / placeholder
  const coverContainer = createElement('div', {
    className: 'album-card__cover'
  });

  if (album.coverThumbnail) {
    const img = createElement('img', {
      className: 'album-card__image',
      attrs: {
        src: URL.createObjectURL(album.coverThumbnail),
        alt: '',
        loading: 'lazy'
      }
    });
    coverContainer.appendChild(img);
  } else {
    const placeholder = createElement('div', {
      className: 'album-card__placeholder'
    });
    placeholder.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
    `;
    coverContainer.appendChild(placeholder);
  }

  // Album info
  const info = createElement('div', {
    className: 'album-card__info'
  });

  const name = createElement('h3', {
    className: 'album-card__name',
    text: album.name
  });

  const count = createElement('span', {
    className: 'album-card__count',
    text: `${album.photoCount} ${album.photoCount === 1 ? 'photo' : 'photos'}`
  });

  info.appendChild(name);
  info.appendChild(count);

  card.appendChild(coverContainer);
  card.appendChild(info);

  // Event handlers
  const handleClick = () => {
    if (onClick) {
      onClick(album.id);
    }
  };

  const handleKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) {
        onClick(album.id);
      }
    }
  };

  card.addEventListener('click', handleClick);
  card.addEventListener('keydown', handleKeydown);

  return card;
}

/**
 * AlbumCard class for more complex use cases
 */
export class AlbumCard {
  /**
   * Create an AlbumCard instance
   * @param {Object} options - Card options
   */
  constructor(options) {
    this.album = options.album;
    this.onClick = options.onClick;
    this.element = null;
    this.objectUrls = [];
  }

  /**
   * Render the card
   * @returns {HTMLElement} Card element
   */
  render() {
    this.element = createAlbumCard({
      album: this.album,
      onClick: this.onClick
    });
    
    // Track blob URL for cleanup
    if (this.album.coverThumbnail) {
      const img = this.element.querySelector('.album-card__image');
      if (img) {
        this.objectUrls.push(img.src);
      }
    }
    
    return this.element;
  }

  /**
   * Update album data
   * @param {Object} album - New album data
   */
  update(album) {
    this.album = album;
    
    if (this.element) {
      const name = this.element.querySelector('.album-card__name');
      const count = this.element.querySelector('.album-card__count');
      
      if (name) {
        name.textContent = album.name;
      }
      
      if (count) {
        count.textContent = `${album.photoCount} ${album.photoCount === 1 ? 'photo' : 'photos'}`;
      }
      
      // Update aria-label
      this.element.setAttribute('aria-label', `${album.name}, ${album.photoCount} photos`);
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
