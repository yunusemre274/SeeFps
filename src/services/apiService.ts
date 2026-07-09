/**
 * SeeFps — API Service Layer
 *
 * Backend (FastAPI) ile iletişim kuran merkezi servis katmanı.
 * Tüm API çağrıları bu dosya üzerinden yapılır.
 *
 * GET endpoint'leri: Hardware listeler, Oyun listeler, Çözünürlükler
 * POST endpoint'leri: Detection, Simulation Start, Simulation Results
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
  DetectionPayload,
  DetectionResponse,
  SimulationStartPayload,
  SimulationStartResponse,
  SimulationResultsPayload,
  SimulationResultsResponse,
} from "@/types/types";

// ─── Configuration ───

/**
 * Backend API base URL.
 * .env dosyasından okunur (VITE_API_BASE_URL), yoksa localhost:8000 varsayılır.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ─── Generic Fetch Helpers ───

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

/**
 * Standart API POST isteği gönderir.
 * Backend'in JSON yanıt döndürmesini bekler.
 *
 * @throws Error - Network hatası veya API hatası durumunda
 */
async function postApi<TReq, TRes>(endpoint: string, body: TReq): Promise<TRes> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API Error: ${response.status} ${response.statusText} — ${endpoint}: ${errorText}`
    );
  }

  return response.json();
}

// ─── Hardware Endpoints (GET) ───

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

// ─── Game Endpoints (GET) ───

/** GET /api/games — Dataset'ten oyun listesini çeker */
export async function fetchGames(): Promise<GameItem[]> {
  return fetchApi<GameItem>("/games");
}

/** GET /api/games/{gameId}/maps — Belirli bir oyunun harita listesini çeker */
export async function fetchGameMaps(gameId: string): Promise<MapItem[]> {
  return fetchApi<MapItem>(`/games/${encodeURIComponent(gameId)}/maps`);
}

// ─── Detection Endpoint (POST) ───

/**
 * POST /api/detect — Detection App'ten gelen donanım bilgilerini eşleştirir.
 * Backend, fuzzy matching ile CPU/GPU isimlerini dataset'teki kayıtlarla eşleştirir.
 */
export async function detectHardware(payload: DetectionPayload): Promise<DetectionResponse> {
  return postApi<DetectionPayload, DetectionResponse>("/detect", payload);
}

/**
 * GET /api/detect/session/{sessionId} — Detection oturum bilgisini çeker.
 */
export async function fetchDetectionSession(sessionId: string): Promise<{
  success: boolean;
  session_id: string;
  hardware: {
    cpu_raw: string;
    gpu_raw: string;
    cpu_display: string;
    gpu_display: string;
    ram: number | null;
    ssd: string | null;
    resolution: string | null;
  };
}> {
  const url = `${API_BASE_URL}/detect/session/${encodeURIComponent(sessionId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Detection session not found: ${sessionId}`);
  }

  return response.json();
}

// ─── Simulation Endpoints (POST) ───

/**
 * POST /api/simulation/start — Yeni benchmark session başlatır.
 * Backend bir session_id ve WebSocket URL'i döndürür.
 */
export async function startSimulation(payload: SimulationStartPayload): Promise<SimulationStartResponse> {
  return postApi<SimulationStartPayload, SimulationStartResponse>("/simulation/start", payload);
}

/**
 * POST /api/simulation/results — Benchmark sonuçlarını gönderir ve ML tahmin alır.
 * Backend, ML modeli (predict_fps.py) ile tahmini FPS hesaplar ve sonuçları döndürür.
 */
export async function submitSimulationResults(payload: SimulationResultsPayload): Promise<SimulationResultsResponse> {
  return postApi<SimulationResultsPayload, SimulationResultsResponse>("/simulation/results", payload);
}

