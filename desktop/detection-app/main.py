#!/usr/bin/env python3
"""
SeeFps Detection App — Ana Uygulama
======================================
Kullanıcının makinesindeki donanım bilgilerini tarayarak
Backend API'ye gönderen masaüstü uygulaması.

Kullanım:
    python main.py
    python main.py --api-url http://192.168.1.100:8000
    python main.py --dry-run  (API'ye göndermeden sadece tara)

Akış:
    1. "Taranıyor..." → Donanım bilgileri okunur
    2. "Gönderiliyor..." → Backend API'ye POST /api/detect
    3. "Tamamlandı ✅" → Eşleşme sonucu gösterilir
    4. "Web sitesine dön" → Session ID ile yönlendirme bilgisi
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime

# Rich kütüphanesi mevcut mu kontrol et
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich import print as rprint
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

from hardware_scanner import scan_hardware, HardwareReport
from api_client import DetectionApiClient, ApiConfig, ApiResult


# ─── Logging ───

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f"detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("SeeFps.Detection")


# ─── Terminal UI (Rich) ───

if HAS_RICH:
    console = Console()
else:
    console = None


def print_banner():
    """Uygulama başlık banner'ı."""
    banner = """
╔══════════════════════════════════════════════╗
║       🖥️  SeeFps — Detection App  v1.0       ║
║     Donanım Tarama & API Gönderim Aracı     ║
╚══════════════════════════════════════════════╝
    """
    if console:
        console.print(Panel.fit(
            "[bold cyan]🖥️  SeeFps — Detection App  v1.0[/]\n"
            "[dim]Donanım Tarama & API Gönderim Aracı[/]",
            border_style="cyan",
        ))
    else:
        print(banner)


def print_hardware_report(report: HardwareReport):
    """Donanım raporu tablosu."""
    if console:
        table = Table(
            title="🔍 Donanım Tarama Sonuçları",
            show_header=True,
            header_style="bold cyan",
        )
        table.add_column("Bileşen", style="bold", width=12)
        table.add_column("Değer", style="green")
        table.add_column("Detay", style="dim")

        table.add_row(
            "CPU",
            report.cpu.model_name,
            f"{report.cpu.cores_physical}C/{report.cpu.cores_logical}T • {report.cpu.frequency_mhz:.0f} MHz",
        )
        table.add_row(
            "GPU",
            report.gpu.model_name,
            f"VRAM: {report.gpu.vram_mb} MB" if report.gpu.vram_mb else report.gpu.vendor,
        )
        table.add_row(
            "RAM",
            f"{report.ram.total_gb} GB {report.ram.ram_type}",
            f"{report.ram.frequency_mhz} MHz" if report.ram.frequency_mhz else "",
        )
        table.add_row(
            "Depolama",
            f"{report.storage.total_gb} GB {report.storage.storage_type}",
            report.storage.model_name,
        )
        table.add_row(
            "Ekran",
            f"{report.screen.width}x{report.screen.height}",
            report.screen.resolution_label,
        )
        table.add_row(
            "İşletim S.",
            f"{report.os_name} {report.os_version[:30]}",
            "",
        )

        console.print(table)

        if report.errors:
            console.print()
            for err in report.errors:
                console.print(f"  [yellow]⚠️  {err}[/]")
    else:
        print("\n─── Donanım Tarama Sonuçları ───")
        print(f"  CPU:       {report.cpu.model_name}")
        print(f"  GPU:       {report.gpu.model_name}")
        print(f"  RAM:       {report.ram.total_gb} GB {report.ram.ram_type}")
        print(f"  Depolama:  {report.storage.total_gb} GB {report.storage.storage_type}")
        print(f"  Ekran:     {report.screen.width}x{report.screen.height} ({report.screen.resolution_label})")
        print(f"  OS:        {report.os_name}")
        if report.errors:
            for err in report.errors:
                print(f"  ⚠️  {err}")


