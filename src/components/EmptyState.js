/**
 * Empty State Component
 * Displays placeholder content when no items exist
 * @module src/components/EmptyState
 */

import { createElement } from '../utils/dom.js';

/**
 * Icon SVGs for empty states
 */
const ICONS = {
  albums: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
  `,
  photos: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
  `,
  search: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  `,
  error: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `
};

/**
 * Create an empty state element
 * @param {Object} options - Empty state options
 * @param {string} options.title - Title text
 * @param {string} [options.message] - Optional message text
 * @param {string} [options.icon='albums'] - Icon name
 * @param {Object} [options.action] - Optional action button
 * @param {string} options.action.label - Button label
 * @param {Function} options.action.onClick - Button click handler
 * @returns {HTMLElement} Empty state element
 */
export function createEmptyState({ title, message, icon = 'albums', action }) {
  const container = createElement('div', {
    className: 'empty-state',
    attrs: {
      role: 'status',
      'aria-live': 'polite'
    }
  });

  // Icon
  const iconContainer = createElement('div', {
    className: 'empty-state__icon'
  });
  iconContainer.innerHTML = ICONS[icon] || ICONS.albums;
  container.appendChild(iconContainer);

  // Title
  const titleElement = createElement('h2', {
    className: 'empty-state__title',
    text: title
  });
  container.appendChild(titleElement);

  // Message
  if (message) {
    const messageElement = createElement('p', {
      className: 'empty-state__message',
      text: message
    });
    container.appendChild(messageElement);
  }

  // Action button
  if (action) {
    const button = createElement('button', {
      className: 'empty-state__action btn btn-primary',
      text: action.label
    });
    button.addEventListener('click', action.onClick);
    container.appendChild(button);
  }

  return container;
}
