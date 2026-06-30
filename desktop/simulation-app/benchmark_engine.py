"""
SeeFps Simulation App — Sanal Benchmark Motoru
================================================
Oyun motoru dinamiklerini mantıksal yük faktörleri olarak modelleyen
ve ML tahminlerini modüle eden simülasyon motoru.

Bu motor gerçek bir oyun çalıştırmaz — bunun yerine:
  1. Backend'den ML tahmini (base FPS) alır
  2. Oyun motoru dinamikleri yük tablosuna göre sahne bazlı FPS hesaplar
  3. Sıcaklık, RPM, Clock hızı gibi metrikleri heuristik olarak üretir
  4. Sonuçları zamanlı aşamalar halinde Backend'e raporlar

Sahne Yapısı:
  Sahne 1: Idle/Menu     — baseline FPS (yük çarpanı 1.0)
  Sahne 2: Normal Oynanış — ortalama yük (yük çarpanı 0.85)
  Sahne 3: Yoğun Efektler — pik yük (yük çarpanı 0.60)
  Sahne 4: Stres Testi    — maksimum yük (yük çarpanı 0.45)
"""

import random
import time
from dataclasses import dataclass, field
from typing import Any


# ─── Oyun Motoru Dinamikleri Yük Tablosu ───

ENGINE_LOAD_PROFILES: dict[str, dict[str, float]] = {
    # engine_name → {efekt → GPU/CPU yük çarpanı}
    "Unreal Engine 4": {
        "smoke_particles": 0.12,
        "reflections": 0.10,
        "shadows": 0.08,
        "physics": 0.06,
        "postprocessing": 0.05,
    },
    "Source Engine": {
        "smoke_particles": 0.08,
        "reflections": 0.06,
        "shadows": 0.06,
        "physics": 0.04,
        "postprocessing": 0.03,
    },
    "Source 2": {
        "smoke_particles": 0.10,
        "reflections": 0.08,
        "shadows": 0.07,
        "physics": 0.05,
        "postprocessing": 0.04,
    },
    "Frostbite 3": {
        "smoke_particles": 0.14,
        "reflections": 0.12,
        "shadows": 0.10,
        "physics": 0.08,
        "postprocessing": 0.06,
    },
    "IW Engine": {
        "smoke_particles": 0.10,
        "reflections": 0.09,
        "shadows": 0.07,
        "physics": 0.05,
        "postprocessing": 0.04,
    },
    "RAGE Engine": {
        "smoke_particles": 0.11,
        "reflections": 0.10,
        "shadows": 0.09,
        "physics": 0.07,
        "postprocessing": 0.05,
    },
    "AnvilNext 2.0": {
        "smoke_particles": 0.10,
        "reflections": 0.08,
        "shadows": 0.08,
        "physics": 0.06,
        "postprocessing": 0.05,
    },
    "Unity": {
        "smoke_particles": 0.07,
        "reflections": 0.06,
        "shadows": 0.05,
        "physics": 0.04,
        "postprocessing": 0.03,
    },
}

# Varsayılan profil (bilinmeyen motorlar için)
DEFAULT_LOAD_PROFILE = {
    "smoke_particles": 0.09,
    "reflections": 0.07,
    "shadows": 0.06,
    "physics": 0.05,
    "postprocessing": 0.04,
}

# ─── Harita Karmaşıklık Çarpanları ───

MAP_COMPLEXITY: dict[str, float] = {
    # Karmaşık haritalar → düşük FPS (çarpan < 1.0)
    "los-santos": 0.88,
    "online-freemode": 0.85,
    "battle-royale-island": 0.90,
    "erangel": 0.88,
    "worlds-edge": 0.87,
    "kings-canyon": 0.89,
    "kings-row": 0.92,
    "dust-ii": 0.95,
    "mirage": 0.94,
    "inferno": 0.93,
    "summoners-rift": 0.96,
    # Basit haritalar → yüksek FPS
    "default-map": 0.98,
    "default-arena": 0.97,
}


