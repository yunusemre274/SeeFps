/**
 * SeeFps — API Response Type Definitions
 *
 * Backend (FastAPI) Pydantic şemalarıyla uyumlu tip tanımları.
 * Bu dosya Frontend ↔ Backend API sözleşmesini (contract) temsil eder.
 *
 * NOT: Backend henüz kurulmadı. Bu tipler CLAUDE.md §12 (Entegrasyon Sözleşmesi)
 * baz alınarak hazırlanmıştır ve Backend geliştirmesinde (Phase 2) birebir
 * karşılanacaktır.
 */

// ─── Hardware Types ───

/** CPU listesi API response elemanı */
export interface CpuItem {
  id: string;
  name: string;
}

/** GPU listesi API response elemanı */
export interface GpuItem {
  id: string;
  name: string;
}

/** RAM seçeneği API response elemanı */
export interface RamItem {
  id: string;
  name: string;
}

/** SSD seçeneği API response elemanı */
export interface SsdItem {
  id: string;
  name: string;
}

/** Çözünürlük seçeneği API response elemanı */
export interface ResolutionItem {
  id: string;
  name: string;
}

// ─── Game & Map Types ───

/** Oyun listesi API response elemanı */
export interface GameItem {
  id: string;
  name: string;
  platform: string;
  engine: string;
  maps: MapItem[];
}

/** Harita API response elemanı */
export interface MapItem {
  id: string;
  name: string;
}

/** Tüm hardware endpoint'lerinin standart response wrapper'ı */
export interface ApiResponse<T> {
  success: boolean;
  data: T[];
}

// ─── Detection Types ───

/** Detection App'ten gelen donanım tarama payload'u */
export interface DetectionPayload {
  cpu_name: string;
  gpu_name: string;
  ram_gb?: number;
  ssd_type?: string;
  resolution?: string;
}

/** Eşleşme detayı (her bileşen için) */
export interface DetectionMatchDetail {
  matched: boolean;
  raw_value: string | null;
  display_name: string | null;
}

/** POST /api/detect response */
export interface DetectionResponse {
  success: boolean;
  session_id: string | null;
  cpu: DetectionMatchDetail;
  gpu: DetectionMatchDetail;
  ram: string | null;
  ssd: string | null;
  resolution: string | null;
  errors: string[];
  available_hardware: { cpus: string[]; gpus: string[] } | null;
}

// ─── System Spec (Frontend State) ───

/** Kullanıcının seçtiği veya Detection App'ten gelen donanım bilgisi */
export interface SystemSpec {
  cpu: string;
  gpu: string;
  ram: string;
  ssd: string;
  resolution: string;
  source: "auto" | "manual";
}

// ─── Simulation Types ───

/** POST /api/simulation/start payload */
export interface SimulationStartPayload {
  cpu_name: string;
  gpu_name: string;
  game_name: string;
  resolution?: number;
  game_setting?: string;
}

/** POST /api/simulation/start response */
export interface SimulationStartResponse {
  success: boolean;
  session_id: string;
  message: string;
  websocket_url: string;
  polling_url: string;
}

/** POST /api/simulation/results payload */
export interface SimulationResultsPayload {
  session_id: string;
  avg_fps?: number;
  max_fps?: number;
  min_fps?: number;
  fps_timeline?: number[];
  cpu_temp_avg?: number;
  gpu_temp_avg?: number;
  cpu_clock_avg?: number;
  gpu_clock_avg?: number;
  fan_rpm_avg?: number;
  bottleneck?: string;
  benchmark_duration_sec?: number;
}

/** POST /api/simulation/results response */
export interface SimulationResultsResponse {
  success: boolean;
  session_id: string;
  results: BenchmarkResults;
}

// ─── Benchmark Results (Backend'den dönen sonuç) ───

/** Simulation App + ML tahmin sonuçları */
export interface BenchmarkResults {
  avgFps: number;
  maxFps: number;
  minFps: number;
  fpsTimeline: number[];
  cpuTempAvg: number;
  gpuTempAvg: number;
  cpuClockAvg: number;
  gpuClockAvg: number;
  fanRpmAvg: number;
  bottleneck: "CPU" | "GPU" | "balanced";
  benchmarkDurationSec: number;
  /** ML modelinin ürettiği tahmini FPS (predict_fps.py) */
  mlPredictedFps?: number | null;
  /** ML tahmin hatası (varsa) */
  mlError?: string | null;
}

// ─── Game Selection (Frontend State) ───

/** Kullanıcının oyun seçim durumu */
export interface GameSelection {
  platform: string;
  game: GameItem;
  map: string;
}

