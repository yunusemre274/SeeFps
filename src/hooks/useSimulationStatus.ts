/**
 * SeeFps — Simulation Status Hook
 *
 * Backend'deki Simulation App benchmark durumunu takip eden hook.
 * WebSocket bağlantısı kurarak gerçek zamanlı ilerleme güncellemesi alır.
 * WebSocket bağlantısı kurulamazsa polling fallback'e geçer.
 *
 * Phase 2 (Backend) ve Phase 4 (Simulation App) tamamlandığında
 * bu hook otomatik olarak çalışacaktır.
 *
 * Şu an (Phase 1): Backend henüz hazır olmadığından, bağlantı denemesi yapıp
 * "waiting_for_app" durumunda kalır.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BenchmarkResults } from "@/types/types";

// ─── Types ───

/** Simülasyon durumu aşamaları */
export type SimulationStage =
  | "waiting_for_app"   // Simulation App henüz bağlanmadı
  | "connecting"        // WebSocket bağlantısı kuruluyor
  | "initializing"      // Ortam kuruluyor
  | "loading_textures"  // Dokular yükleniyor
  | "compiling_shaders" // Shader'lar derleniyor
  | "gpu_stress"        // GPU yük testi
  | "cpu_stress"        // CPU yük testi
  | "gameplay_sim"      // Oyun simülasyonu
  | "particle_fx"       // Partikül efektleri testi
  | "thermal_analysis"  // Sıcaklık analizi
  | "finalizing"        // Sonuçlar hesaplanıyor
  | "completed"         // Tamamlandı
  | "error"             // Hata oluştu
  | "timeout";          // Zaman aşımı

/** Aşama detay bilgisi */
export interface StageInfo {
  stage: SimulationStage;
  label: string;
  progress: number; // 0-100
  detail?: string;
}

/** Benchmark aşama tanımları — sabit sıralı */
export const BENCHMARK_STAGES: StageInfo[] = [
  { stage: "waiting_for_app",   label: "Simulation App bekleniyor...",       progress: 0 },
  { stage: "connecting",        label: "Bağlantı kuruluyor...",             progress: 5 },
  { stage: "initializing",      label: "Ortam kuruluyor...",                progress: 10 },
  { stage: "loading_textures",  label: "Dokular yükleniyor...",             progress: 20 },
  { stage: "compiling_shaders", label: "Shader'lar derleniyor...",          progress: 30 },
  { stage: "gpu_stress",        label: "GPU yük testi...",                  progress: 40 },
  { stage: "cpu_stress",        label: "CPU yük testi...",                  progress: 55 },
  { stage: "gameplay_sim",      label: "Oyun simülasyonu koşturuluyor...",  progress: 65 },
  { stage: "particle_fx",       label: "Partikül & efekt testi...",         progress: 78 },
  { stage: "thermal_analysis",  label: "Sıcaklık analizi yapılıyor...",     progress: 88 },
  { stage: "finalizing",        label: "Sonuçlar hesaplanıyor...",          progress: 95 },
  { stage: "completed",         label: "Benchmark tamamlandı!",            progress: 100 },
];

/** Hook'un döndürdüğü durum objesi */
export interface SimulationStatus {
  /** Mevcut aşama bilgisi */
  currentStage: StageInfo;
  /** Benchmark tamamlandığında sonuçlar */
  results: BenchmarkResults | null;
  /** Hata mesajı (varsa) */
  errorMessage: string | null;
  /** WebSocket bağlantı durumu */
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  /** Geçen süre (saniye) */
  elapsedSeconds: number;
  /** Tahmini kalan süre (saniye) */
  estimatedRemainingSeconds: number | null;
}

// ─── Configuration ───

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";
const POLLING_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const TIMEOUT_SECONDS = 300; // 5 dakika timeout
const POLLING_INTERVAL_MS = 3000; // 3 saniye
const RECONNECT_DELAY_MS = 5000; // 5 saniye

// ─── Hook ───

/**
 * Simulation App benchmark durumunu takip eden hook.
 *
 * @param sessionId - Benzersiz benchmark oturum ID'si
 * @param enabled - Hook'u aktif/deaktif etmek için
 * @param onComplete - Benchmark tamamlandığında çağrılacak callback
 */
