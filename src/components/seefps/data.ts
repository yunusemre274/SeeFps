export const CPUS = [
  "Intel Core i3-12100F",
  "Intel Core i5-12400F",
  "Intel Core i5-13600K",
  "Intel Core i7-13700K",
  "Intel Core i9-14900K",
  "AMD Ryzen 5 5600X",
  "AMD Ryzen 5 7600X",
  "AMD Ryzen 7 5800X3D",
  "AMD Ryzen 7 7800X3D",
  "AMD Ryzen 9 7950X3D",
];

export const GPUS = [
  "NVIDIA GTX 1660 Super",
  "NVIDIA RTX 3060",
  "NVIDIA RTX 3070",
  "NVIDIA RTX 4060 Ti",
  "NVIDIA RTX 4070 Super",
  "NVIDIA RTX 4080 Super",
  "NVIDIA RTX 4090",
  "AMD RX 6700 XT",
  "AMD RX 7800 XT",
  "AMD RX 7900 XTX",
];

export const RAMS = ["8 GB DDR4", "16 GB DDR4 3200", "32 GB DDR4 3600", "32 GB DDR5 6000", "64 GB DDR5 6400"];
export const SSDS = ["SATA SSD 550 MB/s", "NVMe Gen3 3500 MB/s", "NVMe Gen4 7000 MB/s", "NVMe Gen5 12000 MB/s"];
export const RESOLUTIONS = ["1080p (1920x1080)", "1440p (2560x1440)", "4K (3840x2160)"];

export type Platform = { id: string; name: string; games: Game[] };
export type Game = { id: string; name: string; maps: string[]; engine: string; weight: number };

export const PLATFORMS: Platform[] = [
  {
    id: "steam",
    name: "Steam",
    games: [
      { id: "cs2", name: "Counter-Strike 2", engine: "Source 2", weight: 0.9, maps: ["Dust II", "Mirage", "Inferno", "Nuke", "Ancient"] },
      { id: "dota2", name: "Dota 2", engine: "Source 2", weight: 1.0, maps: ["Radiant", "Dire"] },
      { id: "apex", name: "Apex Legends", engine: "Source", weight: 0.7, maps: ["Kings Canyon", "World's Edge", "Storm Point"] },
    ],
  },
  {
    id: "riot",
    name: "Riot Client",
    games: [
      { id: "valorant", name: "VALORANT", engine: "Unreal Engine 4", weight: 1.1, maps: ["Bind", "Haven", "Ascent", "Split", "Lotus"] },
      { id: "lol", name: "League of Legends", engine: "Custom Riot Engine", weight: 1.2, maps: ["Summoner's Rift", "ARAM Howling Abyss"] },
    ],
  },
  {
    id: "epic",
    name: "Epic Games",
    games: [
      { id: "fortnite", name: "Fortnite", engine: "Unreal Engine 5", weight: 0.6, maps: ["Battle Royale Island", "Zero Build", "Creative Hub"] },
      { id: "rocket", name: "Rocket League", engine: "Unreal Engine 3", weight: 1.3, maps: ["DFH Stadium", "Mannfield", "Champions Field"] },
    ],
  },
  {
    id: "ea",
    name: "EA App",
    games: [
      { id: "bf2042", name: "Battlefield 2042", engine: "Frostbite", weight: 0.55, maps: ["Kaleidoscope", "Manifest", "Orbital"] },
      { id: "fc24", name: "EA Sports FC 24", engine: "Frostbite", weight: 1.0, maps: ["Old Trafford", "Camp Nou"] },
    ],
  },
  {
    id: "xbox",
    name: "Xbox / Microsoft",
    games: [
      { id: "forza", name: "Forza Horizon 5", engine: "ForzaTech", weight: 0.7, maps: ["Mexico Open World", "Hot Wheels DLC"] },
      { id: "starfield", name: "Starfield", engine: "Creation Engine 2", weight: 0.45, maps: ["New Atlantis", "Akila City"] },
    ],
  },
];

// rough perf weights
export function cpuScore(cpu: string) {
  const i = CPUS.indexOf(cpu);
  return 0.6 + (i / (CPUS.length - 1)) * 1.4; // 0.6..2.0
}
export function gpuScore(gpu: string) {
  const i = GPUS.indexOf(gpu);
  return 0.5 + (i / (GPUS.length - 1)) * 2.5; // 0.5..3.0
}
export function ramScore(r: string) { return 0.7 + RAMS.indexOf(r) * 0.12; }
export function ssdScore(s: string) { return 0.9 + SSDS.indexOf(s) * 0.05; }
export function resScore(r: string) { return [1.2, 0.9, 0.55][RESOLUTIONS.indexOf(r)] ?? 1; }