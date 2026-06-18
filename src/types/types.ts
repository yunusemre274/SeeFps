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

// ─── Grouped API Response Types ───

/** Tüm hardware endpoint'lerinin standart response wrapper'ı */
export interface ApiResponse<T> {
  success: boolean;
  data: T[];
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

// ─── Benchmark Results (Simulation App'ten gelecek) ───

/** Simulation App'in Backend API'ye POST ettiği sonuç verisi */
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
}

// ─── Game Selection (Frontend State) ───

/** Kullanıcının oyun seçim durumu */
export interface GameSelection {
  platform: string;
  game: GameItem;
  map: string;
}
