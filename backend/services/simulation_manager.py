"""
SeeFps Backend — Simulation Session Manager
=============================================
Benchmark oturumlarını yöneten merkezi servis.

Her benchmark için bir SimulationSession oluşturulur ve şu bilgileri tutar:
  - Donanım konfigürasyonu (CPU, GPU, oyun bilgisi)
  - Mevcut aşama (stage) ve ilerleme (progress)
  - Sonuçlar (tamamlandığında)
  - Bağlı WebSocket istemcileri

Bu servis, Simulation App → Backend → Frontend veri akışını yönetir.
"""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

from fastapi import WebSocket


# ─── Benchmark Aşamaları (Frontend useSimulationStatus.ts ile uyumlu) ───

SIMULATION_STAGES = [
    {"stage": "waiting_for_app",   "label": "Simulation App bekleniyor...",       "progress": 0},
    {"stage": "connecting",        "label": "Bağlantı kuruluyor...",             "progress": 5},
    {"stage": "initializing",      "label": "Ortam kuruluyor...",                "progress": 10},
    {"stage": "loading_textures",  "label": "Dokular yükleniyor...",             "progress": 20},
    {"stage": "compiling_shaders", "label": "Shader'lar derleniyor...",          "progress": 30},
    {"stage": "gpu_stress",        "label": "GPU yük testi...",                  "progress": 40},
    {"stage": "cpu_stress",        "label": "CPU yük testi...",                  "progress": 55},
    {"stage": "gameplay_sim",      "label": "Oyun simülasyonu koşturuluyor...",  "progress": 65},
    {"stage": "particle_fx",       "label": "Partikül & efekt testi...",         "progress": 78},
    {"stage": "thermal_analysis",  "label": "Sıcaklık analizi yapılıyor...",     "progress": 88},
    {"stage": "finalizing",        "label": "Sonuçlar hesaplanıyor...",          "progress": 95},
    {"stage": "completed",         "label": "Benchmark tamamlandı!",            "progress": 100},
]


@dataclass
class SimulationSession:
    """Bir benchmark oturumu."""
    session_id: str
    cpu_name: str
    gpu_name: str
    game_name: str
    resolution: float = 1080.0
    game_setting: str = "b'max'"

    # Durum
    stage: str = "waiting_for_app"
    progress: int = 0
    detail: str | None = None

    # Sonuçlar
    results: dict[str, Any] | None = None
    completed: bool = False
    error: str | None = None

    # Meta
    created_at: float = field(default_factory=time.time)

    # Bağlı WebSocket istemcileri
    websockets: list[WebSocket] = field(default_factory=list)


class SimulationManager:
    """
    Tüm aktif benchmark oturumlarını yöneten singleton yönetici.
    """

    _instance: "SimulationManager | None" = None
    _sessions: dict[str, SimulationSession]

    def __new__(cls) -> "SimulationManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._sessions = {}
        return cls._instance

    def create_session(
        self,
        cpu_name: str,
        gpu_name: str,
        game_name: str,
        resolution: float = 1080.0,
        game_setting: str = "b'max'",
    ) -> SimulationSession:
        """Yeni bir benchmark oturumu oluştur."""
        session_id = str(uuid.uuid4())
        session = SimulationSession(
            session_id=session_id,
            cpu_name=cpu_name,
            gpu_name=gpu_name,
            game_name=game_name,
            resolution=resolution,
            game_setting=game_setting,
        )
        self._sessions[session_id] = session
        print(f"📊 Yeni simulation session: {session_id}")
        return session

    def get_session(self, session_id: str) -> SimulationSession | None:
        """Session'ı ID ile getir."""
        return self._sessions.get(session_id)

    async def update_stage(
        self,
        session_id: str,
        stage: str,
        progress: int | None = None,
        detail: str | None = None,
    ) -> None:
        """
        Bir session'ın aşamasını güncelle ve bağlı WebSocket istemcilerine bildir.
        """
        session = self.get_session(session_id)
        if not session:
            return

        session.stage = stage
        if progress is not None:
            session.progress = progress
        else:
            # Aşama tanımından varsayılan progress'i al
            for s in SIMULATION_STAGES:
                if s["stage"] == stage:
                    session.progress = s["progress"]
                    break
        session.detail = detail

        # WebSocket istemcilerine bildir
        message = {
            "type": "stage_update",
            "stage": stage,
            "progress": session.progress,
            "detail": detail,
        }
        await self._broadcast(session, message)

    async def complete_session(
        self,
        session_id: str,
        results: dict[str, Any],
    ) -> None:
        """
        Bir session'ı tamamla, sonuçları kaydet ve istemcilere bildir.
        """
        session = self.get_session(session_id)
        if not session:
            return

        session.stage = "completed"
        session.progress = 100
        session.completed = True
        session.results = results

        # WebSocket istemcilerine bildir
        message = {
            "type": "completed",
            "stage": "completed",
            "progress": 100,
            "results": results,
        }
        await self._broadcast(session, message)
        print(f"✅ Simulation session tamamlandı: {session_id}")

    async def fail_session(
        self,
        session_id: str,
        error_message: str,
    ) -> None:
        """Bir session'ı hata ile sonlandır."""
        session = self.get_session(session_id)
        if not session:
            return

        session.stage = "error"
        session.error = error_message

        message = {
            "type": "error",
            "stage": "error",
            "message": error_message,
        }
        await self._broadcast(session, message)
        print(f"❌ Simulation session hatası: {session_id} — {error_message}")

    async def add_websocket(self, session_id: str, ws: WebSocket) -> None:
        """Bir WebSocket istemcisini session'a bağla."""
        session = self.get_session(session_id)
        if not session:
            return
        session.websockets.append(ws)

        # Mevcut durumu yeni bağlanan istemciye gönder
        await ws.send_json({
            "type": "stage_update",
            "stage": session.stage,
            "progress": session.progress,
            "detail": session.detail,
        })

        # Eğer zaten tamamlanmışsa sonuçları da gönder
        if session.completed and session.results:
            await ws.send_json({
                "type": "completed",
                "stage": "completed",
                "progress": 100,
                "results": session.results,
            })

    def remove_websocket(self, session_id: str, ws: WebSocket) -> None:
        """Bir WebSocket istemcisini session'dan kaldır."""
        session = self.get_session(session_id)
        if session and ws in session.websockets:
            session.websockets.remove(ws)

    async def _broadcast(self, session: SimulationSession, message: dict) -> None:
        """Tüm bağlı WebSocket istemcilerine mesaj gönder."""
        disconnected: list[WebSocket] = []
        for ws in session.websockets:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)

        # Kopmuş bağlantıları temizle
        for ws in disconnected:
            session.websockets.remove(ws)

    def get_session_status(self, session_id: str) -> dict | None:
        """Polling endpoint'i için session durumunu döndür."""
        session = self.get_session(session_id)
        if not session:
            return None

        return {
            "session_id": session_id,
            "stage": session.stage,
            "progress": session.progress,
            "detail": session.detail,
            "completed": session.completed,
            "results": session.results,
            "error": session.error,
        }


# ─── Singleton instance ───
simulation_manager = SimulationManager()