export function useSimulationStatus(
  sessionId: string | null,
  enabled: boolean = true,
  onComplete?: (results: BenchmarkResults) => void,
): SimulationStatus {
  const [currentStage, setCurrentStage] = useState<StageInfo>(BENCHMARK_STAGES[0]);
  const [results, setResults] = useState<BenchmarkResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<SimulationStatus["connectionStatus"]>("disconnected");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /** WebSocket bağlantısı kur */
  const connectWebSocket = useCallback(() => {
    if (!sessionId || !enabled) return;

    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/simulation/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        setErrorMessage(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "stage_update") {
            const stageInfo = BENCHMARK_STAGES.find(s => s.stage === data.stage);
            if (stageInfo) {
              setCurrentStage({
                ...stageInfo,
                progress: data.progress ?? stageInfo.progress,
                detail: data.detail,
              });
            }
          }

          if (data.type === "completed" && data.results) {
            const benchResults: BenchmarkResults = data.results;
            setResults(benchResults);
            setCurrentStage(BENCHMARK_STAGES[BENCHMARK_STAGES.length - 1]);
            onCompleteRef.current?.(benchResults);
          }

          if (data.type === "error") {
            setErrorMessage(data.message ?? "Bilinmeyen bir hata oluştu.");
            setCurrentStage({ stage: "error", label: "Hata!", progress: currentStage.progress });
          }
        } catch {
          // JSON parse hatası — sessizce atla
        }
      };

      ws.onerror = () => {
        setConnectionStatus("error");
        // WebSocket başarısız → polling'e geç
        startPolling();
      };

      ws.onclose = () => {
        if (connectionStatus === "connected") {
          // Beklenmeyen kapanma — tekrar bağlan
          setTimeout(connectWebSocket, RECONNECT_DELAY_MS);
        }
        setConnectionStatus("disconnected");
      };
    } catch {
      setConnectionStatus("error");
      startPolling();
    }
  }, [sessionId, enabled]);

  /** Polling fallback — WebSocket bağlanamazsa */
  const startPolling = useCallback(() => {
    if (timerRef.current) return; // Zaten polling yapılıyor

    timerRef.current = setInterval(async () => {
      if (!sessionId) return;

      try {
        const response = await fetch(
          `${POLLING_BASE_URL}/simulation/status/${sessionId}`
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.stage) {
          const stageInfo = BENCHMARK_STAGES.find(s => s.stage === data.stage);
          if (stageInfo) {
            setCurrentStage({
              ...stageInfo,
              progress: data.progress ?? stageInfo.progress,
              detail: data.detail,
            });
          }
        }

        if (data.completed && data.results) {
          setResults(data.results);
          setCurrentStage(BENCHMARK_STAGES[BENCHMARK_STAGES.length - 1]);
          onCompleteRef.current?.(data.results);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch {
        // Polling hatası — API henüz hazır değil, sessizce devam
      }
    }, POLLING_INTERVAL_MS);
  }, [sessionId]);

  /** Süre sayacı */
  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = Date.now();
    elapsedRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      // Timeout kontrolü
      if (elapsed >= TIMEOUT_SECONDS) {
        setCurrentStage({ stage: "timeout", label: "Zaman aşımı!", progress: currentStage.progress });
        setErrorMessage(
          `Benchmark ${TIMEOUT_SECONDS} saniye içinde tamamlanamadı. ` +
          "Simulation App'in çalıştığından emin olun."
        );
      }
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [enabled]);

  /** WebSocket bağlantısını başlat */
  useEffect(() => {
    if (enabled && sessionId) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, sessionId, connectWebSocket]);

  /** beforeunload — sayfa kapanma koruması */
  useEffect(() => {
    if (!enabled || currentStage.stage === "completed" || currentStage.stage === "error") return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, currentStage.stage]);

  /** Tahmini kalan süre hesapla */
  const estimatedRemainingSeconds = (() => {
    if (currentStage.progress <= 0 || elapsedSeconds <= 0) return null;
    const rate = currentStage.progress / elapsedSeconds;
    if (rate <= 0) return null;
    return Math.round((100 - currentStage.progress) / rate);
  })();

  return {
    currentStage,
    results,
    errorMessage,
    connectionStatus,
    elapsedSeconds,
    estimatedRemainingSeconds,
  };
}
