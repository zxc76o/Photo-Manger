/**
 * Dialog Component Unit Tests
 * @module tests/unit/components/Dialog.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Dialog } from '../../../src/components/Dialog.js';

describe('Dialog', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('render', () => {
    it('should create dialog element', () => {
      const dialog = new Dialog({
        title: 'Test Dialog'
      });

      const element = dialog.render();

      expect(element.classList.contains('dialog')).toBe(true);
    });

    it('should render title', () => {
      const dialog = new Dialog({
        title: 'My Title'
      });

      const element = dialog.render();
      const title = element.querySelector('.dialog__title');

      expect(title.textContent).toBe('My Title');
    });

    it('should render message if provided', () => {
      const dialog = new Dialog({
        title: 'Title',
        message: 'This is a message'
      });

      const element = dialog.render();
      const message = element.querySelector('.dialog__message');

      expect(message.textContent).toBe('This is a message');
    });

    it('should render input if type is prompt', () => {
      const dialog = new Dialog({
        title: 'Enter Name',
        type: 'prompt',
        inputPlaceholder: 'Album name'
      });

      const element = dialog.render();
      const input = element.querySelector('.dialog__input');

      expect(input).not.toBeNull();
      expect(input.placeholder).toBe('Album name');
    });

    it('should render confirm and cancel buttons', () => {
      const dialog = new Dialog({
        title: 'Confirm',
        confirmText: 'Yes',
        cancelText: 'No'
      });

      const element = dialog.render();
      const confirmBtn = element.querySelector('.dialog__button--confirm');
      const cancelBtn = element.querySelector('.dialog__button--cancel');

      expect(confirmBtn.textContent).toBe('Yes');
      expect(cancelBtn.textContent).toBe('No');
    });
  });

  describe('show', () => {
    it('should show dialog', () => {
      const dialog = new Dialog({ title: 'Test' });
      const element = dialog.render();
      container.appendChild(element);

      dialog.show();

      expect(element.classList.contains('dialog--visible')).toBe(true);
    });

    it('should focus input in prompt mode', async () => {
      const dialog = new Dialog({
        title: 'Enter Name',
        type: 'prompt'
      });

      const element = dialog.render();
      container.appendChild(element);

      dialog.show();

      // Wait for requestAnimationFrame
      await new Promise(r => requestAnimationFrame(r));

      const input = element.querySelector('.dialog__input');
      expect(document.activeElement).toBe(input);
    });

    it('should set initial input value if provided', () => {
      const dialog = new Dialog({
        title: 'Rename',
        type: 'prompt',
        inputValue: 'Original Name'
      });

      const element = dialog.render();
      container.appendChild(element);
      dialog.show();

      const input = element.querySelector('.dialog__input');
      expect(input.value).toBe('Original Name');
    });
  });

  describe('hide', () => {
    it('should hide dialog', () => {
      const dialog = new Dialog({ title: 'Test' });
      const element = dialog.render();
      container.appendChild(element);

      dialog.show();
      dialog.hide();

      expect(element.classList.contains('dialog--visible')).toBe(false);
    });
  });

  describe('confirm action', () => {
    it('should call onConfirm callback', async () => {
      const onConfirm = vi.fn();
      const dialog = new Dialog({
        title: 'Confirm',
        onConfirm
      });

      const element = dialog.render();
      container.appendChild(element);
      dialog.show();

      const confirmBtn = element.querySelector('.dialog__button--confirm');
      confirmBtn.click();

      expect(onConfirm).toHaveBeenCalled();
    });

    it('should pass input value in prompt mode', async () => {
      const onConfirm = vi.fn();
      const dialog = new Dialog({
        title: 'Enter Name',
        type: 'prompt',
        onConfirm
      });

      const element = dialog.render();
      container.appendChild(element);
      dialog.show();

      const input = element.querySelector('.dialog__input');
      input.value = 'My Album';

      const confirmBtn = element.querySelector('.dialog__button--confirm');
      confirmBtn.click();

      expect(onConfirm).toHaveBeenCalledWith('My Album');
    });

    it('should hide dialog after confirm', () => {
      const dialog = new Dialog({
        title: 'Test',
        onConfirm: vi.fn()
      });

      const element = dialog.render();
      container.appendChild(element);
      dialog.show();

      const confirmBtn = element.querySelector('.dialog__button--confirm');
      confirmBtn.click();

      expect(element.classList.contains('dialog--visible')).toBe(false);
    });
  });

  describe('cancel action', () => {
    it('should call onCancel callback', () => {
      const onCancel = vi.fn();
      const dialog = new Dialog({
        title: 'Confirm',
        onCancel
      });

      const element = dialog.render();
      container.appendChild(element);
      dialog.show();

      const cancelBtn = element.querySelector('.dialog__button--cancel');
      cancelBtn.click();

      expect(onCancel).toHaveBeenCalled();
    });

    it('should hide dialog after cancel', () => {
      const dialog = new Dialog({
        title: 'Test',
        onCancel: vi.fn()
      });

      const element = dialog.render();
      container.appendChild(element);
      dialog.show();

      const cancelBtn = element.querySelector('.dialog__button--cancel');
      cancelBtn.click();

      expect(element.classList.contains('dialog--visible')).toBe(false);
    });
  });

  describe('escape key', () => {
    it('should hide dialog on Escape', () => {
      const dialog = new Dialog({ title: 'Test' });
      const element = dialog.render();
      container.appendChild(element);

      dialog.show();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(element.classList.contains('dialog--visible')).toBe(false);
    });
  });

  describe('backdrop click', () => {
    it('should hide dialog when clicking backdrop', () => {
      const dialog = new Dialog({ title: 'Test' });
      const element = dialog.render();
      container.appendChild(element);

      dialog.show();

      const backdrop = element.querySelector('.dialog__backdrop');
      backdrop.click();

      expect(element.classList.contains('dialog--visible')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should remove element', () => {
      const dialog = new Dialog({ title: 'Test' });
      const element = dialog.render();
      container.appendChild(element);

      dialog.destroy();

      expect(element.parentNode).toBeNull();
    });
  });
});
