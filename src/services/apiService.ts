/**
 * SeeFps — API Service Layer
 *
 * Backend (FastAPI) ile iletişim kuran merkezi servis katmanı.
 * Tüm API çağrıları bu dosya üzerinden yapılır.
 *
 * NOT: Backend henüz kurulmadı. API çağrıları şu an network hatası döndürecektir.
 * useHardwareData hook'ları bu hatayı yakalar ve kullanıcıya uygun mesaj gösterir.
 *
 * Backend hazır olduğunda (Phase 2), bu dosyadaki URL'ler ve response format
 * doğrudan çalışacak şekilde tasarlanmıştır.
 */

import type {
  ApiResponse,
  CpuItem,
  GpuItem,
  RamItem,
  SsdItem,
  ResolutionItem,
  GameItem,
  MapItem,
} from "@/types/types";

// ─── Configuration ───

/**
 * Backend API base URL.
 * Phase 2'de .env dosyasından okunacak (VITE_API_BASE_URL).
 * Şimdilik localhost:8000 varsayılıyor.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

// ─── Generic Fetch Helper ───

/**
 * Standart API GET isteği gönderir.
 * Backend'in { success: boolean, data: T[] } formatında yanıt döndürmesini bekler.
 *
 * @throws Error - Network hatası veya API hatası durumunda
 */
async function fetchApi<T>(endpoint: string): Promise<T[]> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `API Error: ${response.status} ${response.statusText} — ${endpoint}`
    );
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(`API returned success=false for ${endpoint}`);
  }

  return json.data;
}

// ─── Hardware Endpoints ───

/** GET /api/hardware/cpus — Dataset'ten CPU listesini çeker */
export async function fetchCpus(): Promise<CpuItem[]> {
  return fetchApi<CpuItem>("/hardware/cpus");
}

/** GET /api/hardware/gpus — Dataset'ten GPU listesini çeker */
export async function fetchGpus(): Promise<GpuItem[]> {
  return fetchApi<GpuItem>("/hardware/gpus");
}

/** GET /api/hardware/rams — Dataset'ten RAM seçeneklerini çeker */
export async function fetchRams(): Promise<RamItem[]> {
  return fetchApi<RamItem>("/hardware/rams");
}

/** GET /api/hardware/ssds — Dataset'ten SSD seçeneklerini çeker */
export async function fetchSsds(): Promise<SsdItem[]> {
  return fetchApi<SsdItem>("/hardware/ssds");
}

/** GET /api/resolutions — Dataset'ten desteklenen çözünürlükleri çeker */
export async function fetchResolutions(): Promise<ResolutionItem[]> {
  return fetchApi<ResolutionItem>("/resolutions");
}

// ─── Game Endpoints ───

/** GET /api/games — Dataset'ten oyun listesini çeker */
export async function fetchGames(): Promise<GameItem[]> {
  return fetchApi<GameItem>("/games");
}

/** GET /api/games/{gameId}/maps — Belirli bir oyunun harita listesini çeker */
export async function fetchGameMaps(gameId: string): Promise<MapItem[]> {
  return fetchApi<MapItem>(`/games/${encodeURIComponent(gameId)}/maps`);
}
