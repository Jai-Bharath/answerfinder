<div align="center">

<img src="assets/icons/icon128.png" alt="AnswerFinder Logo" width="128" height="128" />

# AnswerFinder

### Intelligent Q&A Engine for Chrome

[![Version](https://img.shields.io/badge/version-1.2-blue.svg?style=for-the-badge)](manifest.json)
[![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-orange.svg?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)

**AnswerFinder** is a powerful Chrome extension that instantly finds answers to your questions using a smart multi-tier matching system combined with AI assistance. Perfect for students, researchers, and anyone who needs quick access to information.

[Quick Start](#-installation--setup) • [How to Use](#-how-to-use) • [How It Works](#-how-it-works) • [AI Features](#-ai-powered-answers)

</div>

---

## 📋 Table of Contents

- [Installation & Setup](#-installation--setup)
- [How to Use](#-how-to-use)
- [How It Works](#-how-it-works)
- [AI-Powered Answers](#-ai-powered-answers)
- [Data Formats](#-data-formats)
- [Configuration](#%EF%B8%8F-configuration)
- [Backend Setup (Optional)](#-backend-setup-optional)
- [Features](#-features)
- [FAQ](#-faq)

---

## 🚀 Installation & Setup

### Step 1: Install the Extension

1. **Download or Clone this repository:**

   ```bash
   git clone https://github.com/yourusername/answerfinder.git
   cd answerfinder
   ```

2. **Open Chrome Extensions page:**
   - Navigate to `chrome://extensions/`
   - Or click the Chrome menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension:**
   - Click "Load unpacked"
   - Select the `answerfinder` folder
   - The extension icon should appear in your toolbar

### Step 2: Prepare Your Q&A Data

Create a file with your questions and answers in one of these formats:

**Option A: JSON Format** (Recommended)

```json
[
  {
    "question": "What is the capital of France?",
    "answer": "Paris"
  },
  {
    "question": "Who invented the telephone?",
    "answer": "Alexander Graham Bell"
  }
]
```

**Option B: TXT Format** (Simple)

```text
What is the capital of France?
Paris

Who invented the telephone?
Alexander Graham Bell
```

### Step 3: Upload Your Data

1. Click the AnswerFinder icon in your Chrome toolbar
2. Click "Choose File" in the Upload section
3. Select your `.json` or `.txt` file
4. Wait for the success message
5. You're ready to go!

---

## 💡 How to Use

### Basic Usage

1. **Select Text:** Highlight any question on a webpage
2. **Right-Click:** Open the context menu
3. **Click "Search Answer":** AnswerFinder will instantly display the answer

### Answer Display

The answer appears in a clean popup overlay showing:

- **📊 Confidence Score:** How confident the match is (0-100%)
- **💬 The Answer:** Clear, formatted response
- **🔍 Match Type:** Which matching algorithm found the answer
- **⚡ Response Time:** How fast the answer was found

### Keyboard Shortcuts (Coming Soon)

- `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac) - Quick search selected text

---

## 🔧 How It Works

AnswerFinder uses a sophisticated **5-Tier Matching System** to find the best answer:

### Tier 1: Exact Match

```
Perfect character-by-character match
Confidence: 100% | Speed: <1ms
```

The fastest method - searches for identical questions in your database.

### Tier 2: Keyword Match

```
Matches based on important words
Confidence: 85-95% | Speed: <5ms
```

Extracts key terms and finds questions with the same core concepts.

### Tier 3: Fuzzy Match

```
Handles typos and variations
Confidence: 70-85% | Speed: <10ms
```

Uses advanced algorithms to match similar questions even with spelling errors.

### Tier 4: Partial Match

```
Finds answers for incomplete questions
Confidence: 60-75% | Speed: <15ms
```

Useful when you select only part of a question.

### Tier 5: AI-Powered Answer

```
Generates intelligent responses
Confidence: Variable | Speed: ~2-4s
```

When no local match is found, AI generates an answer with reasoning.

### The Matching Flow

```
User selects text
        ↓
   Normalize text
        ↓
   Try Exact Match ────→ Found? → Return answer
        ↓ No
   Try Keyword Match ───→ Found? → Return answer
        ↓ No
   Try Fuzzy Match ─────→ Found? → Return answer
        ↓ No
   Try Partial Match ───→ Found? → Return answer
        ↓ No
   AI Fallback (if enabled) ────→ Generate answer
        ↓ No/Disabled
   Return "No match found"
```

---

## 🤖 AI-Powered Answers

When your local database doesn't have an answer, AnswerFinder can use AI to help you!

### What is AI Fallback?

AI Fallback is a smart feature that:

- ✅ Generates accurate answers to questions not in your database
- ✅ Provides step-by-step reasoning
- ✅ Works with various question types (math, science, history, etc.)
- ✅ Respects your privacy through a secure proxy

### How AI Works

1. **Question is sent** to a proxy server (not directly to AI providers)
2. **AI model (Gemma 2)** analyzes the question
3. **Structured response** is generated with answer + reasoning
4. **Result displayed** in the same clean format

### Enabling AI

1. Open AnswerFinder popup
2. Scroll to Settings section
3. Check "Enable AI Answering"
4. That's it! The extension uses a Cloudflare Worker by default

### AI Response Format

AI answers include:

- **Direct Answer:** Clear, concise response
- **Reasoning:** Why the answer is correct
- **Confidence:** AI's certainty level
- **Source:** Indicates this is an AI-generated response

### Privacy & Limits

- 🔒 Questions are routed through a proxy for anonymity
- 📊 100 AI queries per day (default limit)
- ⚡ Cached answers are reused to save queries
- 🔐 No personal data is stored or transmitted

---

## 📂 Data Formats

### JSON Format (Recommended)

**Best for:** Large question banks, complex data, easy backup

```json
[
  {
    "question": "What is photosynthesis?",
    "answer": "Photosynthesis is the process by which plants convert light energy into chemical energy."
  },
  {
    "question": "Who wrote Romeo and Juliet?",
    "answer": "William Shakespeare"
  }
]
```

**Advantages:**

- ✅ Easy to edit and maintain
- ✅ Supports special characters
- ✅ Can be validated for errors
- ✅ Works with thousands of entries

### TXT Format (Simple)

**Best for:** Quick study sheets, simple Q&A pairs

```text
What is photosynthesis?
Photosynthesis is the process by which plants convert light energy into chemical energy.

Who wrote Romeo and Juliet?
William Shakespeare
```

**Format Rules:**

- ❗ One question per line, followed by the answer
- ❗ Separate each Q&A pair with a blank line
- ❗ No special formatting needed

### Sample Files

Check the included sample files:

- `sample_questions.json` - Example JSON format
- `sample_questions.txt` - Example TXT format

---

## ⚙️ Configuration

### Settings Panel

Open the extension popup to access all settings:

#### Matching Options

**Fuzzy Matching**

- Enables typo tolerance
- Recommended: ✅ ON

**Partial Matching**

- Matches incomplete questions
- Recommended: ✅ ON

**Minimum Confidence**

- How strict the matching should be
- Range: 0-100%
- Recommended: 50%

#### AI Options

**Enable AI Answering**

- Activates AI fallback system
- Toggle ON to use AI when no local match exists
- Uses secure Cloudflare Workers backend by default

#### Data Management

**Export Data**

- Download your current Q&A database as JSON
- Great for backups

**Clear All Data**

- Remove all questions and reset the extension
- ⚠️ This action cannot be undone!

---

## 🌐 Backend Setup

**AnswerFinder uses Cloudflare Workers by default** - no setup required!

The extension comes pre-configured with a secure Cloudflare Worker at:
`https://answerfinder-ai-proxy.workers.dev/api/query`

### Want to Use Your Own Backend?

If you prefer to host your own AI proxy, you have two options:

### Option 1: Deploy Your Own Cloudflare Worker

1. **Navigate to proxy directory:**

   ```bash
   cd proxy
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set environment variables:**

   ```bash
   echo "OPENROUTER_API_KEY=your_key_here" > .env
   ```

4. **Start the server:**

   ```bash
   node server.js
   ```

5. **Server runs on:** `http://localhost:3000`

### Option 2: Cloudflare Workers (Production)

1. **Navigate to worker directory:**

   ```bash
   cd proxy/cloudflare-worker
   ```

2. **Install Wrangler:**

   ```bash
   npm install -g wrangler
   ```

3. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

4. **Set your API key:**

   ```bash
   wrangler secret put OPENROUTER_API_KEY
   ```

5. **Deploy:**

   ```bash
   wrangler deploy
   ```

6. **Update the extension code:**
   - Open `lib/ai/ai-service.js`
   - Replace the default `proxyUrl` with your worker URL
   - Example: `https://answerfinder.yourname.workers.dev/api/query`

### Option 2: Local Development Server

1. **Navigate to proxy directory:**

   ```bash
   cd proxy
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set environment variables:**

   ```bash
   echo "OPENROUTER_API_KEY=your_key_here" > .env
   ```

4. **Start the server:**

   ```bash
   node server.js
   ```

5. **Server runs on:** `http://localhost:3000`

6. **Update the extension code:**
   - Open `lib/ai/ai-service.js`
   - Replace the default `proxyUrl` with `http://localhost:3000/api/query`

### Getting an API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Generate an API key
4. Models used: Google Gemma 2 (cost-effective and fast)

---

## ✨ Features

- ✅ **Lightning Fast:** Sub-10ms response time for local matches
- ✅ **Smart Matching:** 5-tier intelligent search system
- ✅ **AI Powered:** Gemma 2 integration for unknown questions
- ✅ **Privacy First:** Local data storage, secure proxy
- ✅ **Flexible Formats:** JSON and TXT support
- ✅ **Clean UI:** Modern, intuitive interface
- ✅ **Bulk Import:** Handle thousands of questions
- ✅ **Export & Backup:** Download your data anytime
- ✅ **Confidence Scoring:** Know how accurate each match is
- ✅ **Context Menu:** Right-click to search
- ✅ **Rate Limiting:** Prevents API abuse
- ✅ **Caching:** Remembers AI answers to save queries

---

## 🎯 Quick Start Guide

### For Students

1. Create a study guide in JSON or TXT format
2. Upload it to AnswerFinder
3. While studying online, select any question
4. Right-click and choose "Search Answer"
5. Get instant answers!

### For Researchers

1. Import your research Q&A database
2. Enable AI for unknown queries
3. Browse research papers and highlight questions
4. Get immediate answers from your database or AI

### For Developers

1. Create FAQ documentation in JSON
2. Load it into AnswerFinder
3. Quickly look up API references
4. Speed up your development workflow

---

## ❓ FAQ

**Q: Does AnswerFinder work offline?**
A: Yes! Local matching works completely offline. Only AI fallback requires internet.

**Q: How many questions can I store?**
A: Tested with 10,000+ questions with no performance issues.

**Q: Is my data private?**
A: Yes. All data is stored locally in your browser. AI queries are sent through a proxy for anonymity.

**Q: What browsers are supported?**
A: Currently Chrome and Chromium-based browsers (Edge, Brave, Opera).

**Q: Can I use my own AI model?**
A: Yes! Modify the proxy server to use any OpenAI-compatible API.

**Q: Is there a mobile version?**
A: Not yet, but it's on the roadmap!

**Q: How much does it cost?**
A: The extension is free. AI queries cost ~$0.0001 per query (using OpenRouter).

---

## 🛠️ Troubleshooting

**Extension won't load:**

- Ensure Developer Mode is enabled
- Check for console errors in `chrome://extensions/`

**No matches found:**

- Check your minimum confidence setting (try lowering it)
- Verify your Q&A file was uploaded successfully
- Try enabling partial matching

**AI not working:**

- Verify AI is enabled in settings
- Check proxy URL is correct
- Ensure your API key is valid
- Check daily limit (100 queries/day)

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div align="center">

Made with ❤️ for students, researchers, and knowledge seekers

**[Report Bug](https://github.com/yourusername/answerfinder/issues)** • **[Request Feature](https://github.com/yourusername/answerfinder/issues)**

</div>

<p align="center">
  <b>Built for students, researchers, and power users.</b> <br/>
  MIT License • 2026 AnswerFinder Team
</p>
