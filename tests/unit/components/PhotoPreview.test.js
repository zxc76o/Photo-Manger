/**
 * PhotoPreview Component Tests
 * @module tests/unit/components/PhotoPreview.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhotoPreview } from '../../../src/components/PhotoPreview.js';

describe('PhotoPreview', () => {
  let container;
  let preview;
  let mockPhotos;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    mockPhotos = [
      { id: 'photo-1', fileName: 'photo1.jpg', thumbnail: new Blob(['1']) },
      { id: 'photo-2', fileName: 'photo2.jpg', thumbnail: new Blob(['2']) },
      { id: 'photo-3', fileName: 'photo3.jpg', thumbnail: new Blob(['3']) }
    ];
    
    preview = new PhotoPreview();
  });

  afterEach(() => {
    if (preview) {
      preview.close();
    }
    document.body.removeChild(container);
  });

  describe('render', () => {
    it('should render preview overlay', () => {
      const element = preview.render();
      
      expect(element).toBeDefined();
      expect(element.classList.contains('photo-preview')).toBe(true);
    });

    it('should be hidden by default', () => {
      const element = preview.render();
      
      expect(element.classList.contains('photo-preview--hidden')).toBe(true);
    });

    it('should include navigation buttons', () => {
      const element = preview.render();
      
      const prevBtn = element.querySelector('.photo-preview__nav--prev');
      const nextBtn = element.querySelector('.photo-preview__nav--next');
      
      expect(prevBtn).toBeDefined();
      expect(nextBtn).toBeDefined();
    });

    it('should include close button', () => {
      const element = preview.render();
      
      const closeBtn = element.querySelector('.photo-preview__close');
      expect(closeBtn).toBeDefined();
    });
  });

  describe('open', () => {
    it('should show preview with photo', () => {
      const element = preview.render();
      container.appendChild(element);
      
      preview.open(mockPhotos, 0);
      
      expect(element.classList.contains('photo-preview--hidden')).toBe(false);
    });

    it('should display correct photo', () => {
      const element = preview.render();
      container.appendChild(element);
      
      preview.open(mockPhotos, 1);
      
      const img = element.querySelector('.photo-preview__image');
      expect(img).toBeDefined();
      expect(preview.getCurrentIndex()).toBe(1);
    });

    it('should show filename', () => {
      const element = preview.render();
      container.appendChild(element);
      
      preview.open(mockPhotos, 0);
      
      const filename = element.querySelector('.photo-preview__filename');
      expect(filename.textContent).toContain('photo1.jpg');
    });
  });

  describe('navigation', () => {
    it('should navigate to next photo', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 0);
      
      preview.next();
      
      expect(preview.getCurrentIndex()).toBe(1);
    });

    it('should navigate to previous photo', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 1);
      
      preview.prev();
      
      expect(preview.getCurrentIndex()).toBe(0);
    });

    it('should wrap around at end', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 2);
      
      preview.next();
      
      expect(preview.getCurrentIndex()).toBe(0);
    });

    it('should wrap around at beginning', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 0);
      
      preview.prev();
      
      expect(preview.getCurrentIndex()).toBe(2);
    });

    it('should disable prev when only one photo', () => {
      const element = preview.render();
      container.appendChild(element);
      
      preview.open([mockPhotos[0]], 0);
      
      const prevBtn = element.querySelector('.photo-preview__nav--prev');
      const nextBtn = element.querySelector('.photo-preview__nav--next');
      expect(prevBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(true);
    });
  });

  describe('close', () => {
    it('should hide preview on close', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 0);
      
      preview.close();
      
      expect(element.classList.contains('photo-preview--hidden')).toBe(true);
    });

    it('should call onClose callback', () => {
      const element = preview.render();
      container.appendChild(element);
      const onClose = vi.fn();
      preview.onClose(onClose);
      preview.open(mockPhotos, 0);
      
      preview.close();
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should close on Escape key', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 0);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      
      expect(element.classList.contains('photo-preview--hidden')).toBe(true);
    });

    it('should go next on ArrowRight', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 0);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(event);
      
      expect(preview.getCurrentIndex()).toBe(1);
    });

    it('should go prev on ArrowLeft', () => {
      const element = preview.render();
      container.appendChild(element);
      preview.open(mockPhotos, 1);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(event);
      
      expect(preview.getCurrentIndex()).toBe(0);
    });
  });

  describe('counter', () => {
    it('should show photo counter', () => {
      const element = preview.render();
      container.appendChild(element);
      
      preview.open(mockPhotos, 1);
      
      const counter = element.querySelector('.photo-preview__counter');
      expect(counter.textContent).toContain('2');
      expect(counter.textContent).toContain('3');
    });
  });
});
