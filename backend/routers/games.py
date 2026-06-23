"""
SeeFps Backend — Games Router
==============================
Oyun, harita ve çözünürlük listelerini döndüren endpoint'ler.

Frontend endpoint beklentileri (apiService.ts):
  GET /api/games              → ApiResponse<GameItem[]>
  GET /api/games/{game_id}/maps → ApiResponse<MapItem[]>
  GET /api/resolutions        → ApiResponse<ResolutionItem[]>
"""

from fastapi import APIRouter, HTTPException

from models.schemas import (
    HardwareItemResponse,
    GameItemResponse,
    MapItemResponse,
    ApiResponse,
)
from services.data_service import (
    get_game_list,
    get_game_maps,
    get_resolution_list,
)

router = APIRouter(prefix="/api", tags=["Games"])


@router.get(
    "/games",
    response_model=ApiResponse[GameItemResponse],
    summary="Oyun Listesi",
    description="Dataset'ten benzersiz oyun isimlerini, platform, engine ve harita bilgileriyle döndürür.",
)
async def list_games():
    items = get_game_list()
    games = []
    for item in items:
        maps = [MapItemResponse(**m) for m in item["maps"]]
        games.append(GameItemResponse(
            id=item["id"],
            name=item["name"],
            platform=item["platform"],
            engine=item["engine"],
            maps=maps,
        ))
    return ApiResponse(success=True, data=games)


@router.get(
    "/games/{game_id}/maps",
    response_model=ApiResponse[MapItemResponse],
    summary="Oyun Haritaları",
    description="Belirli bir oyunun harita listesini döndürür.",
)
async def list_game_maps(game_id: str):
    maps_data = get_game_maps(game_id)
    if not maps_data:
        raise HTTPException(status_code=404, detail=f"Oyun bulunamadı: {game_id}")
    maps = [MapItemResponse(**m) for m in maps_data]
    return ApiResponse(success=True, data=maps)


@router.get(
    "/resolutions",
    response_model=ApiResponse[HardwareItemResponse],
    summary="Çözünürlük Listesi",
    description="Dataset'ten desteklenen çözünürlükleri döndürür.",
)
async def list_resolutions():
    items = get_resolution_list()
    return ApiResponse(
        success=True,
        data=[HardwareItemResponse(**item) for item in items],
    )
