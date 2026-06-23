"""
SeeFps Backend — FastAPI Ana Sunucu
=====================================
Tüm API endpoint'lerini barındıran giriş noktası.

Çalıştırma:
    cd backend
    uvicorn server:app --reload --port 8000

Swagger UI:
    http://localhost:8000/docs

DIKKAT: Bu dosya server.py olarak adlandırılmıştır.
        TrainedData/main.py (veri temizleme betiği) ile çakışmayı önlemek için
        main.py kullanılMAMALIDIR. (CLAUDE.md §Kural 10)
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import hardware, games
from services.data_service import load_dataset

# .env dosyasını yükle (varsa)
load_dotenv()


# ─── Lifespan: Uygulama başlangıcında dataset'i yükle ───

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Uygulama başlarken dataset'i belleğe yükler.
    Uygulama kapanırken temizlik yapar.
    """
    # Startup
    print("🚀 SeeFps Backend başlatılıyor...")
    load_dataset()
    print("✅ Dataset yüklendi, API hazır!")
    print("📖 Swagger UI: http://localhost:8000/docs")
    yield
    # Shutdown
    print("🛑 SeeFps Backend kapatılıyor...")


# ─── FastAPI App ───

app = FastAPI(
    title="SeeFps API",
    description=(
        "SeeFps — Sanal FPS Benchmark Platformu API.\n\n"
        "Donanım bilgileri, oyun listeleri ve benchmark sonuçları "
        "için endpoint'ler sağlar.\n\n"
        "**Veri Kaynağı:** Eğitilmiş ML dataset'i (`main_merged.csv`)\n"
        "**ML Model:** MLPRegressor (R² = 0.9997)"
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ─── CORS Middleware ───

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Router'ları ekle ───

app.include_router(hardware.router)
app.include_router(games.router)


# ─── Health Check ───

@app.get("/api/health", tags=["System"])
async def health_check():
    """API sağlık kontrolü."""
    return {"status": "ok", "service": "seefps-backend", "version": "1.0.0"}


# ─── Doğrudan çalıştırma ───

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host=host, port=port, reload=True)
