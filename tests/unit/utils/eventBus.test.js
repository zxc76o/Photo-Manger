/**
 * EventBus Tests
 * @module tests/unit/utils/eventBus.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, EVENTS } from '../../../src/utils/eventBus.js';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('on', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.emit('test', { data: 123 });
      
      expect(handler).toHaveBeenCalledWith({ data: 123 });
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('test', handler);
      
      unsubscribe();
      eventBus.emit('test', {});
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      eventBus.emit('test', {});
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.off('test', handler);
      eventBus.emit('test', {});
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      eventBus.off('test', handler1);
      eventBus.emit('test', {});
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should emit events to all subscribers', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      
      eventBus.emit('test', { value: 'hello' });
      
      expect(handler).toHaveBeenCalledWith({ value: 'hello' });
    });

    it('should not throw if no subscribers', () => {
      expect(() => eventBus.emit('nonexistent', {})).not.toThrow();
    });

    it('should catch errors in handlers', () => {
      const errorHandler = vi.fn(() => { throw new Error('Test error'); });
      const normalHandler = vi.fn();
      
      eventBus.on('test', errorHandler);
      eventBus.on('test', normalHandler);
      
      // Should not throw
      expect(() => eventBus.emit('test', {})).not.toThrow();
      
      // Normal handler should still be called
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should only call handler once', () => {
      const handler = vi.fn();
      eventBus.once('test', handler);
      
      eventBus.emit('test', { first: true });
      eventBus.emit('test', { second: true });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ first: true });
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.once('test', handler);
      
      unsubscribe();
      eventBus.emit('test', {});
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all listeners for specific event', () => {
      const handler = vi.fn();
      eventBus.on('test1', handler);
      eventBus.on('test2', handler);
      
      eventBus.clear('test1');
      
      eventBus.emit('test1', {});
      eventBus.emit('test2', {});
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should clear all listeners when no event specified', () => {
      const handler = vi.fn();
      eventBus.on('test1', handler);
      eventBus.on('test2', handler);
      
      eventBus.clear();
      
      eventBus.emit('test1', {});
      eventBus.emit('test2', {});
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('EVENTS', () => {
    it('should have album events', () => {
      expect(EVENTS.ALBUM_CREATED).toBe('album:created');
      expect(EVENTS.ALBUM_UPDATED).toBe('album:updated');
      expect(EVENTS.ALBUM_DELETED).toBe('album:deleted');
      expect(EVENTS.ALBUM_REORDERED).toBe('album:reordered');
    });

    it('should have photo events', () => {
      expect(EVENTS.PHOTO_IMPORTED).toBe('photo:imported');
      expect(EVENTS.PHOTO_MOVED).toBe('photo:moved');
      expect(EVENTS.PHOTO_DELETED).toBe('photo:deleted');
    });

    it('should have navigation events', () => {
      expect(EVENTS.NAVIGATE_ALBUM).toBe('navigate:album');
      expect(EVENTS.NAVIGATE_HOME).toBe('navigate:home');
    });
  });
});
