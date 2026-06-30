#!/usr/bin/env python3
"""
SeeFps — Phase 5: End-to-End Entegrasyon Testi
=================================================
Tüm katmanları test eden kapsamlı E2E test script'i.
"""

import json
import time
import sys
import asyncio
import concurrent.futures
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BASE_URL = "http://localhost:8000"
PASS = "✅"
FAIL = "❌"
WARN = "⚠️"

results = {"passed": 0, "failed": 0, "warnings": 0}


def test(name: str, condition: bool, detail: str = ""):
    if condition:
        results["passed"] += 1
        print(f"  {PASS} {name}")
    else:
        results["failed"] += 1
        print(f"  {FAIL} {name} — {detail}")


def api_get(path: str) -> dict | None:
    try:
        req = Request(f"{BASE_URL}{path}")
        resp = urlopen(req, timeout=10)
        return json.loads(resp.read())
    except Exception:
        return None


def api_post(path: str, data: dict) -> tuple[int, dict | None]:
    try:
        req = Request(
            f"{BASE_URL}{path}",
            data=json.dumps(data).encode(),
            headers={"Content-Type": "application/json"},
        )
        resp = urlopen(req, timeout=10)
        return resp.status, json.loads(resp.read())
    except HTTPError as e:
        try:
            body = json.loads(e.read())
        except Exception:
            body = None
        return e.code, body
    except Exception:
        return 0, None


# ═══════════════════════════════════════════
# TEST 1: Backend API Temel Sağlık
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 1: Backend API — Temel Sağlık Kontrolleri")
print("=" * 60)

health = api_get("/api/health")
test("GET /api/health → 200", health is not None and health.get("status") == "ok")


# ═══════════════════════════════════════════
# TEST 2: Frontend → Backend — Dropdown'lar
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 2: Frontend → Backend — Dropdown Verileri")
print("=" * 60)

# CPU listesi
cpus_resp = api_get("/api/hardware/cpus")
cpus = cpus_resp.get("data", []) if cpus_resp else []
test("GET /api/hardware/cpus → veri dönüyor", len(cpus) > 0)
test(f"  CPU sayısı ≥ 10", len(cpus) >= 10, f"Bulunan: {len(cpus)}")

# GPU listesi
gpus_resp = api_get("/api/hardware/gpus")
gpus = gpus_resp.get("data", []) if gpus_resp else []
test("GET /api/hardware/gpus → veri dönüyor", len(gpus) > 0)
test(f"  GPU sayısı ≥ 10", len(gpus) >= 10, f"Bulunan: {len(gpus)}")

# RAM listesi
rams_resp = api_get("/api/hardware/rams")
rams = rams_resp.get("data", []) if rams_resp else []
test("GET /api/hardware/rams → veri dönüyor", len(rams) > 0)

# SSD listesi
ssds_resp = api_get("/api/hardware/ssds")
ssds = ssds_resp.get("data", []) if ssds_resp else []
test("GET /api/hardware/ssds → veri dönüyor", len(ssds) > 0)

# Oyun listesi
games_resp = api_get("/api/games")
games = games_resp.get("data", []) if games_resp else []
test("GET /api/games → veri dönüyor", len(games) > 0)
test(f"  Oyun sayısı ≥ 5", len(games) >= 5, f"Bulunan: {len(games)}")

if games:
    first_game = games[0]
    game_id = first_game.get("id", "")
    maps_resp = api_get(f"/api/games/{game_id}/maps")
    maps = maps_resp.get("data", []) if maps_resp and isinstance(maps_resp, dict) else (maps_resp if isinstance(maps_resp, list) else [])
    test(f"  GET /api/games/{game_id}/maps → haritalar", len(maps) > 0)

# Çözünürlükler
res_resp = api_get("/api/resolutions")
test("GET /api/resolutions → veri dönüyor", res_resp is not None)


# ═══════════════════════════════════════════
# TEST 3: Detection App → Backend Akışı
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 3: Detection App → Backend — Donanım Eşleştirme")
print("=" * 60)

# Başarılı eşleşme
status, detect_resp = api_post("/api/detect", {
    "cpu_name": "i9-9900K",
    "gpu_name": "rtx 2080 ti",
    "ram_gb": 32.0,
    "ssd_type": "NVMe",
    "resolution": "1080p",
})
test("POST /api/detect → 200", status == 200)
test("  Eşleşme başarılı", detect_resp is not None and detect_resp.get("success") is True)
if detect_resp and detect_resp.get("success"):
    test("  Session ID döndü", detect_resp.get("session_id") is not None)
    test("  CPU eşleşti", detect_resp.get("cpu", {}).get("matched") is True)
    test("  GPU eşleşti", detect_resp.get("gpu", {}).get("matched") is True)

# Başarısız eşleşme
status2, detect_fail = api_post("/api/detect", {
    "cpu_name": "Apple M5 Ultra",
    "gpu_name": "AMD 9800X3D",
    "ram_gb": 128,
    "ssd_type": "NVMe",
    "resolution": "2160p",
})
test("POST /api/detect (bilinmeyen donanım) → 200", status2 == 200)
test("  Eşleşme başarısız (beklenen)", detect_fail is not None and detect_fail.get("success") is False)
test("  Hata mesajları var", detect_fail is not None and len(detect_fail.get("errors", [])) > 0)
test("  Mevcut donanım listesi var", detect_fail is not None and detect_fail.get("available_hardware") is not None)


# ═══════════════════════════════════════════
# TEST 4: Simulation App → Backend Akışı
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 4: Simulation App → Backend — Benchmark Akışı")
print("=" * 60)

