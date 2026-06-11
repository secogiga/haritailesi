import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';

// SahneAuthContext mock
const mockRecordAction = vi.fn().mockResolvedValue(undefined);
vi.mock('@/contexts/SahneAuthContext', () => ({
  useSahneAuth: () => ({ recordAction: mockRecordAction, user: null, isLoading: false }),
}));

import { usePageAction } from '@/hooks/usePageAction';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePageAction', () => {
  it('mount olduğunda actionId ile recordAction çağırır', async () => {
    await act(async () => {
      renderHook(() => usePageAction('v-etkinlikler'));
    });

    expect(mockRecordAction).toHaveBeenCalledWith('v-etkinlikler');
    expect(mockRecordAction).toHaveBeenCalledTimes(1);
  });

  it('actionId değişince tekrar çağırır', async () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) => usePageAction(id),
      { initialProps: { id: 'v-etkinlikler' } },
    );

    await act(async () => {
      rerender({ id: 'v-mentorluk' });
    });

    expect(mockRecordAction).toHaveBeenCalledWith('v-etkinlikler');
    expect(mockRecordAction).toHaveBeenCalledWith('v-mentorluk');
    expect(mockRecordAction).toHaveBeenCalledTimes(2);
  });

  it('aynı actionId ile rerender olunca tekrar çağırmaz', async () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) => usePageAction(id),
      { initialProps: { id: 'v-etkinlikler' } },
    );

    await act(async () => {
      rerender({ id: 'v-etkinlikler' });
    });

    expect(mockRecordAction).toHaveBeenCalledTimes(1);
  });

  it('recordAction hata fırlatsa da çökmez', async () => {
    mockRecordAction.mockRejectedValueOnce(new Error('network error'));

    await expect(
      act(async () => {
        renderHook(() => usePageAction('v-etkinlikler'));
      }),
    ).resolves.not.toThrow();
  });
});
