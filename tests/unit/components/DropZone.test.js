/**
 * DropZone Component Tests
 * @module tests/unit/components/DropZone.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DropZone } from '../../../src/components/DropZone.js';

describe('DropZone', () => {
  let container;
  let dropZone;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    dropZone = new DropZone();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('render', () => {
    it('should render drop zone element', () => {
      const element = dropZone.render();
      
      expect(element).toBeDefined();
      expect(element.classList.contains('drop-zone')).toBe(true);
    });

    it('should include file input', () => {
      const element = dropZone.render();
      const input = element.querySelector('input[type="file"]');
      
      expect(input).toBeDefined();
      expect(input.accept).toContain('image/');
      expect(input.multiple).toBe(true);
    });

    it('should include browse button', () => {
      const element = dropZone.render();
      const button = element.querySelector('.drop-zone__browse-btn');
      
      expect(button).toBeDefined();
      expect(button.textContent).toContain('Browse');
    });

    it('should include drop instructions', () => {
      const element = dropZone.render();
      
      expect(element.textContent).toContain('Drag');
    });
  });

  describe('drag and drop events', () => {
    it('should add active class on dragover', () => {
      const element = dropZone.render();
      container.appendChild(element);
      
      const event = new Event('dragover', { bubbles: true });
      event.preventDefault = vi.fn();
      element.dispatchEvent(event);
      
      expect(element.classList.contains('drop-zone--active')).toBe(true);
    });

    it('should remove active class on dragleave', () => {
      const element = dropZone.render();
      container.appendChild(element);
      element.classList.add('drop-zone--active');
      
      const event = new Event('dragleave', { bubbles: true });
      element.dispatchEvent(event);
      
      expect(element.classList.contains('drop-zone--active')).toBe(false);
    });

    it('should emit files event on drop', async () => {
      const element = dropZone.render();
      container.appendChild(element);
      
      const onFiles = vi.fn();
      dropZone.onFiles(onFiles);
      
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const dataTransfer = {
        files: [mockFile],
        items: []
      };
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = dataTransfer;
      event.preventDefault = vi.fn();
      element.dispatchEvent(event);
      
      expect(onFiles).toHaveBeenCalledWith([mockFile]);
    });
  });

  describe('file input', () => {
    it('should emit files on input change', () => {
      const element = dropZone.render();
      container.appendChild(element);
      
      const onFiles = vi.fn();
      dropZone.onFiles(onFiles);
      
      const input = element.querySelector('input[type="file"]');
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Simulate file selection
      Object.defineProperty(input, 'files', { value: [mockFile] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      expect(onFiles).toHaveBeenCalledWith([mockFile]);
    });

    it('should trigger input on button click', () => {
      const element = dropZone.render();
      container.appendChild(element);
      
      const input = element.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(input, 'click');
      
      const button = element.querySelector('.drop-zone__browse-btn');
      button.click();
      
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should disable drop zone', () => {
      const element = dropZone.render();
      container.appendChild(element);
      
      dropZone.setDisabled(true);
      
      expect(element.classList.contains('drop-zone--disabled')).toBe(true);
      const input = element.querySelector('input[type="file"]');
      expect(input.disabled).toBe(true);
    });

    it('should not emit files when disabled', () => {
      const element = dropZone.render();
      container.appendChild(element);
      
      const onFiles = vi.fn();
      dropZone.onFiles(onFiles);
      dropZone.setDisabled(true);
      
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const dataTransfer = { files: [mockFile], items: [] };
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = dataTransfer;
      event.preventDefault = vi.fn();
      element.dispatchEvent(event);
      
      expect(onFiles).not.toHaveBeenCalled();
    });
  });
});
