<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Trance Studio - Pro Edition</title>
    <style>
        :root {
            --neon-blue: #00f2ff;
            --neon-purple: #bc13fe;
            --bg-dark: #050505;
            --panel-bg: #11111b;
        }

        body {
            background-color: var(--bg-dark);
            color: #fff;
            font-family: 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .studio-container {
            width: 95%;
            max-width: 1200px;
            background: var(--panel-bg);
            margin: 20px;
            padding: 40px;
            border-radius: 24px;
            border: 1px solid #333;
            box-shadow: 0 0 50px rgba(0, 242, 255, 0.1);
        }

        header {
            text-align: center;
            margin-bottom: 40px;
        }

        h1 {
            font-size: 2.5rem;
            background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 4px;
        }

        .api-section {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 12px;
        }

        input, textarea {
            background: #000;
            border: 1px solid #444;
            color: #fff;
            padding: 12px;
            border-radius: 8px;
            font-size: 1rem;
        }

        input[type="password"] { flex: 1; }

        .prompt-box {
            width: 100%;
            height: 100px;
            margin-bottom: 20px;
            border: 1px solid var(--neon-blue);
        }

        .action-btns {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }

        button {
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            transition: 0.3s;
        }

        .btn-generate { background: var(--neon-blue); color: #000; }
        .btn-stop { background: #ff4444; color: #fff; }
        .btn-download { background: #00ff88; color: #000; }

        button:hover:not(:disabled) {
            transform: scale(1.02);
            filter: brightness(1.2);
        }

        button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .visualizer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        canvas {
            width: 100%;
            height: 200px;
            background: #000;
            border-radius: 12px;
            border: 1px solid #222;
        }

        .mixer-panel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 15px;
            background: #0a0a0f;
            padding: 20px;
            border-radius: 12px;
        }

        .channel {
            text-align: center;
            padding: 10px;
            background: #1a1a25;
            border-radius: 8px;
        }

        .led {
            width: 10px;
            height: 10px;
            background: #333;
            border-radius: 50%;
            margin: 0 auto 10px;
        }

        .led.active { background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue); }

        .log-area {
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            background: #000;
            color: #0f0;
            padding: 15px;
            height: 150px;
            overflow-y: auto;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #333;
        }

        .loading-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }

        .loader {
            border: 5px solid #333;
            border-top: 5px solid var(--neon-blue);
            border-radius: 50%;
            width: 50px; height: 50px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>

<div class="loading-overlay" id="loaderOverlay">
    <div style="text-align:center">
        <div class="loader"></div>
        <p>ה-AI בונה את הטראק שלך...</p>
    </div>
</div>

<div class="studio-container">
    <header>
        <h1>AI Trance Music Engine</h1>
        <p>מערכת סינתזה מתקדמת המופעלת על ידי בינה מלאכותית</p>
    </header>

    <div class="api-section">
        <input type="password" id="apiKey" placeholder="הכנס מפתח API של Gemini">
        <button class="btn-generate" style="padding: 0 20px;" onclick="saveApiKey()">שמור מפתח</button>
    </div>

    <div class="section">
        <label>תיאור המוזיקה (Prompt):</label>
        <textarea id="prompt" class="prompt-box" placeholder="תאר את הסגנון, הקצב והאווירה (למשל: Progressive Trance with heavy kicks and melodic lead)"></textarea>
    </div>

    <div class="action-btns">
        <button id="generateBtn" class="btn-generate" onclick="handleGenerate()">צור והפעל מוזיקה</button>
        <button id="stopBtn" class="btn-stop" onclick="stopMusic()" disabled>עצור</button>
        <button id="downloadBtn" class="btn-download" onclick="exportWav()" disabled>הורד WAV</button>
    </div>

    <div class="visualizer-grid">
        <div>
            <label>ספקטרום תדרים</label>
            <canvas id="freqCanvas"></canvas>
        </div>
        <div>
            <label>גלי קול (Oscilloscope)</label>
            <canvas id="waveCanvas"></canvas>
        </div>
    </div>

    <div class="mixer-panel">
        <div class="channel"><div id="led-kick" class="led"></div>KICK</div>
        <div class="channel"><div id="led-snare" class="led"></div>SNARE</div>
        <div class="channel"><div id="led-hihat" class="led"></div>HI-HAT</div>
        <div class="channel"><div id="led-bass" class="led"></div>BASS</div>
        <div class="channel"><div id="led-lead" class="led"></div>LEAD</div>
        <div class="channel"><div id="led-pad" class="led"></div>PADS</div>
    </div>

    <div id="log" class="log-area">המערכת מוכנה...</div>
</div>

<script>
/**
 * AI TRANCE ENGINE v2.0
 * מנוע סינתזה רב-ערוצי הכולל תופים, בס וליד
 */

const STORAGE_KEY = 'ai_trance_studio_key';
let audioCtx, masterGain, mainAnalyser, waveAnalyser, recorder;
let isPlaying = false;
let recordedChunks = [];
let sequencerTimer;

// --- INITIALIZATION ---

window.onload = () => {
    const key = localStorage.getItem(STORAGE_KEY);
    if(key) document.getElementById('apiKey').value = key;
    initCanvases();
};

function saveApiKey() {
    localStorage.setItem(STORAGE_KEY, document.getElementById('apiKey').value);
    addLog("מפתח ה-API נשמר במערכת.");
}

function addLog(msg) {
    const log = document.getElementById('log');
    log.innerHTML += `> ${msg}<br>`;
    log.scrollTop = log.scrollHeight;
}

// --- SYNTHESIS ENGINE CLASSES ---

class DrumSynth {
    constructor(ctx, dest) {
        this.ctx = ctx;
        this.dest = dest;
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.dest);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
        this.flashLed('kick');
    }

    playHihat(time) {
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.dest);

        noise.start(time);
        this.flashLed('hihat');
    }

    playSnare(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(this.dest);
        osc.start(time);
        osc.stop(time + 0.2);
        this.flashLed('snare');
    }

    flashLed(id) {
        const led = document.getElementById(`led-${id}`);
        led.classList.add('active');
        setTimeout(() => led.classList.remove('active'), 100);
    }
}

