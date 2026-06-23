"""
SeeFps Backend — Simulation Router
=====================================
Simulation App ↔ Backend ↔ Frontend veri akışını yöneten endpoint'ler.

Endpoint'ler:
  POST /api/simulation/start       → Yeni benchmark session başlat
  POST /api/simulation/results     → Simulation App'ten sonuç al
  POST /api/simulation/stage       → Simulation App'ten aşama güncelle
  GET  /api/simulation/status/{id} → Polling: mevcut durumu döndür
  WS   /ws/simulation/{id}        → WebSocket: canlı durum akışı

Akış:
  1. Frontend POST /api/simulation/start → session_id alır
  2. Frontend WS /ws/simulation/{session_id} ile bağlanır
  3. Simulation App her aşamayı POST /api/simulation/stage ile günceller
  4. Backend her güncellemeyi WebSocket ile Frontend'e push eder
  5. Simulation App bitince POST /api/simulation/results ile sonuçları gönderir
  6. Backend ML prediction yapar ve sonuçları Frontend'e push eder
"""

import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from models.schemas import PredictionRequest
from services.ml_service import predict_fps
from services.simulation_manager import simulation_manager, SIMULATION_STAGES

router = APIRouter(tags=["Simulation"])


# ─── Request/Response Modelleri ───

class SimulationStartRequest(BaseModel):
    """Yeni simulation session başlatma isteği."""
    cpu_name: str
    gpu_name: str
    game_name: str
    resolution: float = 1080.0
    game_setting: str = "b'max'"


class SimulationStageUpdate(BaseModel):
    """Simulation App'ten gelen aşama güncellemesi."""
    session_id: str
    stage: str
    progress: int | None = None
    detail: str | None = None


class SimulationResultPayload(BaseModel):
    """Simulation App'ten gelen benchmark sonuçları."""
    session_id: str
    avg_fps: float | None = None
    max_fps: float | None = None
    min_fps: float | None = None
    fps_timeline: list[float] = []
    cpu_temp_avg: float | None = None
    gpu_temp_avg: float | None = None
    cpu_clock_avg: float | None = None
    gpu_clock_avg: float | None = None
    fan_rpm_avg: float | None = None
    bottleneck: str | None = None
    benchmark_duration_sec: float | None = None


# ─── REST Endpoint'ler ───

@router.post(
    "/api/simulation/start",
    summary="Benchmark Başlat",
    description="Yeni bir simulation session oluşturur ve session_id döndürür.",
)
async def start_simulation(request: SimulationStartRequest):
    """Yeni benchmark session oluştur."""
    session = simulation_manager.create_session(
        cpu_name=request.cpu_name,
        gpu_name=request.gpu_name,
        game_name=request.game_name,
        resolution=request.resolution,
        game_setting=request.game_setting,
    )

    return {
        "success": True,
        "session_id": session.session_id,
        "message": "Simulation session oluşturuldu. WebSocket ile bağlanın veya polling yapın.",
        "websocket_url": f"/ws/simulation/{session.session_id}",
        "polling_url": f"/api/simulation/status/{session.session_id}",
    }


@router.post(
    "/api/simulation/stage",
    summary="Aşama Güncelle",
    description="Simulation App'ten gelen aşama güncellemesini işler ve WebSocket istemcilerine bildirir.",
)
async def update_simulation_stage(update: SimulationStageUpdate):
    """Simulation App'ten gelen aşama güncellemesini işle."""
    session = simulation_manager.get_session(update.session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session bulunamadı: {update.session_id}")

    # Geçerli aşama mı kontrol et
    valid_stages = [s["stage"] for s in SIMULATION_STAGES]
    if update.stage not in valid_stages:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz aşama: '{update.stage}'. Geçerli aşamalar: {valid_stages}",
        )

    await simulation_manager.update_stage(
        session_id=update.session_id,
        stage=update.stage,
        progress=update.progress,
        detail=update.detail,
    )

    return {"success": True, "stage": update.stage, "progress": session.progress}


