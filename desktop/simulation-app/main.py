#!/usr/bin/env python3
"""
SeeFps Simulation App — Ana Uygulama
=======================================
Sanal benchmark simülasyonu çalıştırarak sonuçları
Backend API'ye gönderen masaüstü uygulaması.

Kullanım:
    python main.py --cpu "i9-9900K" --gpu "rtx 2080 ti" --game "fortnite"
    python main.py --cpu "Ryzen 7 3700X" --gpu "gtx 1660 ti" --game "csgo" --map "dust-ii"
    python main.py --dry-run --cpu "test" --gpu "test" --game "test"

Akış:
    1. Backend'e session başlat (POST /api/simulation/start)
    2. Sanal benchmark çalıştır (9 sahne, ~44 saniye)
    3. Her aşamayı Backend'e raporla (POST /api/simulation/stage)
    4. Sonuçları Backend'e gönder (POST /api/simulation/results)
    5. Backend ML prediction yapar ve Frontend'e push eder
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn
    from rich.live import Live
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

from benchmark_engine import SimulationEngine, BenchmarkResult
from api_client import SimulationApiClient, ApiConfig


# ─── Logging ───

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f"simulation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
    ],
)
logger = logging.getLogger("SeeFps.Simulation")

console = Console() if HAS_RICH else None


# ─── UI Helpers ───

def print_banner():
    """Uygulama başlık banner'ı."""
    if console:
        console.print(Panel.fit(
            "[bold magenta]🎮  SeeFps — Simulation App  v1.0[/]\n"
            "[dim]Sanal Benchmark Simülasyonu[/]",
            border_style="magenta",
        ))
    else:
        print("\n╔══════════════════════════════════════╗")
        print("║  🎮  SeeFps — Simulation App  v1.0  ║")
        print("╚══════════════════════════════════════╝\n")


def print_config(cpu: str, gpu: str, game: str, map_id: str, engine: str):
    """Benchmark konfigürasyonunu göster."""
    if console:
        table = Table(title="📋 Benchmark Konfigürasyonu", show_header=False, border_style="cyan")
        table.add_column("Alan", style="bold", width=12)
        table.add_column("Değer", style="green")
        table.add_row("CPU", cpu)
        table.add_row("GPU", gpu)
        table.add_row("Oyun", game)
        table.add_row("Harita", map_id)
        table.add_row("Motor", engine)
        console.print(table)
    else:
        print(f"  CPU:    {cpu}")
        print(f"  GPU:    {gpu}")
        print(f"  Oyun:   {game}")
        print(f"  Harita: {map_id}")
        print(f"  Motor:  {engine}")


def print_results(result: BenchmarkResult):
    """Benchmark sonuçlarını göster."""
    if console:
        table = Table(title="📊 Benchmark Sonuçları", show_header=True, header_style="bold green")
        table.add_column("Metrik", style="bold", width=18)
        table.add_column("Değer", style="cyan", justify="right")
        table.add_column("Birim", style="dim")

        table.add_row("Ortalama FPS", f"{result.avg_fps:.1f}", "fps")
        table.add_row("Maksimum FPS", f"{result.max_fps:.1f}", "fps")
        table.add_row("Minimum FPS", f"{result.min_fps:.1f}", "fps")
        table.add_row("─" * 16, "─" * 8, "─" * 6)
        table.add_row("CPU Sıcaklık", f"{result.cpu_temp_avg:.1f}", "°C")
        table.add_row("GPU Sıcaklık", f"{result.gpu_temp_avg:.1f}", "°C")
        table.add_row("CPU Clock", f"{result.cpu_clock_avg:.0f}", "MHz")
        table.add_row("GPU Clock", f"{result.gpu_clock_avg:.0f}", "MHz")
        table.add_row("Fan RPM", f"{result.fan_rpm_avg:.0f}", "RPM")
        table.add_row("─" * 16, "─" * 8, "─" * 6)
        table.add_row("Bottleneck", result.bottleneck, "")
        table.add_row("Süre", f"{result.benchmark_duration_sec:.1f}", "saniye")

        console.print(table)
    else:
        print(f"\n📊 Benchmark Sonuçları:")
        print(f"  Ort. FPS: {result.avg_fps:.1f}")
        print(f"  Max FPS:  {result.max_fps:.1f}")
        print(f"  Min FPS:  {result.min_fps:.1f}")
        print(f"  CPU Temp: {result.cpu_temp_avg:.1f}°C")
        print(f"  GPU Temp: {result.gpu_temp_avg:.1f}°C")
        print(f"  Bottleneck: {result.bottleneck}")


