import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';

// fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { SahneAuthProvider, useSahneAuth } from '@/contexts/SahneAuthContext';
import { LS_LEVEL_ACTIONS } from '@/lib/rehber';

function wrapper({ children }: { children: ReactNode }) {
  return <SahneAuthProvider>{children}</SahneAuthProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// Başarılı /users/me yanıtı oluştur
function mockMeResponse(completedActionIds: string[] = []) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: 'user-1',
      email: 'test@example.com',
      membershipTier: 'individual_member',
      completedActionIds,
      profile: { displayName: 'Test User', avatarUrl: null, city: null, profession: null },
    }),
  };
}

describe('SahneAuthContext — recordAction', () => {
  it('kullanıcı yokken localStorage\'a yazar', async () => {
    // /users/me 401 döner → kullanıcı yok
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    const { result } = renderHook(() => useSahneAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.recordAction('v-etkinlikler');
    });

    const stored = JSON.parse(localStorageMock.getItem(LS_LEVEL_ACTIONS) ?? '[]') as string[];
    expect(stored).toContain('v-etkinlikler');
  });

  it('localStorage\'a aynı ID\'yi iki kez yazmaz', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    const { result } = renderHook(() => useSahneAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.recordAction('v-etkinlikler');
      await result.current.recordAction('v-etkinlikler');
    });

    const stored = JSON.parse(localStorageMock.getItem(LS_LEVEL_ACTIONS) ?? '[]') as string[];
    expect(stored.filter(id => id === 'v-etkinlikler').length).toBe(1);
  });

  it('kullanıcı varken optimistic update yapar', async () => {
    // Sıra: (1) /users/me → user dön, (2) localStorage boş → sync atla,
    //        (3) recordAction → /me/actions POST
    mockFetch
      .mockResolvedValueOnce(mockMeResponse([]))  // (1) /users/me
      .mockResolvedValueOnce({                    // (2) /me/actions POST (recordAction)
        ok: true,
        status: 201,
        json: async () => ({ completedActionIds: ['v-etkinlikler'] }),
      });

    const { result } = renderHook(() => useSahneAuth(), { wrapper });

    // Kullanıcı yüklenene kadar bekle
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.recordAction('v-etkinlikler');
    });

    // Optimistic update veya server response sonrası completedActionIds'de olmalı
    expect(result.current.user?.completedActionIds).toContain('v-etkinlikler');
  });

  it('login sonrası localStorage aksiyonları sunucuyla sync edilir', async () => {
    localStorageMock.setItem(LS_LEVEL_ACTIONS, JSON.stringify(['v-etkinlikler', 'v-mentorluk']));

    // Sıra: (1) /users/me → user dön, (2) /me/actions/sync → merge edilmiş list dön
    mockFetch
      .mockResolvedValueOnce(mockMeResponse([]))   // (1) /users/me
      .mockResolvedValueOnce({                     // (2) /me/actions/sync (syncLocalStorageActions)
        ok: true,
        status: 201,
        json: async () => ({ completedActionIds: ['v-etkinlikler', 'v-mentorluk'] }),
      });

    const { result } = renderHook(() => useSahneAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Sync tamamlanana kadar bekle: localStorage temizlenmeli
    await waitFor(() => {
      expect(localStorageMock.getItem(LS_LEVEL_ACTIONS)).toBeNull();
    }, { timeout: 3000 });

    // Sync sonrası user state'inde completedActionIds güncellenmiş olmalı
    expect(result.current.user?.completedActionIds).toContain('v-etkinlikler');
  });
});
