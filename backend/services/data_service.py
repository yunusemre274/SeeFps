"""
SeeFps Backend — Data Service
==============================
Dataset'ten dropdown verileri çeken merkezi veri servisi.

Veri Kaynağı: TrainedData/predict_fps.py → load_and_prepare_data()
Bu servis predict_fps.py'yi import ederek temizlenmiş dataset'i yükler
ve Frontend dropdown'larını besleyecek verileri hazırlar.

Singleton pattern: Dataset uygulama başlangıcında bir kez yüklenir
ve bellekte tutulur. Her istekte CSV okuma yapılmaz.
"""

import os
import re
import sys

import pandas as pd

# ─── TrainedData modülünü import edilebilir yap ───
_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))   # backend/services/
_BACKEND_DIR = os.path.dirname(_SERVICES_DIR)                # backend/
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)                # SeeFps/
_TRAINED_DATA_DIR = os.path.join(_PROJECT_ROOT, "TrainedData")

# TrainedData dizinini Python path'ine ekle
if _TRAINED_DATA_DIR not in sys.path:
    sys.path.insert(0, _TRAINED_DATA_DIR)

# predict_fps.py'den gerekli fonksiyonları import et
from predict_fps import load_and_prepare_data, DATA_PATH  # type: ignore[import-untyped]


# ─── Byte-string temizleyici ───

def _clean_value(val: str) -> str:
    """
    Dataset'teki b'...' byte-string formatını temizler.

    Örnekler:
        "b'Intel Core i9-9900K'"  → "Intel Core i9-9900K"
        "b'fortnite'"             → "fortnite"
        "b'nvidia geforce rtx 2080 ti'" → "NVIDIA GeForce RTX 2080 Ti"
    """
    if not isinstance(val, str):
        return str(val)

    # b'...' pattern'ini temizle
    cleaned = re.sub(r"^b'(.*)'$", r"\1", val.strip())
    cleaned = re.sub(r'^b"(.*)"$', r"\1", cleaned)
    return cleaned.strip()


def _format_gpu_name(raw: str) -> str:
    """GPU isimlerini düzgün formatla (title case + NVIDIA/AMD büyük harf)."""
    cleaned = _clean_value(raw)
    # Title case uygula
    formatted = cleaned.title()
    # Marka düzeltmeleri
    formatted = formatted.replace("Nvidia", "NVIDIA")
    formatted = formatted.replace("Amd", "AMD")
    formatted = formatted.replace("Geforce", "GeForce")
    formatted = formatted.replace("Radeon", "Radeon")
    # Seri numarası düzeltmeleri (Rtx → RTX, Gtx → GTX, Rx → RX)
    formatted = re.sub(r'\bRtx\b', 'RTX', formatted)
    formatted = re.sub(r'\bGtx\b', 'GTX', formatted)
    formatted = re.sub(r'\bRx\b', 'RX', formatted)
    formatted = re.sub(r'\bXt\b', 'XT', formatted)
    formatted = re.sub(r'\bTi\b', 'Ti', formatted)
    return formatted


def _format_cpu_name(raw: str) -> str:
    """CPU isimlerini düzgün formatla."""
    cleaned = _clean_value(raw)
    return cleaned


def _format_game_name(raw: str) -> str:
    """Oyun isimlerini camelCase → İnsan okunabilir formata dönüştür."""
    cleaned = _clean_value(raw)

    # camelCase → spaced: "callOfDutyWW2" → "call Of Duty WW2"
    spaced = re.sub(r'([a-z])([A-Z])', r'\1 \2', cleaned)

    # Title case
    formatted = spaced.title()

    # Bilinen oyun ismi düzeltmeleri
    corrections = {
        "Callofduty": "Call of Duty",
        "Call Of Duty": "Call of Duty",
        "Csgo": "CS:GO",
        "Cs Go": "CS:GO",
        "Dota2": "Dota 2",
        "Dota 2": "Dota 2",
        "Gta V": "GTA V",
        "Gtav": "GTA V",
        "Pubg": "PUBG",
        "Wow": "WoW",
        "Ww2": "WW2",
        "Ww 2": "WW2",
    }
    for old, new in corrections.items():
        formatted = formatted.replace(old, new)

    return formatted


def _slugify(name: str) -> str:
    """İsimden URL-uyumlu ID oluştur."""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


