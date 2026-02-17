/**
 * App.js
 * Main entry point for the application.
 */

import { GeminiService } from './geminiService.js';
import { AudioEngine } from './audioEngine.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize Services
        const geminiService = new GeminiService();
        const audioEngine = new AudioEngine();
        
        // Initialize UI with dependencies
        const ui = new UI(audioEngine, geminiService);

        console.log('Application Initialized Successfully');

        // Optional: Pre-warm Tone.js context on first user interaction
        // This is handled by UI play button but good to know state
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Critical Error: ' + error.message);
    }
});
