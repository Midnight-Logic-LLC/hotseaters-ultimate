import { describe, it, expect, vi } from 'vitest';
import {
  resolveSalesActivityAnchors,
  type AnchorAttorney,
} from '../resolve-sales-activity-anchors';

describe('resolveSalesActivityAnchors', () => {
  it('throws when no attorneyId is given', async () => {
    const fetchAttorney = vi.fn();
    await expect(
      resolveSalesActivityAnchors(null, null, { fetchAttorney }),
    ).rejects.toThrow(/attorneyId is required/);
    expect(fetchAttorney).not.toHaveBeenCalled();
  });

  it('short-circuits with the client hint without fetching', async () => {
    const fetchAttorney = vi.fn();
    const result = await resolveSalesActivityAnchors('att-1', 'client-9', {
      fetchAttorney,
    });
    expect(result).toEqual({ attorney_id: 'att-1', client_id: 'client-9' });
    expect(fetchAttorney).not.toHaveBeenCalled();
  });

  it('fetches the attorney and returns the resolved pair when no hint', async () => {
    const attorney: AnchorAttorney = { id: 'att-1', client_id: 'client-7' };
    const fetchAttorney = vi.fn().mockResolvedValue(attorney);
    const result = await resolveSalesActivityAnchors('att-1', null, {
      fetchAttorney,
    });
    expect(result).toEqual({ attorney_id: 'att-1', client_id: 'client-7' });
    expect(fetchAttorney).toHaveBeenCalledWith('att-1');
  });

  it('throws when the attorney cannot be found', async () => {
    const fetchAttorney = vi.fn().mockResolvedValue(null);
    await expect(
      resolveSalesActivityAnchors('att-missing', undefined, { fetchAttorney }),
    ).rejects.toThrow(/Attorney att-missing not found/);
  });

  it('throws when the attorney has no client_id', async () => {
    const fetchAttorney = vi
      .fn()
      .mockResolvedValue({ id: 'att-1', client_id: null });
    await expect(
      resolveSalesActivityAnchors('att-1', undefined, { fetchAttorney }),
    ).rejects.toThrow(/has no client_id/);
  });
});