# ─── Ana Akış ───

def run(
    cpu_name: str,
    gpu_name: str,
    game_name: str,
    map_id: str = "default-map",
    engine: str = "Unknown",
    resolution: float = 1080.0,
    api_url: str = "http://localhost:8000",
    dry_run: bool = False,
    speed: float = 0.3,
) -> int:
    """
    Simulation App ana akışı.

    Returns:
        0: Başarılı
        1: Backend bağlantı hatası
        2: Simülasyon hatası
        3: Sonuç gönderim hatası
    """
    print_banner()
    print_config(cpu_name, gpu_name, game_name, map_id, engine)

    client = SimulationApiClient(ApiConfig(base_url=api_url))
    session_id = None

    # ─── Adım 1: Backend Session Başlat ───
    if not dry_run:
        if console:
            console.print(f"\n[dim]Backend kontrol ediliyor... {api_url}[/]")

        if not client.health_check():
            msg = f"Backend API erişilebilir değil ({api_url})"
            logger.error(msg)
            if console:
                console.print(Panel(f"[red]{msg}[/]", title="❌ Bağlantı Hatası", border_style="red"))
            else:
                print(f"\n❌ {msg}")
            return 1

        session_data = client.start_session(
            cpu_name=cpu_name,
            gpu_name=gpu_name,
            game_name=f"b'{game_name}'",
            resolution=resolution,
        )

        if not session_data or not session_data.get("session_id"):
            logger.error("Session oluşturulamadı")
            if console:
                console.print("[red]❌ Session oluşturulamadı[/]")
            return 1

        session_id = session_data["session_id"]
        logger.info(f"Session başlatıldı: {session_id}")
        if console:
            console.print(f"\n[green]✅ Session başlatıldı:[/] [cyan]{session_id}[/]")

    # ─── Adım 2: Base FPS al (ML prediction Backend'de yapılacak) ───
    # Simülasyon motoru için tahmini base FPS
    # Gerçek ML prediction, sonuçlar gönderildiğinde Backend tarafında yapılacak
    base_fps = 120.0  # Varsayılan — Backend tarafında gerçek ML ile override edilecek
    logger.info(f"Simülasyon base FPS: {base_fps}")

    # ─── Adım 3: Benchmark Çalıştır ───
    engine_sim = SimulationEngine(
        base_fps=base_fps,
        engine_name=engine,
        map_id=map_id,
    )

    def on_stage_update(stage_name: str, progress: int, detail: str):
        """Her aşama değişikliğinde Backend'e raporla."""
        if console:
            console.print(f"  [cyan]▶[/] {detail} [dim]({progress}%)[/]")
        logger.info(f"Aşama: {stage_name} — {progress}% — {detail}")

        if not dry_run and session_id:
            client.update_stage(session_id, stage_name, progress, detail)

    if console:
        console.print("\n[bold magenta]🚀 Benchmark başlıyor...[/]\n")

    result = engine_sim.run_benchmark(
        on_stage_update=on_stage_update,
        speed_multiplier=speed,
    )

    # Tamamlandı aşamasını bildir
    if not dry_run and session_id:
        client.update_stage(session_id, "finalizing", 95, "Sonuçlar hesaplanıyor...")

    # ─── Adım 4: Sonuçları Göster ───
    print_results(result)
    logger.info(f"Sonuçlar: avg={result.avg_fps:.1f}, max={result.max_fps:.1f}, min={result.min_fps:.1f}")

    # ─── Adım 5: Sonuçları Backend'e Gönder ───
    if dry_run:
        if console:
            console.print("\n[yellow]🔸 Dry-run modu — sonuçlar gönderilmedi.[/]")
        return 0

    if console:
        console.print("\n[bold]📤 Sonuçlar Backend'e gönderiliyor...[/]")

    api_payload = result.to_api_payload(session_id)
    logger.info(f"API payload: {json.dumps(api_payload, ensure_ascii=False)}")

    response = client.submit_results(api_payload)

    if response and response.get("success"):
        ml_fps = response.get("results", {}).get("mlPredictedFps")
        if console:
            panel_text = (
                f"[bold green]✅ Sonuçlar başarıyla gönderildi![/]\n\n"
                f"[bold]Session:[/] [cyan]{session_id}[/]\n"
                f"[bold]Simülasyon FPS:[/] {result.avg_fps:.1f}\n"
                f"[bold]ML Tahmini FPS:[/] {ml_fps if ml_fps else 'N/A'}\n\n"
                f"[bold cyan]🌐 Web sitesine dönün — sonuçlarınız hazır![/]"
            )
            console.print(Panel(panel_text, title="Benchmark Tamamlandı", border_style="green"))
        else:
            print(f"\n✅ Sonuçlar gönderildi! Session: {session_id}")
            print(f"   ML Tahmini FPS: {ml_fps}")
            print(f"\n🌐 Web sitesine dönün — sonuçlarınız hazır!")
        return 0
    else:
        # Retry + offline kaydetme
        offline_path = os.path.join(LOG_DIR, f"offline_results_{session_id}.json")
        with open(offline_path, "w", encoding="utf-8") as f:
            json.dump(api_payload, f, indent=2, ensure_ascii=False)
        logger.warning(f"Sonuçlar gönderilemedi — offline kaydedildi: {offline_path}")

        if console:
            console.print(Panel(
                f"[yellow]⚠️  Sonuçlar gönderilemedi.[/]\n\n"
                f"Offline kaydedildi: [dim]{offline_path}[/]\n"
                f"Backend çalışır hale gelince tekrar deneyin.",
                title="Gönderim Başarısız",
                border_style="yellow",
            ))
        return 3


