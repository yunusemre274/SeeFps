"""
SeeFps Backend — Detection Router
====================================
Detection App'ten gelen donanım verilerini karşılayan endpoint.

Akış:
  1. Detection App kullanıcının CPU/GPU bilgisini tarar
  2. POST /api/detect ile bu bilgileri Backend'e gönderir
  3. Backend, dataset'teki kayıtlarla eşleştirme yapar
  4. Eşleşme sonucunu ve session_id döndürür
  5. Frontend, session_id ile donanım bilgisini otomatik doldurur
"""

import uuid
from fastapi import APIRouter, HTTPException

from models.schemas import (
    DetectionPayload,
    DetectionResponse,
    DetectionMatchDetail,
)
from services.data_service import (
    match_hardware_to_dataset,
    get_available_hardware_names,
)

router = APIRouter(prefix="/api", tags=["Detection"])

# ─── Basit in-memory session store ───
# Görev 2.2 kapsamında: Üretimde Redis veya DB ile değiştirilecek.
_sessions: dict[str, dict] = {}


@router.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Donanım Tespiti",
    description=(
        "Detection App'ten gelen CPU/GPU bilgilerini dataset ile eşleştirir. "
        "Eşleşme başarılı ise bir session_id döndürür."
    ),
    responses={
        200: {"description": "Eşleşme sonucu (başarılı veya kısmi)"},
        422: {"description": "Geçersiz payload (validation hatası)"},
    },
)
async def detect_hardware(payload: DetectionPayload):
    """
    Detection App'ten gelen donanım bilgilerini dataset ile eşleştirir.

    Eşleşme Stratejisi:
      - Tam eşleşme (case-insensitive)
      - Kısmi eşleşme (contains)
      - Ters eşleşme (reverse contains)

    Başarılı eşleşmede session_id oluşturulur.
    Başarısız eşleşmede hangi bileşenin bulunamadığı ve
    mevcut seçenekler bildirilir.
    """
    # ─── Input sanitization ───
    cpu_name = payload.cpu_name.strip()
    gpu_name = payload.gpu_name.strip()

    if not cpu_name:
        raise HTTPException(status_code=422, detail="cpu_name boş olamaz")
    if not gpu_name:
        raise HTTPException(status_code=422, detail="gpu_name boş olamaz")

    # ─── Dataset ile eşleştirme ───
    match_result = match_hardware_to_dataset(cpu_name, gpu_name)

    # ─── Response oluştur ───
    cpu_detail = DetectionMatchDetail(
        matched=match_result["cpu_raw"] is not None,
        raw_value=match_result["cpu_raw"],
        display_name=match_result["cpu_display"],
    )

    gpu_detail = DetectionMatchDetail(
        matched=match_result["gpu_raw"] is not None,
        raw_value=match_result["gpu_raw"],
        display_name=match_result["gpu_display"],
    )

    # Session oluştur (sadece tam eşleşme varsa)
    session_id = None
    if match_result["matched"]:
        session_id = str(uuid.uuid4())
        _sessions[session_id] = {
            "cpu_raw": match_result["cpu_raw"],
            "gpu_raw": match_result["gpu_raw"],
            "cpu_display": match_result["cpu_display"],
            "gpu_display": match_result["gpu_display"],
            "ram": payload.ram_gb,
            "ssd": payload.ssd_type,
            "resolution": payload.resolution,
        }

    # Eşleşme başarısızsa mevcut donanım listesini ekle
    available = None
    if not match_result["matched"]:
        available = get_available_hardware_names()

    return DetectionResponse(
        success=match_result["matched"],
        session_id=session_id,
        cpu=cpu_detail,
        gpu=gpu_detail,
        ram=f"{payload.ram_gb} GB" if payload.ram_gb else None,
        ssd=payload.ssd_type,
        resolution=payload.resolution,
        errors=match_result["errors"],
        available_hardware=available,
    )


@router.get(
    "/detect/session/{session_id}",
    summary="Session Bilgisi",
    description="Daha önce oluşturulmuş bir detection session'ının bilgilerini döndürür.",
)
async def get_session(session_id: str):
    """Session'a ait donanım bilgilerini döndür."""
    if session_id not in _sessions:
        raise HTTPException(
            status_code=404,
            detail=f"Session bulunamadı: {session_id}",
        )
    session = _sessions[session_id]
    return {
        "success": True,
        "session_id": session_id,
        "hardware": session,
    }