# ─── Oyun → Harita eşleştirme tablosu ───
# Dataset'te ayrı map kolonu olmadığından, her oyun için mantıksal haritalar atanıyor.

_GAME_MAPS: dict[str, list[str]] = {
    "awayout": ["Prison Escape", "Hospital"],
    "airmechstrike": ["Default Arena"],
    "apexlegends": ["World's Edge", "Storm Point", "Kings Canyon"],
    "battlefield4": ["Operation Metro", "Siege of Shanghai", "Golmud Railway"],
    "battletech": ["Default Map"],
    "callofdutyww2": ["Normandy Beach", "Pointe Du Hoc", "Ardennes Forest"],
    "counterstrikeglobaloffensive": ["Dust II", "Mirage", "Inferno"],
    "destiny2": ["The Tower", "Europa", "Savathun's Throne World"],
    "dota2": ["Default Map"],
    "farcry5": ["Hope County", "Holland Valley"],
    "fortnite": ["Battle Royale Island", "Zero Build Arena"],
    "frostpunk": ["The City", "Default Map"],
    "grandtheftauto5": ["Los Santos", "Blaine County", "Online Freemode"],
    "leagueoflegends": ["Summoner's Rift", "ARAM Bridge"],
    "overwatch": ["King's Row", "Hanamura", "Ilios"],
    "pathofexile": ["Wraeclast", "Oriath"],
    "playerunknownsbattlegrounds": ["Erangel", "Miramar", "Sanhok"],
    "radicalheights": ["Battle Royale Island"],
    "rainbowsixsiege": ["House", "Oregon", "Clubhouse"],
    "seaofthieves": ["Open Seas", "Devil's Roar"],
    "starcraft2": ["Default Map", "Ladder Map"],
    "totalwar3kingdoms": ["China Map", "Default Campaign"],
    "warframe": ["Orbiter", "Plains of Eidolon"],
    "worldoftanks": ["Himmelsdorf", "Prokhorovka", "Malinovka"],
}


# ─── Singleton Dataset Cache ───

class _DatasetCache:
    """Dataset'i bellekte tutan singleton sınıf."""

    _instance: "_DatasetCache | None" = None
    _df: pd.DataFrame | None = None

    def __new__(cls) -> "_DatasetCache":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self) -> pd.DataFrame:
        """Dataset'i yükle (ilk çağrıda) veya cache'ten döndür."""
        if self._df is None:
            print("📦 Dataset yükleniyor ve ön-işleniyor...")
            self._df = load_and_prepare_data(DATA_PATH)
            print(f"✅ Dataset yüklendi: {self._df.shape[0]} satır, {self._df.shape[1]} kolon")
        return self._df

    def get_df(self) -> pd.DataFrame:
        """Cache'teki DataFrame'i döndür. Yüklenmemişse yükle."""
        return self.load()


_cache = _DatasetCache()


# ─── Public API ───

def load_dataset() -> None:
    """Uygulama başlangıcında dataset'i belleğe yükle."""
    _cache.load()


def get_cpu_list() -> list[dict[str, str]]:
    """Dataset'ten benzersiz CPU listesini döndür."""
    df = _cache.get_df()
    raw_values = df["cpuname"].dropna().unique().tolist()
    items = []
    for raw in sorted(raw_values):
        name = _format_cpu_name(raw)
        items.append({"id": _slugify(name), "name": name})
    return items


def get_gpu_list() -> list[dict[str, str]]:
    """Dataset'ten benzersiz GPU listesini döndür."""
    df = _cache.get_df()
    raw_values = df["gpuname"].dropna().unique().tolist()
    items = []
    for raw in sorted(raw_values):
        name = _format_gpu_name(raw)
        items.append({"id": _slugify(name), "name": name})
    return items


def get_ram_options() -> list[dict[str, str]]:
    """
    Sabit RAM seçenekleri döndür.
    Dataset'te ayrı RAM kolonu bulunmadığından, yaygın konfigürasyonlar sunuluyor.
    """
    options = [
        {"id": "8gb-ddr4",  "name": "8 GB DDR4"},
        {"id": "16gb-ddr4", "name": "16 GB DDR4"},
        {"id": "32gb-ddr4", "name": "32 GB DDR4"},
        {"id": "64gb-ddr4", "name": "64 GB DDR4"},
        {"id": "16gb-ddr5", "name": "16 GB DDR5"},
        {"id": "32gb-ddr5", "name": "32 GB DDR5"},
        {"id": "64gb-ddr5", "name": "64 GB DDR5"},
    ]
    return options


