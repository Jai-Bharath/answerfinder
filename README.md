<div align="center">

<img src="assets/icons/icon128.png" alt="AnswerFinder Logo" width="128" height="128" />

# AnswerFinder
### The Intelligent Q&A Engine for Chrome

[![Version](https://img.shields.io/badge/version-2.1-blue.svg?style=for-the-badge)](manifest.json)
[![Status](https://img.shields.io/badge/status-production-success.svg?style=for-the-badge)](STATUS.md)
[![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-orange.svg?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![Hosting](https://img.shields.io/badge/backend-Cloudflare%20Workers-blue?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)

**AnswerFinder** is a professional-grade assistant that combines high-speed **Offline Lookup** with a powerful **AI Fallback** system. Never be without an answer again.

[Getting Started](#-getting-started) • [AI Features](#-ai-fallback-system) • [Data Formats](#-data-formats) • [Deployment](#-hosting-your-own-backend)

</div>

---

## 🚀 How It Works

AnswerFinder uses a **Multi-Tier Search Architecture** to find the right answer, prioritizing your local data for speed and privacy.

### 1. The Local Engine (Tier 1-4)
When you select text and click "Search Answer," the extension instantly scans your imported knowledge base using:
1.  **Exact Matching**: Identical character match.
2.  **Keyword Overlap**: Matching based on core subjects.
3.  **Fuzzy Logic**: Handles typos and small phrasing differences.
4.  **Partial Match**: Finds answers even if you only select part of the question.

### 2. The AI Safety Net (Tier 5)
If no local match is found (or confidence is too low), the **AI Fallback** kicks in. It sends the question to a cloud-hosted LLM (**Gemma 2.0**) which provides a factual answer and step-by-step reasoning.

---

## 🧠 AI Fallback System

Don't have the answer in your database? No problem.

*   **Smart Reasoning**: AI doesn't just give an answer; it explains *why* it's correct.
*   **Concise Results**: Optimized prompts ensure you get a 4-line summary, not a wall of text.
*   **Safety First**: AI is disabled by default. You control when to use it.
*   **Privacy**: Questions are routed through a secure proxy to keep your identity private.

---

## 📤 Data Formats & Uploading

AnswerFinder is designed to handle thousands of questions with zero lag.

### Local JSON Format (Recommended)
Best for backing up your data or complex entries.
```json
[
  {
    "question": "What is the capital of Japan?",
    "answer": "Tokyo"
  }
]
```

### Simple TXT Format
Perfect for quick study sheets. Separate pairs with a blank line.
```text
Question 1? 
Answer 1

Question 2?
Answer 2
```

---

## 🛠️ Installation

1.  Clone this repository.
2.  Open Chrome and visit `chrome://extensions/`.
3.  Enable **Developer Mode**.
4.  Click **Load Unpacked** and select this folder.

---

## ⚙️ Configuration

Open the extension popup to customize your experience:
*   **Enable AI Fallback**: Toggle this ON to use the Gemma-powered assistant.
*   **Confidence Slider**: Adjust how "picky" the local engine is (Recommended: 50%).
*   **Theme**: Choose between Light, Dark, or System Auto.

---

## 🌐 Hosting Your Own Backend

By default, this extension uses a shared Cloudflare Worker. If you are a developer and want to host your own:
1.  Navigate to `/proxy/cloudflare-worker`.
2.  Run `npx wrangler deploy`.
3.  Update the `aiProxyUrl` in your settings!

---

<p align="center">
  <b>Built for students, researchers, and power users.</b> <br/>
  MIT License • 2026 AnswerFinder Team
</p>
