/**
 * GeminiService.js
 * Handles interactions with Google's Gemini API for music generation.
 */

export class GeminiService {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        // Updated to use the faster and more reliable gemini-1.5-flash model
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    }

    getApiKey() {
        return this.apiKey;
    }

    validateApiKey() {
        return this.apiKey && this.apiKey.length > 20;
    }

    /**
     * Sends a prompt to Gemini to generate a music composition in JSON format.
     * @param {string} userPrompt - The user's description of the music.
     * @returns {Promise<Object>} - The parsed JSON music object.
     */
    async generateMusicJSON(userPrompt) {
        if (!this.validateApiKey()) {
            throw new Error('API Key is missing or invalid.');
        }

        const systemPrompt = `
        You are a world-class music composer and expert in Tone.js and Web Audio API.
        Your task is to compose a full song based on the user's description.
        
        OUTPUT FORMAT:
        You must return ONLY a valid JSON object. Do not include any markdown formatting like \`\`\`json or \`\`\`.
        The JSON must adhere to this exact schema:
        
        {
            "title": "Song Title",
            "tempo": 120, // BPM (60-180)
            "timeSignature": [4, 4],
            "key": "C Major",
            "tracks": [
                {
                    "name": "Drums", // Instrument name
                    "type": "membranesynth", // Options: "fmsynth", "amsynth", "membranesynth", "metalsynth", "monosynth", "polysynth", "noise"
                    "volume": -10, // Decibels (-60 to 0)
                    "pan": 0, // -1 (left) to 1 (right)
                    "notes": [
                        {
                            "pitch": "C2", // Note name (e.g., C4, F#3) or frequency. For drums/noise use specific mapping if needed but usually pitch is ignored for noise.
                            "duration": "8n", // Tone.js duration notation: "4n", "8n", "16n", "1m" (measure), etc.
                            "time": "0:0:0", // Tone.js time notation: "Bars:Quarters:Sixteenths" (e.g., "0:0:0", "0:0:2", "1:2:0")
                            "velocity": 0.8 // 0 to 1
                        }
                    ],
                    "effects": ["reverb", "delay"] // Optional array of effects to apply
                }
            ]
        }

        COMPOSITION RULES:
        1. Create a FULL loop of at least 4 bars (measures 0 to 3).
        2. Use multiple tracks (at least 3-4): e.g., Bass, Melody (Lead), Chords (Harmony), Drums.
        3. Make it musically interesting. Use syncopation, varying velocities, and proper harmony.
        4. "membranesynth" is good for kicks/toms. "metalsynth" is good for hi-hats. "fmsynth" for bass. "polysynth" for chords.
        5. Ensure the "time" values are strictly ordered and within the 4-bar limit.
        
        USER PROMPT: "${userPrompt}"
        `;

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7, // Creativity balance
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate music');
            }

            const data = await response.json();
            
            // Extract the text content
            let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('Gemini returned an empty response.');
            }

            // Improved cleaning logic for Gemini 1.5 Flash output
            // 1. Remove Markdown code blocks (```json ... ```)
            // 2. Find the first '{' and last '}' to extract the JSON object
            let cleanText = generatedText.replace(/```json/g, '').replace(/```/g, '');
            
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            // Parse JSON
            try {
                const musicData = JSON.parse(cleanText);
                return musicData;
            } catch (parseError) {
                console.error("Failed to parse JSON:", cleanText);
                throw new Error('Gemini generated invalid JSON. Please try again with a different prompt.');
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    }
}
