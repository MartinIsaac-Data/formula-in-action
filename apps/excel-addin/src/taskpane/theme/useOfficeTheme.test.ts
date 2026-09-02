// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { hexLuminance } from './useOfficeTheme';

describe('hexLuminance', () => {
  it('returns near 0 for black and near 1 for white', () => {
    expect(hexLuminance('#000000')).toBeCloseTo(0, 5);
    expect(hexLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('tolerates a missing "#" and whitespace', () => {
    expect(hexLuminance('  ffffff ')).toBeCloseTo(1, 5);
  });

  it('returns null for anything that is not a 6-digit hex', () => {
    expect(hexLuminance(undefined)).toBeNull();
    expect(hexLuminance('rgb(0,0,0)')).toBeNull();
    expect(hexLuminance('#fff')).toBeNull();
  });

  it('classifies a dark Office background below 0.5', () => {
    expect(hexLuminance('#1f1f1f')).toBeLessThan(0.5);
    expect(hexLuminance('#faf9f8')).toBeGreaterThan(0.5);
  });
});
