import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { X, Search, ChevronsUpDown, Check } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as Command$1 } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const Command = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1,
  {
    ref,
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = Command$1.displayName;
const CommandInput = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ jsx(
    Command$1.Input,
    {
      ref,
      className: cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = Command$1.Input.displayName;
const CommandList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.List,
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = Command$1.List.displayName;
const CommandEmpty = React.forwardRef((props, ref) => /* @__PURE__ */ jsx(Command$1.Empty, { ref, className: "py-6 text-center text-sm", ...props }));
CommandEmpty.displayName = Command$1.Empty.displayName;
const CommandGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Group,
  {
    ref,
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = Command$1.Group.displayName;
const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Separator,
  {
    ref,
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = Command$1.Separator.displayName;
const CommandItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    ),
    ...props
  }
));
CommandItem.displayName = Command$1.Item.displayName;
function NeonCombobox({
  label,
  placeholder = "Seçim yapın...",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı.",
  options,
  value,
  onChange,
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const displayValue = useMemo(() => {
    if (!value) return null;
    return value.length > 40 ? value.slice(0, 37) + "..." : value;
  }, [value]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx("label", { className: "block font-mono text-xs uppercase tracking-widest text-primary/70", children: label }),
    /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        "button",
        {
          role: "combobox",
          "aria-expanded": open,
          "aria-label": `${label} seçin`,
          disabled,
          className: cn(
            "flex w-full items-center justify-between",
            "border border-primary/30 bg-background/60 backdrop-blur-sm",
            "px-4 py-3 text-left font-mono text-sm",
            "transition-all duration-200",
            "hover:border-primary/60 hover:bg-background/80",
            "focus:outline-none focus:neon-border",
            "disabled:cursor-not-allowed disabled:opacity-40",
            open && "neon-border"
          ),
          children: [
            displayValue ? /* @__PURE__ */ jsx("span", { className: "text-foreground neon-text truncate", children: displayValue }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: placeholder }),
            /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 text-primary/50" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        PopoverContent,
        {
          className: cn(
            "w-[var(--radix-popover-trigger-width)] p-0",
            "border-primary/30 bg-card/95 backdrop-blur-md",
            "shadow-[0_0_20px_oklch(0.82_0.24_142/0.15)]"
          ),
          align: "start",
          children: /* @__PURE__ */ jsxs(
            Command,
            {
              className: "bg-transparent",
              filter: (value2, search) => {
                const normalizedValue = value2.toLocaleLowerCase("tr");
                const normalizedSearch = search.toLocaleLowerCase("tr");
                if (normalizedValue.includes(normalizedSearch)) return 1;
                return 0;
              },
              children: [
                /* @__PURE__ */ jsx(
                  CommandInput,
                  {
                    placeholder: searchPlaceholder,
                    className: "font-mono text-sm text-primary placeholder:text-muted-foreground"
                  }
                ),
                /* @__PURE__ */ jsxs(CommandList, { className: "max-h-[240px] scrollbar-thin", children: [
                  /* @__PURE__ */ jsx(CommandEmpty, { className: "py-4 text-center font-mono text-xs text-muted-foreground", children: emptyMessage }),
                  /* @__PURE__ */ jsx(CommandGroup, { children: options.map((option) => /* @__PURE__ */ jsxs(
                    CommandItem,
                    {
                      value: option,
                      onSelect: (currentValue) => {
                        onChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      },
                      className: cn(
                        "cursor-pointer font-mono text-sm transition-colors",
                        "aria-selected:bg-primary/10 aria-selected:text-primary",
                        value === option && "text-primary"
                      ),
                      children: [
                        /* @__PURE__ */ jsx(
                          Check,
                          {
                            className: cn(
                              "mr-2 h-3.5 w-3.5 text-primary",
                              value === option ? "opacity-100" : "opacity-0"
                            )
                          }
                        ),
                        /* @__PURE__ */ jsx("span", { className: "truncate", children: option })
                      ]
                    },
                    option
                  )) })
                ] })
              ]
            }
          )
        }
      )
    ] }),
    value && /* @__PURE__ */ jsxs("div", { className: "font-mono text-[10px] text-primary/50 truncate", children: [
      "> ",
      value
    ] })
  ] });
}
const BENCHMARK_STAGES = [
  { stage: "waiting_for_app", label: "Simulation App bekleniyor...", progress: 0 },
  { stage: "connecting", label: "Bağlantı kuruluyor...", progress: 5 },
  { stage: "initializing", label: "Ortam kuruluyor...", progress: 10 },
  { stage: "loading_textures", label: "Dokular yükleniyor...", progress: 20 },
  { stage: "compiling_shaders", label: "Shader'lar derleniyor...", progress: 30 },
  { stage: "gpu_stress", label: "GPU yük testi...", progress: 40 },
  { stage: "cpu_stress", label: "CPU yük testi...", progress: 55 },
  { stage: "gameplay_sim", label: "Oyun simülasyonu koşturuluyor...", progress: 65 },
  { stage: "particle_fx", label: "Partikül & efekt testi...", progress: 78 },
  { stage: "thermal_analysis", label: "Sıcaklık analizi yapılıyor...", progress: 88 },
  { stage: "finalizing", label: "Sonuçlar hesaplanıyor...", progress: 95 },
  { stage: "completed", label: "Benchmark tamamlandı!", progress: 100 }
];
const WS_BASE_URL = "ws://localhost:8000";
const POLLING_BASE_URL = "http://localhost:8000/api";
const TIMEOUT_SECONDS = 300;
const POLLING_INTERVAL_MS = 3e3;
const RECONNECT_DELAY_MS = 5e3;
function useSimulationStatus(sessionId, enabled = true, onComplete) {
  const [currentStage, setCurrentStage] = useState(BENCHMARK_STAGES[0]);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
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
            const stageInfo = BENCHMARK_STAGES.find((s) => s.stage === data.stage);
            if (stageInfo) {
              setCurrentStage({
                ...stageInfo,
                progress: data.progress ?? stageInfo.progress,
                detail: data.detail
              });
            }
          }
          if (data.type === "completed" && data.results) {
            const benchResults = data.results;
            setResults(benchResults);
            setCurrentStage(BENCHMARK_STAGES[BENCHMARK_STAGES.length - 1]);
            onCompleteRef.current?.(benchResults);
          }
          if (data.type === "error") {
            setErrorMessage(data.message ?? "Bilinmeyen bir hata oluştu.");
            setCurrentStage({ stage: "error", label: "Hata!", progress: currentStage.progress });
          }
        } catch {
        }
      };
      ws.onerror = () => {
        setConnectionStatus("error");
        startPolling();
      };
      ws.onclose = () => {
        if (connectionStatus === "connected") {
          setTimeout(connectWebSocket, RECONNECT_DELAY_MS);
        }
        setConnectionStatus("disconnected");
      };
    } catch {
      setConnectionStatus("error");
      startPolling();
    }
  }, [sessionId, enabled]);
  const startPolling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(async () => {
      if (!sessionId) return;
      try {
        const response = await fetch(
          `${POLLING_BASE_URL}/simulation/status/${sessionId}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.stage) {
          const stageInfo = BENCHMARK_STAGES.find((s) => s.stage === data.stage);
          if (stageInfo) {
            setCurrentStage({
              ...stageInfo,
              progress: data.progress ?? stageInfo.progress,
              detail: data.detail
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
      }
    }, POLLING_INTERVAL_MS);
  }, [sessionId]);
  useEffect(() => {
    if (!enabled) return;
    startTimeRef.current = Date.now();
    elapsedRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1e3);
      setElapsedSeconds(elapsed);
      if (elapsed >= TIMEOUT_SECONDS) {
        setCurrentStage({ stage: "timeout", label: "Zaman aşımı!", progress: currentStage.progress });
        setErrorMessage(
          `Benchmark ${TIMEOUT_SECONDS} saniye içinde tamamlanamadı. Simulation App'in çalıştığından emin olun.`
        );
      }
    }, 1e3);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [enabled]);
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
  useEffect(() => {
    if (!enabled || currentStage.stage === "completed" || currentStage.stage === "error") return;
    const handler = (e) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, currentStage.stage]);
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
    estimatedRemainingSeconds
  };
}
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function connectionBadge(status) {
  switch (status) {
    case "connected":
      return { color: "text-primary", text: "CONNECTED" };
    case "connecting":
      return { color: "text-yellow-400", text: "CONNECTING..." };
    case "error":
      return { color: "text-destructive", text: "OFFLINE" };
    default:
      return { color: "text-muted-foreground", text: "WAITING" };
  }
}
function stageIcon(stage) {
  switch (stage) {
    case "waiting_for_app":
      return "◎";
    case "connecting":
      return "◐";
    case "initializing":
      return "⚙";
    case "loading_textures":
      return "▦";
    case "compiling_shaders":
      return "◈";
    case "gpu_stress":
      return "⊕";
    case "cpu_stress":
      return "⊗";
    case "gameplay_sim":
      return "🎮";
    case "particle_fx":
      return "✦";
    case "thermal_analysis":
      return "🌡";
    case "finalizing":
      return "◉";
    case "completed":
      return "✓";
    case "error":
      return "✗";
    case "timeout":
      return "⏱";
    default:
      return "·";
  }
}
function AnalyzingScreen({ spec, game, onDone }) {
  const [sessionId] = useState(() => `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const {
    currentStage,
    errorMessage,
    connectionStatus,
    elapsedSeconds,
    estimatedRemainingSeconds
  } = useSimulationStatus(sessionId, true, onDone);
  const [logLines, setLogLines] = useState([
    `[sys] benchmark session initialized: ${sessionId}`,
    `[sys] target: ${game.game.name} // map: ${game.map}`,
    `[sys] config: ${spec.cpu} | ${spec.gpu}`,
    `[sys] awaiting Desktop Simulation App connection...`
  ]);
  const logEndRef = useRef(null);
  useEffect(() => {
    if (currentStage.stage !== "waiting_for_app") {
      const icon = stageIcon(currentStage.stage);
      setLogLines((prev) => [
        ...prev,
        `[${icon}] ${currentStage.label}${currentStage.detail ? ` — ${currentStage.detail}` : ""}`
      ]);
    }
  }, [currentStage.stage]);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);
  const badge = connectionBadge(connectionStatus);
  const isWaiting = currentStage.stage === "waiting_for_app";
  const isError = currentStage.stage === "error" || currentStage.stage === "timeout";
  const isCompleted = currentStage.stage === "completed";
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-6 py-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-1", children: "step 04" }),
        /* @__PURE__ */ jsx("h2", { className: "font-[Orbitron] text-3xl font-bold uppercase tracking-wide text-primary neon-text sm:text-4xl", children: isWaiting ? "Awaiting Simulation" : isCompleted ? "Complete" : "Analyzing..." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxs("div", { className: `font-mono text-xs uppercase tracking-widest ${badge.color}`, children: [
          "● ",
          badge.text
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "font-mono text-xs text-muted-foreground mt-1", children: [
          formatTime(elapsedSeconds),
          estimatedRemainingSeconds != null && /* @__PURE__ */ jsxs("span", { children: [
            " / ~",
            formatTime(estimatedRemainingSeconds),
            " remaining"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "mb-6 font-mono text-sm text-muted-foreground", children: [
      "> rendering ",
      /* @__PURE__ */ jsx("span", { className: "text-primary", children: game.game.name }),
      " ",
      "// map: ",
      /* @__PURE__ */ jsx("span", { className: "text-primary", children: game.map }),
      " ",
      "// engine: ",
      /* @__PURE__ */ jsx("span", { className: "text-primary", children: game.game.engine })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative bg-card/80 backdrop-blur-sm border border-primary/30 p-0 overflow-hidden", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary z-10" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary z-10" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary z-10" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary z-10" }),
          /* @__PURE__ */ jsxs("div", { className: "relative aspect-video w-full overflow-hidden bg-background", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute inset-0",
                style: {
                  background: isError ? "radial-gradient(ellipse at 50% 50%, oklch(0.35 0.18 25 / 0.4) 0%, transparent 60%), linear-gradient(180deg, #1a0000 0%, #000 100%)" : "radial-gradient(ellipse at 30% 70%, oklch(0.35 0.18 145 / 0.7) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, oklch(0.5 0.22 142 / 0.5) 0%, transparent 60%), linear-gradient(180deg, #001a0c 0%, #000 100%)"
                }
              }
            ),
            /* @__PURE__ */ jsxs("svg", { className: "absolute inset-0 h-full w-full", viewBox: "0 0 800 450", preserveAspectRatio: "none", children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "g-analyzing", x1: "0", x2: "0", y1: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0", stopColor: "oklch(0.82 0.24 142)", stopOpacity: "0.0" }),
                /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "oklch(0.82 0.24 142)", stopOpacity: "0.5" })
              ] }) }),
              Array.from({ length: 14 }).map((_, i) => /* @__PURE__ */ jsx("line", { x1: "0", y1: 300 + i * 12, x2: "800", y2: 300 + i * 12, stroke: "oklch(0.5 0.2 145 / 0.3)" }, `h${i}`)),
              Array.from({ length: 20 }).map((_, i) => {
                const x = 400 + (i - 10) * 80;
                return /* @__PURE__ */ jsx("line", { x1: 400, y1: "300", x2: x, y2: "450", stroke: "oklch(0.5 0.2 145 / 0.3)" }, `v${i}`);
              }),
              /* @__PURE__ */ jsx("rect", { x: "80", y: "180", width: "100", height: "120", fill: "url(#g-analyzing)", stroke: "oklch(0.82 0.24 142)" }),
              /* @__PURE__ */ jsx("rect", { x: "220", y: "140", width: "120", height: "160", fill: "url(#g-analyzing)", stroke: "oklch(0.82 0.24 142)" }),
              /* @__PURE__ */ jsx("rect", { x: "480", y: "160", width: "100", height: "140", fill: "url(#g-analyzing)", stroke: "oklch(0.82 0.24 142)" }),
              /* @__PURE__ */ jsx("rect", { x: "620", y: "200", width: "120", height: "100", fill: "url(#g-analyzing)", stroke: "oklch(0.82 0.24 142)" }),
              /* @__PURE__ */ jsxs("g", { stroke: "oklch(0.92 0.2 142)", strokeWidth: "1.5", children: [
                /* @__PURE__ */ jsx("line", { x1: "400", y1: "210", x2: "400", y2: "240" }),
                /* @__PURE__ */ jsx("line", { x1: "400", y1: "270", x2: "400", y2: "300" }),
                /* @__PURE__ */ jsx("line", { x1: "370", y1: "255", x2: "395", y2: "255" }),
                /* @__PURE__ */ jsx("line", { x1: "405", y1: "255", x2: "430", y2: "255" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute left-3 top-3 font-mono text-xs text-primary neon-text", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold", children: [
                stageIcon(currentStage.stage),
                " ",
                currentStage.stage === "waiting_for_app" ? "STANDBY" : `${Math.round(currentStage.progress)}%`
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-primary/70", children: currentStage.label })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute right-3 top-3 font-mono text-xs text-primary/80", children: game.game.name.toUpperCase() }),
            /* @__PURE__ */ jsxs("div", { className: "absolute left-3 bottom-3 right-3 font-mono text-[10px] text-primary/80", children: [
              currentStage.label.toUpperCase(),
              " ",
              /* @__PURE__ */ jsx("span", { className: "animate-blink", children: "_" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "scanlines absolute inset-0" }),
            isWaiting && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "font-[Orbitron] text-xl font-bold text-primary neon-text animate-flicker", children: "AWAITING CONNECTION" }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 font-mono text-xs text-primary/60", children: "Simulation App'i başlatın..." })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-2 w-full overflow-hidden border-t border-primary/30 bg-background", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full transition-all duration-500 ease-out",
              style: {
                width: `${currentStage.progress}%`,
                background: isError ? "oklch(0.65 0.25 25)" : "linear-gradient(90deg, oklch(0.82 0.24 142), oklch(0.92 0.20 145))",
                boxShadow: isError ? "0 0 10px oklch(0.65 0.25 25 / 0.6)" : "0 0 10px oklch(0.82 0.24 142 / 0.6)"
              }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-3", children: "benchmark stages" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2", children: BENCHMARK_STAGES.filter((s) => s.stage !== "waiting_for_app").slice(0, -1).map((stage) => {
            const isCurrent = stage.stage === currentStage.stage;
            const isPast = stage.progress < currentStage.progress;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: `
                      px-2 py-1.5 text-center font-mono text-[10px] uppercase border transition-all duration-300
                      ${isCurrent ? "border-primary bg-primary/15 text-primary neon-text animate-glow" : isPast ? "border-primary/30 bg-primary/5 text-primary/60" : "border-primary/10 text-muted-foreground"}
                    `,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs mb-0.5", children: stageIcon(stage.stage) }),
                  /* @__PURE__ */ jsx("div", { className: "truncate", children: stage.label.replace("...", "") })
                ]
              },
              stage.stage
            );
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-2", children: "event log" }),
          /* @__PURE__ */ jsxs("div", { className: "h-48 overflow-y-auto bg-background/60 p-3 font-mono text-[11px] text-primary space-y-0.5", children: [
            logLines.map((line, i) => /* @__PURE__ */ jsxs("div", { className: "text-primary/80", children: [
              "> ",
              line
            ] }, i)),
            /* @__PURE__ */ jsx("div", { ref: logEndRef }),
            /* @__PURE__ */ jsx("div", { className: "animate-blink text-primary/50", children: "> _" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-2", children: "config" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-1 font-mono text-xs", children: [
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
        ] }),
        isWaiting && /* @__PURE__ */ jsxs("div", { className: "relative bg-card/80 backdrop-blur-sm border border-primary/30 p-4", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-primary/70 mb-2", children: "info" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 font-mono text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              "> ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: "SeeFps Simulation App" }),
              "'i bilgisayarınıza indirip çalıştırın."
            ] }),
            /* @__PURE__ */ jsx("p", { children: "> Benchmark sonuçları otomatik olarak bu sayfaya gönderilecektir." })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: true,
              className: "mt-3 w-full px-4 py-2 font-mono text-xs uppercase tracking-widest bg-primary/10 border border-primary/30 text-primary/50 cursor-not-allowed",
              children: "↓ Simulation App İndir (Yakında)"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-[10px] text-muted-foreground text-center", children: "Phase 4 tamamlandığında aktif olacaktır." })
        ] }),
        isError && errorMessage && /* @__PURE__ */ jsxs("div", { className: "relative bg-card/80 backdrop-blur-sm border border-destructive/50 p-4", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-destructive" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-destructive" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-destructive" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-destructive" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-destructive/70 mb-2", children: "// error" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-destructive", children: errorMessage })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "font-mono text-[10px] text-muted-foreground text-center", children: [
          "user input ",
          /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "DISABLED" }),
          " during benchmark"
        ] })
      ] })
    ] })
  ] });
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
      step === "benchmark" && spec && game && /* @__PURE__ */ jsx(BenchmarkAnalyzing, { spec, game, onDone: (r) => {
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
        /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(NeonCombobox, { label: "CPU / Processor", placeholder: "CPU seçin...", searchPlaceholder: "CPU modeli ara...", emptyMessage: "Bu CPU modeli bulunamadı.", options: cpuNames, value: cpu, onChange: setCpu }),
          /* @__PURE__ */ jsx(NeonCombobox, { label: "GPU / Graphics Card", placeholder: "GPU seçin...", searchPlaceholder: "GPU modeli ara...", emptyMessage: "Bu GPU modeli bulunamadı.", options: gpuNames, value: gpu, onChange: setGpu }),
          /* @__PURE__ */ jsx(NeonCombobox, { label: "RAM", placeholder: "RAM seçin...", searchPlaceholder: "RAM ara...", emptyMessage: "Bu RAM seçeneği bulunamadı.", options: ramNames, value: ram, onChange: setRam }),
          /* @__PURE__ */ jsx(NeonCombobox, { label: "SSD Speed", placeholder: "SSD seçin...", searchPlaceholder: "SSD ara...", emptyMessage: "Bu SSD seçeneği bulunamadı.", options: ssdNames, value: ssd, onChange: setSsd }),
          /* @__PURE__ */ jsx(NeonCombobox, { label: "Screen Resolution", placeholder: "Çözünürlük seçin...", searchPlaceholder: "Çözünürlük ara...", emptyMessage: "Bu çözünürlük bulunamadı.", options: resNames, value: resolution, onChange: setResolution })
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
            /* @__PURE__ */ jsx(NeonCombobox, { label: "Platform", placeholder: "Platform seçin...", searchPlaceholder: "Platform ara...", emptyMessage: "Platform bulunamadı.", options: platforms, value: selectedPlatform, onChange: (v) => {
              setSelectedPlatform(v);
              setSelectedGameId("");
              setSelectedMap("");
            } }),
            /* @__PURE__ */ jsx(NeonCombobox, { label: "Game", placeholder: "Oyun seçin...", searchPlaceholder: "Oyun adı ara...", emptyMessage: "Bu oyun bulunamadı.", options: platformGames.map((g) => g.name), value: selectedGame?.name ?? "", onChange: (v) => {
              const g = platformGames.find((pg) => pg.name === v);
              if (g) {
                setSelectedGameId(g.id);
                setSelectedMap("");
              }
            } }),
            /* @__PURE__ */ jsx(NeonCombobox, { label: "Map", placeholder: "Harita seçin...", searchPlaceholder: "Harita ara...", emptyMessage: "Harita bulunamadı.", options: maps, value: selectedMap, onChange: setSelectedMap })
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
function BenchmarkAnalyzing({
  spec,
  game,
  onDone
}) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx(AnalyzingScreen, { spec, game, onDone })
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
