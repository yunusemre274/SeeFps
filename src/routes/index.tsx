import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MatrixRain } from "@/components/MatrixRain";
import {
  useCpus,
  useGpus,
  useRams,
  useSsds,
  useResolutions,
  useGames,
} from "@/hooks/useHardwareData";
import type {
  SystemSpec,
  BenchmarkResults,
  GameItem,
  GameSelection,
} from "@/types/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SeeFps — Virtual FPS Benchmark" },
      { name: "description", content: "Simulate FPS for CS2, Valorant, Fortnite, Forza and more on your rig." },
      { property: "og:title", content: "SeeFps — Virtual FPS Benchmark" },
      { property: "og:description", content: "Matrix-themed virtual FPS benchmark simulator." },
    ],
  }),
  component: Index,
});

type Step = "splash" | "system-choice" | "detection" | "manual" | "game" | "benchmark" | "results" | "done";

function Index() {
  const [step, setStep] = useState<Step>("splash");
  const [spec, setSpec] = useState<SystemSpec | null>(null);
  const [game, setGame] = useState<GameSelection | null>(null);
  const [results, setResults] = useState<BenchmarkResults | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <MatrixRain opacity={step === "splash" ? 0.35 : 0.18} />
      <div className="matrix-grid-bg pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="scanlines pointer-events-none fixed inset-0 z-0" />

      <main className="relative z-10">
        {step === "splash" && <Splash onEnter={() => setStep("system-choice")} />}
        {step === "system-choice" && (
          <SystemChoice
            onDetect={() => setStep("detection")}
            onManual={() => setStep("manual")}
          />
        )}
        {step === "detection" && (
          <Detection
            onDone={(s) => { setSpec(s); setStep("game"); }}
            onBack={() => setStep("system-choice")}
          />
        )}
        {step === "manual" && (
          <Manual
            initial={spec}
            onDone={(s) => { setSpec(s); setStep("game"); }}
            onBack={() => setStep("system-choice")}
          />
        )}
        {step === "game" && (
          <GamePick
            onDone={(g) => { setGame(g); setStep("benchmark"); }}
            onBack={() => setStep("system-choice")}
          />
        )}
        {step === "benchmark" && spec && game && (
          <BenchmarkPending spec={spec} game={game} onDone={(r) => { setResults(r); setStep("results"); }} />
        )}
        {step === "results" && results && spec && game && (
          <ResultsView spec={spec} game={game} results={results} onFinish={() => setStep("done")} />
        )}
        {step === "done" && (
          <DoneView
            onAgain={() => { setResults(null); setGame(null); setStep("system-choice"); }}
          />
        )}
      </main>
    </div>
  );
}

/* ---------- Shared UI ---------- */

function Header() {
  return (
    <div className="flex items-center justify-between border-b border-primary/30 px-6 py-4">
      <div className="flex items-center gap-2 font-[Orbitron] text-xl font-extrabold tracking-widest text-primary neon-text">
        <span className="inline-block h-3 w-3 rounded-full bg-primary animate-glow" />
        SEE<span className="text-foreground">FPS</span>
      </div>
      <div className="font-mono text-xs text-muted-foreground">
        &gt; system.online <span className="animate-blink">_</span>
      </div>
    </div>
  );
}

