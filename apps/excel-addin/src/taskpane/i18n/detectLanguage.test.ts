// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectLanguage, languageFromTag } from './detectLanguage';

describe('languageFromTag', () => {
  it('matches a supported primary subtag regardless of region/case', () => {
    expect(languageFromTag('fr-FR')).toBe('fr');
    expect(languageFromTag('FR')).toBe('fr');
    expect(languageFromTag('fr_CA')).toBe('fr');
    expect(languageFromTag('en-GB')).toBe('en');
  });

  it('returns null for an unsupported or missing tag', () => {
    expect(languageFromTag('de-DE')).toBeNull();
    expect(languageFromTag(undefined)).toBeNull();
    expect(languageFromTag(null)).toBeNull();
    expect(languageFromTag('')).toBeNull();
  });
});

describe('detectLanguage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to English when nothing is available', () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    expect(detectLanguage()).toBe('en');
  });

  it('uses the browser/WebView locale when Office is unavailable', () => {
    vi.stubGlobal('navigator', { language: 'fr-CA' });
    expect(detectLanguage()).toBe('fr');
  });
});
