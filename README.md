<div align="center">

<img src="assets/icons/icon128.png" alt="AnswerFinder Logo" width="128" height="128" />

# AnswerFinder

**Lightning-Fast Q&A Chrome Extension with AI Support**

[![Version](https://img.shields.io/badge/version-1.2-blue.svg)](manifest.json)
[![Platform](https://img.shields.io/badge/platform-Chrome-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Upload your Q&A database → Search any text on any webpage → Get instant answers  
No match? Optional AI (Gemma 2) generates answers for you.

**Perfect for:** Students • Researchers • Developers • Knowledge Workers

[Quick Start](#-quick-start) • [Features](#-features) • [How It Works](#-how-it-works) • [Setup](#-setup)

</div>

---

## 🚀 Quick Start

### Installation (3 Steps)

```bash
git clone https://github.com/yourusername/answerfinder.git
```

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → Select `answerfinder` folder

### Create Your Q&A Database

**JSON Format** (recommended for 100+ questions):

```json
[
  { "question": "What is the capital of France?", "answer": "Paris" },
  { "question": "Who wrote Romeo and Juliet?", "answer": "William Shakespeare" }
]
```

**TXT Format** (simple alternative):

```text
What is the capital of France?
Paris

Who wrote Romeo and Juliet?
William Shakespeare
```

> **Important:** Blank line required between Q&A pairs in TXT format

### Use It

1. Click extension icon → Upload your file
2. Select any text on a webpage
3. Right-click → **"Search Answer"**
4. View instant results!

---

## ✨ Features

### 🎯 Smart 4-Tier Matching

- **Exact Match** — Perfect character match (<1ms, 100% confidence)
- **Keyword Match** — Matches important words (<5ms, 85-95% confidence)
- **Fuzzy Match** — Handles typos like "Wha is Paris?" (<10ms, 70-85% confidence)
- **Partial Match** — Finds "capital France" in full questions (<15ms, 60-75% confidence)

### 🤖 AI-Powered Fallback

- **Gemma 2 AI** — Answers questions not in your database
- **Smart reasoning** — Explains why answers are correct
- **Nearly free** — ~$0.0001 per query
- **Privacy-focused** — Secure anonymous proxy
- **Cached results** — Never asks twice for same question

### 💾 Data Management

- **100% local storage** — Data stays in your browser
- **No tracking** — Zero analytics or telemetry
- **Export/Import** — Full data portability
- **Handles 10,000+ questions** — Effortlessly

### 🎨 User Experience

- **Clean sidebar overlay** — Non-intrusive display
- **Auto-hide after viewing** — Stays out of your way
- **One-click copying** — Copy answers instantly
- **Confidence scores** — Know match reliability
- **Context menu integration** — Right-click anywhere

---

## 🔧 How It Works

### Automatic Matching Process

AnswerFinder tries 4 matching methods automatically, from fastest to most comprehensive:

```
User selects text
    ↓
Tier 1: Exact Match (instant)
    ↓ no match
Tier 2: Keyword Match (fast)
    ↓ no match
Tier 3: Fuzzy Match (typo-tolerant)
    ↓ no match
Tier 4: Partial Match (flexible)
    ↓ no match
AI enabled? → Generate answer (2-4s)
    ↓
Display result with confidence score
```

**You configure nothing** - it just works!

### Matching Examples

| Your Question | Finds Database Entry | Method |
|--------------|---------------------|--------|
| "What is the capital of France?" | Exact same | Exact |
| "capital of France" | "What is the capital of France?" | Keyword |
| "What is teh capital of Frence?" | "What is the capital of France?" | Fuzzy |
| "France capital" | "What is the capital of France?" | Partial |

---

## 🤖 AI Setup

### Enable AI (2 Clicks)

1. Click extension icon
2. Check ✅ **"Enable AI Answering"**

Done! Uses default secure proxy - no API key needed.

### AI Details

- **Model** — Google Gemma 2 (fast, accurate, cost-effective)
- **Privacy** — Anonymous queries through secure Cloudflare Worker
- **Cost** — ~$0.0001 per query (100 queries ≈ $0.01)
- **Daily limit** — 100 queries per day
- **Caching** — Answers saved locally, never re-queried

### When to Enable AI

✅ **Enable if:**
- You want complete coverage for any question
- Your database is small or incomplete
- You need answers for unexpected questions

❌ **Keep disabled if:**
- You only want answers from your curated database
- You want 100% control over content
- You prefer no external API calls

---

## 📂 Data Format Guide

### JSON (Best for Large Databases)

**Advantages:** Handles thousands of entries, supports Unicode, validates easily

```json
[
  {
    "question": "What is the Pythagorean theorem?",
    "answer": "a² + b² = c² - In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides."
  },
  {
    "question": "Who discovered penicillin?",
    "answer": "Alexander Fleming in 1928"
  }
]
```

**Tip:** Validate your JSON at [jsonlint.com](https://jsonlint.com) before uploading

### TXT (Best for Quick Notes)

**Advantages:** Simple to create, no syntax knowledge needed

```text
What is the Pythagorean theorem?
a² + b² = c² - In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.

Who discovered penicillin?
Alexander Fleming in 1928
```

**Rules:** Question line 1, answer line 2, blank line between pairs

**Sample files included:** `sample_questions.json` and `sample_questions.txt`

---

## ⚙️ Settings

Click the extension icon to access:

### Enable AI Answering
- Toggle AI fallback for questions not in database

### Export Data
- Download your Q&A database as `answerfinder-export-[timestamp].json`
- Use for backups or sharing

### Clear All Data
- Remove all questions and cache
- ⚠️ **Cannot be undone!** Export first if needed

### Statistics Display
- Total questions loaded
- Cached search results
- Last import timestamp

### Advanced Setup
- Custom AI backend setup instructions in [USAGE.md](USAGE.md)

---

## 🎯 Use Cases

### 📚 Students
Upload flashcards → Study online → Get instant answers while reading

### 🔬 Researchers
Convert paper abstracts to Q&A → Look up terms instantly → AI fills knowledge gaps

### 💻 Developers
API docs to Q&A format → Quick reference while coding → No context switching

### 👥 Teams
Company FAQ in JSON → Share with team → Instant access → AI handles edge cases

---

## 🛠️ Troubleshooting

### Extension Won't Load
- ✅ Enable Developer Mode in `chrome://extensions/`
- ✅ Select folder containing `manifest.json`
- ✅ Reload Chrome and try again

### File Upload Fails
- ✅ **JSON:** Validate at [jsonlint.com](https://jsonlint.com)
- ✅ **TXT:** Verify blank lines between Q&A pairs
- ✅ Keep file under 10MB
- ✅ Ensure UTF-8 encoding

### No Matches Found
- ✅ Check file uploaded (view Statistics)
- ✅ Try selecting more/less text
- ✅ Enable AI as fallback
- ✅ Export data to verify content

### AI Not Responding
- ✅ Verify "Enable AI Answering" is checked
- ✅ Check daily limit (100 queries)
- ✅ Verify internet connection
- ✅ Check browser console (F12) for errors

---

## ❓ FAQ

**Supported browsers?**  
Chrome, Edge, Brave, Opera (Chromium-based)

**Question limit?**  
Tested with 10,000+ questions successfully

**Multiple files?**  
One at a time - export and merge manually if needed

**Data storage?**  
100% local in your browser only

**Cost?**  
Extension is free. AI costs ~$0.0001/query (only if enabled)

**Offline use?**  
Local matching works offline. AI requires internet

**PDF support?**  
Yes! If you can select text, it works

**Privacy?**  
No tracking. AI queries are anonymous if enabled

---

## 🚀 Development

### Local Setup

```bash
git clone https://github.com/yourusername/answerfinder.git
cd answerfinder
# Load unpacked extension in chrome://extensions/
```

### File Structure

```
answerfinder/
├── manifest.json              # Extension config
├── background/                # Service worker & state
├── content/                   # Injected scripts
├── popup/                     # Extension UI
├── lib/
│   ├── ai/                   # AI integration
│   ├── matching/             # 4-tier engine
│   ├── storage/              # IndexedDB & cache
│   └── parsers/              # JSON/TXT parsing
└── proxy/                     # AI backend
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

**Summary:** Use, modify, and distribute freely. Attribution appreciated!

---

## Credits

**Built with:** Chrome Extension Manifest V3 • IndexedDB • OpenRouter API • Cloudflare Workers • Google Gemma 2 AI

**Inspired by:** The need for instant access to knowledge while browsing

---

<div align="center">

### Made with ❤️ for Knowledge Seekers

**Found it useful? Star ⭐ this repo!**

</div>