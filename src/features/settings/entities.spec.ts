import { describe, it, expect } from 'vitest';
import { registerSettingsEntities } from './entities';

describe('registerSettingsEntities', () => {
  it('does not throw on first call', () => {
    expect(() => registerSettingsEntities()).not.toThrow();
  });

  it('is idempotent — safe to call multiple times', () => {
    expect(() => {
      registerSettingsEntities();
      registerSettingsEntities();
      registerSettingsEntities();
    }).not.toThrow();
  });
});