function NeonButton({
  children, onClick, variant = "primary", disabled, className = "",
}: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost"; disabled?: boolean; className?: string }) {
  const base = "relative px-6 py-3 font-mono uppercase tracking-widest text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = variant === "primary"
    ? "bg-primary text-primary-foreground neon-border hover:scale-[1.02] hover:brightness-110"
    : "border border-primary/50 text-primary hover:bg-primary/10 hover:neon-border";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-card/80 backdrop-blur-sm border border-primary/30 p-6 ${className}`}>
      <span className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" />
      <span className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" />
      <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
      <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />
      {children}
    </div>
  );
}

/** API verileri yüklenirken gösterilen loading state */
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-4 font-mono text-sm text-primary/70">
      <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      <span>{label}</span>
      <span className="animate-blink">_</span>
    </div>
  );
}

/** API bağlantı hatası gösterimi */
function ApiErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Panel>
      <div className="text-center py-6">
        <div className="font-mono text-xs uppercase tracking-widest text-destructive/70 mb-2">// connection error</div>
        <div className="font-mono text-sm text-destructive mb-4">&gt; {message}</div>
        <div className="font-mono text-xs text-muted-foreground mb-4">
          Backend API (FastAPI) henüz çalışmıyor. Phase 2 tamamlandığında veriler otomatik yüklenecektir.
        </div>
        {onRetry && (
          <NeonButton variant="ghost" onClick={onRetry}>↻ Tekrar Dene</NeonButton>
        )}
      </div>
    </Panel>
  );
}

/* ---------- 1. Splash ---------- */

function Splash({ onEnter }: { onEnter: () => void }) {
  const icons = ["⊕", "◎", "🎮", "💀", "▶", "⚡", "◐", "✦"];
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Floating transparent game icons */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {icons.map((c, i) => (
          <div
            key={i}
            className="absolute text-primary/15 font-bold neon-text"
            style={{
              fontSize: `${80 + (i % 4) * 40}px`,
              left: `${(i * 13 + 5) % 90}%`,
              top: `${(i * 23 + 7) % 80}%`,
              animation: `matrix-flicker ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {c}
          </div>
        ))}
        {/* aim / target / joystick / skull SVGs */}
        <SplashGlyph style={{ top: "12%", left: "8%" }} kind="target" />
        <SplashGlyph style={{ top: "70%", left: "12%" }} kind="aim" />
        <SplashGlyph style={{ top: "20%", right: "10%" }} kind="skull" />
        <SplashGlyph style={{ bottom: "12%", right: "14%" }} kind="joystick" />
      </div>

      <div className="relative z-10 text-center">
        <div className="mb-2 font-mono text-xs uppercase tracking-[0.4em] text-primary/70">
          // initializing benchmark protocol
        </div>
        <h1 className="font-[Orbitron] text-7xl font-black tracking-widest text-primary neon-text animate-flicker sm:text-9xl">
          SeeFps
        </h1>
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.3em] text-foreground/70">
          Virtual FPS Benchmark Simulator
        </p>
        <div className="mt-12 flex justify-center">
          <NeonButton onClick={onEnter}>&gt; Press Start</NeonButton>
        </div>
        <div className="mt-6 font-mono text-[10px] uppercase text-muted-foreground">
          powered by machine learning // hub &amp; spoke architecture
        </div>
      </div>
    </div>
  );
}

function SplashGlyph({ kind, style }: { kind: "target" | "aim" | "skull" | "joystick"; style: React.CSSProperties }) {
  const s = "absolute h-32 w-32 text-primary/20 neon-text";
  if (kind === "target") return (
    <svg style={style} className={s} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="50" cy="50" r="45" /><circle cx="50" cy="50" r="30" /><circle cx="50" cy="50" r="15" /><circle cx="50" cy="50" r="3" fill="currentColor" />
    </svg>
  );
  if (kind === "aim") return (
    <svg style={style} className={s} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="50" y1="5" x2="50" y2="35" /><line x1="50" y1="65" x2="50" y2="95" />
      <line x1="5" y1="50" x2="35" y2="50" /><line x1="65" y1="50" x2="95" y2="50" />
      <circle cx="50" cy="50" r="20" />
    </svg>
  );
  if (kind === "skull") return (
    <svg style={style} className={s} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 10 C25 10 15 30 15 50 C15 65 25 75 30 78 L30 90 L45 90 L45 82 L55 82 L55 90 L70 90 L70 78 C75 75 85 65 85 50 C85 30 75 10 50 10 Z M35 45 C35 40 38 37 42 37 C46 37 49 40 49 45 C49 50 46 53 42 53 C38 53 35 50 35 45 Z M51 45 C51 40 54 37 58 37 C62 37 65 40 65 45 C65 50 62 53 58 53 C54 53 51 50 51 45 Z" />
    </svg>
  );
  return (
    <svg style={style} className={s} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="10" y="35" width="80" height="40" rx="20" />
      <circle cx="30" cy="55" r="6" /><circle cx="68" cy="50" r="4" fill="currentColor" /><circle cx="78" cy="60" r="4" fill="currentColor" />
    </svg>
  );
}