# ─── Benchmark Sahneleri ───

@dataclass
class BenchmarkScene:
    """Bir benchmark sahnesi."""
    name: str
    label: str
    duration_sec: float
    gpu_load_factor: float   # 0.0 - 1.0 (1.0 = tam yük)
    cpu_load_factor: float   # 0.0 - 1.0
    active_effects: list[str] = field(default_factory=list)
    stage_name: str = ""     # Backend'e raporlanan aşama


BENCHMARK_SCENES = [
    BenchmarkScene(
        name="idle_menu",
        label="Ana Menü / Idle",
        duration_sec=5,
        gpu_load_factor=0.15,
        cpu_load_factor=0.10,
        active_effects=[],
        stage_name="initializing",
    ),
    BenchmarkScene(
        name="texture_loading",
        label="Doku Yükleme",
        duration_sec=4,
        gpu_load_factor=0.30,
        cpu_load_factor=0.20,
        active_effects=[],
        stage_name="loading_textures",
    ),
    BenchmarkScene(
        name="shader_compile",
        label="Shader Derleme",
        duration_sec=4,
        gpu_load_factor=0.40,
        cpu_load_factor=0.35,
        active_effects=[],
        stage_name="compiling_shaders",
    ),
    BenchmarkScene(
        name="gpu_stress",
        label="GPU Yük Testi",
        duration_sec=6,
        gpu_load_factor=0.85,
        cpu_load_factor=0.40,
        active_effects=["reflections", "shadows", "postprocessing"],
        stage_name="gpu_stress",
    ),
    BenchmarkScene(
        name="cpu_stress",
        label="CPU Yük Testi",
        duration_sec=6,
        gpu_load_factor=0.50,
        cpu_load_factor=0.90,
        active_effects=["physics"],
        stage_name="cpu_stress",
    ),
    BenchmarkScene(
        name="gameplay_normal",
        label="Normal Oynanış",
        duration_sec=6,
        gpu_load_factor=0.65,
        cpu_load_factor=0.55,
        active_effects=["shadows", "physics"],
        stage_name="gameplay_sim",
    ),
    BenchmarkScene(
        name="gameplay_intense",
        label="Yoğun Efekt Sahnesi",
        duration_sec=6,
        gpu_load_factor=0.90,
        cpu_load_factor=0.75,
        active_effects=["smoke_particles", "reflections", "shadows", "physics", "postprocessing"],
        stage_name="particle_fx",
    ),
    BenchmarkScene(
        name="thermal_analysis",
        label="Sıcaklık Analizi",
        duration_sec=4,
        gpu_load_factor=0.70,
        cpu_load_factor=0.60,
        active_effects=["shadows", "postprocessing"],
        stage_name="thermal_analysis",
    ),
    BenchmarkScene(
        name="finalize",
        label="Sonuç Hesaplama",
        duration_sec=3,
        gpu_load_factor=0.10,
        cpu_load_factor=0.10,
        active_effects=[],
        stage_name="finalizing",
    ),
]


# ─── Benchmark Sonuçları ───

@dataclass
class SceneResult:
    """Bir sahnenin sonuçları."""
    scene_name: str
    avg_fps: float
    min_fps: float
    max_fps: float
    cpu_temp: float
    gpu_temp: float
    cpu_clock_mhz: float
    gpu_clock_mhz: float
    fan_rpm: float
    fps_samples: list[float] = field(default_factory=list)


