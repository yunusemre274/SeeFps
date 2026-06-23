"""
SeeFps Backend — Pydantic Response Modelleri
=============================================
Frontend (apiService.ts / types.ts) API sözleşmesiyle birebir uyumlu
response şemaları.

Frontend beklentisi:
  { success: boolean, data: T[] }

Bu dosyadaki modeller bu yapıyı karşılar.
"""

from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")


# ─── Hardware Item ───

class HardwareItemResponse(BaseModel):
    """
    CPU, GPU, RAM, SSD ve Resolution listelerinin ortak elemanı.
    Frontend'teki CpuItem, GpuItem, RamItem, SsdItem, ResolutionItem ile uyumlu.
    """
    id: str
    name: str


# ─── Game & Map ───

class MapItemResponse(BaseModel):
    """
    Oyuna ait harita elemanı.
    Frontend'teki MapItem ile uyumlu.
    """
    id: str
    name: str


class GameItemResponse(BaseModel):
    """
    Oyun listesi elemanı.
    Frontend'teki GameItem ile uyumlu.
    """
    id: str
    name: str
    platform: str
    engine: str
    maps: list[MapItemResponse]


# ─── Generic API Wrapper ───

class ApiResponse(BaseModel, Generic[T]):
    """
    Tüm endpoint'lerin ortak response wrapper'ı.
    Frontend'teki ApiResponse<T> ile uyumlu.

    Kullanım:
        ApiResponse[HardwareItemResponse](success=True, data=[...])
    """
    success: bool = True
    data: list[T]


# ─── Detection Payload (Görev 2.2 için hazırlık) ───

class DetectionPayload(BaseModel):
    """
    Detection App'ten gelecek donanım bilgisi.
    Görev 2.2'de kullanılacak — şimdilik tanımlanıyor.
    """
    cpu_name: str
    gpu_name: str
    ram_gb: float | None = None
    ssd_type: str | None = None
    resolution: str | None = None


# ─── Prediction Request (Görev 2.3 için hazırlık) ───

class PredictionRequest(BaseModel):
    """
    FPS tahmin isteği.
    Görev 2.3'te kullanılacak — şimdilik tanımlanıyor.
    """
    cpu_name: str
    gpu_name: str
    game_name: str
    resolution: float = 1080.0
    game_setting: str = "b'max'"


class PredictionResponse(BaseModel):
    """FPS tahmin sonucu."""
    predicted_fps: float
    cpu_name: str
    gpu_name: str
    game_name: str
    resolution: float
    game_setting: str
