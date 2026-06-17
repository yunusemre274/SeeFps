<div align="center">

# 🎯 SeeFps

### **Predict Your Performance. Optimize Your Hardware.**

*An AI-powered virtual benchmark platform with desktop simulation clients that predict your gaming FPS, thermals, and bottlenecks — without running a single frame of the actual game.*

&nbsp;

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](#)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-blue?style=for-the-badge&logo=semanticrelease&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](#license)
[![Python](https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#-architecture--tech-stack)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#-architecture--tech-stack)
[![Scikit Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](#-architecture--tech-stack)

&nbsp;

<img src="https://img.shields.io/badge/Hub_%26_Spoke_Architecture-FF6F61?style=for-the-badge" alt="Hub and Spoke" />
<img src="https://img.shields.io/badge/Zero_Mock_Data-2ECC71?style=for-the-badge" alt="Zero Mock Data" />
<img src="https://img.shields.io/badge/Desktop_Simulation_Engine-8A2BE2?style=for-the-badge" alt="Desktop Simulation" />

</div>

---

## 📖 About The Project

**SeeFps** is not your typical "will it run?" website that pulls numbers from a static database. It is a **full end-to-end platform** built on a **Hub & Spoke architecture** — combining a central web platform (Hub) with dedicated desktop clients (Spokes) for hardware detection and benchmark simulation — all powered by a high-accuracy machine learning model.

At its core, SeeFps is driven by a **MLPRegressor neural network** trained on thousands of real benchmark data points, achieving an **R² score of 0.9997** — meaning its predictions are nearly indistinguishable from actual test results. But raw prediction is only half the story. The **Desktop Simulation App** runs a virtual benchmark engine directly on the user's machine, modeling game-specific rendering loads — particle systems, reflections, volumetric smoke, character abilities, and map complexity — to produce a **context-aware performance profile** tailored to the exact scenario you care about.

Unlike traditional web-based estimators, SeeFps uses **zero mock data**. Every hardware option, every game entry, and every selection dropdown is dynamically fed from the trained ML dataset through a FastAPI backend. The **Detection App** automatically scans your local hardware, while the **Simulation App** runs the benchmark locally and streams real-time progress back to the website, where users watch a live "Analyzing..." screen before results appear.

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🔍 Hardware Detection App
A lightweight desktop client that automatically scans your system — **CPU, GPU, RAM, SSD, and display resolution** — and securely sends the data to the web platform via the Backend API.

### 🎛️ Smart Selection Boxes
No sliders. No guesswork. Choose your hardware from **dedicated dropdown selection boxes** for CPU, GPU, RAM, SSD, and resolution — each populated dynamically from the trained ML dataset. Search, filter, and select with precision.

### 🎮 Game & Map Selection
Choose your target platform, game title, and specific map. Each map carries its own rendering profile — because not all arenas are created equal.

</td>
<td width="50%" valign="top">

### 💻 Desktop Simulation App
The benchmark doesn't run in your browser — it runs on **your machine**. The Simulation App downloads to your desktop, executes a virtual benchmark with game engine dynamics (smoke, abilities, reflections, particles), and uploads results back to the web platform.

### ⏳ Live Analyzing State
While the Simulation App works, the website displays a **dynamic "Analyzing..." screen** with real-time progress updates via WebSocket — stage indicators, progress bars, and status messages keep you informed every step of the way.

### 📊 Comprehensive Results
Get the full picture: **Max / Min / Avg FPS**, CPU & GPU temperatures, fan RPM estimates, clock speed projections, and **bottleneck analysis** — all in one beautiful results dashboard.

</td>
</tr>
</table>

---

## 🏗️ Architecture & Tech Stack

SeeFps follows a **Hub & Spoke architecture** where the Web Platform serves as the central hub, and desktop clients operate as independent spokes communicating through the Backend API.

```
                    ┌──────────────────────────────────────┐
                    │        🌐 WEB PLATFORM (HUB)         │
                    │                                      │
                    │   ┌──────────────────────────────┐   │
                    │   │        FRONTEND (UI)          │   │
                    │   │   Selection Boxes (Dropdowns) │   │
                    │   │   Analyzing State Screen      │   │
                    │   │   Results Dashboard           │   │
                    │   └─────────────┬────────────────┘   │
                    │                 │ REST API            │
                    │   ┌─────────────▼────────────────┐   │
                    │   │    BACKEND API (FastAPI)      │   │
                    │   │   ML Service • Data Service   │   │
                    │   │   WebSocket • Session Mgmt    │   │
                    │   └──┬──────────────────────┬───┘   │
                    └──────┼──────────────────────┼───────┘
                           │                      │
               ┌───────────▼──────┐   ┌───────────▼──────────┐
               │  🔍 DETECTION    │   │  🎮 SIMULATION APP   │
               │     APP          │   │  (Desktop Client)    │
               │  (Desktop)       │   │                      │
               │                  │   │  ML Model Inference  │
               │  Scans HW specs  │   │  Benchmark Engine    │
               │  POST → API      │   │  POST results → API  │
               │  (Spoke 1)       │   │  (Spoke 2)           │
               └──────────────────┘   └──────────────────────┘
```

| Layer                       | Technology                          | Purpose                                               |
| --------------------------- | ----------------------------------- | ----------------------------------------------------- |
| **Frontend (Web Hub)**      | HTML, CSS, JavaScript (or React)    | Selection boxes, analyzing state, results dashboard    |
| **Backend API (Hub Core)**  | Python 3.10+, FastAPI, Uvicorn      | REST API, WebSocket, data service, session management  |
| **ML Engine**               | Scikit-learn, Joblib, NumPy, Pandas | MLPRegressor inference pipeline                        |
| **Detection App (Spoke 1)** | Python (psutil, GPUtil, cpuinfo)    | Local hardware auto-detection & API reporting          |
| **Simulation App (Spoke 2)**| Python (or Electron / C#)           | Desktop benchmark simulation & result upload           |

> [!IMPORTANT]
> **The benchmark simulation does NOT run in the browser.** It executes on the user's
> machine via the Desktop Simulation App and reports results back through the API.

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** installed on your system
- **Node.js 18+** *(only if using a JS build tool for frontend)*
- **Git**

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/SeeFps.git
cd SeeFps
```

### 2️⃣ Backend Setup (Hub Core)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn server:app --reload --port 8000
```

The API will be available at `http://localhost:8000` and interactive docs at `http://localhost:8000/docs`.

> [!NOTE]
> The FastAPI entry point is **`server.py`**, not `main.py`. The existing `TrainedData/main.py`
> is a data cleaning script — naming it `server.py` avoids confusion.

### 3️⃣ Frontend Setup

```bash
cd frontend

# Vanilla HTML/CSS/JS — use a live server:
npx serve .

# If using React:
# npm install
# npm run dev
```

### 4️⃣ Detection App (Spoke 1)

```bash
cd detection

pip install -r requirements.txt
python detector.py
```

### 5️⃣ Simulation App (Spoke 2)

```bash
cd simulation

pip install -r requirements.txt
python simulator.py
```

> [!NOTE]
> Both desktop apps require local execution on the user's machine. The Detection App
> scans hardware specs, and the Simulation App runs the benchmark engine. Both
> communicate with the web platform exclusively through the Backend API.

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend && pytest tests/ -v

# Detection app tests
cd detection && pytest tests/ -v

# Simulation app tests
cd simulation && pytest tests/ -v
```

---

## 📸 Application Flow

```
                                    ┌──────────────┐
                                    │    Splash    │
                                    │    Screen    │
                                    └──────┬───────┘
                                           │
                           ┌───────────────▼───────────────┐
                           │     Hardware Input             │
                           │                               │
                ┌──────────┴──────────┐  ┌─────────────────┴──┐
                │  🔍 Detection App   │  │  🎛️ Selection Boxes │
                │  (Desktop — auto)   │  │  CPU ▼  GPU ▼      │
                │         │           │  │  RAM ▼  SSD ▼      │
                │    POST /api/detect │  │  Resolution ▼      │
                └──────────┬──────────┘  └─────────────────┬──┘
                           └───────────────┬───────────────┘
                                           │
                                    ┌──────▼───────┐
                                    │  Game & Map  │
                                    │  Selection   │
                                    └──────┬───────┘
                                           │
                           ┌───────────────▼───────────────┐
                           │      Benchmark Phase          │
                           │                               │
                ┌──────────┴──────────┐  ┌─────────────────┴──┐
                │ 💻 Simulation App   │  │  🌐 Website shows   │
                │ (runs on desktop)   │  │  "Analyzing..." UI  │
                │ Benchmark engine    │  │  Live progress via  │
                │ executes locally    │  │  WebSocket updates   │
                │         │           │  │         ▲            │
                │  POST results → API─┼──┼─────────┘            │
                └─────────────────────┘  └──────────────────────┘
                                           │
                                    ┌──────▼───────┐
                                    │   Results    │
                                    │  Dashboard   │
                                    │  FPS • Temp  │
                                    │  RPM • Clock │
                                    │  Bottleneck  │
                                    └──────┬───────┘
                                           │
                                    🔄 Re-test
                                    (back to HW input)
```

---

## 🤖 ML Model Details

| Metric                  | Value                                              |
| ----------------------- | -------------------------------------------------- |
| **Algorithm**           | MLPRegressor (Neural Network)                      |
| **R² Score**            | ≈ 0.9997                                           |
| **Engineered Features** | 14 custom features                                 |
| **Preprocessing**       | SimpleImputer → StandardScaler / OrdinalEncoder / OneHotEncoder |
| **Serialization**       | Joblib (pipeline + metadata)                       |
| **Training Data**       | Thousands of real benchmark records                |
| **Data Policy**         | **Zero mock data** — all UI selections fed from trained dataset |

The model processes hardware specifications through a sophisticated **ColumnTransformer** pipeline that handles numeric scaling, ordinal encoding for GPU capabilities (DirectX, OpenCL, Vulkan support levels), and one-hot encoding for categorical features like game names and GPU architectures.

---

## 📁 Project Structure

```
SeeFps/
├── CLAUDE.md                   # AI agent rules & project guidelines
├── README.md                   # ← You are here
├── Roadmap.md                  # Development roadmap & task tracking
├── .gitignore
│
├── TrainedData/                # Pre-trained ML artifacts (read-only)
│   ├── seefps_model.joblib     # Trained MLPRegressor pipeline
│   ├── predict_fps.py          # Production-ready inference module
│   ├── main.ipynb              # Research & training notebook
│   └── *.csv                   # Training datasets
│
├── backend/                    # 🌐 Hub Core — FastAPI REST API + WebSocket
│   ├── server.py               # ⚠️ Entry point (NOT main.py)
│   ├── routers/
│   ├── services/
│   └── tests/
│
├── frontend/                   # 🌐 Hub UI — Web Interface
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── detection/                  # 🔍 Spoke 1 — Desktop Hardware Scanner
│   ├── detector.py
│   ├── api_client.py
│   └── tests/
│
└── simulation/                 # 🎮 Spoke 2 — Desktop Benchmark Engine
    ├── simulator.py
    ├── ml_adapter.py
    ├── api_client.py
    └── tests/
```

---

## ⚠️ Disclaimer

> **SeeFps is not a real-time 3D rendering engine or an actual game benchmark tool.**
>
> It does not render frames, execute game binaries, or stress-test your hardware in the traditional sense. SeeFps is a **data-driven, AI-powered prediction platform** with a **desktop simulation engine** that models game engine dynamics through mathematical load factors and machine learning inference.
>
> The Desktop Simulation App runs a **virtual benchmark** — it does not launch or interact with actual games. All performance estimates (FPS, temperatures, fan speeds, clock rates) are generated by ML models trained on real-world benchmark data, enhanced with game engine load heuristics.
>
> Results should be treated as **informed estimates** — highly accurate, but not a replacement for running the actual game on your hardware. Think of it as a *virtual test drive* for your PC's gaming performance.

---

## 🗺️ Roadmap

- [x] ML model training & validation (R² ≈ 0.9997)
- [x] Production-ready inference module (`predict_fps.py`)
- [x] Frontend UI design (Lovable)
- [ ] Frontend refactoring — mock data removal, selection boxes, analyzing state
- [ ] Backend API (FastAPI) — REST endpoints, WebSocket, data service
- [ ] ML model integration via API / Simulation App
- [ ] Desktop Detection App (hardware scanning)
- [ ] Desktop Simulation App (benchmark engine)
- [ ] Frontend ↔ Backend integration
- [ ] Detection App ↔ Backend integration
- [ ] Simulation App ↔ Backend ↔ Frontend integration
- [ ] End-to-end testing & deployment
- [ ] Mobile-responsive UI polish

See [Roadmap.md](Roadmap.md) for the detailed, phased task breakdown.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 📬 Contact

**Project Maintainer:** Yunus Emre

**Project Link:** [https://github.com/your-username/SeeFps](https://github.com/your-username/SeeFps)

---

<div align="center">

**Built with 🧠 Machine Learning and ❤️ for PC Gaming**

*SeeFps — See your frames before you play.*

</div>
