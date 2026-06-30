"""
SeeFps Detection App — Hardware Scanner
=========================================
Kullanıcının sistemindeki donanım bilgilerini (CPU, GPU, RAM, SSD, ekran)
otomatik olarak okuyan modül.

Her bileşen ayrı bir fonksiyonla okunur ve okunamayan bileşenler için
graceful fallback uygulanır.

Desteklenen OS'ler:
  - Windows (öncelikli)
  - macOS
  - Linux
"""

import os
import platform
import subprocess
from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass
class CpuInfo:
    """CPU donanım bilgisi."""
    model_name: str = "Unknown CPU"
    brand: str = "Unknown"
    cores_physical: int = 0
    cores_logical: int = 0
    frequency_mhz: float = 0.0
    frequency_max_mhz: float = 0.0
    cache_l2_kb: int = 0
    architecture: str = "Unknown"


@dataclass
class GpuInfo:
    """GPU donanım bilgisi."""
    model_name: str = "Unknown GPU"
    vram_mb: int = 0
    driver_version: str = "Unknown"
    vendor: str = "Unknown"


@dataclass
class RamInfo:
    """RAM donanım bilgisi."""
    total_gb: float = 0.0
    frequency_mhz: int = 0
    ram_type: str = "DDR4"  # DDR4 veya DDR5


@dataclass
class StorageInfo:
    """Depolama bilgisi."""
    model_name: str = "Unknown"
    total_gb: float = 0.0
    storage_type: str = "SATA"  # SATA veya NVMe
    is_ssd: bool = True


@dataclass
class ScreenInfo:
    """Ekran bilgisi."""
    width: int = 1920
    height: int = 1080
    resolution_label: str = "1080p"


@dataclass
class HardwareReport:
    """Tüm donanım bilgilerini tutan rapor."""
    cpu: CpuInfo = field(default_factory=CpuInfo)
    gpu: GpuInfo = field(default_factory=GpuInfo)
    ram: RamInfo = field(default_factory=RamInfo)
    storage: StorageInfo = field(default_factory=StorageInfo)
    screen: ScreenInfo = field(default_factory=ScreenInfo)
    os_name: str = platform.system()
    os_version: str = platform.version()
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """JSON'a dönüştürülebilir dict formatı."""
        return asdict(self)

    def to_api_payload(self) -> dict[str, Any]:
        """Backend POST /api/detect payload formatı."""
        return {
            "cpu_name": self.cpu.model_name,
            "gpu_name": self.gpu.model_name,
            "ram_gb": self.ram.total_gb,
            "ssd_type": self.storage.storage_type,
            "resolution": self.screen.resolution_label,
        }


# ─── CPU Bilgisi Okuma ───

def read_cpu() -> CpuInfo:
    """CPU bilgilerini oku."""
    info = CpuInfo()

    try:
        import cpuinfo
        cpu_data = cpuinfo.get_cpu_info()
        info.model_name = cpu_data.get("brand_raw", "Unknown CPU")
        info.brand = cpu_data.get("vendor_id_raw", "Unknown")
        info.architecture = cpu_data.get("arch", "Unknown")
        info.cores_physical = cpu_data.get("count", 0)

        # Hz → MHz dönüşümü
        hz = cpu_data.get("hz_actual", (0, 0))
        if isinstance(hz, (list, tuple)) and len(hz) >= 1:
            try:
                info.frequency_mhz = float(hz[0]) / 1e6 if float(hz[0]) > 1e6 else float(hz[0])
            except (ValueError, TypeError):
                pass

        # L2 cache
        l2 = cpu_data.get("l2_cache_size", "0")
        if isinstance(l2, str):
            l2 = l2.replace("KiB", "").replace("MiB", "").replace("KB", "").strip()
            try:
                info.cache_l2_kb = int(l2)
            except ValueError:
                pass
        elif isinstance(l2, int):
            info.cache_l2_kb = l2

    except ImportError:
        info.model_name = _fallback_cpu_name()

    try:
        import psutil
        info.cores_physical = psutil.cpu_count(logical=False) or 0
        info.cores_logical = psutil.cpu_count(logical=True) or 0
        freq = psutil.cpu_freq()
        if freq:
            info.frequency_mhz = freq.current or 0.0
            info.frequency_max_mhz = freq.max or 0.0
    except ImportError:
        pass

    return info


def _fallback_cpu_name() -> str:
    """cpuinfo kütüphanesi yoksa OS'ten CPU adını oku."""
    system = platform.system()
    try:
        if system == "Windows":
            result = subprocess.run(
                ["wmic", "cpu", "get", "name"],
                capture_output=True, text=True, timeout=5,
            )
            lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip() and l.strip() != "Name"]
            return lines[0] if lines else "Unknown CPU"

        elif system == "Darwin":  # macOS
            result = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True, text=True, timeout=5,
            )
            return result.stdout.strip() or "Unknown CPU"

        elif system == "Linux":
            result = subprocess.run(
                ["grep", "-m1", "model name", "/proc/cpuinfo"],
                capture_output=True, text=True, timeout=5,
            )
            line = result.stdout.strip()
            return line.split(":", 1)[1].strip() if ":" in line else "Unknown CPU"

    except Exception:
        pass
    return "Unknown CPU"


