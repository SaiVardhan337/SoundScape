// SoundScape Core Application Manager
document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // NOTEPAD: Markdown Autosave & Tabs & WPM
    // ==========================================
    const editor = document.getElementById("note-editor");
    const preview = document.getElementById("note-preview");
    const editTabBtn = document.getElementById("edit-tab-btn");
    const previewTabBtn = document.getElementById("preview-tab-btn");
    const saveIndicator = document.getElementById("autosave-indicator");
    const wpmDisplay = document.getElementById("wpm-display");
    
    let debounceTimer;

    // Load initial note
    async function loadWorkspaceNote() {
        try {
            const response = await fetch("/api/notes");
            if (response.ok) {
                const note = await response.json();
                editor.value = note.content;
            }
        } catch (e) {
            console.error("Failed to load workspace note:", e);
        }
    }

    // Save note to API
    async function saveWorkspaceNote(content) {
        saveIndicator.textContent = "Saving...";
        saveIndicator.classList.add("saving");
        try {
            const response = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                saveIndicator.textContent = "Saved";
            } else {
                saveIndicator.textContent = "Sync Error";
            }
        } catch (e) {
            saveIndicator.textContent = "Offline Mode";
        } finally {
            saveIndicator.classList.remove("saving");
        }
    }

    // Debounce listener to reduce API calls while typing
    editor.addEventListener("input", (e) => {
        saveIndicator.textContent = "Saving...";
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            saveWorkspaceNote(e.target.value);
        }, 1200);
    });

    // Editor Tabs Switching
    editTabBtn.addEventListener("click", () => {
        editTabBtn.classList.add("active");
        previewTabBtn.classList.remove("active");
        editor.classList.remove("hidden");
        preview.classList.add("hidden");
        editor.focus();
    });

    previewTabBtn.addEventListener("click", () => {
        previewTabBtn.classList.add("active");
        editTabBtn.classList.remove("active");
        editor.classList.add("hidden");
        preview.classList.remove("hidden");
        // Convert Markdown text to HTML using marked.js
        preview.innerHTML = marked.parse(editor.value || "*No text yet. Start writing in the editor.*");
    });

    // ==========================================
    // INTERACTIVE SOUNDSCAPE & WPM CALCULATOR
    // ==========================================
    const toggleReactive = document.getElementById("toggle-reactive");
    
    let keypressTimestamps = [];
    let currentWPM = 0;
    
    // Track key presses in editor (only for calculating speed metrics)
    editor.addEventListener("keydown", (e) => {
        if (e.key && e.key.length === 1) {
            keypressTimestamps.push(Date.now());
        }
    });

    // Calculate rolling WPM every second
    setInterval(() => {
        const now = Date.now();
        const cutoff = now - 5000; // 5 second window
        
        keypressTimestamps = keypressTimestamps.filter(t => t > cutoff);
        
        currentWPM = Math.round((keypressTimestamps.length / 5) * 12);
        wpmDisplay.textContent = `${currentWPM} WPM`;

        const isReactive = toggleReactive.checked;
        sound.updateFilterCutoff(currentWPM, isReactive);

        // Scale background radial glow dynamically based on typing speed
        const glow = document.getElementById("glow");
        if (isReactive && currentWPM > 0) {
            const scale = 1 + Math.min(currentWPM / 150, 0.4);
            glow.style.transform = `translate(-50%, -50%) scale(${scale})`;
            glow.style.opacity = `${0.8 + (currentWPM / 300)}`;
        } else {
            glow.style.transform = "translate(-50%, -50%) scale(1)";
            glow.style.opacity = "";
        }
    }, 1000);

    toggleReactive.addEventListener("change", () => {
        sound.init(); // ensure audio context is ready
        if (toggleReactive.checked) {
            wpmDisplay.classList.remove("hidden");
        } else {
            wpmDisplay.classList.add("hidden");
            sound.updateFilterCutoff(0, false); // open filter completely
        }
    });


    // ==========================================
    // SOUND MIXER CONTROLLER
    // ==========================================
    const sliders = {
        pink: document.getElementById("slider-pink"),
        binaural: document.getElementById("slider-binaural"),
        rain: document.getElementById("slider-rain"),
        forest: document.getElementById("slider-forest"),
        lofi: document.getElementById("slider-lofi")
    };

    const valLabels = {
        pink: document.getElementById("val-pink"),
        binaural: document.getElementById("val-binaural"),
        rain: document.getElementById("val-rain"),
        forest: document.getElementById("val-forest"),
        lofi: document.getElementById("val-lofi")
    };

    // Update sound managers and volume labels dynamically
    Object.keys(sliders).forEach(name => {
        sliders[name].addEventListener("input", (e) => {
            const val = e.target.value;
            valLabels[name].textContent = `${val}%`;
            sound.setVolume(name, val);
        });
    });

    // Binaural Beats Focus Frequencies
    document.querySelectorAll(".binaural-modes .mode-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".binaural-modes .mode-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            sound.setBinauralFrequency(e.target.dataset.freq);
        });
    });

    // Master Mute
    const muteBtn = document.getElementById("master-mute-btn");
    muteBtn.addEventListener("click", () => {
        const isMuted = sound.toggleMute();
        muteBtn.innerHTML = isMuted 
            ? '<i class="fa-solid fa-volume-xmark" style="color: #ef4444;"></i>' 
            : '<i class="fa-solid fa-volume-high"></i>';
    });

    // Presets mapped to the new Pink Noise generator
    const presets = {
        lofi:   { lofi: 60, rain: 25, pink: 15, forest: 0, binaural: 0 },
        forest: { forest: 65, rain: 20, lofi: 0, pink: 0, binaural: 10 },
        sleepy: { rain: 60, pink: 40, forest: 0, lofi: 0, binaural: 0 },
        clear:  { pink: 0, binaural: 0, rain: 0, forest: 0, lofi: 0 }
    };

    document.querySelectorAll(".presets-row .preset-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const presetName = e.currentTarget.dataset.preset;
            const values = presets[presetName];
            
            document.querySelectorAll(".presets-row .preset-btn").forEach(b => b.classList.remove("active"));
            if (presetName !== 'clear') {
                e.currentTarget.classList.add("active");
            }
            
            Object.keys(sliders).forEach(name => {
                const val = values[name] !== undefined ? values[name] : 0;
                sliders[name].value = val;
                valLabels[name].textContent = `${val}%`;
                sound.setVolume(name, val);
            });
        });
    });

    // ==========================================
    // POMODORO TIMER & PROGRESS RING
    // ==========================================
    let timerInterval = null;
    let timerMinutes = 25;
    let timerSecondsLeft = timerMinutes * 60;
    let timerIsRunning = false;

    const timerCountdown = document.getElementById("timer-countdown");
    const playBtn = document.getElementById("timer-play-btn");
    const resetBtn = document.getElementById("timer-reset-btn");
    const timerProgressRing = document.getElementById("timer-progress");
    
    // Circular SVG math constants
    const ringRadius = 80;
    const ringCircumference = 2 * Math.PI * ringRadius;
    
    timerProgressRing.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    timerProgressRing.style.strokeDashoffset = 0;

    function setProgress(percent) {
        const offset = ringCircumference - (percent / 100 * ringCircumference);
        timerProgressRing.style.strokeDashoffset = offset;
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerSecondsLeft / 60);
        const secs = timerSecondsLeft % 60;
        timerCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        // Progress ring fill percentage
        const totalDuration = timerMinutes * 60;
        const elapsed = totalDuration - timerSecondsLeft;
        const pct = (elapsed / totalDuration) * 100;
        setProgress(pct);
    }

    async function logFocusSession(mins) {
        try {
            await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ duration_minutes: mins })
            });
            fetchStatsAndDraw(); // Reload the graph
        } catch (e) {
            console.error("Failed to sync completed focus session:", e);
        }
    }

    // Programmatic Zen Tibetan Chime (Mathematical synth sound)
    function playZenChime() {
        const chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Custom synthesizer configuration for bell harmonic feel
        const osc1 = chimeCtx.createOscillator();
        const osc2 = chimeCtx.createOscillator();
        const gainNode = chimeCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, chimeCtx.currentTime); // Fundamental A4
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, chimeCtx.currentTime); // Overtone A5

        gainNode.gain.setValueAtTime(0, chimeCtx.currentTime);
        // Soft swell attack and smooth decrescendo decay
        gainNode.gain.linearRampToValueAtTime(0.4, chimeCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, chimeCtx.currentTime + 3.0);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(chimeCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(chimeCtx.currentTime + 3.0);
        osc2.stop(chimeCtx.currentTime + 3.0);
    }

    function timerFinished() {
        playZenChime();
        clearInterval(timerInterval);
        timerIsRunning = false;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        
        // Only log focus sessions if it was a Pomodoro focus phase (not a break)
        const activeMode = document.querySelector(".timer-modes .timer-mode-btn.active").dataset.time;
        if (activeMode == "25") {
            logFocusSession(timerMinutes);
            // Flash ambient glow color to calm success emerald green
            const glow = document.getElementById("glow");
            glow.style.background = "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 100%)";
            setTimeout(() => {
                glow.style.background = ""; // Restore default glow
            }, 10000);
        }
        
        timerSecondsLeft = timerMinutes * 60;
        updateTimerDisplay();
    }

    function startTimer() {
        if (timerIsRunning) {
            // Pause
            clearInterval(timerInterval);
            timerIsRunning = false;
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        } else {
            // Initialize AudioContext on first play click to resolve browser security policy
            sound.init();
            
            // Play
            timerIsRunning = true;
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            timerInterval = setInterval(() => {
                timerSecondsLeft--;
                updateTimerDisplay();
                if (timerSecondsLeft <= 0) {
                    timerFinished();
                }
            }, 1000);
        }
    }

    playBtn.addEventListener("click", startTimer);

    resetBtn.addEventListener("click", () => {
        clearInterval(timerInterval);
        timerIsRunning = false;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        timerSecondsLeft = timerMinutes * 60;
        updateTimerDisplay();
    });

    // Time Mode Buttons
    document.querySelectorAll(".timer-modes .timer-mode-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".timer-modes .timer-mode-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            timerMinutes = Number(e.target.dataset.time);
            timerSecondsLeft = timerMinutes * 60;
            
            clearInterval(timerInterval);
            timerIsRunning = false;
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            updateTimerDisplay();
        });
    });

    // ==========================================
    // STATS PANEL OVERLAY
    // ==========================================
    const statsOverlay = document.getElementById("stats-overlay");
    const openStatsBtn = document.getElementById("toggle-stats-btn");
    const closeStatsBtn = document.getElementById("close-stats-btn");

    openStatsBtn.addEventListener("click", () => {
        statsOverlay.classList.remove("hidden");
        fetchStatsAndDraw();
    });

    closeStatsBtn.addEventListener("click", () => {
        statsOverlay.classList.add("hidden");
    });

    // Close stats if clicking outside the drawer
    statsOverlay.addEventListener("click", (e) => {
        if (e.target === statsOverlay) {
            statsOverlay.classList.add("hidden");
        }
    });

    // ==========================================
    // INITIALIZATION RUNNER
    // ==========================================
    loadWorkspaceNote();
    updateTimerDisplay();
});
