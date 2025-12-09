/**
 * Context Menu Component Unit Tests
 * @module tests/unit/components/ContextMenu.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextMenu } from '../../../src/components/ContextMenu.js';

describe('ContextMenu', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('render', () => {
    it('should create context menu element', () => {
      const menu = new ContextMenu({
        items: [
          { id: 'rename', label: 'Rename' }
        ]
      });

      const element = menu.render();

      expect(element.classList.contains('context-menu')).toBe(true);
    });

    it('should render menu items', () => {
      const menu = new ContextMenu({
        items: [
          { id: 'rename', label: 'Rename' },
          { id: 'delete', label: 'Delete' }
        ]
      });

      const element = menu.render();
      const items = element.querySelectorAll('.context-menu__item');

      expect(items).toHaveLength(2);
      expect(items[0].textContent).toContain('Rename');
      expect(items[1].textContent).toContain('Delete');
    });

    it('should render separator items', () => {
      const menu = new ContextMenu({
        items: [
          { id: 'rename', label: 'Rename' },
          { type: 'separator' },
          { id: 'delete', label: 'Delete' }
        ]
      });

      const element = menu.render();
      const separator = element.querySelector('.context-menu__separator');

      expect(separator).not.toBeNull();
    });

    it('should render items with icons', () => {
      const menu = new ContextMenu({
        items: [
          { id: 'rename', label: 'Rename', icon: '✏️' }
        ]
      });

      const element = menu.render();
      const icon = element.querySelector('.context-menu__icon');

      expect(icon).not.toBeNull();
      expect(icon.textContent).toBe('✏️');
    });
  });

  describe('show', () => {
    it('should show menu at specified position', () => {
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }]
      });

      const element = menu.render();
      container.appendChild(element);

      menu.show(100, 200);

      expect(element.classList.contains('context-menu--visible')).toBe(true);
      expect(element.style.left).toBe('100px');
      expect(element.style.top).toBe('200px');
    });

    it('should emit show event', () => {
      const onShow = vi.fn();
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }],
        onShow
      });

      menu.render();
      menu.show(100, 200);

      expect(onShow).toHaveBeenCalled();
    });
  });

  describe('hide', () => {
    it('should hide the menu', () => {
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }]
      });

      const element = menu.render();
      container.appendChild(element);

      menu.show(100, 200);
      menu.hide();

      expect(element.classList.contains('context-menu--visible')).toBe(false);
    });

    it('should emit hide event', () => {
      const onHide = vi.fn();
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }],
        onHide
      });

      menu.render();
      menu.show(100, 200);
      menu.hide();

      expect(onHide).toHaveBeenCalled();
    });
  });

  describe('item selection', () => {
    it('should call onSelect callback when item is clicked', () => {
      const onSelect = vi.fn();
      const menu = new ContextMenu({
        items: [
          { id: 'rename', label: 'Rename' },
          { id: 'delete', label: 'Delete' }
        ],
        onSelect
      });

      const element = menu.render();
      container.appendChild(element);
      menu.show(100, 200, { albumId: 'test-album' });

      const renameItem = element.querySelector('[data-action="rename"]');
      renameItem.click();

      expect(onSelect).toHaveBeenCalledWith('rename', { albumId: 'test-album' });
    });

    it('should hide menu after item selection', () => {
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }],
        onSelect: vi.fn()
      });

      const element = menu.render();
      container.appendChild(element);

      menu.show(100, 200);

      const item = element.querySelector('[data-action="test"]');
      item.click();

      expect(element.classList.contains('context-menu--visible')).toBe(false);
    });

    it('should support keyboard navigation', () => {
      const onSelect = vi.fn();
      const menu = new ContextMenu({
        items: [
          { id: 'rename', label: 'Rename' },
          { id: 'delete', label: 'Delete' }
        ],
        onSelect
      });

      const element = menu.render();
      container.appendChild(element);
      menu.show(100, 200, { testContext: true });

      // Press Enter on first item
      const item = element.querySelector('[data-action="rename"]');
      item.focus();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      item.dispatchEvent(event);

      expect(onSelect).toHaveBeenCalledWith('rename', { testContext: true });
    });
  });

  describe('outside click handling', () => {
    it('should hide menu when clicking outside', () => {
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }]
      });

      const element = menu.render();
      container.appendChild(element);

      menu.show(100, 200);

      // Click outside the menu
      document.body.click();

      expect(element.classList.contains('context-menu--visible')).toBe(false);
    });
  });

  describe('escape key handling', () => {
    it('should hide menu when Escape is pressed', () => {
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }]
      });

      const element = menu.render();
      container.appendChild(element);

      menu.show(100, 200);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(element.classList.contains('context-menu--visible')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should remove element and clean up listeners', () => {
      const menu = new ContextMenu({
        items: [{ id: 'test', label: 'Test' }]
      });

      const element = menu.render();
      container.appendChild(element);

      menu.destroy();

      expect(element.parentNode).toBeNull();
    });
  });
});