# ─── GPU Bilgisi Okuma ───

def read_gpu() -> GpuInfo:
    """GPU bilgilerini oku."""
    info = GpuInfo()

    # Önce GPUtil dene (NVIDIA için)
    try:
        import GPUtil
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu = gpus[0]  # İlk GPU
            info.model_name = gpu.name or "Unknown GPU"
            info.vram_mb = int(gpu.memoryTotal) if gpu.memoryTotal else 0
            info.driver_version = gpu.driver or "Unknown"
            info.vendor = "NVIDIA"
            return info
    except (ImportError, Exception):
        pass

    # Fallback: OS'e özel yöntemler
    info.model_name = _fallback_gpu_name()
    return info


def _fallback_gpu_name() -> str:
    """GPUtil yoksa OS'ten GPU adını oku."""
    system = platform.system()
    try:
        if system == "Windows":
            result = subprocess.run(
                ["wmic", "path", "win32_VideoController", "get", "name"],
                capture_output=True, text=True, timeout=5,
            )
            lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip() and l.strip() != "Name"]
            return lines[0] if lines else "Unknown GPU"

        elif system == "Darwin":  # macOS
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True, text=True, timeout=10,
            )
            for line in result.stdout.split("\n"):
                if "Chipset Model" in line or "Chip" in line:
                    return line.split(":", 1)[1].strip() if ":" in line else "Unknown GPU"

        elif system == "Linux":
            result = subprocess.run(
                ["lspci", "-v"],
                capture_output=True, text=True, timeout=5,
            )
            for line in result.stdout.split("\n"):
                if "VGA" in line or "3D" in line:
                    # "XX:XX.X VGA compatible controller: NVIDIA Corporation ..."
                    parts = line.split(":", 2)
                    return parts[2].strip() if len(parts) > 2 else "Unknown GPU"

    except Exception:
        pass
    return "Unknown GPU"


# ─── RAM Bilgisi Okuma ───

def read_ram() -> RamInfo:
    """RAM bilgilerini oku."""
    info = RamInfo()

    try:
        import psutil
        mem = psutil.virtual_memory()
        info.total_gb = round(mem.total / (1024 ** 3), 1)
    except ImportError:
        pass

    # RAM tipi ve frekans — OS'e bağlı
    _read_ram_details(info)
    return info


def _read_ram_details(info: RamInfo) -> None:
    """RAM frekansı ve türünü (DDR4/DDR5) okumaya çalış."""
    system = platform.system()
    try:
        if system == "Windows":
            # Frekans
            result = subprocess.run(
                ["wmic", "memorychip", "get", "speed"],
                capture_output=True, text=True, timeout=5,
            )
            lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip().isdigit()]
            if lines:
                info.frequency_mhz = int(lines[0])

            # DDR tipi
            result2 = subprocess.run(
                ["wmic", "memorychip", "get", "SMBIOSMemoryType"],
                capture_output=True, text=True, timeout=5,
            )
            lines2 = [l.strip() for l in result2.stdout.strip().split("\n") if l.strip().isdigit()]
            if lines2:
                mem_type = int(lines2[0])
                info.ram_type = {26: "DDR4", 34: "DDR5"}.get(mem_type, "DDR4")

        elif system == "Darwin":
            result = subprocess.run(
                ["system_profiler", "SPMemoryDataType"],
                capture_output=True, text=True, timeout=10,
            )
            for line in result.stdout.split("\n"):
                if "Speed" in line and "MHz" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        speed_str = parts[1].strip().replace("MHz", "").strip()
                        try:
                            info.frequency_mhz = int(speed_str)
                        except ValueError:
                            pass
                if "Type" in line and "DDR" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        info.ram_type = parts[1].strip()

    except Exception:
        pass


# ─── SSD/Depolama Bilgisi Okuma ───

def read_storage() -> StorageInfo:
    """Birincil depolama bilgilerini oku."""
    info = StorageInfo()

    try:
        import psutil
        partitions = psutil.disk_partitions()
        if partitions:
            # Sistem diskini bul
            system_part = partitions[0]
            for part in partitions:
                if platform.system() == "Windows" and "C:" in part.device:
                    system_part = part
                    break
                if part.mountpoint == "/":
                    system_part = part
                    break

            usage = psutil.disk_usage(system_part.mountpoint)
            info.total_gb = round(usage.total / (1024 ** 3), 1)
    except (ImportError, Exception):
        pass

    # Depolama türü (NVMe vs SATA)
    _read_storage_type(info)
    return info


