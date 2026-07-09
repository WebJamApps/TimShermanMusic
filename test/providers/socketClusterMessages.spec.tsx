/**
 * @file socketClusterMessages.spec.tsx
 * @description Unit tests for socketClusterMessages.tsx provider.
 */

import { vi, expect, describe, it } from 'vitest';
import socketClusterMessages from '../../src/providers/socketClusterMessages';

describe('socketClusterMessages', () => {
  it('validateData when it is an array', () => {
    let dataArr: any = null;
    const setFunc = vi.fn(d => { dataArr = d; });
    const receiver = { value: [{}], done: false };
    socketClusterMessages.validateData(receiver, setFunc);
    expect(Array.isArray(dataArr)).toBeTruthy();
  });

  it('validateData when it is not an array', () => {
    let dataArr: any = null;
    const setFunc = vi.fn(d => { dataArr = d; });
    const receiver = { value: null, done: false } as any;
    socketClusterMessages.validateData(receiver, setFunc);
    expect(dataArr).toBeNull();
  });
});
