/**
 * ImportProgress Component Tests
 * @module tests/unit/components/ImportProgress.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImportProgress } from '../../../src/components/ImportProgress.js';
import { eventBus, EVENTS } from '../../../src/utils/eventBus.js';

describe('ImportProgress', () => {
  let container;
  let progress;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    eventBus.clear();
    progress = new ImportProgress(eventBus);
  });

  afterEach(() => {
    document.body.removeChild(container);
    eventBus.clear();
  });

  describe('render', () => {
    it('should render progress container', () => {
      const element = progress.render();
      
      expect(element).toBeDefined();
      expect(element.classList.contains('import-progress')).toBe(true);
    });

    it('should be hidden by default', () => {
      const element = progress.render();
      
      expect(element.classList.contains('import-progress--hidden')).toBe(true);
    });

    it('should include progress bar', () => {
      const element = progress.render();
      const bar = element.querySelector('.import-progress__bar');
      
      expect(bar).toBeDefined();
    });

    it('should include status text', () => {
      const element = progress.render();
      const status = element.querySelector('.import-progress__status');
      
      expect(status).toBeDefined();
    });
  });

  describe('show/hide', () => {
    it('should show progress overlay', () => {
      const element = progress.render();
      container.appendChild(element);
      
      progress.show();
      
      expect(element.classList.contains('import-progress--hidden')).toBe(false);
    });

    it('should hide progress overlay', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      progress.hide();
      
      expect(element.classList.contains('import-progress--hidden')).toBe(true);
    });
  });

  describe('update progress', () => {
    it('should update progress bar width', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      progress.update({ current: 5, total: 10, fileName: 'test.jpg' });
      
      const fill = element.querySelector('.import-progress__fill');
      expect(fill.style.width).toBe('50%');
    });

    it('should update status text', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      progress.update({ current: 3, total: 10, fileName: 'photo.jpg' });
      
      const status = element.querySelector('.import-progress__status');
      expect(status.textContent).toContain('3');
      expect(status.textContent).toContain('10');
    });

    it('should show current filename', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      progress.update({ current: 1, total: 5, fileName: 'my-photo.jpg' });
      
      const filename = element.querySelector('.import-progress__filename');
      expect(filename.textContent).toContain('my-photo.jpg');
    });
  });

  describe('event handling', () => {
    it('should update on IMPORT_PROGRESS event', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      eventBus.emit(EVENTS.IMPORT_PROGRESS, { current: 2, total: 4, fileName: 'test.jpg' });
      
      const fill = element.querySelector('.import-progress__fill');
      expect(fill.style.width).toBe('50%');
    });

    it('should hide on IMPORT_COMPLETE event', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      eventBus.emit(EVENTS.IMPORT_COMPLETE, { success: [], failed: [] });
      
      // Should hide after a delay
      expect(element.classList.contains('import-progress--complete')).toBe(true);
    });
  });

  describe('show results', () => {
    it('should show success count', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      progress.showResults({ success: [{}, {}, {}], failed: [] });
      
      const status = element.querySelector('.import-progress__status');
      expect(status.textContent).toContain('3');
    });

    it('should show failed count if any', () => {
      const element = progress.render();
      container.appendChild(element);
      progress.show();
      
      progress.showResults({ success: [{}], failed: [{}, {}] });
      
      const status = element.querySelector('.import-progress__status');
      expect(status.textContent).toContain('2');
      expect(status.textContent.toLowerCase()).toContain('failed');
    });
  });
});