/* ---------- 2. System choice ---------- */

function SystemChoice({ onDetect, onManual }: { onDetect: () => void; onManual: () => void }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <StepLabel n={2} title="System Configuration" />
        <p className="mb-10 font-mono text-sm text-muted-foreground">
          &gt; Choose how to register your hardware specs.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <ChoiceCard
            tag="01 / AUTO"
            title="Detection"
            desc="Download the SeeFps probe — auto-detects CPU, GPU, RAM, storage and display."
            cta="Run detection"
            onClick={onDetect}
          />
          <ChoiceCard
            tag="02 / MANUAL"
            title="Manual Input"
            desc="Pick your specs from curated lists — fast, no install required."
            cta="Configure manually"
            onClick={onManual}
          />
        </div>
      </div>
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-4">
      <span className="font-mono text-xs uppercase tracking-widest text-primary/70">step {String(n).padStart(2, "0")}</span>
      <h2 className="font-[Orbitron] text-3xl font-bold uppercase tracking-wide text-primary neon-text sm:text-4xl">{title}</h2>
    </div>
  );
}

function ChoiceCard({ tag, title, desc, cta, onClick }: { tag: string; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <Panel className="group cursor-pointer transition-all hover:neon-border" >
      <div onClick={onClick} className="flex h-full flex-col">
        <div className="font-mono text-xs text-primary/70">{tag}</div>
        <h3 className="mt-2 font-[Orbitron] text-2xl font-bold uppercase text-foreground group-hover:text-primary group-hover:neon-text">{title}</h3>
        <p className="mt-3 flex-1 font-mono text-sm text-muted-foreground">{desc}</p>
        <div className="mt-6">
          <NeonButton onClick={onClick}>{cta} →</NeonButton>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Detection (Desktop App required) ---------- */

/**
 * Detection bileşeni — Masaüstü Detection App gerekliliğini bildirir.
 *
 * Eski versiyon: Sahte (mock) bir tarama animasyonu gösterip hardcoded donanım
 * bilgisi döndürüyordu. Artık Detection App (Phase 3) indirme yönlendirmesi
 * ve manuel giriş alternatifi sunuyor.
 */
function Detection({ onDone, onBack }: { onDone: (s: SystemSpec) => void; onBack: () => void }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <StepLabel n={2} title="Detection Probe" />
        <Panel>
          <div className="text-center py-8">
            <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-4">
              // desktop app required
            </div>
            <div className="font-[Orbitron] text-2xl font-bold text-primary neon-text mb-6">
              SeeFps Detection App
            </div>
            <div className="max-w-md mx-auto space-y-4 font-mono text-sm text-muted-foreground">
              <p>
                &gt; Donanımınızı otomatik taramak için <span className="text-primary">SeeFps Detection App</span>'i
                bilgisayarınıza indirmeniz gerekmektedir.
              </p>
              <p>
                &gt; Uygulama CPU, GPU, RAM, SSD ve ekran çözünürlüğünüzü otomatik algılayarak
                güvenli bir şekilde sunucumuza gönderir.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <NeonButton disabled>
                ↓ Detection App İndir (Yakında)
              </NeonButton>
              <div className="font-mono text-xs text-muted-foreground">
                Phase 3 tamamlandığında aktif olacaktır.
              </div>
            </div>
          </div>
        </Panel>
        <div className="mt-6 flex justify-between">
          <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
          <NeonButton variant="ghost" onClick={() => onBack()}>
            Manuel Giriş Yap →
          </NeonButton>
        </div>
      </div>
    </div>
  );
}

/* ---------- Manual input ---------- */

/**
 * Manual bileşeni — API'den gelen donanım verileriyle Selection yapısı.
 *
 * Eski versiyon: data.ts'den hardcoded CPUS, GPUS, RAMS, SSDS, RESOLUTIONS
 * dizilerini slider ile gösteriyordu. Artık useHardwareData hook'ları
 * aracılığıyla Backend API'den veri çekiyor.
 *
 * NOT: Selector bileşeni şu an hâlâ slider (<input type="range">).
 * Görev 1.2'de Dropdown (Selection Box) bileşenine dönüştürülecek.
 */
function Manual({ initial, onDone, onBack }: { initial: SystemSpec | null; onDone: (s: SystemSpec) => void; onBack: () => void }) {
  const cpuQuery = useCpus();
  const gpuQuery = useGpus();
  const ramQuery = useRams();
  const ssdQuery = useSsds();
  const resQuery = useResolutions();

  // API'den gelen listelerin name alanlarını çıkar
  const cpuNames = useMemo(() => cpuQuery.data?.map(c => c.name) ?? [], [cpuQuery.data]);
  const gpuNames = useMemo(() => gpuQuery.data?.map(g => g.name) ?? [], [gpuQuery.data]);
  const ramNames = useMemo(() => ramQuery.data?.map(r => r.name) ?? [], [ramQuery.data]);
  const ssdNames = useMemo(() => ssdQuery.data?.map(s => s.name) ?? [], [ssdQuery.data]);
  const resNames = useMemo(() => resQuery.data?.map(r => r.name) ?? [], [resQuery.data]);

  const [cpu, setCpu] = useState(initial?.cpu ?? "");
  const [gpu, setGpu] = useState(initial?.gpu ?? "");
  const [ram, setRam] = useState(initial?.ram ?? "");
  const [ssd, setSsd] = useState(initial?.ssd ?? "");
  const [resolution, setResolution] = useState(initial?.resolution ?? "");

  // Veriler yüklendiğinde varsayılan değerleri ayarla (ilk eleman)
  const initialized = useMemo(() => {
    if (!cpu && cpuNames.length > 0) setCpu(cpuNames[0]);
    if (!gpu && gpuNames.length > 0) setGpu(gpuNames[0]);
    if (!ram && ramNames.length > 0) setRam(ramNames[0]);
    if (!ssd && ssdNames.length > 0) setSsd(ssdNames[0]);
    if (!resolution && resNames.length > 0) setResolution(resNames[0]);
    return cpuNames.length > 0 && gpuNames.length > 0;
  }, [cpuNames, gpuNames, ramNames, ssdNames, resNames, cpu, gpu, ram, ssd, resolution]);

  const isLoading = cpuQuery.isLoading || gpuQuery.isLoading || ramQuery.isLoading || ssdQuery.isLoading || resQuery.isLoading;
  const isError = cpuQuery.isError || gpuQuery.isError || ramQuery.isError || ssdQuery.isError || resQuery.isError;
  const errorMessage = [cpuQuery.error, gpuQuery.error, ramQuery.error, ssdQuery.error, resQuery.error]
    .find(e => e)?.message ?? "API bağlantısı kurulamadı";

  const allValid = cpu && gpu && ram && ssd && resolution;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <StepLabel n={2} title="Manual Specs" />

        {isLoading && <LoadingState label="Donanım verileri yükleniyor..." />}

        {isError && (
          <ApiErrorState
            message={errorMessage}
            onRetry={() => {
              cpuQuery.refetch();
              gpuQuery.refetch();
              ramQuery.refetch();
              ssdQuery.refetch();
              resQuery.refetch();
            }}
          />
        )}

        {!isLoading && !isError && (
          <>
            <Panel>
              <div className="grid gap-6">
                <Selector label="CPU / Processor" value={cpu} options={cpuNames} onChange={setCpu} />
                <Selector label="GPU / Graphics Card" value={gpu} options={gpuNames} onChange={setGpu} />
                <Selector label="RAM" value={ram} options={ramNames} onChange={setRam} />
                <Selector label="SSD Speed" value={ssd} options={ssdNames} onChange={setSsd} />
                <Selector label="Screen Resolution" value={resolution} options={resNames} onChange={setResolution} />
              </div>
            </Panel>
            <div className="mt-6 flex justify-between">
              <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
              <NeonButton
                disabled={!allValid}
                onClick={() => onDone({ cpu, gpu, ram, ssd, resolution, source: "manual" })}
              >
                Next →
              </NeonButton>
            </div>
          </>
        )}

        {(isLoading || isError) && (
          <div className="mt-6">
            <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Selector bileşeni — Şu an slider (range input).
 * Görev 1.2'de Dropdown Selection Box'a dönüştürülecek.
 *
 * TODO: GÖREV 1.2 — Bu bileşen <select> veya custom Dropdown ile değiştirilecek.
 */
function Selector({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const idx = options.indexOf(value);
  if (options.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <label className="font-mono text-xs uppercase tracking-widest text-primary/70">{label}</label>
        <span className="font-mono text-sm text-foreground neon-text">{value}</span>
      </div>
      <input
        type="range" min={0} max={options.length - 1} value={idx >= 0 ? idx : 0}
        onChange={(e) => onChange(options[Number(e.target.value)])}
        className="w-full accent-[oklch(0.82_0.24_142)]"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{options[0]}</span><span>{options[options.length - 1]}</span>
      </div>
    </div>
  );
}

/* ---------- 3. Game + Map ---------- */

/**
 * GamePick bileşeni — API'den gelen oyun ve harita verileriyle seçim.
 *
 * Eski versiyon: data.ts'deki hardcoded PLATFORMS dizisinden besleniyordu.
 * Artık useGames() hook'u aracılığıyla Backend API'den veri çekiyor.
 */
function GamePick({ onDone, onBack }: { onDone: (g: GameSelection) => void; onBack: () => void }) {
  const gamesQuery = useGames();

  const games = useMemo(() => gamesQuery.data ?? [], [gamesQuery.data]);

  // Benzersiz platform listesi
  const platforms = useMemo(() => {
    const unique = [...new Set(games.map(g => g.platform))];
    return unique;
  }, [games]);

  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("");

  // Platform seçildiğinde ilk oyunu otomatik seç
  const platformGames = useMemo(() => {
    return games.filter(g => g.platform === selectedPlatform);
  }, [games, selectedPlatform]);

  const selectedGame = useMemo(() => {
    return platformGames.find(g => g.id === selectedGameId) ?? null;
  }, [platformGames, selectedGameId]);

  const maps = useMemo(() => {
    return selectedGame?.maps.map(m => m.name) ?? [];
  }, [selectedGame]);

  // Veriler yüklendiğinde varsayılanları ayarla
  useMemo(() => {
    if (!selectedPlatform && platforms.length > 0) {
      setSelectedPlatform(platforms[0]);
    }
  }, [platforms, selectedPlatform]);

  useMemo(() => {
    if (platformGames.length > 0 && !platformGames.find(g => g.id === selectedGameId)) {
      setSelectedGameId(platformGames[0].id);
    }
  }, [platformGames, selectedGameId]);

  useMemo(() => {
    if (maps.length > 0 && !maps.includes(selectedMap)) {
      setSelectedMap(maps[0]);
    }
  }, [maps, selectedMap]);

  const canProceed = selectedGame && selectedMap;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <StepLabel n={3} title="Game & Map" />

        {gamesQuery.isLoading && <LoadingState label="Oyun listesi yükleniyor..." />}

        {gamesQuery.isError && (
          <ApiErrorState
            message={gamesQuery.error?.message ?? "Oyun verisi yüklenemedi"}
            onRetry={() => gamesQuery.refetch()}
          />
        )}

        {!gamesQuery.isLoading && !gamesQuery.isError && games.length > 0 && (
          <>
            <Panel>
              <div className="grid gap-6">
                <Selector
                  label="Platform"
                  value={selectedPlatform}
                  options={platforms}
                  onChange={(v) => { setSelectedPlatform(v); setSelectedGameId(""); setSelectedMap(""); }}
                />
                <Selector
                  label="Game"
                  value={selectedGame?.name ?? ""}
                  options={platformGames.map(g => g.name)}
                  onChange={(v) => {
                    const g = platformGames.find(pg => pg.name === v);
                    if (g) { setSelectedGameId(g.id); setSelectedMap(""); }
                  }}
                />
                <Selector
                  label="Map"
                  value={selectedMap}
                  options={maps}
                  onChange={setSelectedMap}
                />
              </div>
              {selectedGame && (
                <div className="mt-6 border-t border-primary/20 pt-4 font-mono text-xs text-muted-foreground">
                  ENGINE: <span className="text-primary">{selectedGame.engine}</span>
                </div>
              )}
            </Panel>
            <div className="mt-6 flex justify-between">
              <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
              <NeonButton
                disabled={!canProceed}
                onClick={() => {
                  if (selectedGame && selectedMap) {
                    onDone({ platform: selectedPlatform, game: selectedGame, map: selectedMap });
                  }
                }}
              >
                Run Benchmark →
              </NeonButton>
            </div>
          </>
        )}

        {(gamesQuery.isLoading || gamesQuery.isError) && (
          <div className="mt-6">
            <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 4. Benchmark — Desktop Simulation App Pending ---------- */

/**
 * BenchmarkPending bileşeni — Desktop Simulation App bekleme ekranı.
 *
 * Eski versiyon: Tarayıcıda sahte bir benchmark simülasyonu çalıştırıp
 * mock FPS/sıcaklık/RPM değerleri üretiyordu. Bu KURAL 8 ihlaliydi
 * (simülasyon tarayıcıda çalışmaz).
 *
 * Şu an: Desktop Simulation App'in indirilmesi gerektiğini bildirir.
 * Görev 1.3'te "Analyzing..." bekleme ekranı (WebSocket ile) geliştirilecek.
 * Phase 4'te gerçek Simulation App entegrasyonu yapılacak.
 */
function BenchmarkPending({
  spec, game, onDone,
}: { spec: SystemSpec; game: GameSelection; onDone: (r: BenchmarkResults) => void }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <StepLabel n={4} title="Virtual Environment" />
        <p className="mb-6 font-mono text-sm text-muted-foreground">
          &gt; hedef: <span className="text-primary">{game.game.name}</span> // map: <span className="text-primary">{game.map}</span> // engine: <span className="text-primary">{game.game.engine}</span>
        </p>

        <Panel>
          <div className="text-center py-12">
            <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-4">
              // desktop simulation app required
            </div>
            <div className="font-[Orbitron] text-2xl font-bold text-primary neon-text mb-6">
              SeeFps Simulation App
            </div>
            <div className="max-w-lg mx-auto space-y-4 font-mono text-sm text-muted-foreground">
              <p>
                &gt; Benchmark simülasyonu tarayıcıda <span className="text-destructive">çalışmaz</span>.
              </p>
              <p>
                &gt; <span className="text-primary">SeeFps Simulation App</span>'i indirerek bilgisayarınızda
                sanal benchmark koşturabilirsiniz. Sonuçlar otomatik olarak bu sayfaya gönderilecektir.
              </p>
            </div>

            {/* Seçilen donanım özeti */}
            <div className="mt-8 max-w-md mx-auto">
              <Panel>
                <div className="font-mono text-xs uppercase tracking-widest text-primary/70 mb-3">selected config</div>
                <div className="grid gap-1 font-mono text-xs text-left">
                  <div><span className="text-muted-foreground">CPU:</span> <span className="text-primary">{spec.cpu}</span></div>
                  <div><span className="text-muted-foreground">GPU:</span> <span className="text-primary">{spec.gpu}</span></div>
                  <div><span className="text-muted-foreground">RAM:</span> <span className="text-primary">{spec.ram}</span></div>
                  <div><span className="text-muted-foreground">SSD:</span> <span className="text-primary">{spec.ssd}</span></div>
                  <div><span className="text-muted-foreground">RES:</span> <span className="text-primary">{spec.resolution}</span></div>
                </div>
              </Panel>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <NeonButton disabled>
                ↓ Simulation App İndir (Yakında)
              </NeonButton>
              <div className="font-mono text-xs text-muted-foreground">
                Phase 4 tamamlandığında aktif olacaktır. Görev 1.3'te "Analyzing..." ekranı eklenecek.
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- 5. Results ---------- */

/**
 * ResultsView bileşeni — Benchmark sonuçları.
 *
 * Simulation App (Phase 4) tamamlandığında, sonuçlar Backend API üzerinden
 * bu bileşene aktarılacak. Şimdilik tip tanımları hazır.
 */
function ResultsView({
  spec, game, results, onFinish,
}: { spec: SystemSpec; game: GameSelection; results: BenchmarkResults; onFinish: () => void }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <StepLabel n={5} title="Benchmark Results" />
        <p className="mb-8 font-mono text-sm text-muted-foreground">
          &gt; {game.game.name} @ {game.map} // {spec.resolution}
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          <FpsCard label="Average FPS" value={results.avgFps} highlight />
          <FpsCard label="Max FPS" value={results.maxFps} />
          <FpsCard label="Min (1% low)" value={results.minFps} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <StatCard label="CPU Temperature" value={`${results.cpuTempAvg}°C`} sub="package avg" />
          <StatCard label="GPU Temperature" value={`${results.gpuTempAvg}°C`} sub="hotspot" />
          <StatCard label="Fan RPM" value={`${results.fanRpmAvg}`} sub="chassis avg" />
        </div>

        <Panel className="mt-6">
          <div className="font-mono text-xs uppercase tracking-widest text-primary/70">System Summary</div>
          <div className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">CPU:</span> <span className="text-primary">{spec.cpu}</span></div>
            <div><span className="text-muted-foreground">GPU:</span> <span className="text-primary">{spec.gpu}</span></div>
            <div><span className="text-muted-foreground">RAM:</span> <span className="text-primary">{spec.ram}</span></div>
            <div><span className="text-muted-foreground">SSD:</span> <span className="text-primary">{spec.ssd}</span></div>
            <div><span className="text-muted-foreground">Display:</span> <span className="text-primary">{spec.resolution}</span></div>
            <div><span className="text-muted-foreground">Source:</span> <span className="text-primary">{spec.source}</span></div>
            <div><span className="text-muted-foreground">Bottleneck:</span> <span className="text-primary">{results.bottleneck}</span></div>
          </div>
        </Panel>

        <div className="mt-8 flex justify-end">
          <NeonButton onClick={onFinish}>Finish →</NeonButton>
        </div>
      </div>
    </div>
  );
}

function FpsCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Panel className={highlight ? "animate-glow" : ""}>
      <div className="font-mono text-xs uppercase tracking-widest text-primary/70">{label}</div>
      <div className={`mt-2 font-[Orbitron] font-black ${highlight ? "text-6xl text-primary neon-text" : "text-5xl text-foreground"}`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">frames per second</div>
    </Panel>
  );
}
function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Panel>
      <div className="font-mono text-xs uppercase tracking-widest text-primary/70">{label}</div>
      <div className="mt-2 font-[Orbitron] text-3xl font-bold text-primary neon-text">{value}</div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">{sub}</div>
    </Panel>
  );
}

/* ---------- 6. Done ---------- */

function DoneView({ onAgain }: { onAgain: () => void }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.4em] text-primary/70">// session complete</div>
        <h2 className="mt-4 font-[Orbitron] text-5xl font-black text-primary neon-text animate-flicker">
          BENCHMARK OK
        </h2>
        <p className="mt-6 font-mono text-sm text-muted-foreground">
          &gt; Want to test another configuration? Restart from step 02.
        </p>
        <div className="mt-10">
          <NeonButton onClick={onAgain}>↻ Run New Benchmark</NeonButton>
        </div>
      </div>
    </div>
  );
}
