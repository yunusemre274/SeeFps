"""
SeeFps Backend — Hardware Router
=================================
CPU, GPU, RAM, SSD dropdown listelerini döndüren endpoint'ler.

Frontend endpoint beklentileri (apiService.ts):
  GET /api/hardware/cpus  → ApiResponse<CpuItem[]>
  GET /api/hardware/gpus  → ApiResponse<GpuItem[]>
  GET /api/hardware/rams  → ApiResponse<RamItem[]>
  GET /api/hardware/ssds  → ApiResponse<SsdItem[]>
"""

from fastapi import APIRouter

from models.schemas import HardwareItemResponse, ApiResponse
from services.data_service import (
    get_cpu_list,
    get_gpu_list,
    get_ram_options,
    get_ssd_options,
)

router = APIRouter(prefix="/api/hardware", tags=["Hardware"])


@router.get(
    "/cpus",
    response_model=ApiResponse[HardwareItemResponse],
    summary="CPU Listesi",
    description="Dataset'ten benzersiz CPU isimlerini döndürür.",
)
async def list_cpus():
    items = get_cpu_list()
    return ApiResponse(
        success=True,
        data=[HardwareItemResponse(**item) for item in items],
    )


@router.get(
    "/gpus",
    response_model=ApiResponse[HardwareItemResponse],
    summary="GPU Listesi",
    description="Dataset'ten benzersiz GPU isimlerini döndürür.",
)
async def list_gpus():
    items = get_gpu_list()
    return ApiResponse(
        success=True,
        data=[HardwareItemResponse(**item) for item in items],
    )


@router.get(
    "/rams",
    response_model=ApiResponse[HardwareItemResponse],
    summary="RAM Seçenekleri",
    description="Yaygın RAM konfigürasyonlarını döndürür.",
)
async def list_rams():
    items = get_ram_options()
    return ApiResponse(
        success=True,
        data=[HardwareItemResponse(**item) for item in items],
    )


@router.get(
    "/ssds",
    response_model=ApiResponse[HardwareItemResponse],
    summary="SSD Seçenekleri",
    description="Yaygın SSD konfigürasyonlarını döndürür.",
)
async def list_ssds():
    items = get_ssd_options()
    return ApiResponse(
        success=True,
        data=[HardwareItemResponse(**item) for item in items],
    )