status3, session_resp = api_post("/api/simulation/start", {
    "cpu_name": "i9-9900K",
    "gpu_name": "rtx 2080 ti",
    "game_name": "b'fortnite'",
    "resolution": 1080.0,
})
test("POST /api/simulation/start → 200", status3 == 200)
session_id = session_resp.get("session_id") if session_resp else None
test("  Session ID döndü", session_id is not None)

if session_id:
    stages = ["initializing", "compiling_shaders", "gpu_stress", "cpu_stress", "gameplay_sim"]
    for stage in stages:
        s, _ = api_post("/api/simulation/stage", {
            "session_id": session_id, "stage": stage, "progress": 50, "detail": f"Test: {stage}",
        })
        test(f"  Aşama ({stage}) → 200", s == 200)

    poll = api_get(f"/api/simulation/status/{session_id}")
    test("  Polling durumu doğru", poll is not None and poll.get("stage") == "gameplay_sim")

    status4, result_resp = api_post("/api/simulation/results", {
        "session_id": session_id,
        "avg_fps": 142.5, "max_fps": 165.0, "min_fps": 118.0,
        "fps_timeline": [120.0, 135.5, 142.0, 155.0, 148.0],
        "cpu_temp_avg": 68.0, "gpu_temp_avg": 75.0,
        "cpu_clock_avg": 4200.0, "gpu_clock_avg": 1800.0,
        "fan_rpm_avg": 1400.0, "bottleneck": "GPU",
        "benchmark_duration_sec": 45.0,
    })
    test("POST /api/simulation/results → 200", status4 == 200)
    ml_fps = result_resp.get("results", {}).get("mlPredictedFps") if result_resp else None
    test(f"  ML prediction döndü ({ml_fps})", ml_fps is not None and ml_fps > 0)

    poll2 = api_get(f"/api/simulation/status/{session_id}")
    test("  Session completed", poll2 is not None and poll2.get("completed") is True)


# ═══════════════════════════════════════════
# TEST 5: Hata Senaryoları
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 5: Hata Senaryoları")
print("=" * 60)

s404, _ = api_post("/api/simulation/stage", {
    "session_id": "nonexistent-session-id", "stage": "gpu_stress",
})
test("Var olmayan session → 404", s404 == 404)

_, new_resp = api_post("/api/simulation/start", {
    "cpu_name": "test", "gpu_name": "test", "game_name": "test",
})
new_sid = new_resp.get("session_id") if new_resp else None
if new_sid:
    s400, _ = api_post("/api/simulation/stage", {
        "session_id": new_sid, "stage": "invalid_stage_name",
    })
    test("Geçersiz aşama → 400", s400 == 400)

poll404_resp = api_get("/api/simulation/status/nonexistent-id")
test("Var olmayan session polling → null/404", poll404_resp is None)


# ═══════════════════════════════════════════
# TEST 6: Eşzamanlı Kullanıcı (5 paralel)
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 6: Eşzamanlı Kullanıcı Senaryosu (5 paralel)")
print("=" * 60)

def concurrent_sim(uid: int) -> bool:
    try:
        _, sess = api_post("/api/simulation/start", {
            "cpu_name": "i9-9900K", "gpu_name": "rtx 2080 ti", "game_name": "b'fortnite'",
        })
        if not sess: return False
        sid = sess["session_id"]
        api_post("/api/simulation/stage", {"session_id": sid, "stage": "gpu_stress"})
        s, r = api_post("/api/simulation/results", {
            "session_id": sid, "avg_fps": 100 + uid * 10, "max_fps": 150, "min_fps": 80,
        })
        return s == 200 and r and r.get("success")
    except Exception:
        return False

start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(concurrent_sim, i) for i in range(5)]
    conc_results = [f.result() for f in concurrent.futures.as_completed(futures)]
elapsed = time.time() - start

test("5 paralel kullanıcı — hepsi başarılı", all(conc_results), f"{conc_results}")
test(f"  Süre < 10s ({elapsed:.1f}s)", elapsed < 10)


# ═══════════════════════════════════════════
# TEST 7: WebSocket
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  TEST 7: WebSocket Bağlantı Testi")
print("=" * 60)

try:
    import websockets

    async def test_ws():
        _, sess = api_post("/api/simulation/start", {
            "cpu_name": "Ryzen 7 3700X", "gpu_name": "rtx 2070", "game_name": "b'csgo'",
        })
        sid = sess["session_id"]
        async with websockets.connect(f"ws://localhost:8000/ws/simulation/{sid}") as ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            ok1 = json.loads(msg).get("stage") == "waiting_for_app"
            api_post("/api/simulation/stage", {"session_id": sid, "stage": "gpu_stress"})
            msg2 = await asyncio.wait_for(ws.recv(), timeout=5)
            ok2 = json.loads(msg2).get("stage") == "gpu_stress"
            return ok1 and ok2

    test("WebSocket mesaj alışverişi", asyncio.run(test_ws()))
except ImportError:
    print(f"  {WARN} websockets kütüphanesi yok — atlandı")
    results["warnings"] += 1
except Exception as e:
    test("WebSocket testi", False, str(e))


# ═══════════════════════════════════════════
# SONUÇ
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("  📊 E2E TEST SONUÇLARI")
print("=" * 60)
total = results["passed"] + results["failed"]
print(f"\n  {PASS} Başarılı:  {results['passed']}/{total}")
print(f"  {FAIL} Başarısız: {results['failed']}/{total}")
if results["warnings"]:
    print(f"  {WARN} Uyarı:     {results['warnings']}")
pct = results['passed'] / total * 100 if total else 0
print(f"\n  Başarı oranı: {pct:.0f}%\n")
if results["failed"] == 0:
    print("  🎉 TÜM TESTLER BAŞARILI!\n")
else:
    print(f"  ⚠️  {results['failed']} test başarısız.\n")
sys.exit(0 if results["failed"] == 0 else 1)
