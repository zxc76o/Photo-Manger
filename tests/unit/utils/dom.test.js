/**
 * DOM Utilities Tests
 * @module tests/unit/utils/dom.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createElement,
  qs,
  qsa,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  clearElement,
  show,
  hide,
  on
} from '../../../src/utils/dom.js';

describe('DOM Utilities', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('createElement', () => {
    it('should create element with tag name', () => {
      const el = createElement('div');
      expect(el.tagName).toBe('DIV');
    });

    it('should add attributes', () => {
      const el = createElement('input', { type: 'text', id: 'test-input' });
      expect(el.type).toBe('text');
      expect(el.id).toBe('test-input');
    });

    it('should add className', () => {
      const el = createElement('div', { className: 'foo bar' });
      expect(el.className).toBe('foo bar');
    });

    it('should add dataset attributes', () => {
      const el = createElement('div', { dataset: { id: '123', name: 'test' } });
      expect(el.dataset.id).toBe('123');
      expect(el.dataset.name).toBe('test');
    });

    it('should add event listeners', () => {
      let clicked = false;
      const el = createElement('button', { onClick: () => { clicked = true; } });
      el.click();
      expect(clicked).toBe(true);
    });

    it('should add inline styles', () => {
      const el = createElement('div', { style: { color: 'red', fontSize: '16px' } });
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('16px');
    });

    it('should append text children', () => {
      const el = createElement('p', {}, ['Hello, World!']);
      expect(el.textContent).toBe('Hello, World!');
    });

    it('should append element children', () => {
      const child = createElement('span', {}, ['Child']);
      const parent = createElement('div', {}, [child]);
      expect(parent.firstChild).toBe(child);
    });

    it('should handle mixed children', () => {
      const span = createElement('span', {}, ['World']);
      const el = createElement('p', {}, ['Hello, ', span, '!']);
      expect(el.textContent).toBe('Hello, World!');
    });
  });

  describe('qs and qsa', () => {
    beforeEach(() => {
      container.innerHTML = `
        <div class="item">1</div>
        <div class="item">2</div>
        <div class="item">3</div>
        <span id="unique">Unique</span>
      `;
    });

    it('should select single element', () => {
      const el = qs('#unique', container);
      expect(el.textContent).toBe('Unique');
    });

    it('should return null for no match', () => {
      const el = qs('.nonexistent', container);
      expect(el).toBeNull();
    });

    it('should select all matching elements', () => {
      const els = qsa('.item', container);
      expect(els).toHaveLength(3);
      expect(els[0].textContent).toBe('1');
    });

    it('should return empty array for no matches', () => {
      const els = qsa('.nonexistent', container);
      expect(els).toEqual([]);
    });
  });

  describe('Class manipulation', () => {
    let el;

    beforeEach(() => {
      el = createElement('div', { className: 'initial' });
    });

    it('should add classes', () => {
      addClass(el, 'foo', 'bar');
      expect(el.classList.contains('foo')).toBe(true);
      expect(el.classList.contains('bar')).toBe(true);
    });

    it('should remove classes', () => {
      addClass(el, 'foo', 'bar');
      removeClass(el, 'foo');
      expect(el.classList.contains('foo')).toBe(false);
      expect(el.classList.contains('bar')).toBe(true);
    });

    it('should toggle classes', () => {
      expect(toggleClass(el, 'toggled')).toBe(true);
      expect(el.classList.contains('toggled')).toBe(true);
      
      expect(toggleClass(el, 'toggled')).toBe(false);
      expect(el.classList.contains('toggled')).toBe(false);
    });

    it('should force toggle classes', () => {
      toggleClass(el, 'forced', true);
      expect(el.classList.contains('forced')).toBe(true);
      
      toggleClass(el, 'forced', true); // Force add again
      expect(el.classList.contains('forced')).toBe(true);
    });

    it('should check for class presence', () => {
      expect(hasClass(el, 'initial')).toBe(true);
      expect(hasClass(el, 'nonexistent')).toBe(false);
    });
  });

  describe('clearElement', () => {
    it('should remove all children', () => {
      const el = createElement('div', {}, [
        createElement('span'),
        createElement('span'),
        'text'
      ]);
      expect(el.childNodes.length).toBe(3);
      
      clearElement(el);
      expect(el.childNodes.length).toBe(0);
    });
  });

  describe('show and hide', () => {
    it('should show element by removing hidden class', () => {
      const el = createElement('div', { className: 'hidden' });
      show(el);
      expect(el.classList.contains('hidden')).toBe(false);
    });

    it('should hide element by adding hidden class', () => {
      const el = createElement('div');
      hide(el);
      expect(el.classList.contains('hidden')).toBe(true);
    });
  });

  describe('on', () => {
    it('should add event listener and return cleanup function', () => {
      const el = createElement('button');
      let count = 0;
      
      const cleanup = on(el, 'click', () => { count++; });
      
      el.click();
      expect(count).toBe(1);
      
      cleanup();
      el.click();
      expect(count).toBe(1); // Should not increment after cleanup
    });
  });
});
