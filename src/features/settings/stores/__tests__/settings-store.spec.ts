import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// ── Mock Supabase client ───────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/shared/db/supabase-client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/shared/db/supabase-client';
import { useSettingsStore } from '../settings-store';

function resetStore() {
  useSettingsStore.setState({
    cache: {},
    loading: new Set(),
    typeIdCache: {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

describe('useSettingsStore.getEntitySetting', () => {
  it('returns null when settings_type row not found', async () => {
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: () => ({
        eq: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSettingsStore());
    let value: Record<string, unknown> | null = undefined as unknown as null;
    await act(async () => {
      value = await result.current.getEntitySetting(
        'user.preferences',
        'user-001',
        'user_info',
      );
    });
    expect(value).toBeNull();
  });

  it('returns data when entity_setting row found', async () => {
    let callCount = 0;
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      callCount++;
      if (table === 'settings_type') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ id: 'st-001' }], error: null }),
            }),
          }),
        };
      }
      // entity_setting table
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({
                  data: [{ id: 'es-001', data: { hsh_decline_notifications: 'all' } }],
                  error: null,
                }),
            }),
          }),
        }),
      };
    });
    void mockSelect; void mockEq; void mockLimit; void callCount;

    const { result } = renderHook(() => useSettingsStore());
    let value: Record<string, unknown> | null = null;
    await act(async () => {
      value = await result.current.getEntitySetting(
        'user.preferences',
        'user-001',
        'user_info',
      );
    });
    expect(value).toEqual({ hsh_decline_notifications: 'all' });
  });
});

describe('useSettingsStore.upsertEntitySetting', () => {
  it('calls supabase.upsert with correct settings_type_id and FK column', async () => {
    const capturedUpsert = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'settings_type') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ id: 'st-preferences' }], error: null }),
            }),
          }),
        };
      }
      // entity_setting table — getEntitySetting after upsert returns empty
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
        upsert: capturedUpsert,
      };
    });
    void mockUpsert;

    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      await result.current.upsertEntitySetting(
        'user.preferences',
        'user-001',
        'user_info',
        { hsh_decline_notifications: 'none' },
      );
    });

    expect(capturedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        settings_type_id: 'st-preferences',
        user_info_id: 'user-001',
        data: expect.objectContaining({ hsh_decline_notifications: 'none' }),
      }),
      expect.any(Object),
    );
  });

  it('merges patch with existing cache data', async () => {
    const capturedUpsert = vi.fn().mockResolvedValue({ error: null });

    // Seed cache with existing data.
    useSettingsStore.setState({
      cache: {
        'user.preferences:user-001': {
          settingsTypeId: 'st-pref',
          data: { existing_key: 'existing_value', hsh_decline_notifications: 'all' },
          rowId: 'es-001',
        },
      },
      typeIdCache: { 'user.preferences': 'st-pref' },
      loading: new Set(),
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      upsert: capturedUpsert,
    });

    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      await result.current.upsertEntitySetting(
        'user.preferences',
        'user-001',
        'user_info',
        { hsh_decline_notifications: 'none' },
      );
    });

    expect(capturedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          existing_key: 'existing_value',
          hsh_decline_notifications: 'none',
        }),
      }),
      expect.any(Object),
    );
  });
});
