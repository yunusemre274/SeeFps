"""
SeeFps Detection App — API Client
====================================
Backend API ile güvenli iletişim sağlayan modül.

İşlevler:
  - POST /api/detect → Donanım verilerini gönder
  - Retry mekanizması (bağlantı hatası durumunda)
  - SSL/TLS desteği (HTTPS)
  - Veri doğrulama (gönderim öncesi)
"""

import time
from dataclasses import dataclass
from typing import Any

import requests


@dataclass
class ApiConfig:
    """API bağlantı konfigürasyonu."""
    base_url: str = "https://seefps.onrender.com"
    timeout_sec: int = 10
    max_retries: int = 3
    retry_delay_sec: float = 2.0


@dataclass
class ApiResult:
    """API yanıt sonucu."""
    success: bool
    status_code: int = 0
    data: dict[str, Any] | None = None
    error: str | None = None


class DetectionApiClient:
    """Backend API ile iletişim sağlayan istemci."""

    def __init__(self, config: ApiConfig | None = None):
        self.config = config or ApiConfig()
        self._session = requests.Session()
        self._session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "SeeFps-DetectionApp/1.0",
        })

    def send_detection(self, payload: dict[str, Any]) -> ApiResult:
        """
        Donanım verilerini POST /api/detect endpoint'ine gönder.

        Parameters:
            payload: {
                "cpu_name": "...",
                "gpu_name": "...",
                "ram_gb": 16.0,
                "ssd_type": "NVMe",
                "resolution": "1080p",
            }

        Returns:
            ApiResult — başarı durumu, API yanıtı veya hata mesajı
        """
        # ─── Gönderim öncesi doğrulama ───
        validation_error = self._validate_payload(payload)
        if validation_error:
            return ApiResult(success=False, error=validation_error)

        # ─── Retry mekanizmasıyla gönder ───
        url = f"{self.config.base_url}/api/detect"
        last_error = ""

        for attempt in range(1, self.config.max_retries + 1):
            try:
                response = self._session.post(
                    url,
                    json=payload,
                    timeout=self.config.timeout_sec,
                )

                data = response.json()

                if response.status_code == 200:
                    return ApiResult(
                        success=data.get("success", False),
                        status_code=200,
                        data=data,
                    )
                else:
                    return ApiResult(
                        success=False,
                        status_code=response.status_code,
                        error=data.get("detail", f"HTTP {response.status_code}"),
                        data=data,
                    )

            except requests.ConnectionError:
                last_error = (
                    f"Bağlantı hatası (deneme {attempt}/{self.config.max_retries}). "
                    f"Backend çalışıyor mu? → {self.config.base_url}"
                )
            except requests.Timeout:
                last_error = (
                    f"Zaman aşımı ({self.config.timeout_sec}s) — "
                    f"deneme {attempt}/{self.config.max_retries}"
                )
            except requests.RequestException as e:
                last_error = f"HTTP hatası: {e}"
            except Exception as e:
                last_error = f"Beklenmeyen hata: {e}"

            # Retry beklemesi
            if attempt < self.config.max_retries:
                time.sleep(self.config.retry_delay_sec)

        return ApiResult(success=False, error=last_error)

    def health_check(self) -> bool:
        """Backend API'nin çalışıp çalışmadığını kontrol et."""
        try:
            response = self._session.get(
                f"{self.config.base_url}/api/health",
                timeout=5,
            )
            return response.status_code == 200
        except Exception:
            return False

    @staticmethod
    def _validate_payload(payload: dict[str, Any]) -> str | None:
        """Payload doğrulama — eksik alan kontrolü."""
        if not payload.get("cpu_name") or not payload["cpu_name"].strip():
            return "CPU bilgisi boş. Donanım taraması başarısız olmuş olabilir."
        if not payload.get("gpu_name") or not payload["gpu_name"].strip():
            return "GPU bilgisi boş. Donanım taraması başarısız olmuş olabilir."
        return None