class AcidSynth {
    constructor(ctx, dest) {
        this.ctx = ctx;
        this.dest = dest;
    }

    playNote(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.Q.value = 15;
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.exponentialRampToValueAtTime(3000, time + 0.1);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.dest);

        osc.start(time);
        osc.stop(time + duration);
        this.flashLed('bass');
    }

    flashLed(id) {
        const led = document.getElementById(`led-${id}`);
        led.classList.add('active');
        setTimeout(() => led.classList.remove('active'), 100);
    }
}

class LeadSynth {
    constructor(ctx, dest) {
        this.ctx = ctx;
        this.dest = dest;
    }

    playNote(freq, time, duration) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'square';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.01, time); // Detune

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.dest);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
        this.flashLed('lead');
    }

    flashLed(id) {
        const led = document.getElementById(`led-${id}`);
        led.classList.add('active');
        setTimeout(() => led.classList.remove('active'), 100);
    }
}

// --- SEQUENCER LOGIC ---

let currentBPM = 140;
let currentPattern = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    bass: [40, 40, 80, 40, 40, 40, 120, 40, 40, 40, 80, 40, 40, 40, 120, 40],
    lead: [0, 0, 330, 0, 440, 0, 554, 0, 659, 0, 440, 0, 330, 0, 0, 0]
};

function scheduler() {
    const lookahead = 0.1;
    const scheduleInterval = 25;
    let nextNoteTime = audioCtx.currentTime;
    let currentStep = 0;

    const drums = new DrumSynth(audioCtx, masterGain);
    const acid = new AcidSynth(audioCtx, masterGain);
    const lead = new LeadSynth(audioCtx, masterGain);

    function nextStep() {
        const secondsPerStep = 60.0 / currentBPM / 4.0;
        nextNoteTime += secondsPerStep;
        currentStep = (currentStep + 1) % 16;
    }

    function scheduleStep(step, time) {
        if (currentPattern.kick[step]) drums.playKick(time);
        if (currentPattern.hihat[step]) drums.playHihat(time);
        if (currentPattern.snare[step]) drums.playSnare(time);
        if (currentPattern.bass[step] > 0) acid.playNote(currentPattern.bass[step], time, 0.15);
        if (currentPattern.lead[step] > 0) lead.playNote(currentPattern.lead[step], time, 0.4);
    }

    sequencerTimer = setInterval(() => {
        while (nextNoteTime < audioCtx.currentTime + lookahead) {
            scheduleStep(currentStep, nextNoteTime);
            nextStep();
        }
    }, scheduleInterval);
}

// --- AI INTEGRATION ---

