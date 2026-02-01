<div align="center">

<img src="assets/logo.png" alt="AnswerFinder Logo" width="128" height="128" />

# AnswerFinder
### Intelligent Offline Q&A Engine for Chrome

[![Version](https://img.shields.io/badge/version-2.0-blue.svg?style=for-the-badge)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)](STATUS.md)
[![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-orange.svg?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)

<p align="center">
  <b>AnswerFinder</b> transforms your browser into a powerful, offline knowledge base. <br/>
  Upload your own Q&A data and find answers instantly on any webpage without leaving the tab.
</p>

</div>

---

## 🚀 Why AnswerFinder?

Most answer finders are slow, require an internet connection, or simply fail when the wording isn't exact. **AnswerFinder is different.**

| Feature | Description |
| :--- | :--- |
| **⚡ Instant Search** | Sub-100ms response time using locally indexed data. **Zero latency.** |
| **🧠 4-Tier Matching** | Uses **Exact**, **Keyword**, **Fuzzy**, and **Partial** logic to find answers even if the question is rephrased. |
| **🔒 Offline & Private** | Your data never leaves your device. It lives in your browser's IndexedDB. |
| **🎨 Modern UI** | Sleek sidebar interface that slides in without blocking your view. |
| **🛠️ Extensive Support** | Supports both **TXT** and **JSON** formats with bulk upload capabilities (10,000+ items). |

---

## 📥 Installation

1.  **Clone or Download** this repository.
2.  Open Chrome and go to `chrome://extensions/`.
3.  **Enable Developer Mode** (Top right toggle).
4.  Click **Load Unpacked**.
5.  Select the `answerfinder` folder.

> **Upgrade Note**: If upgrading from v1.x, please remove the old extension and re-add it to ensure the new Service Worker (v1.2+) loads correctly.

---

## 🛠️ Usage Guide

### 1. Uploading Data

AnswerFinder supports two formats. Click the extension icon and choose your file.

#### Option A: Simple Text (`.txt`)
Perfect for quick lists. Separate pairs with a blank line.

```text
What is the powerhouse of the cell?
Mitochondria

Who wrote Hamlet?
William Shakespeare
```

#### Option B: Structured JSON (`.json`)
Ideal for complex data or exports.

```json
[
  {
    "question": "What is the speed of light?",
    "answer": "299,792,458 m/s"
  },
  {
    "question": "Define Recursion.",
    "answer": "See: Recursion."
  }
]
```

### 2. Finding Answers

1.  **Highlight** any question text on a webpage.
2.  **Right-Click** and select **"Search Answer"**.
3.  The answer sidebar appears instantly! 🚀

---

## ⚙️ Configuration

Customize the engine to your needs via the Popup Menu:

| Setting | Function | Recommended |
| :--- | :--- | :--- |
| **Fuzzy Matching** | Finds answers even with typos/spelling errors. | ✅ ON |
| **Partial Matching** | Finds answers if you select a substring of the question. | ✅ ON |
| **Confidence Threshold** | Filters out weak matches (0-100%). | **50%** |

---

## 🧩 Architecture

AnswerFinder is built on a modern, event-driven architecture designed for speed.

*   **Core**: Vanilla JS (ES Modules) - No bloat.
*   **Storage**: IndexedDB for persistent, large-scale storage.
*   **Matching**: Custom implementation of Levenshtein, Jaro-Winkler, and TF-IDF algorithms.
*   **UI**: Native Web Components style with Shadow DOM isolation (future) and CSS Grid.

---

## 🐞 Troubleshooting

<details>
<summary><b>Click "Upload" but nothing happens?</b></summary>
<br>
This is a known Chrome issue with file pickers closing the popup. We implemented a fix in v1.2! If it persists, toggle the extension OFF/ON in <code>chrome://extensions</code>.
</details>

<details>
<summary><b>Infinite "Searching..." Spinner?</b></summary>
<br>
This occurs if the background script is outdated. Click "Update" in the extensions page and reload the extension.
</details>

<details>
<summary><b>"No Match Found"?</b></summary>
<br>
Try lowering the confidence threshold to 30% or ensuring "Fuzzy Matching" is enabled.
</details>

---

<div align="center">

**Version 2.0.0** • **MIT License** • **Made with ❤️ for Efficiency**

</div>
