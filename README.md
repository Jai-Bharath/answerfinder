# AnswerFinder - Intelligent Q&A Lookup Chrome Extension (v2.0)

**Production-grade offline answer engine with intelligent multi-tier matching for Q&A pairs. Now with Sidebar UI and JSON Support!**

---

## 🚀 What's New in v2.0

*   **JSON Support**: Upload structured `.json` files in addition to `.txt`.
*   **Sidebar UI**: Answers now appear in a sleek, non-intrusive sidebar on the right instead of blocking content.
*   **Self-Healing**: Automatically injects scripts into already-open tabs—no more "Refresh the page" errors!
*   **Enhanced Matching**: Improved 4-tier reverse-lookup engine (Exact -> Keyword -> Fuzzy -> Partial).

---

## Features

✨ **Intelligent Matching**
- **4-Tier Pipeline**: Exact → Keyword → Fuzzy → Partial match.
- **Reverse Lookup**: Finds the question even if you select a substring (e.g., selecting just the middle part of a sentence).
- **Sub-100ms Response**: optimized for instant lookup.
- **Confidence Scoring**: Shows High/Medium/Low confidence badges.

🎨 **Modern User Interface**
- **Fixed Sidebar**: Slides in from the right, preventing content overlap.
- **Live Statistics**: See your total loaded questions and cache hits in real-time.
- **Dark Mode Friendly**: Clean, neutral styling.

💾 **Robust Data Handling**
- **Offline First**: All data stored locally in IndexedDB (Privacy focused!).
- **Large Dataset Support**: Handles 10,000+ questions with ease.
- **Two Formats**: Supports simple TXT lists and structured JSON.

---

## Installation

1.  **Clone/Download** this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  **Enable "Developer mode"** (toggle in top right).
4.  Click **"Load unpacked"**.
5.  Select the `answerfinder` folder.
6.  The extension is now ready!

> **Update Note**: If you are updating from v1.0, please remove the old extension and add it again, or click "Update" and restart Chrome to ensure the new Service Worker loads.

---

## Usage

### 1. Upload Q&A Data

1.  Click the **AnswerFinder icon** in the Chrome toolbar.
2.  Click **"Choose File"**.
3.  Select your data file (`.txt` or `.json`).
4.  Wait for the green success message.

#### Supported Data Formats

**Option A: Simple Text (.txt)**
Standard "Question then Answer" format separated by blank lines.
```text
What is the capital of France?
Paris

What is 2 + 2?
4
```

**Option B: JSON (.json) [NEW!]**
Array of objects with `question` and `answer` fields.
```json
[
  {
    "question": "What is the capital of France?",
    "answer": "Paris"
  },
  {
    "question": "What is 2 + 2?",
    "answer": "4"
  }
]
```

### 2. Search for Answers

1.  Highlight any text on a webpage (e.g., a quiz question).
2.  **Right-Click** and select **"Search Answer"**.
3.  The **Sidebar** will slide in from the right with the best match.

### 3. Settings & Tools

Open the extension popup to:
*   **Export Data**: Save your current database as a JSON file.
*   **Clear Data**: Wipe all questions from the extension.
*   **Adjust Sensitivity**: Change the minimum confidence threshold.
*   **Toggle Modes**: Enable/Disable Fuzzy or Partial matching.

---

## Architecture (v2.0)

### Project Structure (Updated)

```
answerfinder/
├── manifest.json              # V3 Manifest (v1.2+)
├── background/                # Service Worker
│   ├── service-worker.js      # Main background script
│   ├── msg-handler.js         # Message routing (Renamed from message-handler.js)
│   └── state-manager.js
├── content/                   # Content Scripts
│   └── content-script-bundled.js # Bundled UI and Logic
├── lib/                       # Core Logic
│   ├── parsers/               # JSON & TXT Parsers
│   ├── matching/              # 4-Tier Matching Engine
│   └── storage/               # IndexedDB Manager
└── popup/                     # UI Logic
```

### 4-Tier Matching Engine

1.  **Exact Match**: Instant hash lookup (O(1)).
2.  **Keyword Match**: TF-IDF style keyword intersection.
3.  **Fuzzy Match**: Levenshtein/Jaro-Winkler distance for typos.
4.  **Partial Match**: Substring detection (Finding user query inside a stored question).

---

## Troubleshooting

**"Upload is not working / Clicking button does nothing"**
*   This usually means the extension needs a hard reload.
*   **Fix**: Go to `chrome://extensions`, toggle the extension OFF and ON again, then refresh the extension page.

**"Searching..." spinner hangs forever**
*   This means the background service worker is outdated.
*   **Fix**: Click "Update" in `chrome://extensions` and restart the extension.

**"No Match Found"**
*   Ensure your question exists in the uploaded file.
*   Try selecting a smaller part of the question.
*   Check your confidence settings in the popup.

---

**Version**: 2.0.0
**Last Updated**: February 2026
