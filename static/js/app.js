// SoundScape Core Application Manager
document.addEventListener("DOMContentLoaded", () => {
    
    // Global references for dynamic workspace integration
    let aceEditorInstance = null;

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
            if (aceEditorInstance) {
                aceEditorInstance.setTheme("ace/theme/chrome");
                const codeThemeSelect = document.getElementById("code-theme-select");
                if (codeThemeSelect) codeThemeSelect.value = "chrome";
            }
        } else {
            localStorage.setItem("theme", "dark");
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Theme';
            if (aceEditorInstance) {
                aceEditorInstance.setTheme("ace/theme/monokai");
                const codeThemeSelect = document.getElementById("code-theme-select");
                if (codeThemeSelect) codeThemeSelect.value = "monokai";
            }
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
                editor.innerHTML = note.content || "";
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
        if (typeof updateWordGoalProgress === "function") updateWordGoalProgress();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            saveWorkspaceNote(editor.innerHTML);
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
        preview.innerHTML = editor.innerHTML || "*No text yet. Start writing in the editor.*";
    });

    // ==========================================
    // MICROSOFT WORD FORMATTING TOOLBAR
    // ==========================================
    const rtBold = document.getElementById("rt-bold");
    const rtItalic = document.getElementById("rt-italic");
    const rtUnderline = document.getElementById("rt-underline");
    const rtStrikethrough = document.getElementById("rt-strikethrough");
    const rtAlignLeft = document.getElementById("rt-align-left");
    const rtAlignCenter = document.getElementById("rt-align-center");
    const rtAlignRight = document.getElementById("rt-align-right");
    const rtAlignJustify = document.getElementById("rt-align-justify");
    const rtFontSelect = document.getElementById("rt-font-select");
    const rtSizeSelect = document.getElementById("rt-size-select");
    const rtColorBtn = document.getElementById("rt-color-btn");
    const rtColorPicker = document.getElementById("rt-color-picker");
    const rtListUl = document.getElementById("rt-list-ul");
    const rtListOl = document.getElementById("rt-list-ol");
    const rtClearFormat = document.getElementById("rt-clear-format");

    function execFormat(cmd, value = null) {
        document.execCommand(cmd, false, value);
        editor.focus();
        
        // Trigger autosave
        saveIndicator.textContent = "Saving...";
        if (typeof updateWordGoalProgress === "function") updateWordGoalProgress();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            saveWorkspaceNote(editor.innerHTML);
        }, 1200);
    }

    if (rtBold) rtBold.addEventListener("click", () => execFormat("bold"));
    if (rtItalic) rtItalic.addEventListener("click", () => execFormat("italic"));
    if (rtUnderline) rtUnderline.addEventListener("click", () => execFormat("underline"));
    if (rtStrikethrough) rtStrikethrough.addEventListener("click", () => execFormat("strikeThrough"));
    if (rtAlignLeft) rtAlignLeft.addEventListener("click", () => execFormat("justifyLeft"));
    if (rtAlignCenter) rtAlignCenter.addEventListener("click", () => execFormat("justifyCenter"));
    if (rtAlignRight) rtAlignRight.addEventListener("click", () => execFormat("justifyRight"));
    if (rtAlignJustify) rtAlignJustify.addEventListener("click", () => execFormat("justifyFull"));
    
    if (rtFontSelect) {
        rtFontSelect.addEventListener("change", (e) => {
            execFormat("fontName", e.target.value);
        });
    }
    
    if (rtSizeSelect) {
        rtSizeSelect.addEventListener("change", (e) => {
            execFormat("fontSize", e.target.value);
        });
    }

    if (rtColorPicker) {
        rtColorPicker.addEventListener("input", (e) => {
            execFormat("foreColor", e.target.value);
            if (rtColorBtn) rtColorBtn.style.color = e.target.value;
        });
    }
    
    if (rtColorBtn && rtColorPicker) {
        rtColorBtn.addEventListener("click", () => {
            rtColorPicker.click();
        });
    }

    if (rtListUl) rtListUl.addEventListener("click", () => execFormat("insertUnorderedList"));
    if (rtListOl) rtListOl.addEventListener("click", () => execFormat("insertOrderedList"));
    if (rtClearFormat) rtClearFormat.addEventListener("click", () => execFormat("removeFormat"));

    // ==========================================
    // INTERACTIVE SOUNDSCAPE & WPM CALCULATOR
    // ==========================================
    const toggleReactive = document.getElementById("toggle-reactive");
    
    let keypressTimestamps = [];
    let currentWPM = 0;
    
    // Track key presses globally (for WPM and Typewriter sound synthesis)
    document.addEventListener("keydown", (e) => {
        const tag = e.target.tagName.toLowerCase();
        const isInput = tag === "textarea" || tag === "input" || e.target.id === "note-editor" || e.target.classList.contains("ace_text-input");
        if (!isInput) return;
        
        // Log keypress timestamp for WPM calculation
        if (e.key && e.key.length === 1) {
            keypressTimestamps.push(Date.now());
        }
        
        // Play typewriter sound if enabled
        if (toggleTypewriter && toggleTypewriter.checked) {
            const modifierKeys = ["Shift", "Control", "Alt", "Meta", "CapsLock", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape", "Tab"];
            if (modifierKeys.includes(e.key)) return;
            
            if (e.key === "Enter") {
                playTypewriterBell();
            } else {
                playTypewriterClick();
            }
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
        const content = editor.innerText || "";
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
        const compiledContent = editor.innerHTML || "";
        
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
        preview.innerHTML = editor.innerHTML || "";
        preview.insertBefore(printMeta, preview.firstChild);

        // Trigger native browser print which provides PDF conversion options
        window.print();
    }

    // ==========================================
    // TYPEWRITER SOUNDS SYNTHESIZER
    // ==========================================
    const toggleTypewriter = document.getElementById("toggle-typewriter");
    
    // Load cached preference
    const cachedTypewriter = localStorage.getItem("typewriter") === "true";
    if (toggleTypewriter) toggleTypewriter.checked = cachedTypewriter;

    if (toggleTypewriter) {
        toggleTypewriter.addEventListener("change", () => {
            localStorage.setItem("typewriter", toggleTypewriter.checked);
        });
    }

    function playTypewriterClick() {
        if (!sound.ctx) sound.init();
        const ctx = sound.ctx;
        if (!ctx || ctx.state === "suspended") return;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        // High pitch transient click
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(3200, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.004);
        
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.006);

        // Low key strike body thud
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(180, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.015);
        
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.025);
        osc2.stop(ctx.currentTime + 0.025);
    }

    function playTypewriterBell() {
        if (!sound.ctx) sound.init();
        const ctx = sound.ctx;
        if (!ctx || ctx.state === "suspended") return;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1200, ctx.currentTime); // High bell chime
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(2400, ctx.currentTime); // Overtone

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.8);
        osc2.stop(ctx.currentTime + 0.8);
    }

    // ==========================================
    // WALLPAPER / THEME BACKGROUND MANAGER
    // ==========================================
    const wallpaperBtns = document.querySelectorAll(".wallpaper-btn");
    
    function setWallpaper(wpName) {
        // Clear old wp classes from body
        document.body.className = document.body.className.split(" ").filter(c => !c.startsWith("wp-")).join(" ");
        
        if (wpName !== "glow") {
            document.body.classList.add(`wp-${wpName}`);
        }
        
        wallpaperBtns.forEach(btn => {
            btn.classList.remove("active");
            if (btn.dataset.wallpaper === wpName) btn.classList.add("active");
        });
        
        localStorage.setItem("wallpaper", wpName);
    }
    
    // Load initial cached wallpaper
    const cachedWp = localStorage.getItem("wallpaper") || "glow";
    setWallpaper(cachedWp);
    
    wallpaperBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const wp = e.currentTarget.dataset.wallpaper;
            setWallpaper(wp);
        });
    });

    // ==========================================
    // MULTI-WORKSPACE COORDINATOR
    // ==========================================
    const switcherBtns = document.querySelectorAll(".switcher-btn");
    const workspacePanels = document.querySelectorAll(".workspace-panel");
    let activeWorkspace = "writing";

    switcherBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            sound.init(); // Ensure Web Audio context is initialized
            switcherBtns.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            const ws = e.currentTarget.dataset.workspace;
            activeWorkspace = ws;
            
            // Update workspace classes on body
            document.body.classList.remove("ws-writing", "ws-coding", "ws-pdf");
            document.body.classList.add(`ws-${ws}`);
            
            workspacePanels.forEach(panel => {
                panel.classList.add("hidden");
            });
            
            const targetPanel = document.getElementById(`${ws}-workspace`);
            if (targetPanel) targetPanel.classList.remove("hidden");

            // Auto-binaural sweeps and wallpaper transitions matching task profiles
            if (ws === "coding") {
                // Set Coding Binaural Beat (15Hz Beta)
                sound.setBinauralFrequency(15);
                document.querySelectorAll(".binaural-modes .mode-btn").forEach(b => {
                    b.classList.remove("active");
                    if (b.dataset.freq === "15") b.classList.add("active");
                });
                setWallpaper("typewriter");
            } else if (ws === "writing") {
                // Set Writing Binaural Beat (6Hz Theta)
                sound.setBinauralFrequency(6);
                document.querySelectorAll(".binaural-modes .mode-btn").forEach(b => {
                    b.classList.remove("active");
                    if (b.dataset.freq === "6") b.classList.add("active");
                });
                setWallpaper("glow");
            } else if (ws === "pdf") {
                // Set Reading Binaural Beat (10Hz Alpha)
                sound.setBinauralFrequency(10);
                document.querySelectorAll(".binaural-modes .mode-btn").forEach(b => {
                    b.classList.remove("active");
                    if (b.dataset.freq === "10") b.classList.add("active");
                });
                setWallpaper("glow");
            }
        });
    });

    // ==========================================
    // WRITING TOOLS: GOALS & CREATIVE PROMPTS
    // ==========================================
    const wordGoalSelect = document.getElementById("word-goal-select");
    const goalProgressContainer = document.getElementById("goal-progress-container");
    const goalProgressBar = document.getElementById("goal-progress-bar");
    const goalProgressText = document.getElementById("goal-progress-text");
    let targetWordGoal = 0;

    wordGoalSelect.addEventListener("change", (e) => {
        targetWordGoal = Number(e.target.value);
        if (targetWordGoal > 0) {
            goalProgressContainer.classList.remove("hidden");
            updateWordGoalProgress();
        } else {
            goalProgressContainer.classList.add("hidden");
        }
    });

    function updateWordGoalProgress() {
        if (targetWordGoal <= 0) return;
        const text = editor.innerText || "";
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const pct = Math.min((words / targetWordGoal) * 100, 100);
        goalProgressBar.style.setProperty("--progress-pct", `${pct}%`);
        goalProgressText.textContent = `${words} / ${targetWordGoal} words`;
        
        if (pct >= 100) {
            goalProgressText.innerHTML = `<span style="color: var(--color-success); font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Goal Met!</span>`;
        }
    }

    const promptBox = document.getElementById("writing-prompt-box");
    const promptText = document.getElementById("prompt-display-text");
    const promptBtn = document.getElementById("prompt-generator-btn");
    const closePromptBtn = document.getElementById("close-prompt-btn");

    const creativeWritingPrompts = [
        "Write about a character who hears a soft mechanical hum late at night...",
        "Describe a cozy rainy night in a futuristic library, focusing on sound and ambient smells.",
        "Explain the feeling of debugging a complex block of code under the 3 AM moonlight.",
        "Start a story with: 'The rain didn't wash away the neon glow of the street...'",
        "Write a reflection on how noise and soundscapes influence your creative flow.",
        "Draft a letter to a friend describing an ideal study space that you wish existed.",
        "Write a scene where two coders are building a sound synthesizer in a hidden cellar."
    ];

    promptBtn.addEventListener("click", () => {
        promptBox.classList.remove("hidden");
        const idx = Math.floor(Math.random() * creativeWritingPrompts.length);
        promptText.textContent = creativeWritingPrompts[idx];
    });

    closePromptBtn.addEventListener("click", () => {
        promptBox.classList.add("hidden");
    });

    // ==========================================
    // PDF READER: SPLIT FILE WORKSPACE
    // ==========================================
    const pdfFileInput = document.getElementById("pdf-file-input");
    const pdfViewerFrame = document.getElementById("pdf-viewer-frame");
    const pdfUploadTray = document.getElementById("pdf-upload-tray");
    const pdfNoteEditor = document.getElementById("pdf-note-editor");
    const pdfSaveIndicator = document.getElementById("pdf-autosave-indicator");
    let pdfNoteTimer = null;

    // Load cached PDF notes
    pdfNoteEditor.value = localStorage.getItem("pdf_notes") || "";

    pdfFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            const url = URL.createObjectURL(file);
            pdfViewerFrame.src = url;
            pdfViewerFrame.classList.remove("hidden");
            pdfUploadTray.classList.add("hidden");
        }
    });

    pdfNoteEditor.addEventListener("input", () => {
        pdfSaveIndicator.textContent = "Saving...";
        pdfSaveIndicator.classList.add("saving");
        clearTimeout(pdfNoteTimer);
        pdfNoteTimer = setTimeout(() => {
            localStorage.setItem("pdf_notes", pdfNoteEditor.value);
            pdfSaveIndicator.textContent = "Saved";
            pdfSaveIndicator.classList.remove("saving");
        }, 800);
    });

    // ==========================================
    // ACE CODE EDITOR & MOCK RUNNER
    // ==========================================
    const codeLangSelect = document.getElementById("code-lang-select");
    const codeThemeSelect = document.getElementById("code-theme-select");
    const runCodeBtn = document.getElementById("run-code-btn");
    const clearConsoleBtn = document.getElementById("clear-console-btn");
    const consoleLog = document.getElementById("console-log");

    // Initialize Ace Editor instance
    const themeDefault = savedTheme === "light" ? "chrome" : "monokai";
    aceEditorInstance = ace.edit("code-editor");
    aceEditorInstance.setTheme(`ace/theme/${themeDefault}`);
    aceEditorInstance.session.setMode("ace/mode/python");
    codeThemeSelect.value = themeDefault;

    aceEditorInstance.setOptions({
        showPrintMargin: false,
        fontFamily: "'Monaco', 'JetBrains Mono', monospace",
        fontSize: "14px",
        tabSize: 4,
        useSoftTabs: true
    });

    codeLangSelect.addEventListener("change", (e) => {
        const lang = e.target.value;
        aceEditorInstance.session.setMode(`ace/mode/${lang}`);
        
        // Auto prep default print statement mocks for convenience
        let defaultCode = "";
        if (lang === "python") {
            defaultCode = `# Write Python here...\nprint("Hello from SoundScape!")`;
        } else if (lang === "javascript") {
            defaultCode = `// Write Javascript here...\nconsole.log("Hello from SoundScape!");`;
        } else if (lang === "java") {
            defaultCode = `// Write Java here...\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from SoundScape!");\n    }\n}`;
        } else if (lang === "c_cpp") {
            defaultCode = `// Write C++ here...\n#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello from SoundScape!" << endl;\n    return 0;\n}`;
        } else if (lang === "html") {
            defaultCode = `<!-- Write HTML here -->\n<h1>Hello from SoundScape!</h1>`;
        } else if (lang === "css") {
            defaultCode = `/* Write CSS here */\nbody {\n    color: #8b5cf6;\n}`;
        }
        aceEditorInstance.setValue(defaultCode, 1);
    });

    codeThemeSelect.addEventListener("change", (e) => {
        aceEditorInstance.setTheme(`ace/theme/${e.target.value}`);
    });

    clearConsoleBtn.addEventListener("click", () => {
        consoleLog.innerHTML = '<span class="system-line">[System] Console cleared.</span>';
    });

    runCodeBtn.addEventListener("click", () => {
        const code = aceEditorInstance.getValue();
        const lang = codeLangSelect.value;

        consoleLog.innerHTML = `<span class="system-line">[System] Compiling and running ${lang} script...</span>`;
        
        setTimeout(() => {
            try {
                let outputLines = [];
                let regex = null;

                if (lang === "python") {
                    regex = /print\((['"])(.*?)\1\)/g;
                } else if (lang === "javascript") {
                    regex = /console\.log\((['"])(.*?)\1\)/g;
                } else if (lang === "java") {
                    regex = /System\.out\.println\((['"])(.*?)\1\)/g;
                } else if (lang === "c_cpp") {
                    regex = /cout\s*<<\s*(['"])(.*?)\1/g;
                } else if (lang === "html" || lang === "css") {
                    outputLines.push("[System] Successfully parsed client-side markup template.");
                }

                if (regex) {
                    let match;
                    while ((match = regex.exec(code)) !== null) {
                        outputLines.push(match[2]);
                    }
                    if (outputLines.length === 0) {
                        outputLines.push("Process executed with no stdout output.");
                    }
                } else if (lang !== "html" && lang !== "css") {
                    outputLines.push("Compilation successful.");
                }

                outputLines.push("\nProcess finished with exit code 0.");

                // Print results
                outputLines.forEach(line => {
                    const lineEl = document.createElement("div");
                    if (line.includes("exit code 0")) {
                        lineEl.className = "system-line";
                    } else {
                        lineEl.className = "success-line";
                    }
                    lineEl.textContent = line;
                    consoleLog.appendChild(lineEl);
                });

            } catch (err) {
                const errEl = document.createElement("div");
                errEl.className = "error-line";
                errEl.textContent = `[Error] Compilation failed: ${err.message}`;
                consoleLog.appendChild(errEl);
            }
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }, 800); // Latency delay
    });

    // ==========================================
    // INITIALIZATION RUNNER
    // ==========================================
    loadWorkspaceNote();
    loadLofiPlaylist();
});
