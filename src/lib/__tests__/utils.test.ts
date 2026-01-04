import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { cn, generateId, base64ToDataUrl, base64ToAudioUrl, delay } from '../utils';

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('returns non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('property: always returns non-empty string', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const id = generateId();
        return typeof id === 'string' && id.length > 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('base64ToDataUrl', () => {
  it('formats correctly with default mimeType', () => {
    const result = base64ToDataUrl('abc123');
    expect(result).toBe('data:image/png;base64,abc123');
  });

  it('formats correctly with custom mimeType', () => {
    const result = base64ToDataUrl('abc123', 'image/jpeg');
    expect(result).toBe('data:image/jpeg;base64,abc123');
  });

  it('handles empty base64', () => {
    const result = base64ToDataUrl('');
    expect(result).toBe('data:image/png;base64,');
  });

  it('property: output always contains ;base64,', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = base64ToDataUrl(input);
        return result.includes(';base64,') && result.startsWith('data:');
      }),
      { numRuns: 100 }
    );
  });
});

describe('base64ToAudioUrl', () => {
  it('formats correctly', () => {
    const result = base64ToAudioUrl('audiodata');
    expect(result).toBe('data:audio/wav;base64,audiodata');
  });

  it('handles empty base64', () => {
    const result = base64ToAudioUrl('');
    expect(result).toBe('data:audio/wav;base64,');
  });
});

describe('delay', () => {
  it('resolves after specified time', async () => {
    vi.useFakeTimers();
    
    const promise = delay(100);
    
    vi.advanceTimersByTime(50);
    await Promise.resolve(); // flush promises
    
    vi.advanceTimersByTime(50);
    await promise;
    
    vi.useRealTimers();
  });

  it('resolves with undefined', async () => {
    vi.useFakeTimers();
    
    const promise = delay(10);
    vi.advanceTimersByTime(10);
    const result = await promise;
    
    expect(result).toBeUndefined();
    
    vi.useRealTimers();
  });

  it('property: never rejects for positive numbers', () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 10 }), async (ms) => {
        vi.useFakeTimers();
        const promise = delay(ms);
        vi.advanceTimersByTime(ms);
        await promise;
        vi.useRealTimers();
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
