/**
 * SeeFps — AnalyzingScreen (Dinamik Benchmark Bekleme Ekranı)
 *
 * Masaüstü Simulation App benchmark'ı çalıştırırken kullanıcıya
 * canlı ilerleme göstergesi ve animasyonlu bekleme ekranı sunar.
 *
 * Özellikler:
 * - Animasyonlu ilerleme çubuğu (progress bar)
 * - Dönen aşama metinleri (stage labels)
 * - Neon glow efektli canlı durum gösterimi
 * - WebSocket/Polling ile backend bağlantı durumu
 * - Geçen süre ve tahmini kalan süre gösterimi
 * - Hata ve timeout durumu yönetimi
 * - Terminal-tarzı event log
 * - Donanım konfigürasyon özeti
 *
 * Görev 1.3 — Dinamik "Analyzing..." Bekleme Ekranı
 */

import { useState, useEffect, useRef } from "react";
import {
  useSimulationStatus,
  BENCHMARK_STAGES,
  type SimulationStage,
} from "@/hooks/useSimulationStatus";
import type { SystemSpec, GameSelection, BenchmarkResults } from "@/types/types";

// ─── Props ───

interface AnalyzingScreenProps {
  spec: SystemSpec;
  game: GameSelection;
  onDone: (results: BenchmarkResults) => void;
}

// ─── Helpers ───

/** Saniyeyi MM:SS formatına dönüştür */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Bağlantı durumu badge rengi */
function connectionBadge(status: string): { color: string; text: string } {
  switch (status) {
    case "connected":    return { color: "text-primary",      text: "CONNECTED" };
    case "connecting":   return { color: "text-yellow-400",   text: "CONNECTING..." };
    case "error":        return { color: "text-destructive",  text: "OFFLINE" };
    default:             return { color: "text-muted-foreground", text: "WAITING" };
  }
}

/** Aşamaya göre ikon */
function stageIcon(stage: SimulationStage): string {
  switch (stage) {
    case "waiting_for_app":   return "◎";
    case "connecting":        return "◐";
    case "initializing":      return "⚙";
    case "loading_textures":  return "▦";
    case "compiling_shaders": return "◈";
    case "gpu_stress":        return "⊕";
    case "cpu_stress":        return "⊗";
    case "gameplay_sim":      return "🎮";
    case "particle_fx":       return "✦";
    case "thermal_analysis":  return "🌡";
    case "finalizing":        return "◉";
    case "completed":         return "✓";
    case "error":             return "✗";
    case "timeout":           return "⏱";
    default:                  return "·";
  }
}

// ─── Main Component ───

