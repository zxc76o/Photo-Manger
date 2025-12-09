/**
 * DragDrop Component Unit Tests
 * @module tests/unit/components/DragDrop.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragDrop } from '../../../src/components/DragDrop.js';

describe('DragDrop', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('makeDraggable', () => {
    it('should make element draggable', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDraggable(element, { id: 'item-1' });

      expect(element.getAttribute('draggable')).toBe('true');
    });

    it('should add dragging class on dragstart', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDraggable(element, { id: 'item-1' });

      const event = new Event('dragstart');
      event.dataTransfer = { setData: vi.fn() };
      element.dispatchEvent(event);

      expect(element.classList.contains('dragging')).toBe(true);
    });

    it('should remove dragging class on dragend', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDraggable(element, { id: 'item-1' });

      // Start drag
      const startEvent = new Event('dragstart');
      startEvent.dataTransfer = { setData: vi.fn() };
      element.dispatchEvent(startEvent);

      // End drag
      const endEvent = new Event('dragend');
      element.dispatchEvent(endEvent);

      expect(element.classList.contains('dragging')).toBe(false);
    });

    it('should set data transfer with item data', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDraggable(element, { id: 'item-1', type: 'album' });

      const setDataMock = vi.fn();
      const event = new Event('dragstart');
      event.dataTransfer = { setData: setDataMock };
      element.dispatchEvent(event);

      expect(setDataMock).toHaveBeenCalledWith('text/plain', JSON.stringify({ id: 'item-1', type: 'album' }));
    });

    it('should call onDragStart callback', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const onDragStart = vi.fn();
      DragDrop.makeDraggable(element, { id: 'item-1' }, { onDragStart });

      const event = new Event('dragstart');
      event.dataTransfer = { setData: vi.fn() };
      element.dispatchEvent(event);

      expect(onDragStart).toHaveBeenCalledWith({ id: 'item-1' }, expect.any(Event));
    });

    it('should call onDragEnd callback', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const onDragEnd = vi.fn();
      DragDrop.makeDraggable(element, { id: 'item-1' }, { onDragEnd });

      const event = new Event('dragend');
      element.dispatchEvent(event);

      expect(onDragEnd).toHaveBeenCalled();
    });
  });

  describe('makeDropZone', () => {
    it('should prevent default on dragover', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDropZone(element, { onDrop: vi.fn() });

      const event = new Event('dragover', { cancelable: true });
      event.preventDefault = vi.fn();
      element.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should add drag-over class on dragenter', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDropZone(element, { onDrop: vi.fn() });

      const event = new Event('dragenter');
      element.dispatchEvent(event);

      expect(element.classList.contains('drag-over')).toBe(true);
    });

    it('should remove drag-over class on dragleave', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDropZone(element, { onDrop: vi.fn() });

      // Enter
      const enterEvent = new Event('dragenter');
      element.dispatchEvent(enterEvent);

      // Leave
      const leaveEvent = new Event('dragleave');
      element.dispatchEvent(leaveEvent);

      expect(element.classList.contains('drag-over')).toBe(false);
    });

    it('should call onDrop callback with parsed data', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const onDrop = vi.fn();
      DragDrop.makeDropZone(element, { onDrop });

      const event = new Event('drop', { cancelable: true });
      event.dataTransfer = {
        getData: vi.fn().mockReturnValue(JSON.stringify({ id: 'item-1', type: 'album' }))
      };
      element.dispatchEvent(event);

      expect(onDrop).toHaveBeenCalledWith(
        { id: 'item-1', type: 'album' },
        expect.any(Event)
      );
    });

    it('should remove drag-over class on drop', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      DragDrop.makeDropZone(element, { onDrop: vi.fn() });

      // Enter
      const enterEvent = new Event('dragenter');
      element.dispatchEvent(enterEvent);

      // Drop
      const dropEvent = new Event('drop');
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('{}')
      };
      element.dispatchEvent(dropEvent);

      expect(element.classList.contains('drag-over')).toBe(false);
    });
  });

  describe('createDropIndicator', () => {
    it('should create drop indicator element', () => {
      const indicator = DragDrop.createDropIndicator();

      expect(indicator.classList.contains('drop-indicator')).toBe(true);
    });

    it('should show and hide indicator', () => {
      const indicator = DragDrop.createDropIndicator();
      container.appendChild(indicator);

      DragDrop.showIndicator(indicator, 100, 50);
      expect(indicator.classList.contains('visible')).toBe(true);

      DragDrop.hideIndicator(indicator);
      expect(indicator.classList.contains('visible')).toBe(false);
    });
  });

  describe('getDropPosition', () => {
    it('should calculate drop position based on mouse coordinates', () => {
      const items = [];
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.style.width = '100px';
        item.style.height = '100px';
        container.appendChild(item);
        items.push(item);
      }

      // Mock getBoundingClientRect
      items.forEach((item, index) => {
        item.getBoundingClientRect = vi.fn().mockReturnValue({
          left: index * 110,
          right: (index + 1) * 100,
          top: 0,
          bottom: 100,
          width: 100,
          height: 100,
          x: index * 110,
          y: 0
        });
      });

      // Mouse at position 40 (before center of first item at 50)
      const position = DragDrop.getDropPosition(items, 40, 50);
      expect(position).toBe(0);
    });

    it('should return last position when mouse is past all items', () => {
      const items = [];
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        container.appendChild(item);
        item.getBoundingClientRect = vi.fn().mockReturnValue({
          left: i * 110,
          right: (i + 1) * 100,
          top: 0,
          bottom: 100,
          width: 100,
          height: 100,
          x: i * 110,
          y: 0
        });
        items.push(item);
      }

      const position = DragDrop.getDropPosition(items, 500, 50);
      expect(position).toBe(3);
    });
  });
});
