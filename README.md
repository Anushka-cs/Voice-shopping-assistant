# Voice Command Shopping Assistant

A minimalist voice-first shopping list manager with smart suggestions, multilingual voice input, and voice-activated search on a mock product catalog.

## Quick Start

```bash
# 1) Install deps
npm i

# 2) Run dev server
npm run dev

# 3) Open the local URL printed by Vite
```

> Tip: For Chrome on desktop, the Web Speech API works out of the box. For mobile, use Chrome Android. iOS Safari supports webkitSpeechRecognition with user interaction.

## Features Implemented
- Voice input via Web Speech API (start/stop, live transcript)
- NLP parsing for **add / remove / modify / search** (+ quantities, “under $X” filter)
- Multilingual ready: `en-IN`, `en-US`, `hi-IN`
- Shopping list with categories, quantity controls, visual feedback
- Smart suggestions (frequency from history + seasonal seed list)
- Voice-activated search on mock catalog (brand/name, price filter), one-click add

## Notes
- No backend required for demo; persistence can be added later (Firebase/Express).
- For production-grade STT, you can swap in Google STT/Azure STT via a small adapter.

## 200-word Approach (paste in submission)
This project focuses on a fast, voice-first UX. I used the Web Speech API for on-device speech recognition and built a tiny NLP layer to normalize varied phrases into intents: add, remove, modify, and search, including quantity and price filters. Items are auto-categorized using a keyword map for simple organization. Smart suggestions combine a frequency-based model from the user’s recent additions with a small seasonal seed list (configurable per region). Voice-activated search runs against a mock product catalog and supports a max-price constraint (e.g., “find toothpaste under 5”). The UI is intentionally minimalist: a live transcript panel, a suggestions strip for quick taps, the shopping list with quantity controls, and a results grid for search. Visual feedback messages confirm each action. The app is multilingual-ready (English India/US, Hindi) by switching the recognition language code. The code is structured in React with small utilities (NLP, categorization) and kept dependency-light for quick load and easy hosting on Vercel/Netlify. Error handling includes recognition errors and fallback messages when commands aren’t understood.
