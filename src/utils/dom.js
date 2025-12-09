/**
 * DOM Utilities
 * @module utils/dom
 */

/**
 * Create an HTML element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} [attributes={}] - Element attributes
 * @param {(string|Node)[]} [children=[]] - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Handle children from attributes if provided
  if (attributes.children) {
    children = attributes.children;
  }
  
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'text') {
      element.textContent = value;
    } else if (key === 'attrs') {
      for (const [attrName, attrValue] of Object.entries(value)) {
        element.setAttribute(attrName, attrValue);
      }
    } else if (key === 'children') {
      // Handled above, skip
    } else {
      element.setAttribute(key, value);
    }
  }
  
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
  
  return element;
}

/**
 * Query selector with optional context
 * @param {string} selector - CSS selector
 * @param {Element|Document} [context=document] - Context element
 * @returns {Element|null}
 */
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query selector all with optional context
 * @param {string} selector - CSS selector
 * @param {Element|Document} [context=document] - Context element
 * @returns {Element[]}
 */
export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Add class to element
 * @param {Element} element - Target element
 * @param {...string} classNames - Class names to add
 */
export function addClass(element, ...classNames) {
  element.classList.add(...classNames);
}

/**
 * Remove class from element
 * @param {Element} element - Target element
 * @param {...string} classNames - Class names to remove
 */
export function removeClass(element, ...classNames) {
  element.classList.remove(...classNames);
}

/**
 * Toggle class on element
 * @param {Element} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} [force] - Force add or remove
 * @returns {boolean} - Whether class is now present
 */
export function toggleClass(element, className, force) {
  return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {Element} element - Target element
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * Remove all children from an element
 * @param {Element} element - Target element
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Show an element (remove hidden class)
 * @param {Element} element - Target element
 */
export function show(element) {
  removeClass(element, 'hidden');
}

/**
 * Hide an element (add hidden class)
 * @param {Element} element - Target element
 */
export function hide(element) {
  addClass(element, 'hidden');
}

/**
 * Set focus on element with optional scroll into view
 * @param {Element} element - Target element
 * @param {boolean} [preventScroll=false] - Prevent scrolling
 */
export function focus(element, preventScroll = false) {
  element.focus({ preventScroll });
}

/**
 * Add event listener with automatic cleanup
 * @param {EventTarget} target - Event target
 * @param {string} event - Event type
 * @param {EventListener} handler - Event handler
 * @param {AddEventListenerOptions} [options] - Event options
 * @returns {() => void} - Cleanup function
 */
export function on(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

/**
 * Wait for DOM to be ready
 * @returns {Promise<void>}
 */
export function domReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve());
    } else {
      resolve();
    }
  });
}

/**
 * Get element's position relative to viewport
 * @param {Element} element - Target element
 * @returns {DOMRect}
 */
export function getRect(element) {
  return element.getBoundingClientRect();
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Target element
 * @returns {boolean}
 */
export function isInViewport(element) {
  const rect = getRect(element);
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}