def print_api_result(result: ApiResult):
    """API sonucu göster."""
    if result.success and result.data:
        data = result.data
        if console:
            panel_text = (
                f"[bold green]✅ Donanım Eşleştirildi![/]\n\n"
                f"[bold]Session ID:[/] [cyan]{data.get('session_id', 'N/A')}[/]\n"
                f"[bold]CPU:[/] {data.get('cpu', {}).get('display_name', 'N/A')}\n"
                f"[bold]GPU:[/] {data.get('gpu', {}).get('display_name', 'N/A')}\n"
                f"[bold]RAM:[/] {data.get('ram', 'N/A')}\n"
                f"[bold]Çözünürlük:[/] {data.get('resolution', 'N/A')}"
            )
            console.print(Panel(panel_text, title="API Sonucu", border_style="green"))
            console.print()
            console.print("[bold cyan]🌐 Web sitesine dönün ve benchmark'ı başlatın![/]")
            console.print(f"[dim]   Session: {data.get('session_id', '')}[/]")
        else:
            print(f"\n✅ Donanım Eşleştirildi!")
            print(f"   Session ID: {data.get('session_id', 'N/A')}")
            print(f"   CPU: {data.get('cpu', {}).get('display_name', 'N/A')}")
            print(f"   GPU: {data.get('gpu', {}).get('display_name', 'N/A')}")
            print(f"\n🌐 Web sitesine dönün ve benchmark'ı başlatın!")

    elif result.data and not result.success:
        errors = result.data.get("errors", [])
        if console:
            error_text = "[bold red]❌ Eşleşme Başarısız[/]\n\n"
            for err in errors:
                error_text += f"  • {err}\n"

            available = result.data.get("available_hardware")
            if available:
                error_text += "\n[bold]Desteklenen CPU'lar:[/]\n"
                for cpu in available.get("cpus", [])[:5]:
                    error_text += f"  [dim]• {cpu}[/]\n"
                error_text += f"  [dim]... ve {len(available.get('cpus', [])) - 5} adet daha[/]\n"

            console.print(Panel(error_text, title="API Sonucu", border_style="red"))
        else:
            print(f"\n❌ Eşleşme Başarısız:")
            for err in errors:
                print(f"   • {err}")

    else:
        error_msg = result.error or "Bilinmeyen hata"
        if console:
            console.print(Panel(
                f"[bold red]❌ API Hatası[/]\n\n{error_msg}",
                border_style="red",
            ))
        else:
            print(f"\n❌ API Hatası: {error_msg}")


# ─── Ana Akış ───

def run(api_url: str = "http://localhost:8000", dry_run: bool = False) -> int:
    """
    Detection App ana akışı.

    Returns:
        0: Başarılı
        1: Donanım tarama hatası
        2: API gönderim hatası
    """
    print_banner()

    # ─── Adım 1: Donanım Tarama ───
    logger.info("Donanım taraması başlıyor...")

    if console:
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]Taranıyor...[/] {task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Donanım bilgileri okunuyor", total=None)
            report = scan_hardware()
            progress.update(task, completed=True, description="Tamamlandı!")
    else:
        print("\n⏳ Taranıyor... Donanım bilgileri okunuyor...")
        report = scan_hardware()

    print_hardware_report(report)
    logger.info(f"Donanım raporu: {json.dumps(report.to_dict(), ensure_ascii=False, default=str)}")

    # ─── Adım 2: API Payload oluştur ───
    payload = report.to_api_payload()
    logger.info(f"API payload: {json.dumps(payload, ensure_ascii=False)}")

    if dry_run:
        if console:
            console.print("\n[yellow]🔸 Dry-run modu — API'ye gönderilmedi.[/]")
            console.print(f"[dim]Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}[/]")
        else:
            print(f"\n🔸 Dry-run modu — API'ye gönderilmedi.")
            print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
        return 0

    # ─── Adım 3: API'ye Gönder ───
    client = DetectionApiClient(ApiConfig(base_url=api_url))

    # Önce health check
    if console:
        console.print(f"\n[dim]Backend kontrol ediliyor... {api_url}[/]")

    if not client.health_check():
        error_msg = (
            f"Backend API erişilebilir değil ({api_url}).\n"
            "Backend sunucusunun çalıştığından emin olun:\n"
            "  cd backend && uvicorn server:app --port 8000"
        )
        logger.error(error_msg)
        if console:
            console.print(Panel(f"[red]{error_msg}[/]", title="❌ Bağlantı Hatası", border_style="red"))
        else:
            print(f"\n❌ {error_msg}")
        return 2

    logger.info("Backend API erişilebilir, veri gönderiliyor...")

    if console:
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]Gönderiliyor...[/] {task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Donanım verileri API'ye gönderiliyor", total=None)
            result = client.send_detection(payload)
            progress.update(task, completed=True, description="Tamamlandı!")
    else:
        print("\n⏳ Gönderiliyor... Donanım verileri API'ye gönderiliyor...")
        result = client.send_detection(payload)

    # ─── Adım 4: Sonuç göster ───
    print_api_result(result)
    logger.info(f"API sonucu: success={result.success}, data={json.dumps(result.data, ensure_ascii=False, default=str)}")

    # Log dosyası bilgisi
    if console:
        console.print(f"\n[dim]📝 Log: {log_file}[/]")
    else:
        print(f"\n📝 Log: {log_file}")

    return 0 if result.success else 2


# ─── CLI ───

def main():
    """CLI giriş noktası."""
    parser = argparse.ArgumentParser(
        description="SeeFps Detection App — Donanım tarama ve API gönderim aracı",
    )
    parser.add_argument(
        "--api-url",
        default=os.getenv("SEEFPS_API_URL", "http://localhost:8000"),
        help="Backend API URL'si (varsayılan: http://localhost:8000)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Sadece donanım bilgilerini tara, API'ye gönderme",
    )
    args = parser.parse_args()

    exit_code = run(api_url=args.api_url, dry_run=args.dry_run)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
