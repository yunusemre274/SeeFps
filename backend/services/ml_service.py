"""
SeeFps Backend — ML Inference Service
=======================================
predict_fps.py'deki ML fonksiyonlarını wrap eden adapter katmanı.

KURAL: ML inference mantığı yeniden YAZILMAZ.
predict_fps.py'deki `tahmin_et()` ve `load_model()` fonksiyonları
doğrudan import edilerek kullanılır.

Bu servis:
  - Model'i uygulama başlangıcında yükler (singleton)
  - tahmin_et() fonksiyonunu thread-safe bir şekilde çağırır
  - Sonuçları Backend response formatına dönüştürür
"""

import os
import sys
import threading

# ─── TrainedData modülünü import edilebilir yap ───
_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_SERVICES_DIR)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_TRAINED_DATA_DIR = os.path.join(_PROJECT_ROOT, "TrainedData")

if _TRAINED_DATA_DIR not in sys.path:
    sys.path.insert(0, _TRAINED_DATA_DIR)

from predict_fps import tahmin_et, load_model  # type: ignore[import-untyped]


# ─── Thread-safe Model Singleton ───

_model_lock = threading.Lock()
_model_loaded = False


def preload_model() -> None:
    """Uygulama başlangıcında modeli belleğe yükle."""
    global _model_loaded
    with _model_lock:
        if not _model_loaded:
            print("🧠 ML modeli yükleniyor...")
            load_model()
            _model_loaded = True
            print("✅ ML modeli hazır!")


def predict_fps(
    cpu_name: str,
    gpu_name: str,
    game_name: str,
    resolution: float = 1080.0,
    game_setting: str = "b'max'",
) -> dict:
    """
    FPS tahmini yapar.

    predict_fps.py'deki tahmin_et() fonksiyonunu çağırarak
    sonucu Backend response formatına dönüştürür.

    Parameters:
        cpu_name: İşlemci ismi (ör: "i9-9900K")
        gpu_name: Ekran kartı ismi (ör: "rtx 2080 ti")
        game_name: Oyun ismi (ör: "fortnite")
        resolution: Çözünürlük (ör: 1080.0)
        game_setting: Oyun ayarı (ör: "b'max'")

    Returns:
        {
            "success": True/False,
            "predicted_fps": 144.5,
            "error": None | "Hata mesajı"
        }
    """
    # Model yüklenmemişse yükle
    if not _model_loaded:
        preload_model()

    try:
        fps = tahmin_et(
            islemci_ismi=cpu_name,
            ekran_karti_ismi=gpu_name,
            oyun_ismi=game_name,
            oyun_cozunurlugu=resolution,
            oyun_ayari=game_setting,
        )

        if fps is None:
            return {
                "success": False,
                "predicted_fps": None,
                "error": (
                    f"'{cpu_name}' + '{gpu_name}' kombinasyonu "
                    "veritabanında bulunamadı."
                ),
            }

        return {
            "success": True,
            "predicted_fps": round(float(fps), 1),
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "predicted_fps": None,
            "error": f"ML inference hatası: {str(e)}",
        }
