# Contributing to SoundScape 🎧🍃

Thank you for considering contributing to SoundScape! We welcome contributions from developers, writers, sound designers, and UI/UX enthusiasts.

---

## 🚀 Getting Started

### 1. Fork & Clone
Fork the repository on GitHub and clone your fork locally:
```bash
git clone https://github.com/YOUR-USERNAME/SoundScape.git
cd SoundScape
```

### 2. Set Up Development Environment
Install required dependencies and dev tools:
```bash
pip install -r requirements.txt
pip install pytest httpx
```

### 3. Run Local Server
Launch the development server:
```bash
python main.py
```
Navigate to `http://127.0.0.1:8000` to preview your changes.

### 4. Run Test Suite
Before submitting any changes, make sure all tests pass:
```bash
pytest
```

---

## 🌟 Good First Issue Ideas

Looking for ways to get started? Here are great first contributions:

- **⌨️ Keyboard Switch Profiles:** Add new Web Audio frequency parameters or impulse responses for additional mechanical switch types in `static/js/app.js`.
- **🎨 Customizer Themes:** Add new preset CSS color variables to the Dev Mode CSS Customizer.
- **🎵 Binaural Frequencies:** Add preset frequency toggles for Delta (3Hz) or Gamma (40Hz) brainwave states.
- **📊 Focus Stats Widgets:** Enhance focus analytics graphs in `static/js/stats.js`.
- **📝 Markdown Features:** Add extra formatting buttons (e.g. table insert, blockquote helper) to the editor toolbar.

---

## 🛠️ Code Guidelines

- **Python:** Follow PEP 8 conventions. Use type hints where helpful. Keep dependencies minimal.
- **JavaScript:** ES6+ standard syntax. Avoid bloated external frameworks; SoundScape relies on native Web Audio API & vanilla DOM APIs.
- **CSS:** Use root CSS variables (`--color-primary`, `--bg-card`, etc.) for unified dark and light theme consistency.
- **Pull Requests:** Ensure your PR title is descriptive, includes a summary of changes, and all `pytest` checks pass cleanly.

---

## 📄 License
By contributing to SoundScape, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
