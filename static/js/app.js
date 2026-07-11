// SoundScape Core Application Manager
document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // THEME TOGGLE: Dark/Light Theme Manager
    // ==========================================
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Theme';
    } else {
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Theme';
    }

    themeToggleBtn.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("light-theme");
        if (isLight) {
            localStorage.setItem("theme", "light");
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Theme';
        } else {
            localStorage.setItem("theme", "dark");
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Theme';
        }
    });

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
    // CREATIVE FLOW MODE MANAGER
    // ==========================================
    const flowModeBtn = document.getElementById("flow-mode-btn");
    const flowProgressContainer = document.getElementById("flow-progress-container");
    const flowProgressBar = document.getElementById("flow-progress-bar");
    
    let isFlowModeActive = false;
    let flowInterval = null;
    let flowSecondsElapsed = 0;
    const flowDurationSeconds = 15 * 60; // 15 Minute Flow Session
    let flowIdleSeconds = 0;
    
    // Store pre-flow volumes so we can restore them when exiting flow mode
    let savedVolumes = { lofi: 0, binaural: 0, rain: 0, forest: 0 };

    // Programmatic Zen Tibetan Chime (synthesizer)
    function playZenChime() {
        const chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = chimeCtx.createOscillator();
        const osc2 = chimeCtx.createOscillator();
        const gainNode = chimeCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, chimeCtx.currentTime); // Fundamental A4
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, chimeCtx.currentTime); // Overtone A5

        gainNode.gain.setValueAtTime(0, chimeCtx.currentTime);
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

    function toggleFlowMode() {
        sound.init(); // Ensure audio context is ready
        isFlowModeActive = !isFlowModeActive;

        if (isFlowModeActive) {
            // Enter Flow Mode
            flowModeBtn.classList.add("active");
            document.body.classList.add("flow-mode-active");
            flowProgressContainer.classList.remove("hidden");
            
            // Request Notification permission dynamically
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }

            // Turn on WPM meter dynamically
            toggleReactive.checked = true;
            wpmDisplay.classList.remove("hidden");
            
            // Save current volumes
            Object.keys(savedVolumes).forEach(name => {
                const slider = document.getElementById(`slider-${name}`);
                savedVolumes[name] = slider ? Number(slider.value) : 0;
            });

            // Set immersive flow starting sounds: 60% Lofi + 15% Binaural Focus (Alpha)
            const flowTargets = { lofi: 60, binaural: 15, rain: savedVolumes.rain, forest: savedVolumes.forest };
            Object.keys(flowTargets).forEach(name => {
                const slider = document.getElementById(`slider-${name}`);
                if (slider) {
                    slider.value = flowTargets[name];
                    const label = document.getElementById(`val-${name}`);
                    if (label) label.textContent = `${flowTargets[name]}%`;
                }
                sound.setVolume(name, flowTargets[name]);
            });

            // Force Binaural Beat mode to Alpha (10Hz)
            document.querySelectorAll(".binaural-modes .mode-btn").forEach(b => {
                b.classList.remove("active");
                if (b.dataset.freq === "10") b.classList.add("active");
            });
            sound.setBinauralFrequency(10);

            // Reset session tracking
            flowSecondsElapsed = 0;
            flowIdleSeconds = 0;
            flowProgressBar.style.width = "0%";

            // Start ticking interval
            flowInterval = setInterval(() => {
                flowSecondsElapsed++;
                
                // Update progress bar
                const pct = (flowSecondsElapsed / flowDurationSeconds) * 100;
                flowProgressBar.style.width = `${pct}%`;

                // Handle dynamic volume modulation based on writing activity
                if (currentWPM > 5) {
                    // Active typing: swell music to full target volumes
                    flowIdleSeconds = 0;
                    sound.setVolume("lofi", 60);
                    sound.setVolume("binaural", 15);
                    
                    const lofiSlider = document.getElementById("slider-lofi");
                    if (lofiSlider) {
                        lofiSlider.value = 60;
                        document.getElementById("val-lofi").textContent = "60%";
                    }
                    const binSlider = document.getElementById("slider-binaural");
                    if (binSlider) {
                        binSlider.value = 15;
                        document.getElementById("val-binaural").textContent = "15%";
                    }
                } else {
                    // Paused typing (idle)
                    flowIdleSeconds++;
                    if (flowIdleSeconds >= 6) {
                        // After 6s idle, dim tracks to let user think quietly
                        sound.setVolume("lofi", 20);      // Drop lofi to 20%
                        sound.setVolume("binaural", 5);     // Drop focus tones to 5%
                        
                        const lofiSlider = document.getElementById("slider-lofi");
                        if (lofiSlider) {
                            lofiSlider.value = 20;
                            document.getElementById("val-lofi").textContent = "20%";
                        }
                        const binSlider = document.getElementById("slider-binaural");
                        if (binSlider) {
                            binSlider.value = 5;
                            document.getElementById("val-binaural").textContent = "5%";
                        }
                    }
                }

                // Check for session completion
                if (flowSecondsElapsed >= flowDurationSeconds) {
                    playZenChime();
                    
                    // Desktop push notification
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification("SoundScape Flow Complete! 🎧✨", {
                            body: "Excellent session! You've successfully finished your 15-minute focused writing flow.",
                            tag: "soundscape-flow-complete"
                        });
                    }

                    // Immersive flash of green glow on success
                    const glow = document.getElementById("glow");
                    glow.style.background = "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 100%)";
                    setTimeout(() => { glow.style.background = ""; }, 10000);
                    
                    // Exit flow mode
                    toggleFlowMode();
                }
            }, 1000);

            console.log("Creative Flow Mode: Activated.");

        } else {
            // Exit Flow Mode
            flowModeBtn.classList.remove("active");
            document.body.classList.remove("flow-mode-active");
            flowProgressContainer.classList.add("hidden");
            
            clearInterval(flowInterval);
            flowInterval = null;

            // Turn off WPM meter unless reactivated
            toggleReactive.checked = false;
            wpmDisplay.classList.add("hidden");
            sound.updateFilterCutoff(0, false); // Restore filter to open

            // Restore saved pre-flow volumes
            Object.keys(savedVolumes).forEach(name => {
                const slider = document.getElementById(`slider-${name}`);
                if (slider) {
                    slider.value = savedVolumes[name];
                    const label = document.getElementById(`val-${name}`);
                    if (label) label.textContent = `${savedVolumes[name]}%`;
                }
                sound.setVolume(name, savedVolumes[name]);
            });

            console.log("Creative Flow Mode: Deactivated.");
        }
    }

    flowModeBtn.addEventListener("click", toggleFlowMode);

    // ==========================================
    // NOTE EXPORTING: PDF & HTML Export Manager
    // ==========================================
    const exportBtn = document.getElementById("export-btn");
    const exportDropdown = document.getElementById("export-dropdown");

    exportBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        exportDropdown.classList.add("hidden");
    });

    document.querySelectorAll(".export-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const type = e.currentTarget.dataset.type;
            if (type === "html") {
                exportAsHTML();
            } else if (type === "pdf") {
                exportAsPDF();
            }
        });
    });

    function getNoteMetadata() {
        const content = editor.value || "";
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const charCount = content.length;
        
        let sessionInfo = "";
        if (isFlowModeActive) {
            const mins = Math.floor(flowSecondsElapsed / 60);
            const secs = flowSecondsElapsed % 60;
            sessionInfo = ` | Active Flow Session: ${mins}m ${secs}s elapsed`;
        }

        return {
            wordCount,
            charCount,
            timestamp: new Date().toLocaleString(),
            sessionInfo
        };
    }

    function exportAsHTML() {
        const meta = getNoteMetadata();
        const compiledContent = typeof marked !== 'undefined' ? marked.parse(editor.value || "*No content*") : (editor.value || "");
        
        const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SoundScape Document Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.7;
            color: #1f2937;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #fafafa;
        }
        article {
            background: white;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        h1, h2, h3 { color: #111827; margin-top: 1.5em; font-weight: 600; }
        pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #e5e7eb; }
        code { font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.9em; }
        .meta-footer {
            border-top: 1px solid #e5e7eb;
            margin-top: 50px;
            padding-top: 20px;
            font-size: 0.85rem;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <article>
        ${compiledContent}
    </article>
    <div class="meta-footer">
        <span>SoundScape Document</span>
        <span>Date: ${meta.timestamp} | Words: ${meta.wordCount} | Characters: ${meta.charCount}${meta.sessionInfo}</span>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlOutput], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `soundscape-note-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAsPDF() {
        const meta = getNoteMetadata();
        
        let printMeta = document.getElementById("print-meta-header");
        if (!printMeta) {
            printMeta = document.createElement("div");
            printMeta.id = "print-meta-header";
            printMeta.className = "print-meta-header";
        }
        printMeta.innerHTML = `<strong>SoundScape Document Export</strong> | Date: ${meta.timestamp} | Words: ${meta.wordCount}${meta.sessionInfo}`;

        // Temporarily put compiled html content into preview area for native printing view
        if (typeof marked !== 'undefined') {
            preview.innerHTML = marked.parse(editor.value || "*No content*");
        } else {
            preview.innerHTML = editor.value || "";
        }
        preview.insertBefore(printMeta, preview.firstChild);

        // Trigger native browser print which provides PDF conversion options
        window.print();
    }

    // ==========================================
    // INITIALIZATION RUNNER
    // ==========================================
    loadWorkspaceNote();
    loadLofiPlaylist();
});
