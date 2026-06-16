"""
predict_fps.py — SeeFPS: Üretime Hazır FPS Tahmin Modülü
=========================================================
Notebook'taki (main.ipynb) tüm veri ön-işleme, feature engineering ve
model eğitim sürecini birebir taşıyan, modüler Python betiği.

Model: MLPRegressor (en yüksek R² = 0.9997)
Pipeline: SimpleImputer → StandardScaler / OrdinalEncoder / OneHotEncoder
          (ColumnTransformer) + Feature Engineering

Kullanım:
    python predict_fps.py
"""

import os
import warnings
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import r2_score, mean_squared_error

# ConvergenceWarning'leri bastır (MLPRegressor max_iter uyarısı)
warnings.filterwarnings("ignore", category=UserWarning)

# =============================================================================
# SABITLER & YOLLAR
# =============================================================================
# Betik hangi dizindeyse, model ve veri dosyalarını orada arar
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_SCRIPT_DIR, "seefps_model.joblib")
DATA_PATH = os.path.join(_SCRIPT_DIR, "main_merged.csv")

# Pipeline'da kullanılacak kolon grupları (notebook ile birebir)
ORDINAL_COLS = [
    "gamesetting", "gpumemorytype", "gpudirectx",
    "gpuopencl", "gpuopengl", "gpushadermodel", "gpuvulkan",
]
ONEHOT_COLS = [
    "gamename", "gpuarchitecture", "gpubus_interface", "cpumultiplierunlocked",
]
# cpuname ve gpuname model özniteliklerinden çıkarılıyor (notebook'taki gibi)
HIGH_CARDINALITY_DROP = ["cpuname", "gpuname"]

RANDOM_STATE = 21
TEST_SIZE = 0.2


