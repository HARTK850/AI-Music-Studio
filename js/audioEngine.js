/**
 * AudioEngine.js
 * Core logic for Tone.js integration. Handles playback, synthesis, and audio routing.
 */

export class AudioEngine {
    constructor() {
        this.isPlaying = false;
        this.tracks = []; // Stores instrument objects
        this.analyser = null;
        this.recorder = null;
        this.recordingChunks = [];
        this.currentTempo = 120;
        this.isInitialized = false;
        this.masterVolume = new Tone.Volume(-10).toDestination();
        this.reverb = new Tone.Reverb(2).toDestination();
        this.delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
    }

    /**
     * Initialize Audio Context on user interaction (required by browsers).
     */
    async init() {
        if (this.isInitialized) return;

        await Tone.start();
        console.log("Audio Context Started");

        // Set up Master Bus
        Tone.Destination.chain(this.masterVolume);
        
        // Setup Effects Bus
        this.reverb.wet.value = 0.2;
        this.delay.wet.value = 0.2;

        // Setup Analyzer for Visualizer
        this.analyser = new Tone.Analyser("fft", 256);
        this.masterVolume.connect(this.analyser);

        // Setup Recorder
        this.recorder = new Tone.Recorder();
        this.masterVolume.connect(this.recorder);

        this.isInitialized = true;
    }

    /**
     * Parses the JSON music data and schedules playback.
     * @param {Object} musicData - JSON object from Gemini.
     */
    async loadTrack(musicData) {
        if (!this.isInitialized) await this.init();

        this.stop();
        this.clearTracks();

        // Set Global Tempo
        Tone.Transport.bpm.value = musicData.tempo || 120;
        this.currentTempo = musicData.tempo || 120;

        // Process Each Track
        if (musicData.tracks && Array.isArray(musicData.tracks)) {
            musicData.tracks.forEach((trackData, index) => {
                this.createInstrumentTrack(trackData, index);
            });
        }
        
        console.log(`Loaded ${this.tracks.length} tracks.`);
    }

