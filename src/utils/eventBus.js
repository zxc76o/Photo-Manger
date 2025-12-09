/**
 * Event Bus for cross-module communication
 * @module utils/eventBus
 */

/**
 * Creates a new EventBus instance
 * @returns {EventBus}
 */
function createEventBus() {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  return {
    /**
     * Subscribe to an event
     * @template T
     * @param {string} event - Event name
     * @param {(data: T) => void} handler - Event handler
     * @returns {() => void} Unsubscribe function
     */
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(handler);
      
      // Return unsubscribe function
      return () => this.off(event, handler);
    },

    /**
     * Unsubscribe from an event
     * @template T
     * @param {string} event - Event name
     * @param {(data: T) => void} handler - Event handler to remove
     */
    off(event, handler) {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(handler);
        if (eventListeners.size === 0) {
          listeners.delete(event);
        }
      }
    },

    /**
     * Emit an event
     * @template T
     * @param {string} event - Event name
     * @param {T} data - Event data
     */
    emit(event, data) {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for "${event}":`, error);
          }
        });
      }
    },

    /**
     * Subscribe to an event once
     * @template T
     * @param {string} event - Event name
     * @param {(data: T) => void} handler - Event handler
     * @returns {() => void} Unsubscribe function
     */
    once(event, handler) {
      const onceHandler = (data) => {
        this.off(event, onceHandler);
        handler(data);
      };
      return this.on(event, onceHandler);
    },

    /**
     * Clear all listeners for an event or all events
     * @param {string} [event] - Optional event name
     */
    clear(event) {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    }
  };
}

/** Global event bus instance */
export const eventBus = createEventBus();

/** Event types */
export const EVENTS = {
  // Album events
  ALBUM_CREATED: 'album:created',
  ALBUM_UPDATED: 'album:updated',
  ALBUM_DELETED: 'album:deleted',
  ALBUM_REORDERED: 'album:reordered',
  
  // Photo events
  PHOTO_IMPORTED: 'photo:imported',
  PHOTO_ADDED: 'photo:added',
  PHOTO_MOVED: 'photo:moved',
  PHOTO_DELETED: 'photo:deleted',
  
  // Import events
  IMPORT_PROGRESS: 'import:progress',
  IMPORT_COMPLETE: 'import:complete',
  
  // Settings events
  SETTINGS_CHANGED: 'settings:changed',
  
  // Navigation events
  NAVIGATE_ALBUM: 'navigate:album',
  NAVIGATE_HOME: 'navigate:home',
  
  // UI events
  LOADING_START: 'loading:start',
  LOADING_END: 'loading:end',
  ERROR: 'error'
};