export function AnalyzingScreen({ spec, game, onDone }: AnalyzingScreenProps) {
  // Geçici session ID (Phase 2'de gerçek session yönetimi eklenecek)
  const [sessionId] = useState(() => `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const {
    currentStage,
    results,
    errorMessage,
    connectionStatus,
    elapsedSeconds,
    estimatedRemainingSeconds,
  } = useSimulationStatus(sessionId, true, onDone);

  // Terminal-tarzı event log
  const [logLines, setLogLines] = useState<string[]>([
    `[sys] benchmark session initialized: ${sessionId}`,
    `[sys] target: ${game.game.name} // map: ${game.map}`,
    `[sys] config: ${spec.cpu} | ${spec.gpu}`,
    `[sys] awaiting Desktop Simulation App connection...`,
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Aşama değiştiğinde log'a ekle
  useEffect(() => {
    if (currentStage.stage !== "waiting_for_app") {
      const icon = stageIcon(currentStage.stage);
      setLogLines(prev => [
        ...prev,
        `[${icon}] ${currentStage.label}${currentStage.detail ? ` — ${currentStage.detail}` : ""}`,
      ]);
    }
  }, [currentStage.stage]);

  // Log otomatik scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  const badge = connectionBadge(connectionStatus);
  const isWaiting = currentStage.stage === "waiting_for_app";
  const isError = currentStage.stage === "error" || currentStage.stage === "timeout";
  const isCompleted = currentStage.stage === "completed";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Üst bilgi satırı */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-1">step 04</div>
          <h2 className="font-[Orbitron] text-3xl font-bold uppercase tracking-wide text-primary neon-text sm:text-4xl">
            {isWaiting ? "Awaiting Simulation" : isCompleted ? "Complete" : "Analyzing..."}
          </h2>
        </div>
        <div className="text-right">
          <div className={`font-mono text-xs uppercase tracking-widest ${badge.color}`}>
            ● {badge.text}
          </div>
          <div className="font-mono text-xs text-muted-foreground mt-1">
            {formatTime(elapsedSeconds)}
            {estimatedRemainingSeconds != null && (
              <span> / ~{formatTime(estimatedRemainingSeconds)} remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* Oyun bilgi satırı */}
      <p className="mb-6 font-mono text-sm text-muted-foreground">
        &gt; rendering <span className="text-primary">{game.game.name}</span>
        {" "}// map: <span className="text-primary">{game.map}</span>
        {" "}// engine: <span className="text-primary">{game.game.engine}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Sol: Ana görsel alan ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Faux viewport — wireframe sahne */}
          <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-0 overflow-hidden">
            {/* Köşe dekorları */}
            <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary z-10" />
            <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary z-10" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary z-10" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary z-10" />

            <div className="relative aspect-video w-full overflow-hidden bg-background">
              {/* Radial gradient arkaplan */}
              <div
                className="absolute inset-0"
                style={{
                  background: isError
                    ? "radial-gradient(ellipse at 50% 50%, oklch(0.35 0.18 25 / 0.4) 0%, transparent 60%), linear-gradient(180deg, #1a0000 0%, #000 100%)"
                    : "radial-gradient(ellipse at 30% 70%, oklch(0.35 0.18 145 / 0.7) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, oklch(0.5 0.22 142 / 0.5) 0%, transparent 60%), linear-gradient(180deg, #001a0c 0%, #000 100%)",
                }}
              />

              {/* Wireframe sahne */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="g-analyzing" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="oklch(0.82 0.24 142)" stopOpacity="0.0" />
                    <stop offset="1" stopColor="oklch(0.82 0.24 142)" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {/* Ground grid */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={300 + i * 12} x2="800" y2={300 + i * 12} stroke="oklch(0.5 0.2 145 / 0.3)" />
                ))}
                {Array.from({ length: 20 }).map((_, i) => {
                  const x = 400 + (i - 10) * 80;
                  return <line key={`v${i}`} x1={400} y1="300" x2={x} y2="450" stroke="oklch(0.5 0.2 145 / 0.3)" />;
                })}
                {/* Buildings */}
                <rect x="80" y="180" width="100" height="120" fill="url(#g-analyzing)" stroke="oklch(0.82 0.24 142)" />
                <rect x="220" y="140" width="120" height="160" fill="url(#g-analyzing)" stroke="oklch(0.82 0.24 142)" />
                <rect x="480" y="160" width="100" height="140" fill="url(#g-analyzing)" stroke="oklch(0.82 0.24 142)" />
                <rect x="620" y="200" width="120" height="100" fill="url(#g-analyzing)" stroke="oklch(0.82 0.24 142)" />
                {/* Crosshair */}
                <g stroke="oklch(0.92 0.2 142)" strokeWidth="1.5">
                  <line x1="400" y1="210" x2="400" y2="240" />
                  <line x1="400" y1="270" x2="400" y2="300" />
                  <line x1="370" y1="255" x2="395" y2="255" />
                  <line x1="405" y1="255" x2="430" y2="255" />
                </g>
              </svg>

              {/* HUD overlay — aşama bilgisi */}
              <div className="absolute left-3 top-3 font-mono text-xs text-primary neon-text">
                <div className="text-lg font-bold">
                  {stageIcon(currentStage.stage)} {currentStage.stage === "waiting_for_app" ? "STANDBY" : `${Math.round(currentStage.progress)}%`}
                </div>
                <div className="text-primary/70">{currentStage.label}</div>
              </div>

              <div className="absolute right-3 top-3 font-mono text-xs text-primary/80">
                {game.game.name.toUpperCase()}
              </div>

              <div className="absolute left-3 bottom-3 right-3 font-mono text-[10px] text-primary/80">
                {currentStage.label.toUpperCase()} <span className="animate-blink">_</span>
              </div>

              {/* Scanlines */}
              <div className="scanlines absolute inset-0" />

              {/* Pulsating overlay for waiting state */}
              {isWaiting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-[Orbitron] text-xl font-bold text-primary neon-text animate-flicker">
                      AWAITING CONNECTION
                    </div>
                    <div className="mt-2 font-mono text-xs text-primary/60">
                      Simulation App'i başlatın...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden border-t border-primary/30 bg-background">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${currentStage.progress}%`,
                  background: isError
                    ? "oklch(0.65 0.25 25)"
                    : "linear-gradient(90deg, oklch(0.82 0.24 142), oklch(0.92 0.20 145))",
                  boxShadow: isError
                    ? "0 0 10px oklch(0.65 0.25 25 / 0.6)"
                    : "0 0 10px oklch(0.82 0.24 142 / 0.6)",
                }}
              />
            </div>
          </div>

          {/* Aşama göstergeleri */}
          <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4">
            <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
            <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

            <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-3">benchmark stages</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BENCHMARK_STAGES.filter(s => s.stage !== "waiting_for_app").slice(0, -1).map((stage) => {
                const isCurrent = stage.stage === currentStage.stage;
                const isPast = stage.progress < currentStage.progress;

                return (
                  <div
                    key={stage.stage}
                    className={`
                      px-2 py-1.5 text-center font-mono text-[10px] uppercase border transition-all duration-300
                      ${isCurrent
                        ? "border-primary bg-primary/15 text-primary neon-text animate-glow"
                        : isPast
                          ? "border-primary/30 bg-primary/5 text-primary/60"
                          : "border-primary/10 text-muted-foreground"
                      }
                    `}
                  >
                    <div className="text-xs mb-0.5">{stageIcon(stage.stage)}</div>
                    <div className="truncate">{stage.label.replace("...", "")}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sağ: Bilgi paneli ── */}
        <div className="space-y-4">

          {/* Terminal log */}
          <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4">
            <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
            <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

            <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-2">event log</div>
            <div className="h-48 overflow-y-auto bg-background/60 p-3 font-mono text-[11px] text-primary space-y-0.5">
              {logLines.map((line, i) => (
                <div key={i} className="text-primary/80">&gt; {line}</div>
              ))}
              <div ref={logEndRef} />
              <div className="animate-blink text-primary/50">&gt; _</div>
            </div>
          </div>

          {/* Donanım konfigürasyonu */}
          <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4">
            <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
            <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

            <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-2">config</div>
            <div className="grid gap-1 font-mono text-xs">
              <div><span className="text-muted-foreground">CPU:</span> <span className="text-primary">{spec.cpu}</span></div>
              <div><span className="text-muted-foreground">GPU:</span> <span className="text-primary">{spec.gpu}</span></div>
              <div><span className="text-muted-foreground">RAM:</span> <span className="text-primary">{spec.ram}</span></div>
              <div><span className="text-muted-foreground">SSD:</span> <span className="text-primary">{spec.ssd}</span></div>
              <div><span className="text-muted-foreground">RES:</span> <span className="text-primary">{spec.resolution}</span></div>
            </div>
          </div>

          {/* Simulation App indirme bilgilendirmesi */}
          {isWaiting && (
            <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4">
              <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
              <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
              <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
              <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />

              <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-2">info</div>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <p>&gt; <span className="text-primary">SeeFps Simulation App</span>'i bilgisayarınıza indirip çalıştırın.</p>
                <p>&gt; Benchmark sonuçları otomatik olarak bu sayfaya gönderilecektir.</p>
              </div>
              <button
                disabled
                className="mt-3 w-full px-4 py-2 font-mono text-xs uppercase tracking-widest bg-primary/10 border border-primary/30 text-primary/50 cursor-not-allowed"
              >
                ↓ Simulation App İndir (Yakında)
              </button>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground text-center">
                Phase 4 tamamlandığında aktif olacaktır.
              </div>
            </div>
          )}

          {/* Hata durumu */}
          {isError && errorMessage && (
            <div className="relative bg-card/80 backdrop-blur-sm border border-destructive/50 p-4">
              <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-destructive" />
              <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-destructive" />
              <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-destructive" />
              <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-destructive" />

              <div className="font-mono text-xs uppercase tracking-widest text-destructive/70 mb-2">// error</div>
              <div className="font-mono text-xs text-destructive">{errorMessage}</div>
            </div>
          )}

          {/* Kullanıcı uyarısı */}
          <div className="font-mono text-[10px] text-muted-foreground text-center">
            user input <span className="text-destructive">DISABLED</span> during benchmark
          </div>
        </div>
      </div>
    </div>
  );
}
