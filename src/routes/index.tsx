import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MatrixRain } from "@/components/MatrixRain";
import {
  CPUS, GPUS, RAMS, SSDS, RESOLUTIONS, PLATFORMS,
  cpuScore, gpuScore, ramScore, ssdScore, resScore,
  type Game,
} from "@/components/seefps/data";

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

type SystemSpec = {
  cpu: string; gpu: string; ram: string; ssd: string; resolution: string; source: "auto" | "manual";
};

type Results = {
  maxFps: number; minFps: number; avgFps: number;
  cpuClocks: number[]; cpuTemp: number; gpuTemp: number; fanRpm: number;
};

function Index() {
  const [step, setStep] = useState<Step>("splash");
  const [spec, setSpec] = useState<SystemSpec | null>(null);
  const [game, setGame] = useState<{ platform: string; game: Game; map: string } | null>(null);
  const [results, setResults] = useState<Results | null>(null);

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
          <Benchmark spec={spec} game={game} onDone={(r) => { setResults(r); setStep("results"); }} />
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
        <div className="mt-6 flex justify-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
          <span>steam</span>·<span>epic</span>·<span>ea</span>·<span>riot</span>·<span>xbox</span>
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

/* ---------- Detection (simulated) ---------- */

function Detection({ onDone, onBack }: { onDone: (s: SystemSpec) => void; onBack: () => void }) {
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const log = (l: string) => setLines((p) => [...p, l]);

  useEffect(() => {
    const messages = [
      "[probe] initializing kernel hook...",
      "[cpu] querying msr registers...",
      "[gpu] scanning pci-e bus...",
      "[ram] reading SPD profiles...",
      "[ssd] benchmarking sequential read...",
      "[display] reading EDID...",
      "[probe] aggregating hardware fingerprint...",
      "[probe] handshake complete ✓",
    ];
    let i = 0;
    const id = setInterval(() => {
      if (i < messages.length) { log(messages[i]); i++; setProgress((i / messages.length) * 100); }
      else {
        clearInterval(id);
        setTimeout(() => onDone({
          cpu: "AMD Ryzen 7 7800X3D",
          gpu: "NVIDIA RTX 4070 Super",
          ram: "32 GB DDR5 6000",
          ssd: "NVMe Gen4 7000 MB/s",
          resolution: "1440p (2560x1440)",
          source: "auto",
        }), 600);
      }
    }, 420);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <StepLabel n={2} title="Detection Probe" />
        <Panel>
          <div className="font-mono text-xs text-primary/70">
            seefps-probe v1.0 // {Math.round(progress)}%
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden border border-primary/30 bg-background">
            <div className="h-full bg-primary transition-all neon-border" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-6 h-64 overflow-auto bg-background/60 p-4 font-mono text-xs text-primary">
            {lines.map((l, i) => <div key={i}>&gt; {l}</div>)}
            <div className="animate-blink">&gt; _</div>
          </div>
        </Panel>
        <div className="mt-6 flex justify-between">
          <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
        </div>
      </div>
    </div>
  );
}

/* ---------- Manual input ---------- */

function Manual({ initial, onDone, onBack }: { initial: SystemSpec | null; onDone: (s: SystemSpec) => void; onBack: () => void }) {
  const [cpu, setCpu] = useState(initial?.cpu ?? CPUS[2]);
  const [gpu, setGpu] = useState(initial?.gpu ?? GPUS[3]);
  const [ram, setRam] = useState(initial?.ram ?? RAMS[2]);
  const [ssd, setSsd] = useState(initial?.ssd ?? SSDS[1]);
  const [resolution, setResolution] = useState(initial?.resolution ?? RESOLUTIONS[0]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <StepLabel n={2} title="Manual Specs" />
        <Panel>
          <div className="grid gap-6">
            <Selector label="CPU / Processor" value={cpu} options={CPUS} onChange={setCpu} />
            <Selector label="GPU / Graphics Card" value={gpu} options={GPUS} onChange={setGpu} />
            <Selector label="RAM" value={ram} options={RAMS} onChange={setRam} />
            <Selector label="SSD Speed" value={ssd} options={SSDS} onChange={setSsd} />
            <Selector label="Screen Resolution" value={resolution} options={RESOLUTIONS} onChange={setResolution} />
          </div>
        </Panel>
        <div className="mt-6 flex justify-between">
          <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
          <NeonButton onClick={() => onDone({ cpu, gpu, ram, ssd, resolution, source: "manual" })}>Next →</NeonButton>
        </div>
      </div>
    </div>
  );
}

function Selector({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const idx = options.indexOf(value);
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <label className="font-mono text-xs uppercase tracking-widest text-primary/70">{label}</label>
        <span className="font-mono text-sm text-foreground neon-text">{value}</span>
      </div>
      <input
        type="range" min={0} max={options.length - 1} value={idx}
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

function GamePick({ onDone, onBack }: { onDone: (g: { platform: string; game: Game; map: string }) => void; onBack: () => void }) {
  const [pIdx, setPIdx] = useState(0);
  const [gIdx, setGIdx] = useState(0);
  const [mIdx, setMIdx] = useState(0);

  const platform = PLATFORMS[pIdx];
  const game = platform.games[gIdx] ?? platform.games[0];
  const map = game.maps[mIdx] ?? game.maps[0];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <StepLabel n={3} title="Game & Map" />
        <Panel>
          <div className="grid gap-6">
            <Selector label="Platform" value={platform.name} options={PLATFORMS.map(p => p.name)}
              onChange={(v) => { setPIdx(PLATFORMS.findIndex(p => p.name === v)); setGIdx(0); setMIdx(0); }} />
            <Selector label="Game" value={game.name} options={platform.games.map(g => g.name)}
              onChange={(v) => { setGIdx(platform.games.findIndex(g => g.name === v)); setMIdx(0); }} />
            <Selector label="Map" value={map} options={game.maps} onChange={(v) => setMIdx(game.maps.indexOf(v))} />
          </div>
          <div className="mt-6 border-t border-primary/20 pt-4 font-mono text-xs text-muted-foreground">
            ENGINE: <span className="text-primary">{game.engine}</span>
          </div>
        </Panel>
        <div className="mt-6 flex justify-between">
          <NeonButton variant="ghost" onClick={onBack}>← Back</NeonButton>
          <NeonButton onClick={() => onDone({ platform: platform.name, game, map })}>Run Benchmark →</NeonButton>
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. Benchmark simulation ---------- */

function Benchmark({ spec, game, onDone }: { spec: SystemSpec; game: { platform: string; game: Game; map: string }; onDone: (r: Results) => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading textures");
  const [events, setEvents] = useState<string[]>([]);
  const [liveFps, setLiveFps] = useState(0);
  const startRef = useRef(Date.now());
  const fpsSamplesRef = useRef<number[]>([]);

  // Estimate target fps from specs
  const targetFps = useMemo(() => {
    const base = 60 * cpuScore(spec.cpu) * gpuScore(spec.gpu)
      * ramScore(spec.ram) * ssdScore(spec.ssd) * resScore(spec.resolution) * game.game.weight;
    return Math.round(base);
  }, [spec, game]);

  useEffect(() => {
    const phases = [
      "loading textures",
      "compiling shaders",
      "baking shadow maps",
      "warming up engine",
      "simulating gameplay",
      "engine-specific FX pass",
      "finalizing benchmark",
    ];
    const gameFx: Record<string, string[]> = {
      cs2: ["[CS2] smoke grenade detonated", "[CS2] molotov spread on B-site", "[CS2] flashbang ignited"],
      valorant: ["[VAL] Breach ultimate cast", "[VAL] Omen blind deployed", "[VAL] Sage wall raised"],
      lol: ["[LoL] 5 ultimates landed on dragon", "[LoL] teamfight @ baron"],
      forza: ["[Forza] water splash reflection", "[Forza] dynamic weather shift"],
      fortnite: ["[FN] storm circle closed", "[FN] building physics burst"],
      bf2042: ["[BF2042] tornado spawned", "[BF2042] level destruction event"],
      apex: ["[APEX] ring closing"],
      dota2: ["[DOTA2] roshan teamfight"],
      fc24: ["[FC24] crowd reaction"],
      rocket: ["[RL] boost particles"],
      starfield: ["[STAR] city LOD swap"],
    };
    const fx = gameFx[game.game.id] ?? ["[engine] particle burst"];

    const duration = 6000;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      setPhase(phases[Math.min(phases.length - 1, Math.floor((p / 100) * phases.length))]);
      // live fps wobble
      const wobble = (Math.random() - 0.5) * targetFps * 0.4;
      const sample = Math.max(15, Math.round(targetFps + wobble));
      setLiveFps(sample);
      fpsSamplesRef.current.push(sample);
      if (Math.random() < 0.18) {
        setEvents((e) => [fx[Math.floor(Math.random() * fx.length)], ...e].slice(0, 8));
      }
      if (p >= 100) {
        clearInterval(id);
        const samples = fpsSamplesRef.current;
        const max = Math.max(...samples);
        const min = Math.min(...samples);
        const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
        const cores = Math.max(4, Math.min(16, Math.round(4 + cpuScore(spec.cpu) * 4)));
        const baseClock = 3.2 + cpuScore(spec.cpu) * 1.4;
        const cpuClocks = Array.from({ length: cores }, () =>
          +(baseClock + (Math.random() - 0.5) * 0.8).toFixed(2)
        );
        const load = avg / Math.max(targetFps, 1);
        const cpuTemp = Math.round(55 + load * 30 + Math.random() * 6);
        const gpuTemp = Math.round(58 + gpuScore(spec.gpu) * 6 + (Math.random() * 8));
        const fanRpm = Math.round(1200 + load * 1800 + Math.random() * 400);
        setTimeout(() => onDone({ maxFps: max, minFps: min, avgFps: avg, cpuClocks, cpuTemp, gpuTemp, fanRpm }), 500);
      }
    }, 120);
    return () => clearInterval(id);
  }, [onDone, spec, targetFps, game.game.id]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <StepLabel n={4} title="Virtual Environment" />
        <p className="mb-6 font-mono text-sm text-muted-foreground">
          &gt; rendering <span className="text-primary">{game.game.name}</span> // map: <span className="text-primary">{game.map}</span> // engine: <span className="text-primary">{game.game.engine}</span>
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Faux viewport */}
          <Panel className="lg:col-span-2">
            <div className="relative aspect-video w-full overflow-hidden bg-background">
              {/* synthesized scene */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 70%, oklch(0.35 0.18 145 / 0.7) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, oklch(0.5 0.22 142 / 0.5) 0%, transparent 60%), linear-gradient(180deg, #001a0c 0%, #000 100%)",
                }}
              />
              {/* wireframe scene */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="oklch(0.82 0.24 142)" stopOpacity="0.0" />
                    <stop offset="1" stopColor="oklch(0.82 0.24 142)" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {/* ground grid */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={300 + i * 12} x2="800" y2={300 + i * 12} stroke="oklch(0.5 0.2 145 / 0.3)" />
                ))}
                {Array.from({ length: 20 }).map((_, i) => {
                  const x = 400 + (i - 10) * 80;
                  return <line key={`v${i}`} x1={400} y1="300" x2={x} y2="450" stroke="oklch(0.5 0.2 145 / 0.3)" />;
                })}
                {/* buildings */}
                <rect x="80" y="180" width="100" height="120" fill="url(#g)" stroke="oklch(0.82 0.24 142)" />
                <rect x="220" y="140" width="120" height="160" fill="url(#g)" stroke="oklch(0.82 0.24 142)" />
                <rect x="480" y="160" width="100" height="140" fill="url(#g)" stroke="oklch(0.82 0.24 142)" />
                <rect x="620" y="200" width="120" height="100" fill="url(#g)" stroke="oklch(0.82 0.24 142)" />
                {/* crosshair */}
                <g stroke="oklch(0.92 0.2 142)" strokeWidth="1.5">
                  <line x1="400" y1="210" x2="400" y2="240" />
                  <line x1="400" y1="270" x2="400" y2="300" />
                  <line x1="370" y1="255" x2="395" y2="255" />
                  <line x1="405" y1="255" x2="430" y2="255" />
                </g>
              </svg>
              {/* HUD overlay */}
              <div className="absolute left-3 top-3 font-mono text-xs text-primary neon-text">
                <div>FPS: <span className="text-2xl font-bold">{liveFps}</span></div>
                <div>FRAME: {Math.round((1000 / Math.max(liveFps, 1)) * 10) / 10} ms</div>
              </div>
              <div className="absolute right-3 top-3 font-mono text-xs text-primary/80">
                {game.game.name.toUpperCase()}
              </div>
              <div className="absolute left-3 bottom-3 right-3 font-mono text-[10px] text-primary/80">
                {phase.toUpperCase()} <span className="animate-blink">_</span>
              </div>
              {/* scanlines */}
              <div className="scanlines absolute inset-0" />
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden border border-primary/30">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </Panel>

          <Panel>
            <div className="font-mono text-xs uppercase tracking-widest text-primary/70">live events</div>
            <div className="mt-3 h-72 overflow-hidden font-mono text-xs text-primary">
              {events.length === 0 && <div className="text-muted-foreground">waiting for engine events...</div>}
              {events.map((e, i) => (
                <div key={`${e}-${i}`} className="border-l-2 border-primary/50 pl-2 py-1">{e}</div>
              ))}
            </div>
            <div className="mt-4 border-t border-primary/20 pt-3 font-mono text-[10px] text-muted-foreground">
              user input <span className="text-destructive">DISABLED</span> during benchmark
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. Results ---------- */

function ResultsView({
  spec, game, results, onFinish,
}: { spec: SystemSpec; game: { platform: string; game: Game; map: string }; results: Results; onFinish: () => void }) {
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="font-mono text-xs uppercase tracking-widest text-primary/70">CPU Clock per Core (GHz)</div>
            <div className="mt-4 space-y-2">
              {results.cpuClocks.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-20 font-mono text-xs text-muted-foreground">core {String(i).padStart(2, "0")}</span>
                  <div className="relative h-3 flex-1 overflow-hidden border border-primary/30 bg-background">
                    <div className="h-full bg-primary" style={{ width: `${(c / 6) * 100}%` }} />
                  </div>
                  <span className="w-16 text-right font-mono text-sm text-primary neon-text">{c.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6">
            <StatCard label="CPU Temperature" value={`${results.cpuTemp}°C`} sub="package avg" />
            <StatCard label="GPU Temperature" value={`${results.gpuTemp}°C`} sub="hotspot" />
            <StatCard label="Fan RPM" value={`${results.fanRpm}`} sub="chassis avg" />
          </div>
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
