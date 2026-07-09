/**
 * SeeFps — Hardware & Game Data Hooks
 *
 * TanStack Query (React Query) tabanlı custom hook'lar.
 * Backend API'den donanım ve oyun verilerini çeker.
 *
 * Her hook { data, isLoading, isError, error } döndürür.
 * Backend henüz hazır olmadığında isError=true olur ve
 * bileşenler buna uygun "Backend bağlantısı bekleniyor" mesajı gösterir.
 *
 * Phase 2'de Backend ayağa kalktığında bu hook'lar otomatik çalışacaktır.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchCpus,
  fetchGpus,
  fetchRams,
  fetchSsds,
  fetchResolutions,
  fetchGames,
  fetchGameMaps,
} from "@/services/apiService";
import type {
  CpuItem,
  GpuItem,
  RamItem,
  SsdItem,
  ResolutionItem,
  GameItem,
  MapItem,
} from "@/types/types";

// ─── Stale time configuration ───

/** Donanım/oyun verileri sık değişmez — 5 dakika cache */
const STALE_TIME = 5 * 60 * 1000;

/** API bağlantı hatası durumunda yeniden deneme sayısı */
const RETRY_COUNT = 3;

/** Render free-tier cold start için exponential retry delay (ms) */
const retryDelay = (attempt: number) => Math.min(2000 * 2 ** attempt, 15000);

// ─── Hardware Hooks ───

/** CPU listesini API'den çeker */
export function useCpus() {
  return useQuery<CpuItem[], Error>({
    queryKey: ["hardware", "cpus"],
    queryFn: fetchCpus,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}

/** GPU listesini API'den çeker */
export function useGpus() {
  return useQuery<GpuItem[], Error>({
    queryKey: ["hardware", "gpus"],
    queryFn: fetchGpus,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}

/** RAM seçeneklerini API'den çeker */
export function useRams() {
  return useQuery<RamItem[], Error>({
    queryKey: ["hardware", "rams"],
    queryFn: fetchRams,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}

/** SSD seçeneklerini API'den çeker */
export function useSsds() {
  return useQuery<SsdItem[], Error>({
    queryKey: ["hardware", "ssds"],
    queryFn: fetchSsds,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}

/** Çözünürlük seçeneklerini API'den çeker */
export function useResolutions() {
  return useQuery<ResolutionItem[], Error>({
    queryKey: ["resolutions"],
    queryFn: fetchResolutions,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}

// ─── Game Hooks ───

/** Oyun listesini API'den çeker */
export function useGames() {
  return useQuery<GameItem[], Error>({
    queryKey: ["games"],
    queryFn: fetchGames,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}

/** Belirli bir oyunun harita listesini API'den çeker */
export function useGameMaps(gameId: string | null) {
  return useQuery<MapItem[], Error>({
    queryKey: ["games", gameId, "maps"],
    queryFn: () => fetchGameMaps(gameId!),
    enabled: !!gameId,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay,
  });
}
