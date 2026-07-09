#!/usr/bin/env python3
"""
SeeFps Detection App — PyInstaller Build Script
=================================================
Tek dosya çalıştırılabilir üretir (.exe / macOS binary).

Kullanım:
    cd desktop/detection-app
    pip install -r requirements.txt pyinstaller
    python build.py

Çıktı:
    dist/SeeFps-Detection      (macOS)
    dist/SeeFps-Detection.exe  (Windows)
"""

import platform
import subprocess
import sys


def build():
    """PyInstaller ile tek dosya binary oluştur."""
    app_name = "SeeFps-Detection"

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--clean",
        "--name", app_name,
        # Hidden imports — PyInstaller bazen bunları otomatik bulamaz
        "--hidden-import", "cpuinfo",
        "--hidden-import", "psutil",
        "--hidden-import", "GPUtil",
        "--hidden-import", "screeninfo",
        "--hidden-import", "requests",
        "--hidden-import", "rich",
        "main.py",
    ]

    print(f"🔨 Building {app_name} for {platform.system()}...")
    print(f"   Command: {' '.join(cmd)}")
    print()

    result = subprocess.run(cmd, cwd=".")
    if result.returncode == 0:
        ext = ".exe" if platform.system() == "Windows" else ""
        print(f"\n✅ Build başarılı!")
        print(f"   Çıktı: dist/{app_name}{ext}")
        print(f"\n📦 Bu dosyayı GitHub Releases'e yükleyebilirsin.")
    else:
        print(f"\n❌ Build başarısız! (exit code: {result.returncode})")
        sys.exit(1)


if __name__ == "__main__":
    build()
