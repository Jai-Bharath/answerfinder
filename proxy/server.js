const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS_PER_USER = parseInt(process.env.RATE_LIMIT_PER_DAY) || 100;

// In-memory rate limiting (use Redis for production)
const requestCounts = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting Middleware
const checkRateLimit = (req, res, next) => {
  const apiKey = req.headers["x-extension-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing extension key" });
  }

  const now = Date.now();
  const userStats = requestCounts.get(apiKey) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  if (now > userStats.resetTime) {
    userStats.count = 0;
    userStats.resetTime = now + RATE_LIMIT_WINDOW;
  }

  if (userStats.count >= MAX_REQUESTS_PER_USER) {
    return res.status(429).json({
      error: "Daily quota exceeded",
      retryAfter: userStats.resetTime - now,
    });
  }

  userStats.count++;
  requestCounts.set(apiKey, userStats);

  // Add rate limit info to headers
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_USER);
  res.setHeader(
    "X-RateLimit-Remaining",
    MAX_REQUESTS_PER_USER - userStats.count,
  );
  res.setHeader("X-RateLimit-Reset", userStats.resetTime);

  next();
};

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Friendly message for GET /api/query (browser visit)
app.get("/api/query", (req, res) => {
  res
    .status(200)
    .send(
      "✅ Proxy server is running! You can strictly close this tab and use the extension.",
    );
});

// Avoid 404 for favicon
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Groq Configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.3-70b-versatile";

// Proxy Endpoint
app.post("/api/query", checkRateLimit, async (req, res) => {
  try {
    const { inputs } = req.body;

    if (!inputs) {
      return res.status(400).json({ error: "Missing inputs" });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: inputs }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", errorText);
      return res
        .status(response.status)
        .json({ error: "Model API error", details: errorText });
    }

    const data = await response.json();

    // Transform OpenAI format to match our extension's expected format ({ generated_text: ... })
    // Extension expects: { generated_text: "Answer..." }
    const generatedText =
      data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "";

    res.json({ generated_text: generatedText });
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
  });
}

module.exports = app;
