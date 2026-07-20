# SoundScape 🎧🍃

<div align="center">
  <p><strong>A Next-Generation Ambient Focus Suite, Web Audio Synthesizer, & Productivity Workspace</strong></p>

  [![CI](https://github.com/SaiVardhan337/SoundScape/actions/workflows/ci.yml/badge.svg)](https://github.com/SaiVardhan337/SoundScape/actions/workflows/ci.yml)
  [![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
  [![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-orange?style=for-the-badge&logo=web-audio-api)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
  [![Python FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
</div>

---

SoundScape is a premium, offline-first productivity workspace combining mathematical sound synthesis, dynamic environment synchronization, and gamified progress tracking. Whether writing novels, compiling scripts, or annotating research papers, SoundScape wraps your workspace in a gorgeous, eye-friendly cream parchment interface designed to keep your mind locked in deep flow.

---

## 🚀 Key Architectural Pillars

### 1. 🎛️ Physical Audio Synthesis & Soundboards
*   **Generative Wind Chimes:** Procedurally models clamped metal tube resonances using Web Audio oscillators. Features fundamental pitches in a pentatonic scale and inharmonic overtones (`1.0`, `2.76`, `5.40`, `8.93`) with natural ring-outs.
*   **Procedural Bird Chirps:** Synthesizes random forest tweets on-the-fly using exponential frequency sweeps (`2600Hz` to `3900Hz`) to create organic, non-repeating nature soundscapes.
*   **Binaural Beats:** Mathematical carrier wave sweeps for Delta, Theta, Alpha, and Beta brainwave states to stimulate focus, active calculation, or deep sleep.
*   **IndexedDB Loop Uploader:** Drag and drop custom `.mp3` or `.wav` ambient files. Saved locally to browser IndexedDB memory to create infinite personal mixing desks.

### ⌨️ 2. Web Audio Mechanical Keyboard Engine
An immersive sound synthesizer triggering key strike click and spacebar clacks directly inside the browser Web Audio graph:
*   **Typewriter:** Classic metallic strike clicks with return bell chimes on Enter.
*   **Cherry MX Blue:** High-pitched, clicky spring snaps and hollow case slides.
*   **Gateron Brown:** Soft, rounded tactile bottom-outs for quiet workspaces.
*   **NK Cream:** Deep, thuddy wooden-casing clacks for linear enthusiasts.
*   **Raindrops:** Clean, liquid pop droplets for a relaxing typing rhythm.

### 🎮 3. Focus Quest RPG Sidebar
Turn writing and coding milestones into retro RPG progress:
*   **Animated Knight Hero:** Smooth SVG vector sprite walks, bounces, and attacks on your sidebar.
*   **Loot & XP Economy:** Earn gold coins and experience points per word written or focus minutes accumulated.
*   **Log Console:** Tracks slayed monsters (like *Syntax Slimes* or *Distraction Bugs*), level-ups, and game events. Progress is stored persistently in `localStorage`.

### 🌤️ 4. Dynamic Time-of-Day Sync
An automated environmental scheduler synced to your local clock:
*   *Morning (6AM - 12PM):* Light Theme, Leaf Shadow wall backdrop, 30% Forest Birds.
*   *Afternoon (12PM - 5PM):* Light Theme, Solid layout, 25% Lofi Study Beats.
*   *Evening (5PM - 8PM):* Dark Theme, Sunset wallpaper, 30% Lofi + 15% Forest Birds.
*   *Night (8PM - 6AM):* Dark Theme, Rainy window cabin wallpaper, 35% Rain & Thunder.

### 🎨 5. Dev Mode: CSS Customizer Sandbox
*   Paste custom CSS variables to skin your notepad, buttons, or backgrounds.
*   Instantly compiles and injects layout properties with local persistence and a one-click reset safety net.

---

<div align="center">
  <h3>🌌 Premium Dark Mode Study Workspace</h3>
  <img src="static/images/dark_mode_preview.png?v=2" alt="SoundScape Dark Mode Workspace" width="100%" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"/>
</div>

---

## 📂 Repository File Structure

```
soundscape/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow
├── api/
│   ├── index.py               # FastAPI application endpoints
│   ├── database.py            # SQLite database config and connection mapping
│   └── models.py              # SQLAlchemy note & session schemas
├── examples/
│   ├── quickstart.py          # Programmatic API client example
│   └── README.md              # Examples usage guide
├── static/
│   ├── index.html             # Dashboard structure, SVG sprite assets, drawers
│   ├── css/
│   │   └── styles.css         # Theme styles, customizer variables, keyframes
│   ├── js/
│   │   ├── audio.js           # Web Audio synthesizers & routing
│   │   ├── stats.js           # Chart.js weekly summary metrics
│   │   └── app.js             # RPG engine, outline parser, IndexedDB uploader
│   └── images/
│       └── dark_mode_preview.png # Live dark mode workspace screenshot
├── tests/
│   └── test_api.py            # Pytest test suite for REST API endpoints
├── CONTRIBUTING.md            # Guidelines for community contributors
├── LICENSE                    # MIT License
├── main.py                    # Application entry point
├── requirements.txt           # Python backend dependencies
└── vercel.json                # Vercel deployment routing config
```

---

## ⚡ Quick Start

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/SaiVardhan337/SoundScape.git
cd SoundScape
pip install -r requirements.txt
```

### 2. Start Local Server
Launch the development engine:
```bash
python main.py
```
Or with Uvicorn directly:
```bash
uvicorn main:app --reload
```
Navigate to **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

*All notes, markdown logs, and stats will automatically save locally to `soundscape.db` inside your workspace.*

---

## 🧪 Testing & Examples

Run the unit test suite:
```bash
pytest
```

Run the API quickstart example script:
```bash
python examples/quickstart.py
```

---

## 🤝 Contributing & Pull Requests
SoundScape is open source! Please review our [CONTRIBUTING.md](CONTRIBUTING.md) guide for guidelines, good first issues, and development setup. If you love the project, please leave a star! ⭐

## 📄 License
This project is licensed under the [MIT License](LICENSE).