@dataclass
class BenchmarkResult:
    """Tüm benchmark sonuçları."""
    avg_fps: float = 0.0
    max_fps: float = 0.0
    min_fps: float = 0.0
    fps_timeline: list[float] = field(default_factory=list)
    cpu_temp_avg: float = 0.0
    gpu_temp_avg: float = 0.0
    cpu_clock_avg: float = 0.0
    gpu_clock_avg: float = 0.0
    fan_rpm_avg: float = 0.0
    bottleneck: str = "balanced"
    benchmark_duration_sec: float = 0.0
    scene_results: list[SceneResult] = field(default_factory=list)

    def to_api_payload(self, session_id: str) -> dict[str, Any]:
        """Backend POST /api/simulation/results payload formatı."""
        return {
            "session_id": session_id,
            "avg_fps": round(self.avg_fps, 1),
            "max_fps": round(self.max_fps, 1),
            "min_fps": round(self.min_fps, 1),
            "fps_timeline": [round(f, 1) for f in self.fps_timeline],
            "cpu_temp_avg": round(self.cpu_temp_avg, 1),
            "gpu_temp_avg": round(self.gpu_temp_avg, 1),
            "cpu_clock_avg": round(self.cpu_clock_avg, 0),
            "gpu_clock_avg": round(self.gpu_clock_avg, 0),
            "fan_rpm_avg": round(self.fan_rpm_avg, 0),
            "bottleneck": self.bottleneck,
            "benchmark_duration_sec": round(self.benchmark_duration_sec, 1),
        }


# ─── Simülasyon Motoru ───

