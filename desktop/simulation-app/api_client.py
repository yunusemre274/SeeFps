"""
SeeFps Simulation App — Backend API Client
=============================================
Backend API ile iletişim sağlayan modül.

İşlevler:
  - POST /api/simulation/start   → Session başlat
  - POST /api/simulation/stage   → Aşama güncelle
  - POST /api/simulation/results → Sonuçları gönder
  - Retry mekanizması
"""

import time
from dataclasses import dataclass
from typing import Any

import requests


@dataclass
class ApiConfig:
    """API bağlantı konfigürasyonu."""
    base_url: str = "http://localhost:8000"
    timeout_sec: int = 15
    max_retries: int = 3
    retry_delay_sec: float = 2.0


class SimulationApiClient:
    """Backend Simulation API ile iletişim sağlayan istemci."""

    def __init__(self, config: ApiConfig | None = None):
        self.config = config or ApiConfig()
        self._session = requests.Session()
        self._session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "SeeFps-SimulationApp/1.0",
        })

    def health_check(self) -> bool:
        """Backend API'nin çalışıp çalışmadığını kontrol et."""
        try:
            r = self._session.get(f"{self.config.base_url}/api/health", timeout=5)
            return r.status_code == 200
        except Exception:
            return False

    def start_session(
        self,
        cpu_name: str,
        gpu_name: str,
        game_name: str,
        resolution: float = 1080.0,
        game_setting: str = "b'max'",
    ) -> dict[str, Any] | None:
        """POST /api/simulation/start → Session başlat."""
        return self._post("/api/simulation/start", {
            "cpu_name": cpu_name,
            "gpu_name": gpu_name,
            "game_name": game_name,
            "resolution": resolution,
            "game_setting": game_setting,
        })

    def update_stage(
        self,
        session_id: str,
        stage: str,
        progress: int | None = None,
        detail: str | None = None,
    ) -> dict[str, Any] | None:
        """POST /api/simulation/stage → Aşama güncelle."""
        payload: dict[str, Any] = {
            "session_id": session_id,
            "stage": stage,
        }
        if progress is not None:
            payload["progress"] = progress
        if detail is not None:
            payload["detail"] = detail
        return self._post("/api/simulation/stage", payload)

    def submit_results(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        """POST /api/simulation/results → Sonuçları gönder."""
        return self._post("/api/simulation/results", payload)

    def _post(self, path: str, data: dict) -> dict[str, Any] | None:
        """Retry mekanizması ile POST request gönder."""
        url = f"{self.config.base_url}{path}"

        for attempt in range(1, self.config.max_retries + 1):
            try:
                r = self._session.post(url, json=data, timeout=self.config.timeout_sec)
                if r.status_code == 200:
                    return r.json()
                else:
                    print(f"  ⚠️  API hatası: HTTP {r.status_code} — {r.text[:200]}")
                    return None
            except requests.ConnectionError:
                if attempt < self.config.max_retries:
                    time.sleep(self.config.retry_delay_sec)
                else:
                    print(f"  ❌ Bağlantı hatası (tüm denemeler başarısız): {url}")
            except Exception as e:
                print(f"  ❌ Beklenmeyen hata: {e}")
                return None
        return None