def _read_storage_type(info: StorageInfo) -> None:
    """Depolama türünü (NVMe/SATA/HDD) tespit et."""
    system = platform.system()
    try:
        if system == "Windows":
            result = subprocess.run(
                ["wmic", "diskdrive", "get", "model,mediatype"],
                capture_output=True, text=True, timeout=5,
            )
            output = result.stdout.lower()
            if "nvme" in output:
                info.storage_type = "NVMe"
                info.model_name = "NVMe SSD"
            elif "ssd" in output or "solid" in output:
                info.storage_type = "SATA"
                info.model_name = "SATA SSD"
            else:
                info.storage_type = "HDD"
                info.model_name = "HDD"
                info.is_ssd = False

        elif system == "Darwin":
            result = subprocess.run(
                ["system_profiler", "SPNVMeDataType"],
                capture_output=True, text=True, timeout=10,
            )
            if "NVMe" in result.stdout or result.returncode == 0:
                info.storage_type = "NVMe"
                info.model_name = "NVMe SSD"
                # Model adını bul
                for line in result.stdout.split("\n"):
                    if "Model" in line and ":" in line:
                        info.model_name = line.split(":", 1)[1].strip()
                        break
            else:
                info.storage_type = "SATA"
                info.model_name = "SATA SSD"

        elif system == "Linux":
            result = subprocess.run(
                ["lsblk", "-d", "-o", "NAME,ROTA,TRAN"],
                capture_output=True, text=True, timeout=5,
            )
            for line in result.stdout.split("\n")[1:]:
                parts = line.split()
                if len(parts) >= 3:
                    rota = parts[1]  # 0 = SSD, 1 = HDD
                    tran = parts[2]  # nvme, sata, etc.
                    if "nvme" in tran.lower():
                        info.storage_type = "NVMe"
                        info.model_name = "NVMe SSD"
                    elif rota == "0":
                        info.storage_type = "SATA"
                        info.model_name = "SATA SSD"
                    else:
                        info.storage_type = "HDD"
                        info.is_ssd = False
                    break

    except Exception:
        pass


# ─── Ekran Çözünürlüğü Okuma ───

def read_screen() -> ScreenInfo:
    """Aktif monitörün çözünürlüğünü oku."""
    info = ScreenInfo()

    try:
        from screeninfo import get_monitors
        monitors = get_monitors()
        if monitors:
            primary = monitors[0]
            info.width = primary.width
            info.height = primary.height
            info.resolution_label = _resolution_label(primary.height)
            return info
    except (ImportError, Exception):
        pass

    # Fallback: OS'e özel yöntemler
    _fallback_screen(info)
    return info


def _fallback_screen(info: ScreenInfo) -> None:
    """screeninfo yoksa OS'ten çözünürlüğü oku."""
    system = platform.system()
    try:
        if system == "Windows":
            import ctypes
            user32 = ctypes.windll.user32
            info.width = user32.GetSystemMetrics(0)
            info.height = user32.GetSystemMetrics(1)
        elif system == "Darwin":
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True, text=True, timeout=10,
            )
            for line in result.stdout.split("\n"):
                if "Resolution" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        res = parts[1].strip()  # "2560 x 1440"
                        dims = res.split("x")
                        if len(dims) == 2:
                            info.width = int(dims[0].strip())
                            info.height = int(dims[1].strip().split()[0])
        elif system == "Linux":
            result = subprocess.run(
                ["xrandr", "--current"],
                capture_output=True, text=True, timeout=5,
            )
            for line in result.stdout.split("\n"):
                if "*" in line:
                    res = line.strip().split()[0]  # "1920x1080"
                    parts = res.split("x")
                    if len(parts) == 2:
                        info.width = int(parts[0])
                        info.height = int(parts[1])
                    break

        info.resolution_label = _resolution_label(info.height)
    except Exception:
        pass


def _resolution_label(height: int) -> str:
    """Yükseklik → çözünürlük etiketi."""
    if height >= 2160:
        return "2160p"
    elif height >= 1440:
        return "1440p"
    elif height >= 1080:
        return "1080p"
    elif height >= 720:
        return "720p"
    return f"{height}p"


# ─── Ana Tarama Fonksiyonu ───

def scan_hardware() -> HardwareReport:
    """
    Tüm donanım bileşenlerini tara ve birleşik rapor döndür.

    Her bileşen bağımsız olarak okunur — birinin başarısız olması
    diğerlerini etkilemez.
    """
    report = HardwareReport()

    # CPU
    try:
        report.cpu = read_cpu()
    except Exception as e:
        report.errors.append(f"CPU okunamadı: {e}")

    # GPU
    try:
        report.gpu = read_gpu()
    except Exception as e:
        report.errors.append(f"GPU okunamadı: {e}")

    # RAM
    try:
        report.ram = read_ram()
    except Exception as e:
        report.errors.append(f"RAM okunamadı: {e}")

    # Storage
    try:
        report.storage = read_storage()
    except Exception as e:
        report.errors.append(f"Depolama okunamadı: {e}")

    # Screen
    try:
        report.screen = read_screen()
    except Exception as e:
        report.errors.append(f"Ekran çözünürlüğü okunamadı: {e}")

    return report
