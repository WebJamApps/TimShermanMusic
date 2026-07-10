/**
 * @file usePersistedState.spec.tsx
 * @description Unit tests for usePersistedState react hook and its helpers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  setInitValue,
  handleValueChange,
  handleNameChange,
  usePersistedState,
} from '../../src/lib/usePersistedState';

describe('usePersistedState utility and hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('setInitValue helper', () => {
    it('sets initial value from localStorage if present', () => {
      localStorage.setItem('myKey', 'stored_value');
      const setValue = vi.fn();
      setInitValue('myKey', setValue, 'default_val');
      expect(setValue).toHaveBeenCalledWith('stored_value');
    });

    it('sets localStorage to default and does not call setValue if item is absent', () => {
      const setValue = vi.fn();
      setInitValue('myKey', setValue, 'default_val');
      expect(setValue).not.toHaveBeenCalled();
      expect(localStorage.getItem('myKey')).toBe('default_val');
    });

    it('handles exceptions elegantly', () => {
      const setValue = vi.fn();
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      setInitValue('myKey', setValue, 'default_val');
      expect(setValue).toHaveBeenCalledWith('default_val');
      mockGetItem.mockRestore();
    });
  });

  describe('handleValueChange helper', () => {
    it('saves value to localStorage and returns it', () => {
      const result = handleValueChange('myKey', 'new_value');
      expect(result).toBe('new_value');
      expect(localStorage.getItem('myKey')).toBe('new_value');
    });

    it('catches and logs errors gracefully on write exception', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('write error');
      });
      const result = handleValueChange('myKey', 'new_value');
      expect(result).toBe('write error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('write error');
      mockSetItem.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleNameChange helper', () => {
    it('handles identical name and returns empty string', () => {
      const nameRef = { current: 'myKey' };
      const result = handleNameChange(nameRef, 'myKey', 'current_value');
      expect(result).toBe('');
      expect(nameRef.current).toBe('myKey');
    });

    it('saves value under new name, removes old key, and updates ref on key rename', () => {
      localStorage.setItem('oldKey', 'current_value');
      const nameRef = { current: 'oldKey' };
      const result = handleNameChange(nameRef, 'newKey', 'current_value');
      expect(result).toBe('newKey');
      expect(nameRef.current).toBe('newKey');
      expect(localStorage.getItem('newKey')).toBe('current_value');
      expect(localStorage.getItem('oldKey')).toBeNull();
    });

    it('logs error gracefully on key rename exception', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const nameRef = { current: 'oldKey' };
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('rename error');
      });
      const result = handleNameChange(nameRef, 'newKey', 'current_value');
      expect(result).toBe('rename error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('rename error');
      mockSetItem.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('usePersistedState hook', () => {
    it('initializes with default value if localStorage is empty', () => {
      const { result } = renderHook(() => usePersistedState('test_hook_key', 'def_val'));
      expect(result.current[0]).toBe('def_val');
      expect(localStorage.getItem('test_hook_key')).toBe('def_val');
    });

    it('initializes with existing value if localStorage contains item', () => {
      localStorage.setItem('test_hook_key', 'preset_val');
      const { result } = renderHook(() => usePersistedState('test_hook_key', 'def_val'));
      expect(result.current[0]).toBe('preset_val');
    });

    it('updates localStorage and state when state changes', () => {
      const { result } = renderHook(() => usePersistedState('test_hook_key', 'def_val'));
      act(() => {
        result.current[1]('changed_val');
      });
      expect(result.current[0]).toBe('changed_val');
      expect(localStorage.getItem('test_hook_key')).toBe('changed_val');
    });
  });
});