async function handleGenerate() {
    const apiKey = document.getElementById('apiKey').value;
    const userPrompt = document.getElementById('prompt').value;

    if(!apiKey) return addLog("שגיאה: חסר מפתח API");
    
    document.getElementById('loaderOverlay').style.display = 'flex';
    addLog("מתקשר עם Gemini AI...");

    const systemMsg = `You are a professional Trance producer. Generate a JSON object for a music pattern.
    The BPM should be between 130-150. 
    The patterns are arrays of 16 steps.
    For kick/hihat/snare: 1 for play, 0 for silent.
    For bass/lead: frequency in Hz, 0 for silent. Use scales like A Minor (A2=110Hz, A3=220Hz, etc.).
    Format: {"bpm": 140, "kick": [1,0...], "hihat": [0,1...], "snare": [0,0...], "bass": [55,55...], "lead": [0,440...]}
    Return ONLY raw JSON.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Create a ${userPrompt} pattern.` }] }],
                systemInstruction: { parts: [{ text: systemMsg }] }
            })
        });

        const data = await response.json();
        const aiJson = JSON.parse(data.candidates[0].content.parts[0].text);
        
        currentBPM = aiJson.bpm || 140;
        currentPattern = aiJson;
        
        addLog(`הטראק מוכן! BPM: ${currentBPM}`);
        startStudio();
    } catch (err) {
        addLog("שגיאה בניתוח תגובת ה-AI. מפעיל הגדרות ברירת מחדל.");
        startStudio();
    } finally {
        document.getElementById('loaderOverlay').style.display = 'none';
    }
}

// --- AUDIO SESSION CONTROL ---

function startStudio() {
    if (isPlaying) stopMusic();

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Nodes
    masterGain = audioCtx.createGain();
    mainAnalyser = audioCtx.createAnalyser();
    waveAnalyser = audioCtx.createAnalyser();
    const dest = audioCtx.createMediaStreamDestination();
    
    masterGain.connect(mainAnalyser);
    mainAnalyser.connect(waveAnalyser);
    waveAnalyser.connect(audioCtx.destination);
    waveAnalyser.connect(dest);

    // Recording
    recordedChunks = [];
    recorder = new MediaRecorder(dest.stream);
    recorder.ondataavailable = e => recordedChunks.push(e.data);
    recorder.start();

    isPlaying = true;
    scheduler();
    drawVisualizers();

    document.getElementById('stopBtn').disabled = false;
    document.getElementById('downloadBtn').disabled = true;
    addLog("התחלת נגינה והקלטה...");
}

function stopMusic() {
    if (sequencerTimer) clearInterval(sequencerTimer);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    if (audioCtx) audioCtx.close();
    
    isPlaying = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('downloadBtn').disabled = false;
    addLog("המוזיקה נעצרה. הקובץ מוכן להורדה.");
}

function exportWav() {
    const blob = new Blob(recordedChunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_trance_track.wav';
    a.click();
}

// --- VISUALIZERS ---

function initCanvases() {
    const fC = document.getElementById('freqCanvas');
    const wC = document.getElementById('waveCanvas');
    fC.width = fC.offsetWidth; fC.height = 200;
    wC.width = wC.offsetWidth; wC.height = 200;
}

function drawVisualizers() {
    if(!isPlaying) return;
    requestAnimationFrame(drawVisualizers);

    // Freq
    const fC = document.getElementById('freqCanvas');
    const fCtx = fC.getContext('2d');
    const fData = new Uint8Array(mainAnalyser.frequencyBinCount);
    mainAnalyser.getByteFrequencyData(fData);
    
    fCtx.fillStyle = '#000';
    fCtx.fillRect(0,0,fC.width, fC.height);
    for(let i=0; i<fData.length; i++) {
        const h = (fData[i] / 255) * fC.height;
        fCtx.fillStyle = `hsl(${i/2}, 100%, 50%)`;
        fCtx.fillRect(i * 3, fC.height - h, 2, h);
    }

    // Wave
    const wC = document.getElementById('waveCanvas');
    const wCtx = wC.getContext('2d');
    const wData = new Uint8Array(waveAnalyser.fftSize);
    waveAnalyser.getByteTimeDomainData(wData);
    
    wCtx.fillStyle = '#000';
    wCtx.fillRect(0,0,wC.width, wC.height);
    wCtx.lineWidth = 2;
    wCtx.strokeStyle = (--neon-blue);
    wCtx.beginPath();
    const sliceWidth = wC.width / wData.length;
    let x = 0;
    for(let i=0; i<wData.length; i++) {
        const v = wData[i] / 128.0;
        const y = v * wC.height / 2;
        if(i===0) wCtx.moveTo(x,y); else wCtx.lineTo(x,y);
        x += sliceWidth;
    }
    wCtx.stroke();
}

</script>
</body>
</html>