    /**
     * Creates a Tone.js instrument based on track data.
     * @param {Object} trackData 
     * @param {number} index 
     */
    createInstrumentTrack(trackData, index) {
        let instrument;
        const type = trackData.type ? trackData.type.toLowerCase() : 'synth';

        // Select Instrument Type
        switch (type) {
            case 'membranesynth': // Great for kicks/toms
                instrument = new Tone.MembraneSynth({
                    pitchDecay: 0.05,
                    octaves: 10,
                    oscillator: { type: "sine" },
                    envelope: {
                        attack: 0.001,
                        decay: 0.4,
                        sustain: 0.01,
                        release: 1.4,
                        attackCurve: "exponential"
                    }
                });
                break;
            case 'metalsynth': // Great for hi-hats/cymbals
                instrument = new Tone.MetalSynth({
                    frequency: 200,
                    envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                });
                break;
            case 'fmsynth': // Great for bass/bell sounds
                instrument = new Tone.FMSynth({
                    harmonicity: 3,
                    modulationIndex: 10,
                    detune: 0,
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.01, decay: 0.01, sustain: 1, release: 0.5 },
                    modulation: { type: "square" },
                    modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
                });
                break;
            case 'amsynth': // Vintage synth sounds
                instrument = new Tone.AMSynth({
                    harmonicity: 2,
                    oscillator: { type: "amsine2" },
                    envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 1 },
                    modulation: { type: "amsquare" },
                    modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
                });
                break;
            case 'monosynth': // Classic monosynth lead
                instrument = new Tone.MonoSynth({
                    oscillator: { type: "square" },
                    envelope: { attack: 0.1 }
                });
                break;
            case 'polysynth': // Chords/Pads
            default:
                instrument = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
                });
                break;
        }

        // Apply Volume & Panning
        const vol = new Tone.Volume(trackData.volume || -5);
        const panner = new Tone.Panner(trackData.pan || 0);

        // Chain Effects based on trackData.effects
        // Simplified routing: Instrument -> Volume -> Panner -> Master
        // We could add track-specific effects here if needed.
        
        instrument.chain(vol, panner, this.masterVolume);

        // Schedule Notes using Tone.Part for precise timing
        // Notes format: { time: "0:0:0", note: "C4", duration: "8n", velocity: 0.9 }
        const part = new Tone.Part((time, note) => {
            if (instrument.name === "MembraneSynth" || instrument.name === "MetalSynth") {
                // Percussion often ignores duration or handles it differently
                 instrument.triggerAttackRelease(note.pitch || "C2", note.duration || "8n", time, note.velocity);
            } else {
                 instrument.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
            }
        }, trackData.notes).start(0);

        part.loop = true;
        part.loopEnd = "4m"; // Default 4 measure loop

        this.tracks.push({
            name: trackData.name || `Track ${index + 1}`,
            instrument: instrument,
            volumeNode: vol,
            part: part,
            panner: panner,
            originalData: trackData // Keep for reference
        });
    }

    /**
     * Start playback.
     */
    async play() {
        if (!this.isInitialized) await this.init();
        await Tone.Transport.start();
        this.isPlaying = true;
    }

    /**
     * Pause playback.
     */
    pause() {
        Tone.Transport.pause();
        this.isPlaying = false;
    }

    /**
     * Stop playback and reset transport.
     */
    stop() {
        Tone.Transport.stop();
        this.isPlaying = false;
    }

    /**
     * Clear all tracks and dispose instruments to free memory.
     */
    clearTracks() {
        this.tracks.forEach(track => {
            track.part.dispose();
            track.instrument.dispose();
            track.volumeNode.dispose();
            track.panner.dispose();
        });
        this.tracks = [];
        Tone.Transport.cancel(); // Clear scheduled events
    }

    /**
     * Toggle Loop (Transport loop).
     */
    toggleLoop(loopState) {
        Tone.Transport.loop = loopState;
        Tone.Transport.loopStart = 0;
        Tone.Transport.loopEnd = "4m"; 
    }

    /**
     * Record the output to a Blob.
     */
    async startRecording() {
        this.recorder.start();
    }

    async stopRecording() {
        const recording = await this.recorder.stop();
        return recording; // Returns a Blob
    }

    /**
     * Get Analyser data for visualization.
     * @returns {Uint8Array} - Frequency data normalized to 0-255 range.
     */
    getAnalysis() {
        if (!this.analyser) return new Uint8Array(0);
        
        // Tone.Analyser returns Float32Array in Decibels (approx -140 to 0)
        const values = this.analyser.getValue();
        const length = values.length;
        const data = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            let val = values[i];
            
            // Clamp value between -100 dB and 0 dB
            if (val === -Infinity || val < -100) val = -100;
            if (val > 0) val = 0;
            
            // Map -100dB..0dB to 0..255
            // (-100 + 100) = 0 -> 0
            // (0 + 100) = 100 -> 255
            const normalized = (val + 100) / 100;
            data[i] = Math.floor(normalized * 255);
        }
        return data;
    }

    /**
     * Adjust volume for a specific track.
     * @param {number} trackIndex 
     * @param {number} value - Volume in dB
     */
    setTrackVolume(trackIndex, value) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].volumeNode.volume.rampTo(value, 0.1);
        }
    }

    /**
     * Mute/Unmute a track.
     */
    toggleTrackMute(trackIndex) {
        if (this.tracks[trackIndex]) {
            this.tracks[trackIndex].volumeNode.mute = !this.tracks[trackIndex].volumeNode.mute;
            return this.tracks[trackIndex].volumeNode.mute;
        }
        return false;
    }
    
    /**
     * Update Tempo
     */
    setTempo(bpm) {
        Tone.Transport.bpm.rampTo(bpm, 1);
        this.currentTempo = bpm;
    }

    /**
     * Randomize parameters (Variation)
     */
    randomizeParams() {
        this.tracks.forEach(track => {
            // Random Pan
            const newPan = (Math.random() * 2) - 1;
            track.panner.pan.rampTo(newPan, 1);
            
            // Random Filter if applicable (simplified)
            // Ideally we'd have access to synth parameters directly
        });
    }
}