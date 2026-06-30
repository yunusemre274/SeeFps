<div align="center">

# 🎯 SeeFps

### **Predict Your Performance. Optimize Your Hardware.**

*An AI-powered virtual benchmark platform with desktop simulation clients that predict your gaming FPS, thermals, and bottlenecks — without running a single frame of the actual game.*

&nbsp;

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](#)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge&logo=semanticrelease&logoColor=white)](#)
[![Python](https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![Scikit Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](#)

&nbsp;

<img src="https://img.shields.io/badge/Hub_%26_Spoke_Architecture-FF6F61?style=for-the-badge" alt="Hub and Spoke" />
<img src="https://img.shields.io/badge/Zero_Mock_Data-2ECC71?style=for-the-badge" alt="Zero Mock Data" />
<img src="https://img.shields.io/badge/Virtual_Simulation-8A2BE2?style=for-the-badge" alt="Virtual Simulation" />

</div>

---

## 📖 Proje Hakkında (About The Project)

**SeeFps**, piyasadaki geleneksel "Sistem gereksinimlerimi karşılıyor mu?" sitelerinden tamamen farklı bir vizyonla inşa edilmiş, uçtan uca (end-to-end) bir performans tahmin ve analiz platformudur. 

Temelinde, binlerce gerçek benchmark verisiyle eğitilmiş ve **0.9997 R² skoruna** sahip bir **MLPRegressor** (Çok Katmanlı Algılayıcı - Yapay Sinir Ağı) modeli yatar. Ancak SeeFps sadece statik bir tahmin sunmaz. Masaüstünüze inen **Simülasyon İstemcisi (Simulation App)** sayesinde oyun motorlarının (Unreal Engine, Source vb.) dinamik yüklerini (partikül efektleri, yansımalar, fizik motoru) bilgisayarınızda sanal olarak çalıştırarak ısınma ve darboğaz (bottleneck) durumlarını anlık olarak hesaplar.

---

## 🏗️ Mimari Yapı: Hub & Spoke (Merkez ve Uçlar)

Proje, modern ve ölçeklenebilir **Hub & Spoke** mimarisi üzerine kurulmuştur. Web platformu "Merkez" (Hub) olarak çalışırken, masaüstü uygulamaları bağımsız "Uçlar" (Spokes) olarak görev yapar.

```text
                    ┌──────────────────────────────────────┐
                    │        🌐 WEB PLATFORM (HUB)         │
                    │                                      │
                    │   ┌──────────────────────────────┐   │
                    │   │        FRONTEND (UI)         │   │
                    │   │  React / TS / WebSocket UI   │   │
                    │   └─────────────┬────────────────┘   │
                    │                 │ REST API + WSS     │
                    │   ┌─────────────▼────────────────┐   │
                    │   │    BACKEND API (FastAPI)     │   │
                    │   │ 🧠 ML Service (Inference)    │   │
                    │   │ 📊 Data Service (Dataset)    │   │
                    │   └──┬──────────────────────┬───┘   │
                    └──────┼──────────────────────┼───────┘
                           │                      │
               ┌───────────▼──────┐   ┌───────────▼──────────┐
               │  🔍 DETECTION    │   │  🎮 SIMULATION APP   │
               │     APP          │   │  (Desktop Client)    │
               │  (Spoke 1)       │   │  (Spoke 2)           │
               │                  │   │                      │
               │ - psutil/GPUtil  │   │ - Virtual Benchmark  │
               │ - Auto-scans HW  │   │ - Engine Load Tables │
               │ - POST → API     │   │ - Stream progress    │
               └──────────────────┘   └──────────────────────┘
```

### 1. Web Platform (Hub Core - FastAPI)
*   Sistemin kalbidir. Frontend'e verileri sağlar, masaüstü istemcilerinden gelen verileri işler.
*   **Orkestrasyon & Servisler:**
    *   **Data Service:** "Zero Mock Data" prensibiyle çalışır. Arayüzdeki işlemci, ekran kartı ve oyun listelerini statik dosyalardan değil, doğrudan Yapay Zeka'nın eğitildiği gerçek veri setini analiz ederek dinamik olarak oluşturur.
    *   **ML Service (Thread-Safe):** Ayrı bir dosyada (`predict_fps.py`) bulunan eğitilmiş Scikit-Learn modelini (Adapter deseni ile) sisteme entegre eder. Model belleğe bir kez yüklenir (Singleton) ve yüksek performanslı tahminler (inference) yapar.
    *   **Simulation Manager:** Masaüstü simülasyonundan gelen durum güncellemelerini alır ve **WebSocket** (WSS) üzerinden anlık olarak Frontend'e (Kullanıcının tarayıcısına) iter (push).

### 2. Detection App (Spoke 1 - Donanım Tarayıcı)
*   Python tabanlı masaüstü CLI uygulamasıdır. `psutil`, `GPUtil`, ve `py-cpuinfo` kullanarak kullanıcının bilgisayarındaki İşlemci, Ekran Kartı, RAM ve Disk özelliklerini OS seviyesinde okur.
*   Okunan verileri Backend'e gönderir. Backend, "Fuzzy Matching" (Bulanık Eşleştirme) algoritması kullanarak bu donanımları ML veri setindeki temiz isimlerle eşleştirir.

### 3. Simulation App (Spoke 2 - Sanal Benchmark)
*   Oyun indirmeden sistemin nasıl tepki vereceğini ölçer.
*   Oyun motoru dinamiklerini (örneğin Unreal Engine 4'teki gölge, partikül ve yansıma yüklerini) içeren mantıksal profiller kullanır.
*   9 farklı sahneden (Texture Loading, GPU Stress, Particle FX vb.) oluşan bir sanal benchmark koşar. Heuristik yöntemlerle anlık sıcaklık ve saat hızlarını hesaplayıp Backend'e canlı raporlar.

---

## 🛠️ Kullanılan Teknolojiler (Tech Stack)

### Backend & ML Katmanı
*   **Dil:** Python 3.10+
*   **Framework:** FastAPI (Yüksek performanslı, asenkron REST API)
*   **Sunucu:** Uvicorn (ASGI web sunucusu)
*   **Makine Öğrenimi (ML):** Scikit-Learn (`MLPRegressor`), Pandas, NumPy, Joblib (Model serileştirme).
*   **Gerçek Zamanlı İletişim:** WebSockets (Starlette tabanlı).

### Masaüstü İstemciler (Desktop Apps)
*   **Dil:** Python 3.10+
*   **Arayüz:** `Rich` (Gelişmiş Terminal Kullanıcı Arayüzü - TUI, paneller, yükleme barları).
*   **Sistem Erişimi:** `psutil` (CPU/RAM/Disk), `GPUtil` (GPU), `screeninfo` (Çözünürlük).
*   **Ağ İletişimi:** `requests` (Retry ve backoff mekanizmalı API istemcisi).

### Frontend Katmanı
*   **Teknolojiler:** React, TypeScript, Tailwind CSS (Bileşen isimlerinden ve hook yapılarından yola çıkarak).
*   **Öne Çıkanlar:** Custom Hook'lar (`useSimulationStatus`, `useHardwareData`), dinamik "Analyzing..." ekranları.

---

## 🚀 Kurulum ve Çalıştırma Rehberi (Local Development)

Projeyi kendi bilgisayarınızda (lokalinizde) ayağa kaldırmak ve tam entegre E2E (Uçtan Uca) akışı test etmek için aşağıdaki adımları sırasıyla uygulayın.

### Ön Koşullar (Prerequisites)
*   Sisteminizde **Python 3.10 veya üzeri** yüklü olmalıdır.
*   Terminal kullanımı ve temel `git` bilgisi gereklidir.

### Adım 1: Repoyu Klonlayın
```bash
git clone https://github.com/your-username/SeeFps.git
cd SeeFps
```

### Adım 2: Backend (Hub) Kurulumu ve Başlatılması
FastAPI sunucusu, tüm sistemin merkezidir.

```bash
# Backend klasörüne geçin
cd backend

# Sanal ortam (Virtual Environment) oluşturun
python -m venv venv

# Sanal ortamı aktifleştirin
# macOS / Linux için:
source venv/bin/activate
# Windows için:
# venv\Scripts\activate

# Gerekli kütüphaneleri yükleyin
pip install -r requirements.txt
pip install uvicorn

# Sunucuyu başlatın
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
✅ **Başarılı:** Sunucu `http://localhost:8000` adresinde çalışıyor olmalı. Tarayıcınızdan `http://localhost:8000/docs` adresine giderek Swagger UI (API Dokümantasyonu) arayüzünü görebilirsiniz.

*(Bu terminali açık bırakın, sunucu arka planda çalışmaya devam etmelidir.)*

### Adım 3: Detection App (Uç 1) Kurulumu ve Testi
Yeni bir terminal penceresi açın. Bu uygulama bilgisayarınızın donanımını tarayıp Backend ile eşleştirecektir.

```bash
# Proje ana dizininden detection-app'e geçin
cd desktop/detection-app

# Gereksinimleri yükleyin
pip install -r requirements.txt

# Önce API'ye veri GÖNDERMEDEN sadece tarama testi yapın (Dry Run)
python main.py --dry-run

# Backend'e bağlanarak gerçek tarama ve eşleştirme yapın
python main.py
```
✅ **Başarılı:** Terminalde donanımlarınızın bulunduğunu ve Backend API'ye (http://localhost:8000) başarıyla gönderildiğini (200 OK) görmelisiniz.

### Adım 4: Simulation App (Uç 2) Kurulumu ve Testi
Bu uygulama sanal bir benchmark simülasyonu koşar ve sonuçları (WebSocket tetikleyicileri ile) Backend'e iletir.

```bash
# Proje ana dizininden simulation-app'e geçin
cd desktop/simulation-app

# Gereksinimleri yükleyin
pip install -r requirements.txt

# Hızlı (speed 0.1) bir simülasyon testi yapın
# Not: İstediğiniz cpu, gpu ve oyunu parametre olarak verebilirsiniz.
python3 main.py --cpu "i9-9900K" --gpu "rtx 2080 ti" --game "fortnite" --engine "Unreal Engine 4" --speed 0.1
```
✅ **Başarılı:** Terminalde 9 aşamalı bir simülasyonun çalıştığını, Backend'e aşamaların raporlandığını ve en sonunda ML modelinden dönen **Tahmini FPS (Predicted FPS)** değerini görmelisiniz.

---

## 🧪 E2E (Uçtan Uca) Entegrasyon Testleri

SeeFps projesi, 7 farklı kategoride toplam **37 adet E2E Entegrasyon Testi** içerir. Bu testler Backend API'sini, ML entegrasyonunu, Donanım eşleştirmesini ve WebSocket iletişimini otomatik olarak doğrular.

Testleri çalıştırmak için (Backend sunucunuzun 8000 portunda çalışıyor olduğundan emin olun):

```bash
# Proje ana dizininde (SeeFps klasöründe) çalıştırın
python3 tests/e2e_test.py
```

**Test Kapsamı:**
1.  **Backend Temel Sağlık:** API ayakta mı?
2.  **Dropdown Verileri:** Zero Mock Data çalışıyor mu? (Veri setinden CPU/GPU listeleri çekilebiliyor mu?)
3.  **Detection App Akışı:** Bilinen ve bilinmeyen donanım eşleştirme senaryoları.
4.  **Simulation App Akışı:** Session başlatma, Aşama ilerletme, ML tahmini alma.
5.  **Hata Senaryoları:** Yanlış endpointler, geçersiz veriler (404, 400, 422).
6.  **Eşzamanlı Kullanıcı Performansı:** Aynı anda 5 simülasyonun (Concurrency) backend'i kitlemeden işlenmesi.
7.  **WebSocket Canlı Testi:** Sunucu ile anlık mesaj alışverişi.

*Tüm testlerin %100 başarı oranıyla (37/37) geçmesi beklenmektedir.*

---

## 🤝 Katkıda Bulunma (Contributing)
Geliştirmelere açığız! Katkıda bulunmak isterseniz lütfen bir `Pull Request` açmadan önce ilgili issue üzerinden tartışma başlatın ve yazdığınız kodların mevcut E2E testlerinden geçtiğinden emin olun.

## 📄 Lisans
Bu proje MIT Lisansı ile lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakabilirsiniz.