@router.post(
    "/api/simulation/results",
    summary="Benchmark Sonuçları",
    description=(
        "Simulation App'ten gelen benchmark sonuçlarını alır, "
        "ML prediction ile tahmini FPS ekler ve WebSocket istemcilerine bildirir."
    ),
)
async def submit_simulation_results(payload: SimulationResultPayload):
    """
    Simulation App'ten gelen sonuçları işle.

    1. Sonuçları validate et
    2. ML prediction ile tahmini FPS hesapla
    3. Sonuçları session'a kaydet
    4. WebSocket ile Frontend'e bildir
    """
    session = simulation_manager.get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session bulunamadı: {payload.session_id}")

    # ML Prediction — predict_fps.py'deki tahmin_et() fonksiyonunu çağır
    ml_result = predict_fps(
        cpu_name=session.cpu_name,
        gpu_name=session.gpu_name,
        game_name=session.game_name,
        resolution=session.resolution,
        game_setting=session.game_setting,
    )

    # Sonuçları birleştir
    # Simulation App'ten gelen veriler + ML tahmini
    predicted_fps = ml_result.get("predicted_fps")

    results = {
        "avgFps": payload.avg_fps or predicted_fps or 0,
        "maxFps": payload.max_fps or (predicted_fps * 1.2 if predicted_fps else 0),
        "minFps": payload.min_fps or (predicted_fps * 0.8 if predicted_fps else 0),
        "fpsTimeline": payload.fps_timeline or [],
        "cpuTempAvg": payload.cpu_temp_avg or 72.0,
        "gpuTempAvg": payload.gpu_temp_avg or 78.0,
        "cpuClockAvg": payload.cpu_clock_avg or 4200.0,
        "gpuClockAvg": payload.gpu_clock_avg or 1800.0,
        "fanRpmAvg": payload.fan_rpm_avg or 1400.0,
        "bottleneck": payload.bottleneck or _determine_bottleneck(
            payload.cpu_temp_avg, payload.gpu_temp_avg
        ),
        "benchmarkDurationSec": payload.benchmark_duration_sec or 120.0,
        "mlPredictedFps": predicted_fps,
        "mlError": ml_result.get("error"),
    }

    # Session'ı tamamla ve WebSocket ile bildir
    await simulation_manager.complete_session(payload.session_id, results)

    return {
        "success": True,
        "session_id": payload.session_id,
        "results": results,
    }


@router.get(
    "/api/simulation/status/{session_id}",
    summary="Simulation Durumu (Polling)",
    description="Mevcut simulation durumunu döndürür. WebSocket kullanılamazsa polling fallback olarak kullanılır.",
)
async def get_simulation_status(session_id: str):
    """Polling endpoint — session'ın mevcut durumunu döndür."""
    status = simulation_manager.get_session_status(session_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Session bulunamadı: {session_id}")
    return status


# ─── WebSocket Endpoint ───

@router.websocket("/ws/simulation/{session_id}")
async def websocket_simulation(websocket: WebSocket, session_id: str):
    """
    Frontend'e canlı benchmark durumu akışı.

    Frontend useSimulationStatus.ts hook'u bu endpoint'e bağlanır ve
    gerçek zamanlı aşama güncellemelerini alır.

    Mesaj formatı (Frontend'in beklediği):
      { "type": "stage_update", "stage": "gpu_stress", "progress": 40, "detail": "..." }
      { "type": "completed", "stage": "completed", "progress": 100, "results": {...} }
      { "type": "error", "stage": "error", "message": "Hata mesajı" }
    """
    await websocket.accept()

    session = simulation_manager.get_session(session_id)
    if not session:
        await websocket.send_json({
            "type": "error",
            "message": f"Session bulunamadı: {session_id}",
        })
        await websocket.close()
        return

    # Session'a WebSocket'i ekle
    await simulation_manager.add_websocket(session_id, websocket)
    print(f"🔌 WebSocket bağlandı: {session_id}")

    try:
        # Bağlantıyı açık tut — mesaj bekleme döngüsü
        while True:
            # Frontend'ten gelen mesajları dinle (ping/pong veya cancel)
            data = await websocket.receive_text()

            # İsteğe bağlı: Frontend "cancel" komutu gönderebilir
            if data == "cancel":
                await simulation_manager.fail_session(
                    session_id, "Benchmark kullanıcı tarafından iptal edildi."
                )
                break

    except WebSocketDisconnect:
        print(f"🔌 WebSocket koptu: {session_id}")
    finally:
        simulation_manager.remove_websocket(session_id, websocket)


# ─── Yardımcı fonksiyonlar ───

def _determine_bottleneck(
    cpu_temp: float | None,
    gpu_temp: float | None,
) -> str:
    """Basit bottleneck tahmini — sıcaklığa göre."""
    if cpu_temp is None or gpu_temp is None:
        return "balanced"
    if cpu_temp > gpu_temp + 10:
        return "CPU"
    elif gpu_temp > cpu_temp + 10:
        return "GPU"
    return "balanced"