class SimulationEngine:
    """
    Sanal benchmark simülasyonu çalıştıran motor.

    Akış:
      1. Backend'den ML tahmini (base FPS) al
      2. Her sahne için yük faktörlerini uygula → sahne FPS hesapla
      3. Sıcaklık/RPM/Clock heuristikleri üret
      4. Aşama güncellemelerini callback ile raporla
    """

    def __init__(
        self,
        base_fps: float,
        engine_name: str = "Unknown",
        map_id: str = "default-map",
    ):
        self.base_fps = base_fps
        self.engine_name = engine_name
        self.load_profile = ENGINE_LOAD_PROFILES.get(engine_name, DEFAULT_LOAD_PROFILE)
        self.map_complexity = MAP_COMPLEXITY.get(map_id, 0.95)

    def run_benchmark(
        self,
        on_stage_update: "callable | None" = None,
        speed_multiplier: float = 1.0,
    ) -> BenchmarkResult:
        """
        Benchmark simülasyonunu çalıştır.

        Args:
            on_stage_update: Her aşama değişikliğinde çağrılacak callback.
                Signature: (stage_name: str, progress: int, detail: str) -> None
            speed_multiplier: Simülasyon hız çarpanı (test için düşürülebilir).

        Returns:
            BenchmarkResult — tüm sonuçlar.
        """
        all_fps_samples: list[float] = []
        all_cpu_temps: list[float] = []
        all_gpu_temps: list[float] = []
        all_cpu_clocks: list[float] = []
        all_gpu_clocks: list[float] = []
        all_fan_rpms: list[float] = []
        scene_results: list[SceneResult] = []
        start_time = time.time()

        total_duration = sum(s.duration_sec for s in BENCHMARK_SCENES)
        elapsed_duration = 0.0

        for scene in BENCHMARK_SCENES:
            # Aşama bildir
            progress = int((elapsed_duration / total_duration) * 100)
            if on_stage_update:
                on_stage_update(scene.stage_name, progress, scene.label)

            # Sahne FPS hesapla
            scene_result = self._simulate_scene(scene, speed_multiplier)
            scene_results.append(scene_result)

            # Sonuçları topla
            all_fps_samples.extend(scene_result.fps_samples)
            all_cpu_temps.append(scene_result.cpu_temp)
            all_gpu_temps.append(scene_result.gpu_temp)
            all_cpu_clocks.append(scene_result.cpu_clock_mhz)
            all_gpu_clocks.append(scene_result.gpu_clock_mhz)
            all_fan_rpms.append(scene_result.fan_rpm)

            elapsed_duration += scene.duration_sec

        total_time = time.time() - start_time

        # Bottleneck belirleme
        avg_cpu_temp = sum(all_cpu_temps) / len(all_cpu_temps)
        avg_gpu_temp = sum(all_gpu_temps) / len(all_gpu_temps)

        result = BenchmarkResult(
            avg_fps=sum(all_fps_samples) / len(all_fps_samples) if all_fps_samples else 0,
            max_fps=max(all_fps_samples) if all_fps_samples else 0,
            min_fps=min(all_fps_samples) if all_fps_samples else 0,
            fps_timeline=all_fps_samples,
            cpu_temp_avg=avg_cpu_temp,
            gpu_temp_avg=avg_gpu_temp,
            cpu_clock_avg=sum(all_cpu_clocks) / len(all_cpu_clocks),
            gpu_clock_avg=sum(all_gpu_clocks) / len(all_gpu_clocks),
            fan_rpm_avg=sum(all_fan_rpms) / len(all_fan_rpms),
            bottleneck=self._determine_bottleneck(avg_cpu_temp, avg_gpu_temp),
            benchmark_duration_sec=total_time,
            scene_results=scene_results,
        )

        return result

    def _simulate_scene(
        self,
        scene: BenchmarkScene,
        speed_multiplier: float,
    ) -> SceneResult:
        """Tek bir sahneyi simüle et."""
        # Efekt yüklerini hesapla
        total_effect_penalty = 0.0
        for effect in scene.active_effects:
            total_effect_penalty += self.load_profile.get(effect, 0.03)

        # Sahne FPS = base_fps × (1 - gpu_load × effect_penalty) × map_complexity
        load_factor = 1.0 - (scene.gpu_load_factor * total_effect_penalty)
        scene_base_fps = self.base_fps * load_factor * self.map_complexity

        # Yük altında FPS düşüşü
        gpu_penalty = 1.0 - (scene.gpu_load_factor * 0.3)
        cpu_penalty = 1.0 - (scene.cpu_load_factor * 0.15)
        scene_fps = scene_base_fps * gpu_penalty * cpu_penalty

        # FPS örnekleri üret (doğal varyasyon ile)
        num_samples = max(3, int(scene.duration_sec * 2))
        fps_samples = []
        for _ in range(num_samples):
            noise = random.gauss(0, scene_fps * 0.05)  # %5 varyasyon
            sample = max(5.0, scene_fps + noise)
            fps_samples.append(round(sample, 1))

        # Sıcaklık heuristikleri (FPS'e ters orantılı, yüke doğru orantılı)
        base_cpu_temp = 45.0
        base_gpu_temp = 40.0
        cpu_temp = base_cpu_temp + (scene.cpu_load_factor * 40) + random.gauss(0, 2)
        gpu_temp = base_gpu_temp + (scene.gpu_load_factor * 45) + random.gauss(0, 2)

        # Clock hızı (yük altında boost)
        cpu_base_clock = 3500.0
        gpu_base_clock = 1500.0
        cpu_clock = cpu_base_clock + (scene.cpu_load_factor * 1200) + random.gauss(0, 50)
        gpu_clock = gpu_base_clock + (scene.gpu_load_factor * 500) + random.gauss(0, 30)

        # Fan RPM (sıcaklığa orantılı)
        fan_rpm = 800 + (max(cpu_temp, gpu_temp) - 45) * 25 + random.gauss(0, 50)

        # Simülasyon süresi (gerçek bekleme)
        time.sleep(scene.duration_sec * speed_multiplier)

        return SceneResult(
            scene_name=scene.name,
            avg_fps=sum(fps_samples) / len(fps_samples),
            min_fps=min(fps_samples),
            max_fps=max(fps_samples),
            cpu_temp=round(cpu_temp, 1),
            gpu_temp=round(gpu_temp, 1),
            cpu_clock_mhz=round(cpu_clock, 0),
            gpu_clock_mhz=round(gpu_clock, 0),
            fan_rpm=round(max(800, fan_rpm), 0),
            fps_samples=fps_samples,
        )

    @staticmethod
    def _determine_bottleneck(cpu_temp: float, gpu_temp: float) -> str:
        """Bottleneck tahmini — sıcaklığa ve yük dağılımına göre."""
        if cpu_temp > gpu_temp + 8:
            return "CPU"
        elif gpu_temp > cpu_temp + 8:
            return "GPU"
        return "balanced"
