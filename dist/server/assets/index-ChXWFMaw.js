import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
function MatrixRain({ opacity = 0.25 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const chars = "01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ<>/[]{}*+#$%&".split("");
    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = new Array(columns).fill(1);
    const onResize = () => {
      columns = Math.floor(canvas.width / fontSize);
      drops = new Array(columns).fill(1);
    };
    window.addEventListener("resize", onResize);
    const draw = () => {
      ctx.fillStyle = "rgba(0, 10, 5, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff66";
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref,
      className: "pointer-events-none fixed inset-0 z-0",
      style: { opacity },
      "aria-hidden": true
    }
  );
}
const API_BASE_URL = "http://localhost:8000/api";
async function fetchApi(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(
      `API Error: ${response.status} ${response.statusText} — ${endpoint}`
    );
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(`API returned success=false for ${endpoint}`);
  }
  return json.data;
}
async function fetchCpus() {
  return fetchApi("/hardware/cpus");
}
async function fetchGpus() {
  return fetchApi("/hardware/gpus");
}
async function fetchRams() {
  return fetchApi("/hardware/rams");
}
async function fetchSsds() {
  return fetchApi("/hardware/ssds");
}
async function fetchResolutions() {
  return fetchApi("/resolutions");
}
async function fetchGames() {
  return fetchApi("/games");
}
const STALE_TIME = 5 * 60 * 1e3;
const RETRY_COUNT = 2;
function useCpus() {
  return useQuery({
    queryKey: ["hardware", "cpus"],
    queryFn: fetchCpus,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT
  });
}
function useGpus() {
  return useQuery({
    queryKey: ["hardware", "gpus"],
    queryFn: fetchGpus,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT
  });
}
function useRams() {
  return useQuery({
    queryKey: ["hardware", "rams"],
    queryFn: fetchRams,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT
  });
}
function useSsds() {
  return useQuery({
    queryKey: ["hardware", "ssds"],
    queryFn: fetchSsds,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT
  });
}
function useResolutions() {
  return useQuery({
    queryKey: ["resolutions"],
    queryFn: fetchResolutions,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT
  });
}
function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: fetchGames,
    staleTime: STALE_TIME,
    retry: RETRY_COUNT
  });
}
function Index() {
  const [step, setStep] = useState("splash");
  const [spec, setSpec] = useState(null);
  const [game, setGame] = useState(null);
  const [results, setResults] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen overflow-hidden bg-background text-foreground", children: [
    /* @__PURE__ */ jsx(MatrixRain, { opacity: step === "splash" ? 0.35 : 0.18 }),
    /* @__PURE__ */ jsx("div", { className: "matrix-grid-bg pointer-events-none fixed inset-0 z-0 opacity-30" }),
    /* @__PURE__ */ jsx("div", { className: "scanlines pointer-events-none fixed inset-0 z-0" }),
    /* @__PURE__ */ jsxs("main", { className: "relative z-10", children: [
      step === "splash" && /* @__PURE__ */ jsx(Splash, { onEnter: () => setStep("system-choice") }),
      step === "system-choice" && /* @__PURE__ */ jsx(SystemChoice, { onDetect: () => setStep("detection"), onManual: () => setStep("manual") }),
      step === "detection" && /* @__PURE__ */ jsx(Detection, { onDone: (s) => {
        setSpec(s);
        setStep("game");
      }, onBack: () => setStep("system-choice") }),
      step === "manual" && /* @__PURE__ */ jsx(Manual, { initial: spec, onDone: (s) => {
        setSpec(s);
        setStep("game");
      }, onBack: () => setStep("system-choice") }),
      step === "game" && /* @__PURE__ */ jsx(GamePick, { onDone: (g) => {
        setGame(g);
        setStep("benchmark");
      }, onBack: () => setStep("system-choice") }),
      step === "benchmark" && spec && game && /* @__PURE__ */ jsx(BenchmarkPending, { spec, game, onDone: (r) => {
        setResults(r);
        setStep("results");
      } }),
      step === "results" && results && spec && game && /* @__PURE__ */ jsx(ResultsView, { spec, game, results, onFinish: () => setStep("done") }),
      step === "done" && /* @__PURE__ */ jsx(DoneView, { onAgain: () => {
        setResults(null);
        setGame(null);
        setStep("system-choice");
      } })
    ] })
  ] });
}
function Header() {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-primary/30 px-6 py-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-[Orbitron] text-xl font-extrabold tracking-widest text-primary neon-text", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-block h-3 w-3 rounded-full bg-primary animate-glow" }),
      "SEE",
      /* @__PURE__ */ jsx("span", { className: "text-foreground", children: "FPS" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "font-mono text-xs text-muted-foreground", children: [
      "> system.online ",
      /* @__PURE__ */ jsx("span", { className: "animate-blink", children: "_" })
    ] })
  ] });
}
function NeonButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = ""
}) {
  const base = "relative px-6 py-3 font-mono uppercase tracking-widest text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = variant === "primary" ? "bg-primary text-primary-foreground neon-border hover:scale-[1.02] hover:brightness-110" : "border border-primary/50 text-primary hover:bg-primary/10 hover:neon-border";
  return /* @__PURE__ */ jsx("button", { onClick, disabled, className: `${base} ${styles} ${className}`, children });
}
function Panel({
  children,
  className = ""
}) {
  return /* @__PURE__ */ jsxs("div", { className: `relative bg-card/80 backdrop-blur-sm border border-primary/30 p-6 ${className}`, children: [
    /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" }),
    /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" }),
    /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" }),
    /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" }),
    children
  ] });
}
function LoadingState({
  label
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-4 font-mono text-sm text-primary/70", children: [
    /* @__PURE__ */ jsx("div", { className: "h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" }),
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsx("span", { className: "animate-blink", children: "_" })
  ] });
}
function ApiErrorState({
  message,
  onRetry
}) {
  return /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsxs("div", { className: "text-center py-6", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-destructive/70 mb-2", children: "// connection error" }),
    /* @__PURE__ */ jsxs("div", { className: "font-mono text-sm text-destructive mb-4", children: [
      "> ",
      message
    ] }),
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-muted-foreground mb-4", children: "Backend API (FastAPI) henüz çalışmıyor. Phase 2 tamamlandığında veriler otomatik yüklenecektir." }),
    onRetry && /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: onRetry, children: "↻ Tekrar Dene" })
  ] }) });
}
function Splash({
  onEnter
}) {
  const icons = ["⊕", "◎", "🎮", "💀", "▶", "⚡", "◐", "✦"];
  return /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-screen flex-col items-center justify-center px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute inset-0 overflow-hidden", children: [
      icons.map((c, i) => /* @__PURE__ */ jsx("div", { className: "absolute text-primary/15 font-bold neon-text", style: {
        fontSize: `${80 + i % 4 * 40}px`,
        left: `${(i * 13 + 5) % 90}%`,
        top: `${(i * 23 + 7) % 80}%`,
        animation: `matrix-flicker ${3 + i % 4}s ease-in-out infinite`,
        animationDelay: `${i * 0.3}s`
      }, children: c }, i)),
      /* @__PURE__ */ jsx(SplashGlyph, { style: {
        top: "12%",
        left: "8%"
      }, kind: "target" }),
      /* @__PURE__ */ jsx(SplashGlyph, { style: {
        top: "70%",
        left: "12%"
      }, kind: "aim" }),
      /* @__PURE__ */ jsx(SplashGlyph, { style: {
        top: "20%",
        right: "10%"
      }, kind: "skull" }),
      /* @__PURE__ */ jsx(SplashGlyph, { style: {
        bottom: "12%",
        right: "14%"
      }, kind: "joystick" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-2 font-mono text-xs uppercase tracking-[0.4em] text-primary/70", children: "// initializing benchmark protocol" }),
      /* @__PURE__ */ jsx("h1", { className: "font-[Orbitron] text-7xl font-black tracking-widest text-primary neon-text animate-flicker sm:text-9xl", children: "SeeFps" }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 font-mono text-sm uppercase tracking-[0.3em] text-foreground/70", children: "Virtual FPS Benchmark Simulator" }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 flex justify-center", children: /* @__PURE__ */ jsx(NeonButton, { onClick: onEnter, children: "> Press Start" }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 font-mono text-[10px] uppercase text-muted-foreground", children: "powered by machine learning // hub & spoke architecture" })
    ] })
  ] });
}
function SplashGlyph({
  kind,
  style
}) {
  const s = "absolute h-32 w-32 text-primary/20 neon-text";
  if (kind === "target") return /* @__PURE__ */ jsxs("svg", { style, className: s, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
    /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "45" }),
    /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "30" }),
    /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "15" }),
    /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "3", fill: "currentColor" })
  ] });
  if (kind === "aim") return /* @__PURE__ */ jsxs("svg", { style, className: s, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
    /* @__PURE__ */ jsx("line", { x1: "50", y1: "5", x2: "50", y2: "35" }),
    /* @__PURE__ */ jsx("line", { x1: "50", y1: "65", x2: "50", y2: "95" }),
    /* @__PURE__ */ jsx("line", { x1: "5", y1: "50", x2: "35", y2: "50" }),
    /* @__PURE__ */ jsx("line", { x1: "65", y1: "50", x2: "95", y2: "50" }),
    /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "20" })
  ] });
  if (kind === "skull") return /* @__PURE__ */ jsx("svg", { style, className: s, viewBox: "0 0 100 100", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M50 10 C25 10 15 30 15 50 C15 65 25 75 30 78 L30 90 L45 90 L45 82 L55 82 L55 90 L70 90 L70 78 C75 75 85 65 85 50 C85 30 75 10 50 10 Z M35 45 C35 40 38 37 42 37 C46 37 49 40 49 45 C49 50 46 53 42 53 C38 53 35 50 35 45 Z M51 45 C51 40 54 37 58 37 C62 37 65 40 65 45 C65 50 62 53 58 53 C54 53 51 50 51 45 Z" }) });
  return /* @__PURE__ */ jsxs("svg", { style, className: s, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
    /* @__PURE__ */ jsx("rect", { x: "10", y: "35", width: "80", height: "40", rx: "20" }),
    /* @__PURE__ */ jsx("circle", { cx: "30", cy: "55", r: "6" }),
    /* @__PURE__ */ jsx("circle", { cx: "68", cy: "50", r: "4", fill: "currentColor" }),
    /* @__PURE__ */ jsx("circle", { cx: "78", cy: "60", r: "4", fill: "currentColor" })
  ] });
}
function SystemChoice({
  onDetect,
  onManual
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-6 py-16", children: [
      /* @__PURE__ */ jsx(StepLabel, { n: 2, title: "System Configuration" }),
      /* @__PURE__ */ jsx("p", { className: "mb-10 font-mono text-sm text-muted-foreground", children: "> Choose how to register your hardware specs." }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(ChoiceCard, { tag: "01 / AUTO", title: "Detection", desc: "Download the SeeFps probe — auto-detects CPU, GPU, RAM, storage and display.", cta: "Run detection", onClick: onDetect }),
        /* @__PURE__ */ jsx(ChoiceCard, { tag: "02 / MANUAL", title: "Manual Input", desc: "Pick your specs from curated lists — fast, no install required.", cta: "Configure manually", onClick: onManual })
      ] })
    ] })
  ] });
}
function StepLabel({
  n,
  title
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-baseline gap-4", children: [
    /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs uppercase tracking-widest text-primary/70", children: [
      "step ",
      String(n).padStart(2, "0")
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "font-[Orbitron] text-3xl font-bold uppercase tracking-wide text-primary neon-text sm:text-4xl", children: title })
  ] });
}
function ChoiceCard({
  tag,
  title,
  desc,
  cta,
  onClick
}) {
  return /* @__PURE__ */ jsx(Panel, { className: "group cursor-pointer transition-all hover:neon-border", children: /* @__PURE__ */ jsxs("div", { onClick, className: "flex h-full flex-col", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-primary/70", children: tag }),
    /* @__PURE__ */ jsx("h3", { className: "mt-2 font-[Orbitron] text-2xl font-bold uppercase text-foreground group-hover:text-primary group-hover:neon-text", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 flex-1 font-mono text-sm text-muted-foreground", children: desc }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs(NeonButton, { onClick, children: [
      cta,
      " →"
    ] }) })
  ] }) });
}
function Detection({
  onDone,
  onBack
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-6 py-16", children: [
      /* @__PURE__ */ jsx(StepLabel, { n: 2, title: "Detection Probe" }),
      /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-4", children: "// desktop app required" }),
        /* @__PURE__ */ jsx("div", { className: "font-[Orbitron] text-2xl font-bold text-primary neon-text mb-6", children: "SeeFps Detection App" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto space-y-4 font-mono text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "> Donanımınızı otomatik taramak için ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "SeeFps Detection App" }),
            "'i bilgisayarınıza indirmeniz gerekmektedir."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "> Uygulama CPU, GPU, RAM, SSD ve ekran çözünürlüğünüzü otomatik algılayarak güvenli bir şekilde sunucumuza gönderir." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsx(NeonButton, { disabled: true, children: "↓ Detection App İndir (Yakında)" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-muted-foreground", children: "Phase 3 tamamlandığında aktif olacaktır." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-between", children: [
        /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: onBack, children: "← Back" }),
        /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: () => onBack(), children: "Manuel Giriş Yap →" })
      ] })
    ] })
  ] });
}
function Manual({
  initial,
  onDone,
  onBack
}) {
  const cpuQuery = useCpus();
  const gpuQuery = useGpus();
  const ramQuery = useRams();
  const ssdQuery = useSsds();
  const resQuery = useResolutions();
  const cpuNames = useMemo(() => cpuQuery.data?.map((c) => c.name) ?? [], [cpuQuery.data]);
  const gpuNames = useMemo(() => gpuQuery.data?.map((g) => g.name) ?? [], [gpuQuery.data]);
  const ramNames = useMemo(() => ramQuery.data?.map((r) => r.name) ?? [], [ramQuery.data]);
  const ssdNames = useMemo(() => ssdQuery.data?.map((s) => s.name) ?? [], [ssdQuery.data]);
  const resNames = useMemo(() => resQuery.data?.map((r) => r.name) ?? [], [resQuery.data]);
  const [cpu, setCpu] = useState(initial?.cpu ?? "");
  const [gpu, setGpu] = useState(initial?.gpu ?? "");
  const [ram, setRam] = useState(initial?.ram ?? "");
  const [ssd, setSsd] = useState(initial?.ssd ?? "");
  const [resolution, setResolution] = useState(initial?.resolution ?? "");
  useMemo(() => {
    if (!cpu && cpuNames.length > 0) setCpu(cpuNames[0]);
    if (!gpu && gpuNames.length > 0) setGpu(gpuNames[0]);
    if (!ram && ramNames.length > 0) setRam(ramNames[0]);
    if (!ssd && ssdNames.length > 0) setSsd(ssdNames[0]);
    if (!resolution && resNames.length > 0) setResolution(resNames[0]);
    return cpuNames.length > 0 && gpuNames.length > 0;
  }, [cpuNames, gpuNames, ramNames, ssdNames, resNames, cpu, gpu, ram, ssd, resolution]);
  const isLoading = cpuQuery.isLoading || gpuQuery.isLoading || ramQuery.isLoading || ssdQuery.isLoading || resQuery.isLoading;
  const isError = cpuQuery.isError || gpuQuery.isError || ramQuery.isError || ssdQuery.isError || resQuery.isError;
  const errorMessage = [cpuQuery.error, gpuQuery.error, ramQuery.error, ssdQuery.error, resQuery.error].find((e) => e)?.message ?? "API bağlantısı kurulamadı";
  const allValid = cpu && gpu && ram && ssd && resolution;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-6 py-16", children: [
      /* @__PURE__ */ jsx(StepLabel, { n: 2, title: "Manual Specs" }),
      isLoading && /* @__PURE__ */ jsx(LoadingState, { label: "Donanım verileri yükleniyor..." }),
      isError && /* @__PURE__ */ jsx(ApiErrorState, { message: errorMessage, onRetry: () => {
        cpuQuery.refetch();
        gpuQuery.refetch();
        ramQuery.refetch();
        ssdQuery.refetch();
        resQuery.refetch();
      } }),
      !isLoading && !isError && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
          /* @__PURE__ */ jsx(Selector, { label: "CPU / Processor", value: cpu, options: cpuNames, onChange: setCpu }),
          /* @__PURE__ */ jsx(Selector, { label: "GPU / Graphics Card", value: gpu, options: gpuNames, onChange: setGpu }),
          /* @__PURE__ */ jsx(Selector, { label: "RAM", value: ram, options: ramNames, onChange: setRam }),
          /* @__PURE__ */ jsx(Selector, { label: "SSD Speed", value: ssd, options: ssdNames, onChange: setSsd }),
          /* @__PURE__ */ jsx(Selector, { label: "Screen Resolution", value: resolution, options: resNames, onChange: setResolution })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-between", children: [
          /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: onBack, children: "← Back" }),
          /* @__PURE__ */ jsx(NeonButton, { disabled: !allValid, onClick: () => onDone({
            cpu,
            gpu,
            ram,
            ssd,
            resolution,
            source: "manual"
          }), children: "Next →" })
        ] })
      ] }),
      (isLoading || isError) && /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: onBack, children: "← Back" }) })
    ] })
  ] });
}
function Selector({
  label,
  value,
  options,
  onChange
}) {
  const idx = options.indexOf(value);
  if (options.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-end justify-between", children: [
      /* @__PURE__ */ jsx("label", { className: "font-mono text-xs uppercase tracking-widest text-primary/70", children: label }),
      /* @__PURE__ */ jsx("span", { className: "font-mono text-sm text-foreground neon-text", children: value })
    ] }),
    /* @__PURE__ */ jsx("input", { type: "range", min: 0, max: options.length - 1, value: idx >= 0 ? idx : 0, onChange: (e) => onChange(options[Number(e.target.value)]), className: "w-full accent-[oklch(0.82_0.24_142)]" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex justify-between font-mono text-[10px] text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: options[0] }),
      /* @__PURE__ */ jsx("span", { children: options[options.length - 1] })
    ] })
  ] });
}
function GamePick({
  onDone,
  onBack
}) {
  const gamesQuery = useGames();
  const games = useMemo(() => gamesQuery.data ?? [], [gamesQuery.data]);
  const platforms = useMemo(() => {
    const unique = [...new Set(games.map((g) => g.platform))];
    return unique;
  }, [games]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedMap, setSelectedMap] = useState("");
  const platformGames = useMemo(() => {
    return games.filter((g) => g.platform === selectedPlatform);
  }, [games, selectedPlatform]);
  const selectedGame = useMemo(() => {
    return platformGames.find((g) => g.id === selectedGameId) ?? null;
  }, [platformGames, selectedGameId]);
  const maps = useMemo(() => {
    return selectedGame?.maps.map((m) => m.name) ?? [];
  }, [selectedGame]);
  useMemo(() => {
    if (!selectedPlatform && platforms.length > 0) {
      setSelectedPlatform(platforms[0]);
    }
  }, [platforms, selectedPlatform]);
  useMemo(() => {
    if (platformGames.length > 0 && !platformGames.find((g) => g.id === selectedGameId)) {
      setSelectedGameId(platformGames[0].id);
    }
  }, [platformGames, selectedGameId]);
  useMemo(() => {
    if (maps.length > 0 && !maps.includes(selectedMap)) {
      setSelectedMap(maps[0]);
    }
  }, [maps, selectedMap]);
  const canProceed = selectedGame && selectedMap;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-6 py-16", children: [
      /* @__PURE__ */ jsx(StepLabel, { n: 3, title: "Game & Map" }),
      gamesQuery.isLoading && /* @__PURE__ */ jsx(LoadingState, { label: "Oyun listesi yükleniyor..." }),
      gamesQuery.isError && /* @__PURE__ */ jsx(ApiErrorState, { message: gamesQuery.error?.message ?? "Oyun verisi yüklenemedi", onRetry: () => gamesQuery.refetch() }),
      !gamesQuery.isLoading && !gamesQuery.isError && games.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Panel, { children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
            /* @__PURE__ */ jsx(Selector, { label: "Platform", value: selectedPlatform, options: platforms, onChange: (v) => {
              setSelectedPlatform(v);
              setSelectedGameId("");
              setSelectedMap("");
            } }),
            /* @__PURE__ */ jsx(Selector, { label: "Game", value: selectedGame?.name ?? "", options: platformGames.map((g) => g.name), onChange: (v) => {
              const g = platformGames.find((pg) => pg.name === v);
              if (g) {
                setSelectedGameId(g.id);
                setSelectedMap("");
              }
            } }),
            /* @__PURE__ */ jsx(Selector, { label: "Map", value: selectedMap, options: maps, onChange: setSelectedMap })
          ] }),
          selectedGame && /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t border-primary/20 pt-4 font-mono text-xs text-muted-foreground", children: [
            "ENGINE: ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: selectedGame.engine })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-between", children: [
          /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: onBack, children: "← Back" }),
          /* @__PURE__ */ jsx(NeonButton, { disabled: !canProceed, onClick: () => {
            if (selectedGame && selectedMap) {
              onDone({
                platform: selectedPlatform,
                game: selectedGame,
                map: selectedMap
              });
            }
          }, children: "Run Benchmark →" })
        ] })
      ] }),
      (gamesQuery.isLoading || gamesQuery.isError) && /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(NeonButton, { variant: "ghost", onClick: onBack, children: "← Back" }) })
    ] })
  ] });
}
function BenchmarkPending({
  spec,
  game,
  onDone
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-6 py-12", children: [
      /* @__PURE__ */ jsx(StepLabel, { n: 4, title: "Virtual Environment" }),
      /* @__PURE__ */ jsxs("p", { className: "mb-6 font-mono text-sm text-muted-foreground", children: [
        "> hedef: ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: game.game.name }),
        " // map: ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: game.map }),
        " // engine: ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: game.game.engine })
      ] }),
      /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-4", children: "// desktop simulation app required" }),
        /* @__PURE__ */ jsx("div", { className: "font-[Orbitron] text-2xl font-bold text-primary neon-text mb-6", children: "SeeFps Simulation App" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-lg mx-auto space-y-4 font-mono text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "> Benchmark simülasyonu tarayıcıda ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "çalışmaz" }),
            "."
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "> ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "SeeFps Simulation App" }),
            "'i indirerek bilgisayarınızda sanal benchmark koşturabilirsiniz. Sonuçlar otomatik olarak bu sayfaya gönderilecektir."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 max-w-md mx-auto", children: /* @__PURE__ */ jsxs(Panel, { children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-3", children: "selected config" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-1 font-mono text-xs text-left", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "CPU:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.cpu })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "GPU:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.gpu })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "RAM:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.ram })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "SSD:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.ssd })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "RES:" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.resolution })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsx(NeonButton, { disabled: true, children: "↓ Simulation App İndir (Yakında)" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-muted-foreground", children: `Phase 4 tamamlandığında aktif olacaktır. Görev 1.3'te "Analyzing..." ekranı eklenecek.` })
        ] })
      ] }) })
    ] })
  ] });
}
function ResultsView({
  spec,
  game,
  results,
  onFinish
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-6 py-12", children: [
      /* @__PURE__ */ jsx(StepLabel, { n: 5, title: "Benchmark Results" }),
      /* @__PURE__ */ jsxs("p", { className: "mb-8 font-mono text-sm text-muted-foreground", children: [
        "> ",
        game.game.name,
        " @ ",
        game.map,
        " // ",
        spec.resolution
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsx(FpsCard, { label: "Average FPS", value: results.avgFps, highlight: true }),
        /* @__PURE__ */ jsx(FpsCard, { label: "Max FPS", value: results.maxFps }),
        /* @__PURE__ */ jsx(FpsCard, { label: "Min (1% low)", value: results.minFps })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsx(StatCard, { label: "CPU Temperature", value: `${results.cpuTempAvg}°C`, sub: "package avg" }),
        /* @__PURE__ */ jsx(StatCard, { label: "GPU Temperature", value: `${results.gpuTempAvg}°C`, sub: "hotspot" }),
        /* @__PURE__ */ jsx(StatCard, { label: "Fan RPM", value: `${results.fanRpmAvg}`, sub: "chassis avg" })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { className: "mt-6", children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70", children: "System Summary" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 font-mono text-sm sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "CPU:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.cpu })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "GPU:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.gpu })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "RAM:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.ram })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "SSD:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.ssd })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Display:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.resolution })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Source:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: spec.source })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Bottleneck:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: results.bottleneck })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 flex justify-end", children: /* @__PURE__ */ jsx(NeonButton, { onClick: onFinish, children: "Finish →" }) })
    ] })
  ] });
}
function FpsCard({
  label,
  value,
  highlight
}) {
  return /* @__PURE__ */ jsxs(Panel, { className: highlight ? "animate-glow" : "", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-2 font-[Orbitron] font-black ${highlight ? "text-6xl text-primary neon-text" : "text-5xl text-foreground"}`, children: value }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-xs text-muted-foreground", children: "frames per second" })
  ] });
}
function StatCard({
  label,
  value,
  sub
}) {
  return /* @__PURE__ */ jsxs(Panel, { children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-2 font-[Orbitron] text-3xl font-bold text-primary neon-text", children: value }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-xs text-muted-foreground", children: sub })
  ] });
}
function DoneView({
  onAgain
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-[0.4em] text-primary/70", children: "// session complete" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-4 font-[Orbitron] text-5xl font-black text-primary neon-text animate-flicker", children: "BENCHMARK OK" }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 font-mono text-sm text-muted-foreground", children: "> Want to test another configuration? Restart from step 02." }),
      /* @__PURE__ */ jsx("div", { className: "mt-10", children: /* @__PURE__ */ jsx(NeonButton, { onClick: onAgain, children: "↻ Run New Benchmark" }) })
    ] })
  ] });
}
export {
  Index as component
};