def get_ssd_options() -> list[dict[str, str]]:
    """
    Sabit SSD seçenekleri döndür.
    Dataset'te ayrı SSD kolonu bulunmadığından, yaygın konfigürasyonlar sunuluyor.
    """
    options = [
        {"id": "256gb-sata", "name": "256 GB SATA SSD"},
        {"id": "512gb-sata", "name": "512 GB SATA SSD"},
        {"id": "512gb-nvme", "name": "512 GB NVMe Gen3"},
        {"id": "1tb-nvme-gen3", "name": "1 TB NVMe Gen3"},
        {"id": "1tb-nvme-gen4", "name": "1 TB NVMe Gen4"},
        {"id": "2tb-nvme-gen4", "name": "2 TB NVMe Gen4"},
    ]
    return options


def get_resolution_list() -> list[dict[str, str]]:
    """Dataset'ten benzersiz çözünürlük listesini döndür."""
    df = _cache.get_df()
    raw_values = sorted(df["gameresolution"].dropna().unique().tolist())
    items = []
    # Çözünürlük değerleri float (1080.0 vb.) — okunabilir isimlere dönüştür
    resolution_names = {
        720.0: "720p (HD)",
        1080.0: "1080p (Full HD)",
        1440.0: "1440p (2K QHD)",
        2160.0: "2160p (4K UHD)",
    }
    for val in raw_values:
        name = resolution_names.get(float(val), f"{int(val)}p")
        items.append({"id": f"{int(val)}p", "name": name})
    return items


def get_game_list() -> list[dict[str, str | list]]:
    """
    Dataset'ten benzersiz oyun listesini döndür.
    Her oyuna platform, engine ve map bilgileri eklenir.
    """
    df = _cache.get_df()
    raw_values = df["gamename"].dropna().unique().tolist()
    items = []

    for raw in sorted(raw_values):
        cleaned = _clean_value(raw)
        display_name = _format_game_name(raw)
        game_id = _slugify(display_name)

        # Harita eşleştirmesi — cleaned (lowercase) ile kontrol et
        map_key = cleaned.lower().replace(" ", "")
        game_maps = _GAME_MAPS.get(map_key, ["Default Map"])

        maps = [
            {"id": _slugify(m), "name": m}
            for m in game_maps
        ]

        items.append({
            "id": game_id,
            "name": display_name,
            "platform": "PC",  # Dataset sadece PC verisi içeriyor
            "engine": _guess_engine(cleaned),
            "maps": maps,
        })

    return items


def get_game_maps(game_id: str) -> list[dict[str, str]]:
    """Belirli bir oyunun harita listesini döndür."""
    games = get_game_list()
    for game in games:
        if game["id"] == game_id:
            return game["maps"]  # type: ignore[return-value]
    return [{"id": "default-map", "name": "Default Map"}]


def _guess_engine(game_name_cleaned: str) -> str:
    """Oyun ismine göre tahmini motor bilgisi döndür."""
    engine_map = {
        "awayout": "Unreal Engine 4",
        "airmechstrike": "Carbon Engine",
        "apexlegends": "Source Engine",
        "battlefield4": "Frostbite 3",
        "battletech": "Unity",
        "callofdutyww2": "IW Engine",
        "counterstrikeglobaloffensive": "Source Engine",
        "destiny2": "Tiger Engine",
        "dota2": "Source 2",
        "farcry5": "Dunia Engine",
        "fortnite": "Unreal Engine 4",
        "frostpunk": "Unity",
        "grandtheftauto5": "RAGE Engine",
        "leagueoflegends": "Riot Engine",
        "overwatch": "Blizzard Engine",
        "pathofexile": "GGG Engine",
        "playerunknownsbattlegrounds": "Unreal Engine 4",
        "radicalheights": "Unreal Engine 4",
        "rainbowsixsiege": "AnvilNext 2.0",
        "seaofthieves": "Unreal Engine 4",
        "starcraft2": "Blizzard Engine",
        "totalwar3kingdoms": "Warscape Engine",
        "warframe": "Evolution Engine",
        "worldoftanks": "Core Engine",
    }
    key = game_name_cleaned.lower().replace(" ", "")
    return engine_map.get(key, "Unknown")
