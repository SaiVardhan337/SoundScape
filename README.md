# SoundScape 🎧✨

SoundScape is an offline-first ambient sound mixer, Pomodoro timer, and distraction-free markdown notepad designed specifically for developers, writers, and students. 

This repository showcases a modern, high-polish application combining a **Python (FastAPI + SQLite)** backend with a custom **HTML5/CSS/JavaScript (Web Audio API)** frontend.

---

## 🚀 Key Features

*   **Mathematical Audio Synthesis:** SoundScape uses the browser's Web Audio API to mathematically synthesize **Brown Noise** and **Binaural Beats** in real-time, requiring zero audio downloads.
*   **Binaural Brainwave Tuning:** Toggle between Alpha (10Hz focus), Beta (15Hz active analysis), and Theta (6Hz deep meditation) wave offsets to tune your brain's cognitive state.
*   **Cozy Ambient Streamers:** Slider mixers for streamed background nature elements like cozy rain, campfire crackles, and coffee shop chatter.
*   **Autosaving Markdown Notepad:** A central writing workspace featuring editor/preview mode tabs that automatically syncs and saves your work back to the database.
*   **Local Pomodoro Stats:** A clean Pomodoro timer that automatically logs completed focus sessions to a local SQLite database, generating graphical weekly trends.

---

## 🛠️ Architecture & Tech Stack

```
soundscape/
├── main.py (FastAPI application & endpoints)
├── database.py (SQLAlchemy connection & SQLite configuration)
├── models.py (SQLAlchemy Schema for Notes & Focus Sessions)
├── static/
│   ├── index.html (Dashboard Structure)
│   ├── css/styles.css (Frosted-glass UI styling, custom range input curves)
│   └── js/
│       ├── audio.js (Web Audio API carrier frequency synthesizers & routing)
│       ├── stats.js (Chart.js dashboard rendering)
│       └── app.js (Notepad, timer, and UI orchestration)
└── requirements.txt (Python backend dependencies)
```

*   **Backend:** FastAPI, Uvicorn, SQLAlchemy, SQLite
*   **Frontend:** Vanilla JS (Web Audio API, Fetch API, Local Storage), Vanilla CSS (Glassmorphism, dynamic animations), Marked.js (Markdown parsing), Chart.js (Data graphing)

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have Python 3.8+ installed.

### 2. Installation
Clone the repository and install the dependencies:
```bash
pip install -r requirements.txt
```

### 3. Run the App
Launch the local Uvicorn development server:
```bash
uvicorn main:app --reload
```

### 4. Access the Dashboard
Open your browser and navigate to:
```
http://127.0.0.1:8000
```
*Your notes and study sessions will be automatically stored in a local SQLite file (`soundscape.db`) inside the project root.*
