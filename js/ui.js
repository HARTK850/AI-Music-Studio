/**
 * UI.js
 * Manages DOM interactions, visualizations, and user feedback.
 */

export class UI {
    constructor(audioEngine, geminiService) {
        this.audioEngine = audioEngine;
        this.geminiService = geminiService;
        this.canvas = document.getElementById('visualizer-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.confetti = new JSConfetti();
        
        // Element References
        this.apiKeyInput = document.getElementById('api-key-input');
        this.saveKeyBtn = document.getElementById('save-api-key');
        this.apiModal = document.getElementById('api-modal');
        this.promptInput = document.getElementById('prompt-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.loopBtn = document.getElementById('loop-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.randomizeBtn = document.getElementById('randomize-btn');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.trackName = document.getElementById('track-name');
        this.playbackTime = document.getElementById('playback-time');
        this.tempoInput = document.getElementById('tempo-input');
        this.instrumentsGrid = document.getElementById('instruments-grid');
        this.mixerSection = document.getElementById('mixer-section');
        this.apiStatusDot = document.getElementById('api-status-dot');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeModalBtn = document.getElementById('close-modal');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkApiKey();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.startVisualizer();
    }

    setupEventListeners() {
        // API Key Handling
        this.saveKeyBtn.addEventListener('click', () => {
            const key = this.apiKeyInput.value.trim();
            if (key) {
                this.geminiService.setApiKey(key);
                this.checkApiKey();
                this.apiModal.classList.add('hidden');
                this.showNotification('API Key Saved!', 'success');
            } else {
                this.showNotification('Please enter a valid API Key', 'error');
            }
        });

        this.settingsBtn.addEventListener('click', () => {
            this.apiModal.classList.remove('hidden');
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.apiModal.classList.add('hidden');
        });

        // Generate Music
        this.generateBtn.addEventListener('click', async () => {
            const prompt = this.promptInput.value.trim();
            if (!prompt) return this.showNotification('Please enter a description first!', 'warning');
            
            if (!this.geminiService.validateApiKey()) {
                this.apiModal.classList.remove('hidden');
                return;
            }

            await this.handleGeneration(prompt);
        });

        // Playback Controls
        this.playPauseBtn.addEventListener('click', async () => {
            if (this.audioEngine.isPlaying) {
                this.audioEngine.pause();
                this.updatePlayIcon(false);
            } else {
                await this.audioEngine.play();
                this.updatePlayIcon(true);
            }
        });

        this.stopBtn.addEventListener('click', () => {
            this.audioEngine.stop();
            this.updatePlayIcon(false);
        });

        this.loopBtn.addEventListener('click', () => {
            const isLooping = Tone.Transport.loop;
            this.audioEngine.toggleLoop(!isLooping);
            this.loopBtn.classList.toggle('text-primary');
            this.showNotification(!isLooping ? 'Loop Enabled' : 'Loop Disabled', 'info');
        });

        // Download
        this.downloadBtn.addEventListener('click', async () => {
            this.showNotification('Recording... Please wait', 'info');
            this.downloadBtn.disabled = true;
            
            // Record 1 loop (4 measures)
            const duration = Tone.Time("4m").toSeconds();
            this.audioEngine.recorder.start();
            this.audioEngine.stop();
            this.audioEngine.play();

            setTimeout(async () => {
                const recording = await this.audioEngine.recorder.stop();
                this.audioEngine.stop();
                this.updatePlayIcon(false);
                
                const url = URL.createObjectURL(recording);
                const anchor = document.createElement("a");
                anchor.download = `gemini-track-${Date.now()}.webm`;
                anchor.href = url;
                anchor.click();
                
                this.downloadBtn.disabled = false;
                this.showNotification('Download Ready!', 'success');
            }, duration * 1000 + 500); // Buffer slightly
        });

        // Randomize
        this.randomizeBtn.addEventListener('click', () => {
            this.audioEngine.randomizeParams();
            this.showNotification('Parameters Randomized', 'success');
        });

        // Tempo
        this.tempoInput.addEventListener('change', (e) => {
            const bpm = parseInt(e.target.value);
            if (bpm >= 60 && bpm <= 200) {
                this.audioEngine.setTempo(bpm);
            }
        });
    }

    checkApiKey() {
        const key = this.geminiService.getApiKey();
        if (key) {
            this.apiKeyInput.value = key;
            this.apiStatusDot.classList.remove('bg-red-500');
            this.apiStatusDot.classList.add('bg-green-500');
        } else {
            this.apiStatusDot.classList.remove('bg-green-500');
            this.apiStatusDot.classList.add('bg-red-500');
            // Show modal if no key on first load
            // setTimeout(() => this.apiModal.classList.remove('hidden'), 1000);
        }
    }

    async handleGeneration(prompt) {
        this.showLoading(true);
        try {
            const musicData = await this.geminiService.generateMusicJSON(prompt);
            console.log("Generated Data:", musicData);
            
            await this.audioEngine.loadTrack(musicData);
            
            this.renderMixer(musicData.tracks);
            this.trackName.textContent = musicData.title || "Untitled Composition";
            this.tempoInput.value = musicData.tempo || 120;
            
            this.enableControls();
            this.confetti.addConfetti();
            this.showNotification('Music Generated Successfully!', 'success');
            this.mixerSection.classList.remove('hidden');

            // Auto play preview
            setTimeout(() => {
                this.audioEngine.play();
                this.updatePlayIcon(true);
            }, 500);

        } catch (error) {
            console.error(error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderMixer(tracks) {
        this.instrumentsGrid.innerHTML = '';
        tracks.forEach((track, index) => {
            const card = document.createElement('div');
            card.className = 'glass-panel p-4 rounded-lg flex flex-col gap-3 instrument-card border border-gray-700 hover:border-gray-500';
            
            const icon = this.getIconForInstrument(track.type);
            
            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-sm text-primary flex items-center gap-2">
                        <i class="fas ${icon}"></i> ${track.name || `Track ${index + 1}`}
                    </span>
                    <span class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">${track.type}</span>
                </div>
                
                <div class="space-y-1">
                    <div class="flex justify-between text-xs text-gray-400">
                        <span>Vol</span>
                        <span id="vol-val-${index}">-5dB</span>
                    </div>
                    <input type="range" min="-60" max="0" value="${track.volume || -5}" 
                           class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                           data-track="${index}" id="vol-slider-${index}">
                </div>

                <div class="flex justify-between mt-2">
                    <button class="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors mute-btn" data-track="${index}">
                        Mute
                    </button>
                    <!-- Solo button could be added here -->
                </div>
            `;
            
            this.instrumentsGrid.appendChild(card);

            // Add listener for volume slider
            const slider = card.querySelector(`#vol-slider-${index}`);
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.audioEngine.setTrackVolume(index, val);
                card.querySelector(`#vol-val-${index}`).textContent = `${val}dB`;
            });

            // Add listener for mute
            const muteBtn = card.querySelector('.mute-btn');
            muteBtn.addEventListener('click', () => {
                const isMuted = this.audioEngine.toggleTrackMute(index);
                if (isMuted) {
                    muteBtn.classList.add('bg-red-500', 'text-white');
                    muteBtn.classList.remove('bg-gray-700', 'text-gray-300');
                    muteBtn.textContent = 'Muted';
                } else {
                    muteBtn.classList.remove('bg-red-500', 'text-white');
                    muteBtn.classList.add('bg-gray-700', 'text-gray-300');
                    muteBtn.textContent = 'Mute';
                }
            });
        });
    }

    getIconForInstrument(type) {
        if (!type) return 'fa-music';
        type = type.toLowerCase();
        if (type.includes('drum') || type.includes('membrane')) return 'fa-drum';
        if (type.includes('metal')) return 'fa-compact-disc'; // Cymbals
        if (type.includes('bass') || type.includes('fm')) return 'fa-guitar'; // Bass usually
        if (type.includes('mono')) return 'fa-wave-square'; // Lead
        if (type.includes('poly')) return 'fa-layer-group'; // Chords
        return 'fa-music';
    }

    updatePlayIcon(isPlaying) {
        if (isPlaying) {
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause text-2xl"></i>';
            this.playPauseBtn.classList.add('animate-pulse-glow');
        } else {
            this.playPauseBtn.innerHTML = '<i class="fas fa-play text-2xl ml-1"></i>';
            this.playPauseBtn.classList.remove('animate-pulse-glow');
        }
    }

    enableControls() {
        this.playPauseBtn.disabled = false;
        this.stopBtn.disabled = false;
        this.downloadBtn.disabled = false;
        this.randomizeBtn.disabled = false;
        this.playPauseBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    showLoading(isLoading) {
        if (isLoading) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    showNotification(msg, type = 'info') {
        // Simple toast implementation could go here
        // For now, console log and alert fallback
        console.log(`[${type.toUpperCase()}] ${msg}`);
        // Optionally creating a DOM element for toast
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl text-white transform transition-all duration-300 translate-y-10 opacity-0 z-50 ${
            type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        // Remove after 3s
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Canvas Visualizer
    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    startVisualizer() {
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            
            const width = this.canvas.width;
            const height = this.canvas.height;
            this.ctx.clearRect(0, 0, width, height);

            if (!this.audioEngine || !this.audioEngine.isInitialized) {
                return;
            }

            const dataArray = this.audioEngine.getAnalysis(); // Now returns Uint8Array (0-255)
            
            // If empty or not playing, draw flat line
            if (dataArray.length === 0 || !this.audioEngine.isPlaying) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, height / 2);
                this.ctx.lineTo(width, height / 2);
                this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
                this.ctx.stroke();
                return;
            }

            // Draw Frequency Bars
            const barWidth = (width / dataArray.length) * 2;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                const value = dataArray[i]; // 0 to 255
                
                // Map 0-255 to height
                barHeight = (value / 255) * height;

                // Color based on height/intensity
                // Low freq = Red/Purple, High freq = Cyan/Blue
                const hue = (i / dataArray.length) * 360;
                
                this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }
}