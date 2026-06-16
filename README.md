<div align="center">

# 🎯 SeeFps

### **Predict Your Performance. Optimize Your Hardware.**

*An AI-powered virtual benchmark platform that predicts your gaming FPS, thermals, and bottlenecks — without running a single frame.*

&nbsp;

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](#)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-blue?style=for-the-badge&logo=semanticrelease&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](#license)
[![Python](https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#tech-stack)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#tech-stack)
[![Scikit Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](#tech-stack)

&nbsp;

<img src="https://img.shields.io/badge/%E2%9C%A8_No_GPU_Required_for_Testing-8A2BE2?style=for-the-badge" alt="No GPU Required" />

</div>

---

## 📖 About The Project

**SeeFps** is not your typical "will it run?" website that pulls numbers from a static database. It is a **full end-to-end web platform** that combines real-world hardware specifications, game engine dynamics, and a high-accuracy machine learning model to deliver **personalized performance predictions** you can actually trust.

At its core, SeeFps is powered by a **MLPRegressor neural network** trained on thousands of real benchmark data points, achieving an **R² score of 0.9997** — meaning its predictions are nearly indistinguishable from actual test results. But raw prediction is only half the story. SeeFps wraps that intelligence inside a **logical benchmark simulation** that factors in game-specific rendering loads: particle systems, reflections, volumetric smoke, character abilities, and map complexity. The result is not a single generic number, but a **context-aware performance profile** tailored to the exact scenario you care about.

Whether you're planning a hardware upgrade, comparing build configurations, or just curious how your rig handles that one notoriously heavy map — SeeFps gives you the answer **in seconds, without downloading anything, and without stressing your actual hardware.**

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🔍 Hardware Detection
Automatically scan your local system specs with the built-in **Detection App** — CPU, GPU, RAM, storage, and display resolution pulled directly from your machine.

### 🎛️ Manual Selection
Prefer to test a different configuration? Use the intuitive **multi-select bars** to hand-pick any CPU, GPU, RAM, SSD, and resolution combination from our extensive database.

### 🎮 Game & Map Selection
Choose your target platform, game title, and specific map. Each map carries its own rendering profile — because not all arenas are created equal.

</td>
<td width="50%" valign="top">

### 🧠 AI-Powered Prediction
A production-grade **MLPRegressor pipeline** (R² ≈ 0.9997) processes 14 engineered features through imputation, scaling, and encoding to deliver highly accurate FPS estimates.

### 🔥 Engine Dynamics Simulation
Go beyond raw FPS. SeeFps simulates **game engine load factors** — smoke grenades, molotov fires, ability VFX, ray-traced reflections — to show how performance shifts under real gameplay stress.

### 📊 Comprehensive Results
Get the full picture: **Max / Min / Avg FPS**, CPU & GPU temperatures, fan RPM estimates, and clock speed projections — all in one beautiful results dashboard.

</td>
</tr>
</table>

---

## 🏗️ Architecture & Tech Stack

SeeFps is built as a **modular, layered architecture** where each component is independently developed, tested, and deployed.

```
┌─────────────────────────────────────────────────────────┐
│                    🖥️  FRONTEND                         │
│              HTML / CSS / JS (or React)                  │
│     Splash Screen • Forms • Animations • Results UI      │
├─────────────────────────────────────────────────────────┤
│                    ⚡ BACKEND API                        │
│               Python + FastAPI + Uvicorn                  │
│       REST Endpoints • Validation • Business Logic       │
├─────────────────────────────────────────────────────────┤
│                  🧠 ML ENGINE                            │
│            Scikit-learn + Joblib Pipeline                 │
│    Feature Engineering • Inference • Model Serving       │
├─────────────────────────────────────────────────────────┤
│                  🔧 DETECTION APP                        │
│          Python (psutil / GPUtil / cpuinfo)               │
│         Local Hardware Scanning & Reporting              │
└─────────────────────────────────────────────────────────┘
```

| Layer               | Technology                          | Purpose                                   |
| ------------------- | ----------------------------------- | ----------------------------------------- |
| **Frontend**        | HTML, CSS, JavaScript (or React)    | User interface, animations, SPA experience |
| **Backend API**     | Python 3.10+, FastAPI, Uvicorn      | REST API, data validation, ML serving      |
| **ML Engine**       | Scikit-learn, Joblib, NumPy, Pandas | MLPRegressor inference pipeline            |
| **Detection App**   | psutil, GPUtil, py-cpuinfo          | Local hardware auto-detection              |

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

### 2️⃣ Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` and interactive docs at `http://localhost:8000/docs`.

### 3️⃣ Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# If using vanilla HTML/CSS/JS — simply open index.html or use a live server:
npx serve .

# If using React:
# npm install
# npm run dev
```

### 4️⃣ Detection App *(Optional)*

```bash
# Navigate to the detection directory
cd detection

pip install -r requirements.txt
python detector.py
```

> [!NOTE]
> The Detection App requires local execution on the user's machine to access hardware information. It communicates with the web platform via the Backend API.

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Detection tests
cd detection
pytest tests/ -v
```

---

## 📸 Application Flow

```
  ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐     ┌──────────┐
  │  Splash  │────▶│  Hardware    │────▶│  Game &     │────▶│ Benchmark  │────▶│ Results  │
  │  Screen  │     │  Detection   │     │  Map Select │     │ Simulation │     │ Dashboard│
  └──────────┘     │  / Manual    │     └─────────────┘     └────────────┘     └────┬─────┘
                   └──────────────┘                                                  │
                          ▲                                                          │
                          └──────────────────── 🔄 Re-test ─────────────────────────┘
```

---

## 🤖 ML Model Details

| Metric                | Value                           |
| --------------------- | ------------------------------- |
| **Algorithm**         | MLPRegressor (Neural Network)   |
| **R² Score**          | ≈ 0.9997                        |
| **Engineered Features** | 14 custom features            |
| **Preprocessing**     | SimpleImputer → StandardScaler / OrdinalEncoder / OneHotEncoder |
| **Serialization**     | Joblib (pipeline + metadata)    |
| **Training Data**     | Thousands of real benchmark records |

The model processes hardware specifications through a sophisticated **ColumnTransformer** pipeline that handles numeric scaling, ordinal encoding for GPU capabilities (DirectX, OpenCL, Vulkan support levels), and one-hot encoding for categorical features like game names and GPU architectures.

---

## 📁 Project Structure

```
SeeFps/
├── CLAUDE.md                   # AI agent rules & project guidelines
├── README.md                   # ← You are here
├── .gitignore
│
├── TrainedData/                # Pre-trained ML artifacts
│   ├── seefps_model.joblib     # Trained MLPRegressor pipeline
│   ├── predict_fps.py          # Production-ready inference module
│   ├── main.ipynb              # Research & training notebook
│   └── *.csv                   # Training datasets
│
├── backend/                    # FastAPI REST API
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── tests/
│
├── frontend/                   # Web UI
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
└── detection/                  # Hardware detection tool
    ├── detector.py
    └── tests/
```

---

## ⚠️ Disclaimer

> **SeeFps is not a real-time 3D rendering engine or an actual benchmark tool.**
>
> It does not render frames, execute game binaries, or stress-test your hardware. SeeFps is a **data-driven, AI-powered prediction and logical simulation platform**. All performance estimates (FPS, temperatures, fan speeds, clock rates) are generated by machine learning models trained on real-world benchmark data and enhanced with game engine load heuristics.
>
> Results should be treated as **informed estimates** — highly accurate, but not a replacement for running the actual game on your hardware. Think of it as a *virtual test drive* for your PC's gaming performance.

---

## 🗺️ Roadmap

- [x] ML model training & validation (R² ≈ 0.9997)
- [x] Production-ready inference module (`predict_fps.py`)
- [x] Frontend UI design
- [ ] Backend API (FastAPI) — *in progress*
- [ ] ML model integration via REST endpoints
- [ ] Hardware Detection App
- [ ] Frontend ↔ Backend integration
- [ ] Benchmark simulation engine
- [ ] End-to-end testing & deployment
- [ ] Mobile-responsive UI polish

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
