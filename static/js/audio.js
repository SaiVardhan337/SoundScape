// Web Audio API Ambient Engine
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        
        // Audio Node references
        this.nodes = {
            pink: null,
            binaural: {
                leftOsc: null,
                rightOsc: null,
                merger: null
            },
            rain: null,
            forest: null,
            lofi: null
        };

        // Gain (volume) Node references
        this.gains = {
            master: null,
            pink: null,
            binaural: null,
            rain: null,
            forest: null,
            lofi: null
        };

        // Local URL mappings downloaded directly from YouTube links
        this.urls = {
            rain: "audio/rain.mp3",
            forest: "audio/forest.mp3",
            lofi: "audio/lofi.mp3"
        };

        this.binauralFrequencyDiff = 10; // Default Alpha 10Hz
        this.baseCarrierFreq = 200;      // 200Hz base carrier frequency
        this.muted = false;
        this.filterNode = null;
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

        // Create Lowpass Filter Node (Flow Filter)
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.setValueAtTime(20000, this.ctx.currentTime); // Fully open initially
        this.filterNode.connect(this.gains.master);

        // Setup individual mixers (Connect them to the filterNode instead of master)
        this.setupPinkNoise();
        this.setupBinauralBeats();
        this.setupLoopAudio('rain');
        this.setupLoopAudio('forest');
        this.setupLoopAudio('lofi');

        this.initialized = true;
        console.log("SoundScape Audio Engine initialized. Ambient paths loaded.");
    }

    // Programmatically synthesize Pink Noise (soft, balanced, leaf-rustle sound)
    // Uses Paul Kellet's refined method to generate accurate 1/f spectral density.
    setupPinkNoise() {
        this.gains.pink = this.ctx.createGain();
        this.gains.pink.gain.value = 0.0;
        this.gains.pink.connect(this.filterNode); // Route to filter

        const bufferSize = 10 * this.ctx.sampleRate; // 10 seconds of unique noise
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            output[i] = pink * 0.11; // scale to prevent clipping and match standard levels
        }

        this.nodes.pink = this.ctx.createBufferSource();
        this.nodes.pink.buffer = noiseBuffer;
        this.nodes.pink.loop = true;
        this.nodes.pink.connect(this.gains.pink);
        this.nodes.pink.start(0);
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

        if (['rain', 'forest', 'lofi'].includes(name)) {
            const track = this.nodes[name];
            if (percent > 0 && !track.playing) {
                track.element.play().catch(e => console.warn(`Autoplay restriction triggered for ${name}`, e));
                track.playing = true;
            } else if (percent === 0 && track.playing) {
                track.element.pause();
                track.playing = false;
            }
        }

        if (this.gains[name]) {
            this.gains[name].gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
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
}

// Global reference
const sound = new SoundEngine();