# =============================================================================
# 1. FEATURE ENGINEERING  — Notebook hücre [10] birebir
# =============================================================================
def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Notebook'taki 14 mühendislik özniteliğini birebir uygular.
    DataFrame üzerinde in-place değişiklik yapmaz; kopyasını döndürür.
    """
    df = df.copy()

    df["cpu_threads_per_core"] = df["cpunumberofthreads"] / (df["cpunumberofcores"] + 1)
    df["cpu_total_cache"] = df["cpucachel1"] + df["cpucachel2"] + df["cpucachel3"]
    df["gpu_compute_proxy"] = df["gpunumberofcomputeunits"] * df["gpuboostclock"]
    df["gpu_bandwidth_per_compute_unit"] = df["gpubandwidth"] / (df["gpunumberofcomputeunits"] + 1)
    df["bottleneck_ratio_cpu_gpu"] = df["cpunumberofcores"] / (df["gpunumberofcomputeunits"] + 1)
    df["bottleneck_ratio_memory_gpu"] = df["gpumemorysize"] / (df["gpumemorysize"] + 1)
    df["bottleneck_ratio_cpu_memory"] = df["cpunumberofcores"] / (df["gpumemorysize"] + 1)
    df["performance_per_tdp"] = df["gpufp32performance"] / (df["cputdp"] + 1)
    df["cpu_gpu_frequency_ratio"] = df["cpufrequency"] / (df["gpuboostclock"] + 1)
    df["memory_bandwidth_efficiency"] = df["gpubandwidth"] / (df["gpumemorysize"] + 1)
    df["core_to_memory_ratio"] = df["gpunumberofcomputeunits"] / (df["gpumemorysize"] + 1)
    df["cache_efficiency"] = df["cpu_total_cache"] / (df["cpunumberofcores"] + 1)
    df["cpu_performance_score"] = (df["cpunumberofcores"] * df["cpubaseclock"]) / (df["cpuprocesssize"] + 1)
    df["gpu_performance_score"] = (df["gpunumberofcomputeunits"] * df["gpuboostclock"]) / (df["gpuprocesssize"] + 1)

    return df


# =============================================================================
# 2. VERİ ÖN-İŞLEME  — %80 NaN kolon silme + Feature Engineering
# =============================================================================
def load_and_prepare_data(csv_path: str) -> pd.DataFrame:
    """
    1) CSV'yi oku
    2) %80'den fazla NaN içeren kolonları sil (notebook hücre [5-6])
    3) Feature engineering uygula
    """
    df = pd.read_csv(csv_path)

    # %80'den fazla NaN içeren kolonları bul ve sil
    null_ratio = df.isnull().sum() / len(df)
    null_cols = null_ratio[null_ratio > 0.80].index.tolist()
    df = df.drop(columns=null_cols)

    # Feature engineering
    df = feature_engineering(df)

    return df


# =============================================================================
# 3. PREPROCESSOR (ColumnTransformer) OLUŞTURMA — Notebook hücre [16]
# =============================================================================
def build_preprocessor(numeric_cols: list) -> ColumnTransformer:
    """
    Notebook'taki ColumnTransformer yapısını birebir oluşturur.
    - Sayısal: Median impute → StandardScaler
    - Ordinal:  Most-frequent impute → OrdinalEncoder
    - OneHot:   Most-frequent impute → OneHotEncoder
    """
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    ordinal_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ord", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
    ])

    onehot_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_cols),
            ("ordinal", ordinal_pipeline, ORDINAL_COLS),
            ("onehot", onehot_pipeline, ONEHOT_COLS),
        ],
        remainder="drop",  # cpuname, gpuname ve gereksiz kolonları çöpe at
    )
    return preprocessor


# =============================================================================
# 4. MODEL EĞİTİMİ & KAYDETME
# =============================================================================
def train_and_save_model() -> dict:
    """
    Veriyi okur, pipeline kurar, MLPRegressor ile eğitir, diske kaydeder.
    Eğitim metriklerini dict olarak döndürür.
    """
    print("📦 Veri yükleniyor ve ön-işleniyor...")
    df = load_and_prepare_data(DATA_PATH)

    # Hedef ve öznitelikleri ayır (notebook hücre [15])
    X = df.drop(columns=["fps"] + HIGH_CARDINALITY_DROP)
    y = df["fps"]

    # Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    # Sayısal kolonları otomatik tespit et (notebook hücre [16])
    numeric_cols = X_train.select_dtypes(include=["int64", "float64"]).columns.tolist()
    tum_kategorikler = ORDINAL_COLS + ONEHOT_COLS + HIGH_CARDINALITY_DROP
    numeric_cols = [col for col in numeric_cols if col not in tum_kategorikler]

    print(f"   Tespit edilen sayısal kolon sayısı: {len(numeric_cols)}")

    # Preprocessor oluştur
    preprocessor = build_preprocessor(numeric_cols)

    # Tam pipeline: Preprocessor → MLPRegressor
    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", MLPRegressor(random_state=RANDOM_STATE)),
    ])

    print("🧠 MLPRegressor eğitiliyor...")
    full_pipeline.fit(X_train, y_train)

    # Metrikler
    y_train_pred = full_pipeline.predict(X_train)
    y_test_pred = full_pipeline.predict(X_test)

    metrics = {
        "Train R² ": round(r2_score(y_train, y_train_pred), 4),
        "Test R²  ": round(r2_score(y_test, y_test_pred), 4),
        "RMSE     ": round(np.sqrt(mean_squared_error(y_test, y_test_pred)), 4),
    }

    for k, v in metrics.items():
        print(f"   {k}: {v}")

    # Modeli diske kaydet
    # Kaydedilen artefakt:
    #   - full_pipeline  → preprocessor + model (tek dosya)
    #   - numeric_cols   → inference sırasında aynı sıralamayı korumak için
    artifact = {
        "pipeline": full_pipeline,
        "numeric_cols": numeric_cols,
    }
    joblib.dump(artifact, MODEL_PATH)
    print(f"✅ Model kaydedildi → {MODEL_PATH}")

    return metrics


# =============================================================================
# 5. MODELİ YÜKLE (yoksa eğit)
# =============================================================================
def load_model() -> dict:
    """
    Eğer daha önce kaydedilmiş model varsa diskten yükler.
    Yoksa, eğitim sürecini tetikler ve ardından modeli döndürür.
    """
    if os.path.exists(MODEL_PATH):
        print(f"✅ Önceden eğitilmiş model yükleniyor → {MODEL_PATH}")
        artifact = joblib.load(MODEL_PATH)
        return artifact
    else:
        print("⚠️  Kaydedilmiş model bulunamadı. İlk eğitim başlatılıyor...\n")
        train_and_save_model()
        artifact = joblib.load(MODEL_PATH)
        return artifact


# =============================================================================
# 6. VERİSETİNDEN EŞLEME YARDIMCISI
# =============================================================================
def _get_hardware_row(df: pd.DataFrame, cpuname: str, gpuname: str) -> pd.Series | None:
    """
    Veriseti içerisinden cpuname ve gpuname ile eşleşen ilk satırı bulur.
    Bulamazsa None döndürür.
    """
    mask = (
        df["cpuname"].str.lower().str.contains(cpuname.lower(), na=False)
        & df["gpuname"].str.lower().str.contains(gpuname.lower(), na=False)
    )
    matches = df[mask]
    if matches.empty:
        return None
    return matches.iloc[0]


# =============================================================================
# 7. KULLANICI TAHMİN FONKSİYONU
# =============================================================================
def tahmin_et(
    islemci_ismi: str,
    ekran_karti_ismi: str,
    oyun_ismi: str,
    oyun_cozunurlugu: float,
    oyun_ayari: str = "b'max'",
) -> float | None:
    """
    Kullanıcının girdiği saf metin bilgilerini alarak tahmini FPS değerini döndürür.

    Parametreler
    ------------
    islemci_ismi     : str   – Örn: "Ryzen 5 3600", "i9-9900K"
    ekran_karti_ismi : str   – Örn: "RTX 2060", "RX 5700 XT"
    oyun_ismi        : str   – Örn: "fortnite", "dota2"
    oyun_cozunurlugu : float – Örn: 1080.0, 1440.0
    oyun_ayari       : str   – Örn: "b'max'" veya "b'med'"

    Dönüş
    ------
    float : Tahmin edilen FPS değeri, eşleşme bulunamazsa None.
    """
    # 1. Model ve pipeline'ı yükle
    artifact = load_model()
    pipeline = artifact["pipeline"]

    # 2. Referans verisini oku ve ön-işle (feature engineering dahil)
    df = load_and_prepare_data(DATA_PATH)

    # 3. CPU ve GPU isimlerini veriseti içinde eşleştir
    hw_row = _get_hardware_row(df, islemci_ismi, ekran_karti_ismi)
    if hw_row is None:
        print(f"\n❌ Hata: '{islemci_ismi}' + '{ekran_karti_ismi}' kombinasyonu veritabanında bulunamadı.")
        print("   Lütfen veritabanındaki isimleri kontrol edin (örn: \"b'Intel Core i9-9900K'\").")
        return None

    # 4. Satırı DataFrame'e çevir ve kullanıcı parametrelerini üstüne yaz
    input_row = hw_row.to_frame().T.copy()

    # Oyun bilgilerini kullanıcının girdiği değerlerle güncelle
    input_row["gamename"] = oyun_ismi
    input_row["gameresolution"] = oyun_cozunurlugu
    input_row["gamesetting"] = oyun_ayari

    # 5. fps ve yüksek kardinalite kolonlarını düşür (eğitim sırasındaki gibi)
    X_input = input_row.drop(columns=["fps"] + HIGH_CARDINALITY_DROP, errors="ignore")

    # 6. Pipeline üzerinden tahmin (preprocessing otomatik olarak yapılır)
    fps_pred = pipeline.predict(X_input)[0]

    # 7. Sonuçları yazdır
    print("\n" + "=" * 55)
    print("  🎮  SeeFPS — FPS Tahmin Sonucu")
    print("=" * 55)
    print(f"  İşlemci      : {islemci_ismi}")
    print(f"  Ekran Kartı  : {ekran_karti_ismi}")
    print(f"  Oyun         : {oyun_ismi}")
    print(f"  Çözünürlük   : {oyun_cozunurlugu}p")
    print(f"  Ayar         : {oyun_ayari}")
    print("-" * 55)
    print(f"  📊 Tahmini FPS: {fps_pred:.1f}")
    print("=" * 55)

    return fps_pred


# =============================================================================
# 8. MODÜLÜ DOĞRUDAN ÇALIŞTIRMA TESTİ
# =============================================================================
if __name__ == "__main__":
    print("=" * 55)
    print("  SeeFPS — Üretime Hazır FPS Tahmin Sistemi")
    print("=" * 55)
    print()

    # Model yoksa eğit, varsa yükle
    load_model()

    # Örnek tahmin (notebook verisindeki değerlerle test)
    print("\n--- Örnek Tahmin ---")
    tahmin_et(
        islemci_ismi="i9-9900K",
        ekran_karti_ismi="rtx 2080 ti",
        oyun_ismi="b'fortnite'",
        oyun_cozunurlugu=1080.0,
        oyun_ayari="b'max'",
    )