# ─── CLI ───

def main():
    """CLI giriş noktası."""
    parser = argparse.ArgumentParser(
        description="SeeFps Simulation App — Sanal Benchmark Simülasyonu",
    )
    parser.add_argument("--cpu", required=True, help="CPU ismi (ör: 'i9-9900K')")
    parser.add_argument("--gpu", required=True, help="GPU ismi (ör: 'rtx 2080 ti')")
    parser.add_argument("--game", required=True, help="Oyun ismi (ör: 'fortnite')")
    parser.add_argument("--map", default="default-map", help="Harita ID (ör: 'dust-ii')")
    parser.add_argument("--engine", default="Unknown", help="Oyun motoru (ör: 'Unreal Engine 4')")
    parser.add_argument("--resolution", type=float, default=1080.0, help="Çözünürlük (varsayılan: 1080)")
    parser.add_argument("--api-url", default=os.getenv("SEEFPS_API_URL", "http://localhost:8000"))
    parser.add_argument("--dry-run", action="store_true", help="Backend olmadan çalıştır")
    parser.add_argument("--speed", type=float, default=0.3, help="Simülasyon hız çarpanı (0.1=hızlı, 1.0=gerçek zamanlı)")

    args = parser.parse_args()

    exit_code = run(
        cpu_name=args.cpu,
        gpu_name=args.gpu,
        game_name=args.game,
        map_id=args.map,
        engine=args.engine,
        resolution=args.resolution,
        api_url=args.api_url,
        dry_run=args.dry_run,
        speed=args.speed,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
