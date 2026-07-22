// Web Audio API Ambient Engine
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        
        // Audio Node references
        this.nodes = {
            binaural: {
                leftOsc: null,
                rightOsc: null,
                merger: null
            },
            rain: null,
            lofi: null
        };

        // Gain (volume) Node references
        this.gains = {
            master: null,
            binaural: null,
            rain: null,
            forest: null,
            lofi: null,
            chimes: null
        };

        // Stream URL mappings (optimized, highly stable CC/royalty-free audio loops)
        this.urls = {
            rain: "audio/rain.mp3",
            lofi: "audio/lofi.mp3"
        };

        this.binauralFrequencyDiff = 15; // Default Coding Beta 15Hz
        this.baseCarrierFreq = 200;      // 200Hz base carrier frequency
        this.muted = false;
        this.filterNode = null;
        this.analyser = null;
        this.forestTimeout = null;
        this.chimesTimeout = null;
    }

    init() {
        if (this.initialized) return;

        // Initialize AudioContext
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Create Master Volume Controller
        this.gains.master = this.ctx.createGain();
        this.gains.master.gain.value = 1.0;
        this.gains.master.connect(this.ctx.destination);

        // Create Analyser Node for visualizer
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.connect(this.gains.master);

        // Create Lowpass Filter Node (Flow Filter)
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.setValueAtTime(20000, this.ctx.currentTime); // Fully open initially
        this.filterNode.connect(this.analyser);

        // Setup individual mixers (Connect them to the filterNode instead of master)
        this.setupBinauralBeats();
        this.setupLoopAudio('rain');
        this.setupLoopAudio('lofi');
        
        // Setup generative sounds
        this.setupGenerativeForest();
        this.setupGenerativeChimes();

        this.initialized = true;
        console.log("SoundScape Audio Engine initialized. Generative audio & analyser loaded.");
    }

    // Synthesize Binaural Focus Beats (L/R phase difference)
    setupBinauralBeats() {
        this.gains.binaural = this.ctx.createGain();
        this.gains.binaural.gain.value = 0.0;
        this.gains.binaural.connect(this.filterNode); // Route to filter

        this.nodes.binaural.leftOsc = this.ctx.createOscillator();
        this.nodes.binaural.rightOsc = this.ctx.createOscillator();

        this.nodes.binaural.leftOsc.type = 'sine';
        this.nodes.binaural.rightOsc.type = 'sine';

        this.nodes.binaural.leftOsc.frequency.setValueAtTime(this.baseCarrierFreq, this.ctx.currentTime);
        this.nodes.binaural.rightOsc.frequency.setValueAtTime(this.baseCarrierFreq + this.binauralFrequencyDiff, this.ctx.currentTime);

        this.nodes.binaural.merger = this.ctx.createChannelMerger(2);
        
        const leftGain = this.ctx.createGain();
        const rightGain = this.ctx.createGain();

        this.nodes.binaural.leftOsc.connect(leftGain);
        this.nodes.binaural.rightOsc.connect(rightGain);

        leftGain.connect(this.nodes.binaural.merger, 0, 0);
        rightGain.connect(this.nodes.binaural.merger, 0, 1);

        this.nodes.binaural.merger.connect(this.gains.binaural);

        this.nodes.binaural.leftOsc.start(0);
        this.nodes.binaural.rightOsc.start(0);
    }

    // Load and loop web-hosted ambient audio streams
    setupLoopAudio(name) {
        this.gains[name] = this.ctx.createGain();
        this.gains[name].gain.value = 0.0;
        this.gains[name].connect(this.filterNode); // Route to filter

        const audio = new Audio();
        audio.src = this.urls[name];
        audio.loop = true;
        audio.crossOrigin = "anonymous";

        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.gains[name]);
        
        this.nodes[name] = { element: audio, playing: false };
    }

    // Set volume level (0 to 100)
    setVolume(name, percent) {
        if (!this.initialized) this.init();

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const value = percent / 100;

        if (['rain', 'lofi'].includes(name) || name.startsWith('custom_')) {
            const track = this.nodes[name];
            if (track) {
                if (percent > 0 && !track.playing) {
                    track.element.play().catch(e => console.warn(`Autoplay restriction triggered for ${name}`, e));
                    track.playing = true;
                } else if (percent === 0 && track.playing) {
                    track.element.pause();
                    track.playing = false;
                }
            }
        }

        if (this.gains[name]) {
            this.gains[name].gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
        }
    }

    // Change the source URL of a loop dynamically (e.g. for swapping Lofi tracks)
    changeTrackSource(name, newUrl) {
        if (!this.initialized) this.init();
        
        const track = this.nodes[name];
        if (track) {
            const isPlaying = track.playing;
            
            // Pause current track
            track.element.pause();
            
            // Update source
            track.element.src = newUrl;
            track.element.load();
            
            // Resume if it was playing previously
            if (isPlaying) {
                track.element.play().catch(e => console.warn(`Autoplay blocked on track source change: ${newUrl}`, e));
            }
        }
    }

    // Update lowpass filter cutoff frequency based on typing speed (WPM)
    updateFilterCutoff(wpm, active) {
        if (!this.initialized) this.init();
        if (!this.filterNode) return;

        let targetFreq;
        if (!active) {
            targetFreq = 20000; // Open completely
        } else {
            // Scale exponentially between 2500Hz (WPM=0) and 20000Hz (WPM=100)
            const minFreq = 2500;
            const maxFreq = 20000;
            const clampedWPM = Math.min(Math.max(wpm, 0), 100);
            const wpmRatio = clampedWPM / 100;
            targetFreq = minFreq * Math.pow(maxFreq / minFreq, wpmRatio);
        }

        // Slow 6.0s transition constant to create an atmospheric fade-out/in
        this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 6.0);
    }

    // Update Binaural Beats target brainwave frequency
    setBinauralFrequency(diffHz) {
        this.binauralFrequencyDiff = Number(diffHz);
        if (this.nodes.binaural.rightOsc && this.ctx) {
            this.nodes.binaural.rightOsc.frequency.setTargetAtTime(
                this.baseCarrierFreq + this.binauralFrequencyDiff, 
                this.ctx.currentTime, 
                0.2
            );
        }
    }

    // Master mute toggle
    toggleMute() {
        this.muted = !this.muted;
        if (this.gains.master) {
            const targetVal = this.muted ? 0.0 : 1.0;
            this.gains.master.gain.setTargetAtTime(targetVal, this.ctx.currentTime, 0.1);
        }
        return this.muted;
    }

    // Dynamically register a custom loop track
    setupCustomLoopAudio(name, objectUrl) {
        if (!this.initialized) this.init();
        
        // If there's already a track with this name, stop it first
        if (this.nodes[name]) {
            this.nodes[name].element.pause();
        }

        this.gains[name] = this.ctx.createGain();
        this.gains[name].gain.value = 0.0;
        this.gains[name].connect(this.filterNode);

        const audio = new Audio();
        audio.src = objectUrl;
        audio.loop = true;

        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.gains[name]);
        
        this.nodes[name] = { element: audio, playing: false };
    }

    // Delete a custom loop track
    removeCustomLoopAudio(name) {
        const track = this.nodes[name];
        if (track) {
            track.element.pause();
            delete this.nodes[name];
        }
        if (this.gains[name]) {
            this.gains[name].disconnect();
            delete this.gains[name];
        }
    }

    // Setup Generative Forest Birds Synth
    setupGenerativeForest() {
        this.gains.forest = this.ctx.createGain();
        this.gains.forest.gain.value = 0.0;
        this.gains.forest.connect(this.filterNode);
        this.startGenerativeForestLoop();
    }

    // Setup Generative Chimes Synth
    setupGenerativeChimes() {
        this.gains.chimes = this.ctx.createGain();
        this.gains.chimes.gain.value = 0.0;
        this.gains.chimes.connect(this.filterNode);
        this.startGenerativeChimesLoop();
    }

    playProceduralBirdTweet() {
        if (!this.initialized || this.muted) return;
        const ctx = this.ctx;
        if (!ctx || ctx.state === 'suspended') return;

        const gainVal = this.gains.forest ? this.gains.forest.gain.value : 0;
        if (gainVal <= 0.01) return;

        const chirps = Math.floor(Math.random() * 3) + 1;
        let timeOffset = 0;

        for (let i = 0; i < chirps; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";

            const startFreq = 2600 + Math.random() * 700;
            const endFreq = 3900 + Math.random() * 900;
            const duration = 0.07 + Math.random() * 0.05;

            osc.frequency.setValueAtTime(startFreq, ctx.currentTime + timeOffset);
            osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + timeOffset + duration);

            gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
            gain.gain.linearRampToValueAtTime(gainVal * 0.12, ctx.currentTime + timeOffset + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + duration);

            osc.connect(gain);
            gain.connect(this.filterNode);

            osc.start(ctx.currentTime + timeOffset);
            osc.stop(ctx.currentTime + timeOffset + duration + 0.01);

            timeOffset += duration + 0.05 + Math.random() * 0.05;
        }
    }

    startGenerativeForestLoop() {
        const scheduleNext = () => {
            const nextDelay = 3000 + Math.random() * 7000;
            this.forestTimeout = setTimeout(() => {
                this.playProceduralBirdTweet();
                scheduleNext();
            }, nextDelay);
        };
        scheduleNext();
    }

    playWindChimes() {
        if (!this.initialized || this.muted) return;
        const ctx = this.ctx;
        if (!ctx || ctx.state === 'suspended') return;

        const gainVal = this.gains.chimes ? this.gains.chimes.gain.value : 0;
        if (gainVal <= 0.01) return;

        const chimesCount = 3 + Math.floor(Math.random() * 3);
        const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1174.66, 1318.51];
        
        let delay = 0;
        for (let i = 0; i < chimesCount; i++) {
            const baseFreq = scale[Math.floor(Math.random() * scale.length)];
            this.triggerChimeRod(baseFreq, gainVal, ctx.currentTime + delay);
            delay += 0.15 + Math.random() * 0.25;
        }
    }

    triggerChimeRod(baseFreq, volume, time) {
        const ctx = this.ctx;
        const partials = [1.0, 2.76, 5.40, 8.93];
        const ampGains = [1.0, 0.45, 0.25, 0.10];
        const decayTime = 1.6 + Math.random() * 1.6;

        const chimeGain = ctx.createGain();
        chimeGain.gain.setValueAtTime(0, time);
        chimeGain.gain.linearRampToValueAtTime(volume * 0.15, time + 0.005);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, time + decayTime);
        chimeGain.connect(this.filterNode);

        partials.forEach((multiplier, index) => {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(baseFreq * multiplier, time);

            const partialGain = ctx.createGain();
            partialGain.gain.setValueAtTime(ampGains[index], time);
            partialGain.gain.exponentialRampToValueAtTime(0.0001, time + (decayTime / multiplier));

            osc.connect(partialGain);
            partialGain.connect(chimeGain);

            osc.start(time);
            osc.stop(time + decayTime + 0.05);
        });
    }

    startGenerativeChimesLoop() {
        const scheduleNext = () => {
            const nextDelay = 7000 + Math.random() * 11000;
            this.chimesTimeout = setTimeout(() => {
                this.playWindChimes();
                scheduleNext();
            }, nextDelay);
        };
        scheduleNext();
    }
}

// Global reference
const sound = new SoundEngine();
