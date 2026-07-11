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
        binaural: document.getElementById("slider-binaural"),
        rain: document.getElementById("slider-rain"),
        forest: document.getElementById("slider-forest"),
        lofi: document.getElementById("slider-lofi")
    };

    const valLabels = {
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

    // Presets mapped without Pink Noise
    const presets = {
        lofi:   { lofi: 60, rain: 25, forest: 0, binaural: 0 },
        forest: { forest: 65, rain: 20, lofi: 0, binaural: 10 },
        sleepy: { rain: 60, forest: 0, lofi: 0, binaural: 0 },
        clear:  { binaural: 0, rain: 0, forest: 0, lofi: 0 }
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
    // DYNAMIC PLAYLIST LOAD
    // ==========================================
    const trackSelect = document.getElementById("lofi-track-select");
    
    async function loadLofiPlaylist() {
        try {
            const response = await fetch("audio/playlist.json");
            if (response.ok) {
                const tracks = await response.json();
                tracks.forEach(track => {
                    const option = document.createElement("option");
                    option.value = `audio/${track.filename}`;
                    // Make track name look clean and readable
                    option.textContent = `${track.title} (${track.category})`;
                    trackSelect.appendChild(option);
                });
            }
        } catch (e) {
            console.warn("Could not load dynamic lofi playlist manifest:", e);
        }
    }

    trackSelect.addEventListener("change", (e) => {
        const selectedUrl = e.target.value;
        sound.changeTrackSource("lofi", selectedUrl);
    });

    // ==========================================
    // INITIALIZATION RUNNER
    // ==========================================
    loadWorkspaceNote();
    loadLofiPlaylist();
});
