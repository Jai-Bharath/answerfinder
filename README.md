<div align="center">

<img src="assets/icons/icon128.png" alt="AnswerFinder Logo" width="128" height="128" />

# AnswerFinder

### Lightning-Fast Q&A Chrome Extension with AI Support

[![Version](https://img.shields.io/badge/version-1.2-blue.svg?style=for-the-badge)](manifest.json)
[![Platform](https://img.shields.io/badge/platform-Chrome-orange.svg?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)

**AnswerFinder** is a Chrome extension that instantly finds answers to your questions. Upload your Q&A database, search any text on any webpage, and get instant answers. When your database doesn't have an answer, AI (Gemma 2) generates one for you.

**Perfect for:** Students studying, researchers working, developers coding, or anyone who needs quick answers.

[Get Started](#-quick-start-3-steps) • [How It Works](#-how-it-works) • [Features](#-key-features) • [FAQ](#-faq)

</div>

---

## 📋 What is AnswerFinder?

AnswerFinder is a browser extension that:

1. **Stores your Q&A pairs** locally in your browser
2. **Searches them instantly** when you select text on any webpage
3. **Uses AI** to answer questions not in your database (optional)

**Real-World Example:**

- You upload 500 exam questions and answers
- While reading online, you select "What is photosynthesis?"
- Right-click → "Search Answer"
- Get the answer in < 10ms from your database
- If not found, AI generates an answer in ~2-4 seconds

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Extension

1. Download/clone this repository:

   ```bash
   git clone https://github.com/yourusername/answerfinder.git
   ```

2. Open Chrome → `chrome://extensions/`

3. Enable **Developer mode** (top-right toggle)

4. Click **Load unpacked** → Select the `answerfinder` folder

5. ✅ Extension icon appears in toolbar!

### Step 2: Create Your Q&A File

Choose your format:

**JSON Format** (recommended for large datasets):

```json
[
  {
    "question": "What is the capital of France?",
    "answer": "Paris"
  },
  {
    "question": "Who wrote Romeo and Juliet?",
    "answer": "William Shakespeare"
  }
]
```

**TXT Format** (simple and quick):

```text
What is the capital of France?
Paris

Who wrote Romeo and Juliet?
William Shakespeare
```

**Important for TXT:** Separate each Q&A pair with a blank line!

### Step 3: Upload & Search

1. Click the AnswerFinder icon in toolbar
2. Click "Choose File" → Select your file
3. Wait for "Successfully loaded X questions!"
4. Done! Now select any text → Right-click → "Search Answer"

**Optional:** Enable "AI Answering" in settings for questions not in your database

---

## 💡 How to Use

### Daily Workflow

1. **Browse any website** (articles, documents, PDFs, etc.)
2. **Select/highlight a question** with your mouse
3. **Right-click** → Click "**Search Answer**"
4. **Answer appears** in a sidebar overlay

### What You'll See

**When Match Found:**

```
✓ Exact Match | 98% Confidence | 5ms
Paris is the capital and largest city of France.
[Copy Answer]
```

**When No Match (AI Disabled):**

```
✗ No Match
No answer found. Try enabling AI Answering
in settings for questions not in your database.
```

**When No Match (AI Enabled):**

```
🤖 AI Answer | 2.3s
Paris is the capital of France. It's located in
northern France and is the country's most populous city.

Reasoning: This is a well-established fact...
[Copy Answer]
```

---

## 🔧 How It Works

### The Matching System

AnswerFinder uses **4 smart matching methods** automatically:

| Tier | Method            | What It Does             | Speed | Confidence |
| ---- | ----------------- | ------------------------ | ----- | ---------- |
| 1    | **Exact Match**   | Perfect character match  | <1ms  | 100%       |
| 2    | **Keyword Match** | Matches important words  | <5ms  | 85-95%     |
| 3    | **Fuzzy Match**   | Handles typos/variations | <10ms | 70-85%     |
| 4    | **Partial Match** | Incomplete questions     | <15ms | 60-75%     |
| 5    | **AI Answer**     | Generates new answer     | 2-4s  | Variable   |

### Search Flow

```
You select text → AnswerFinder searches your database
                              ↓
                    Match found in database?
                              ↓
                     YES → Show answer
                              ↓
                      NO → AI enabled?
                              ↓
              YES → AI generates answer
                              ↓
              NO → Suggest enabling AI
```

**Key Point:** You don't configure anything. Just search, and AnswerFinder automatically:

- Tries exact match first (fastest)
- Then keyword matching
- Then fuzzy matching (handles typos)
- Then partial matching
- Finally AI (if enabled and needed)

---

## 🤖 AI-Powered Answers

### What is AI Answering?

When you search for a question that's **NOT in your database**, AI can generate an answer for you.

**Model Used:** Google Gemma 2 (fast, accurate, cost-effective)

### How It Works

1. Question is sent to a **secure Cloudflare Worker** (not directly to AI providers)
2. **Gemma 2 AI model** analyzes the question
3. AI generates a **structured answer + reasoning**
4. Answer is **cached** (saved) to avoid asking again
5. Result displayed in the same clean format

### Enabling AI

1. Click AnswerFinder icon → Open popup
2. Check ✅ "**Enable AI Answering**"
3. Done! (Uses default Cloudflare Worker - no setup needed)

### Privacy & Costs

- 🔒 **Privacy:** Questions sent through proxy (your identity hidden)
- 💰 **Cost:** ~$0.0001 per question (nearly free)
- 📊 **Limit:** 100 AI queries per day
- ⚡ **Caching:** Answers are saved, won't ask AI twice for same question
- 🔐 **Data:** No personal info stored or transmitted

### When to Use AI?

**Enable AI if:**

- ✅ You want complete coverage for any question
- ✅ Your database is small/incomplete
- ✅ You need answers for unexpected questions

**Keep AI disabled if:**

- ❌ You only want answers from your database
- ❌ You want 100% control over answers
- ❌ You're concerned about costs (though minimal)

---

## 📂 Data Formats Explained

### JSON Format (Recommended)

**When to use:** 100+ questions, special characters, easy editing

```json
[
  {
    "question": "What is the Pythagorean theorem?",
    "answer": "a² + b² = c² - In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides."
  },
  {
    "question": "Who discovered penicillin?",
    "answer": "Alexander Fleming discovered penicillin in 1928."
  }
]
```

**Benefits:**

- ✅ Handles thousands of entries easily
- ✅ Supports Unicode, emojis, special characters
- ✅ Can validate syntax (use JSONLint.com)
- ✅ Easy to edit in any text editor
- ✅ Can be version-controlled (Git)

### TXT Format (Simple)

**When to use:** Quick study notes, <100 questions, simple text

```text
What is the Pythagorean theorem?
a² + b² = c² - In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.

Who discovered penicillin?
Alexander Fleming discovered penicillin in 1928.
```

**Rules:**

- ❗ Question on line 1, answer on line 2
- ❗ **BLANK LINE** between each Q&A pair
- ❗ No special formatting needed

**Common Mistake:**

```text
❌ Wrong (no blank line):
Question 1?
Answer 1
Question 2?
Answer 2

✅ Correct (blank line separator):
Question 1?
Answer 1

Question 2?
Answer 2
```

### Sample Files Included

- `sample_questions.json` - See JSON examples
- `sample_questions.txt` - See TXT examples

### Tips for Creating Q&A Files

1. **Be consistent:** Use similar phrasing for similar questions
2. **Add variations:** Include different ways to ask the same thing
3. **Keep answers concise:** Short answers work best (1-3 sentences)
4. **Use JSON for large sets:** 100+ questions? Use JSON
5. **Test small first:** Start with 10 questions, then add more

---

## ⚙️ Extension Settings

Open the popup (click extension icon) to access settings:

### Setting: Enable AI Answering

**What it does:**

- ✅ Checked: AI generates answers for questions not in your database
- ❌ Unchecked: Only searches your uploaded Q&A database

**When checked:**

- No match found → AI automatically tries to answer
- Cost: ~$0.0001 per AI query
- Limit: 100 AI queries per day
- Answers are cached (won't ask AI twice)

**When unchecked:**

- No match found → Shows message: "No answer found. Try enabling AI Answering..."
- 100% control over answers (only from your database)
- No cost, no limits

**Recommendation:** ✅ Keep it ON for complete coverage

### Data Management

**Export Data**

- Downloads your Q&A database as JSON file
- Use for: Backups, sharing, version control
- Format: `answerfinder-export-[timestamp].json`

**Clear All Data**

- Removes ALL uploaded questions
- Clears cache
- Resets extension to initial state
- ⚠️ **Cannot be undone!** Export first if needed

### Statistics Display

Shows:

- **Questions Loaded:** Total Q&A pairs in database
- **Cache Entries:** Cached search results (faster lookups)
- **Last Import:** When you last uploaded a file

---

## 🌐 AI Backend (Advanced)

### Default Setup (No Action Required)

AnswerFinder comes with a **pre-configured Cloudflare Worker**:

- URL: `https://answerfinder-ai-proxy.workers.dev/api/query`
- Model: Google Gemma 2
- Secure, fast, reliable
- Just enable AI in settings → it works!

### Want Your Own Backend?

**Why host your own:**

- ✅ Full control over costs
- ✅ Custom rate limits
- ✅ Privacy (your own proxy)
- ✅ Use different AI models

**Two options:**

#### Option 1: Cloudflare Worker (Production)

1. Get OpenRouter API key: [openrouter.ai](https://openrouter.ai/)
2. Navigate to proxy folder:
   ```bash
   cd proxy/cloudflare-worker
   ```
3. Install Wrangler:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
4. Add your API key:
   ```bash
   wrangler secret put OPENROUTER_API_KEY
   ```
5. Deploy:
   ```bash
   wrangler deploy
   ```
6. Update extension:
   - Open `lib/ai/ai-service.js`
   - Change `proxyUrl` to your worker URL

#### Option 2: Local Server (Development)

1. Navigate to proxy folder:
   ```bash
   cd proxy
   npm install
   ```
2. Create `.env` file:
   ```bash
   echo "OPENROUTER_API_KEY=your_key_here" > .env
   ```
3. Start server:
   ```bash
   node server.js
   ```
4. Update extension:
   - Open `lib/ai/ai-service.js`
   - Change `proxyUrl` to `http://localhost:3000/api/query`

### API Key Setup

1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up (free account)
3. Generate API key
4. Add credits ($5 = ~50,000 queries)
5. Model used: `google/gemma-2-9b-it`

---

## ✨ Key Features

### Speed & Performance

- ⚡ **<1ms** for exact matches
- ⚡ **<10ms** for most local searches
- ⚡ **2-4s** for AI answers
- 📊 Handles **10,000+ questions** smoothly
- 🚀 **Cached results** for repeat queries

### Smart Matching

- 🎯 **4-tier system:** Exact → Keyword → Fuzzy → Partial
- 🔍 **Typo handling:** Finds "Wha is Paris?" for "What is Paris?"
- 📝 **Partial matching:** "capital France" finds "What is the capital of France?"
- 🧠 **Keyword extraction:** Focuses on important words

### User Experience

- 🎨 **Clean sidebar overlay:** Non-intrusive answer display
- 📋 **Copy button:** One-click answer copying
- 📊 **Confidence scores:** Know how reliable each match is
- ⌨️ **Context menu:** Right-click to search
- 🔄 **Auto-hide:** Answers fade after viewing

### Data & Privacy

- 💾 **Local storage:** All data stays in your browser
- 🔒 **No tracking:** Zero analytics or telemetry
- 🔐 **Proxy privacy:** AI queries anonymized
- 📤 **Export/Import:** Full data portability
- 🗑️ **Easy reset:** Clear all data anytime

### AI Integration

- 🤖 **Gemma 2 model:** Fast, accurate, cost-effective
- 💡 **Smart reasoning:** AI explains why answers are correct
- 💰 **Affordable:** ~$0.0001 per query
- 📊 **Rate limiting:** Prevents abuse
- ⚡ **Caching:** Reuses AI answers

---

## 🎯 Use Cases

### For Students

**Scenario:** Preparing for exams

1. Export flashcards/notes as JSON
2. Upload to AnswerFinder
3. While studying online, select any question
4. Get instant answer from your notes
5. Enable AI for concepts not in your notes

**Example:**

```json
[
  {
    "question": "What is mitosis?",
    "answer": "Cell division resulting in two identical daughter cells"
  },
  {
    "question": "Name the 4 DNA bases",
    "answer": "Adenine, Thymine, Guanine, Cytosine"
  }
]
```

### For Researchers

**Scenario:** Literature review

1. Create Q&A from paper abstracts
2. Upload domain-specific knowledge
3. While reading papers, look up terms
4. Get definitions from your database
5. AI fills gaps for new concepts

**Example:**

```json
[
  {
    "question": "What is CRISPR?",
    "answer": "Gene-editing technology using Cas9 enzyme"
  },
  {
    "question": "Define p-value",
    "answer": "Probability of obtaining results at least as extreme as observed"
  }
]
```

### For Developers

**Scenario:** API documentation lookup

1. Convert docs to Q&A format
2. Upload to AnswerFinder
3. While coding, select function names
4. Get quick reference without leaving browser
5. AI helps with edge cases

**Example:**

```json
[
  {
    "question": "How to sort array in JavaScript?",
    "answer": "arr.sort() or arr.sort((a,b) => a-b)"
  },
  {
    "question": "What is async/await?",
    "answer": "Syntax for handling Promises synchronously"
  }
]
```

### For Teams

**Scenario:** Company knowledge base

1. Create FAQ in JSON
2. Share file with team
3. Everyone has instant access
4. Update and redistribute easily
5. AI handles uncommon questions

**Example:**

```json
[
  {
    "question": "What is our refund policy?",
    "answer": "30-day money-back guarantee"
  },
  {
    "question": "How to request time off?",
    "answer": "Submit via HR portal 2 weeks in advance"
  }
]
```

---

## ❓ FAQ (Frequently Asked Questions)

### General Questions

**Q: What exactly does AnswerFinder do?**
A: It stores your Q&A pairs and instantly searches them when you select text on any webpage. Optional AI fills gaps for questions not in your database.

**Q: Do I need to be online?**
A: Local matching works 100% offline. Only AI answering requires internet connection.

**Q: Is it really free?**
A: Yes! The extension is free. AI queries cost ~$0.0001 each (nearly free), only if you enable AI.

**Q: What browsers work?**
A: Chrome, Edge, Brave, Opera, and other Chromium-based browsers.

### Setup & Usage

**Q: How many questions can I upload?**
A: Tested with 10,000+ questions with no performance issues. Realistically, no practical limit.

**Q: Can I upload multiple files?**
A: Currently one file at a time. Uploading a new file replaces the old one. Export first if you want to merge.

**Q: What if my file won't upload?**
A: Check:

- File is `.json` or `.txt`
- JSON is valid (test at jsonlint.com)
- TXT has blank lines between Q&A pairs
- File size is reasonable (<10MB)

**Q: Can I edit questions after uploading?**
A: Yes! Export data → Edit JSON file → Re-upload.

### Privacy & Security

**Q: Where is my data stored?**
A: Locally in your browser only. Nothing is sent to external servers (except AI queries if enabled).

**Q: Can others see my questions?**
A: No. Data is stored in your browser's local storage, private to you.

**Q: What data does AI see?**
A: Only the question text you search. No personal info, no browsing history, nothing else.

**Q: Can I trust the Cloudflare Worker?**
A: Yes. It's open-source (check `/proxy/cloudflare-worker/`). It only forwards questions to OpenRouter API. Or host your own!

### AI Questions

**Q: How accurate is the AI?**
A: Gemma 2 is very accurate for factual questions. Always verify critical information.

**Q: What happens if I run out of AI queries?**
A: Default limit is 100/day. After that, AI stops working but local search still works. Host your own backend for custom limits.

**Q: Can I use a different AI model?**
A: Yes! Host your own backend and modify the proxy code to use any OpenAI-compatible API.

**Q: Does AI learn from my questions?**
A: No. Each query is independent. Answers are cached locally but not used to train AI.

### Technical Questions

**Q: Does this slow down my browser?**
A: No. Extension is lightweight. Only runs when you right-click → Search Answer.

**Q: Can I use it on PDFs?**
A: Yes! If you can select text in the PDF, AnswerFinder works.

**Q: Does it work on password-protected sites?**
A: Yes, works on any page where you can select text.

**Q: Can I search by typing instead of selecting?**
A: Not currently. Must select text → Right-click → Search Answer.

### Troubleshooting

**Q: Why no matches found?**
A: Possible reasons:

- Question isn't in your database
- Phrasing is too different from uploaded questions
- AI is disabled
- Try enabling AI or rephrase the search

**Q: AI not working?**
A: Check:

- AI is enabled in settings (checkbox)
- You haven't exceeded 100 queries today
- You have internet connection
- Check browser console for errors (F12)

**Q: Extension won't load?**
A: Ensure:

- Developer mode is ON in `chrome://extensions/`
- You selected the correct folder
- No errors in console (check at `chrome://extensions/`)

**Q: How do I update the extension?**
A: Pull latest code → Click "Reload" button on extension card in `chrome://extensions/`

---

## 🛠️ Troubleshooting Guide

### Problem: Extension won't install

**Symptoms:** Can't load extension in Chrome

**Solutions:**

1. ✅ Enable Developer Mode in `chrome://extensions/`
2. ✅ Make sure you selected the root `answerfinder` folder
3. ✅ Check folder contains `manifest.json`
4. ✅ Try reloading Chrome
5. ✅ Check Chrome version (need Manifest V3 support)

---

### Problem: File upload fails

**Symptoms:** "Failed to upload" error

**Solutions:**

1. ✅ **For JSON:** Validate at [jsonlint.com](https://jsonlint.com)
2. ✅ **For TXT:** Ensure blank lines between Q&A pairs
3. ✅ Check file size (keep under 10MB)
4. ✅ Check file encoding (should be UTF-8)
5. ✅ Look for special characters causing issues
6. ✅ Try with sample files first to confirm extension works

---

### Problem: No matches found

**Symptoms:** "No answer found" for questions you know exist

**Solutions:**

1. ✅ Check question phrasing matches database exactly (try Exact Match)
2. ✅ Verify file uploaded successfully (check Statistics)
3. ✅ Try selecting more/less text
4. ✅ Enable AI as fallback
5. ✅ Export data to verify content

---

### Problem: AI not responding

**Symptoms:** AI enabled but not generating answers

**Solutions:**

1. ✅ Verify "Enable AI Answering" is checked
2. ✅ Check you haven't hit 100 queries today (resets midnight UTC)
3. ✅ Verify internet connection
4. ✅ Open browser console (F12) → Check for errors
5. ✅ Try disabling/re-enabling AI in settings
6. ✅ Check Cloudflare Worker status (workers.dev should be up)

---

### Problem: Slow performance

**Symptoms:** Searches take too long

**Solutions:**

1. ✅ Clear cache: Settings → Clear All Data → Re-upload
2. ✅ Reduce database size (split into smaller files)
3. ✅ Close other extensions temporarily
4. ✅ Clear browser cache
5. ✅ Restart browser

---

### Problem: Answers not displaying

**Symptoms:** Search runs but no overlay appears

**Solutions:**

1. ✅ Check if overlay is outside viewport (try on different website)
2. ✅ Disable conflicting extensions
3. ✅ Clear browser cache
4. ✅ Reload extension
5. ✅ Check browser console for JavaScript errors (F12)

---

## 📊 Technical Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser Extension                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Popup UI  │  │  Background  │  │  Content   │ │
│  │  (Settings) │  │   Service    │  │  Script    │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                 │         │
│         │         ┌──────▼──────────┐      │         │
│         └────────►│  State Manager  │◄─────┘         │
│                   └──────┬──────────┘                │
│                          │                           │
│         ┌────────────────┼────────────────┐          │
│         │                │                │          │
│    ┌────▼────┐    ┌──────▼──────┐  ┌─────▼─────┐   │
│    │  Index  │    │   Matching  │  │    AI     │   │
│    │   DB    │    │   Engine    │  │  Service  │   │
│    │ Manager │    │   (4-tier)  │  │           │   │
│    └─────────┘    └─────────────┘  └─────┬─────┘   │
│                                           │         │
└───────────────────────────────────────────┼─────────┘
                                            │
                                            ▼
                                  ┌───────────────────┐
                                  │ Cloudflare Worker │
                                  │    (AI Proxy)     │
                                  └─────────┬─────────┘
                                            │
                                            ▼
                                  ┌───────────────────┐
                                  │  OpenRouter API   │
                                  │   (Gemma 2 AI)    │
                                  └───────────────────┘
```

### File Structure

```
answerfinder/
├── manifest.json           # Extension configuration
├── background/
│   ├── service-worker.js   # Main background script
│   ├── state-manager.js    # Centralized state
│   └── msg-handler.js      # Message routing
├── content/
│   └── content-script-bundled.js  # Injected into pages
├── popup/
│   ├── popup.html          # Extension popup
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
├── lib/
│   ├── ai/
│   │   ├── ai-service.js        # AI integration
│   │   └── prompt-builder.js    # AI prompts
│   ├── matching/
│   │   ├── matching-engine.js   # Main matcher
│   │   ├── exact-matcher.js     # Tier 1
│   │   ├── keyword-matcher.js   # Tier 2
│   │   ├── fuzzy-matcher.js     # Tier 3
│   │   └── partial-matcher.js   # Tier 4
│   ├── storage/
│   │   ├── indexeddb-manager.js # Q&A storage
│   │   └── cache-manager.js     # Result caching
│   └── parsers/
│       ├── json-parser.js       # Parse JSON files
│       └── txt-parser.js        # Parse TXT files
└── proxy/
    ├── server.js                # Local dev server
    └── cloudflare-worker/
        └── worker.js            # Production proxy
```

---

## 🚀 Development

### Local Development Setup

1. Clone repository:

   ```bash
   git clone https://github.com/yourusername/answerfinder.git
   cd answerfinder
   ```

2. Load extension (no build needed):
   - Open `chrome://extensions/`
   - Enable Developer Mode
   - Load unpacked → Select folder

3. Make changes:
   - Edit files
   - Click "Reload" in `chrome://extensions/`
   - Test changes

### Testing

**Manual Testing:**

1. Upload test Q&A file
2. Visit any webpage
3. Select text → Right-click → Search Answer
4. Verify answer appears correctly

**Console Testing:**

- Open DevTools (F12)
- Check Background worker logs
- Check Content script logs
- Check for errors

### Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

**In short:** You can use, modify, and distribute this extension freely. Attribution appreciated but not required.

---

## 🙏 Credits & Acknowledgments

**Built with:**

- Chrome Extension Manifest V3
- IndexedDB for local storage
- OpenRouter API for AI access
- Cloudflare Workers for serverless backend
- Google Gemma 2 AI model

**Inspired by:** The need for instant access to study materials and knowledge bases.

**Maintained by:** [Your Name/Team]

---

## 📞 Support & Contact

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/yourusername/answerfinder/issues)
- 💡 **Feature Requests:** [GitHub Issues](https://github.com/yourusername/answerfinder/issues)
- 📧 **Email:** your.email@example.com
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/answerfinder/discussions)

---

## 🗺️ Roadmap

### Coming Soon

- [ ] Keyboard shortcut (Ctrl+Shift+F)
- [ ] Dark mode support
- [ ] Multiple Q&A file support
- [ ] Categories/tags for questions
- [ ] Search history

### Future Plans

- [ ] Mobile browser support
- [ ] Cloud sync (optional)
- [ ] Collaborative databases
- [ ] Chrome Web Store publication
- [ ] Firefox port

---

<div align="center">

### Made with ❤️ for Students, Researchers & Knowledge Seekers

**Star ⭐ this repo if you find it useful!**

[Report Bug](https://github.com/yourusername/answerfinder/issues) • [Request Feature](https://github.com/yourusername/answerfinder/issues) • [Contribute](CONTRIBUTING.md)

---

**AnswerFinder v1.2** • Built with Chrome Extension Manifest V3  
MIT License • 2026

</div>
