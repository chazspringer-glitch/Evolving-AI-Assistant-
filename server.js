const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "conversations.json");

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─────────────────────────────────────────────────────────────
// MEMORY HELPERS
// ─────────────────────────────────────────────────────────────

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveStore(store) {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function loadConversations(userId) {
  return loadStore()[userId] ?? [];
}

function saveConversation(userId, userMessage, assistantResponse) {
  const store = loadStore();
  if (!store[userId]) store[userId] = [];

  const turn = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userMessage,
    assistantResponse,
  };

  store[userId].push(turn);
  saveStore(store);
  return turn;
}

// ─────────────────────────────────────────────────────────────
// PERSONALITY
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(history) {
  const topics = new Set();
  let name = null;

  for (const turn of history) {
    const text = turn.userMessage.toLowerCase();
    const nameMatch = text.match(/(?:i'm|i am|my name is|call me)\s+([a-z]+)/i);
    if (nameMatch) name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    if (/\b(code|programming|typescript|javascript|python)\b/.test(text)) topics.add("coding");
    if (/\b(saas|startup|product|launch|revenue)\b/.test(text)) topics.add("SaaS");
    if (/\b(ai|llm|model|gpt|claude)\b/.test(text)) topics.add("AI");
    if (/\b(design|ui|ux|figma|css)\b/.test(text)) topics.add("design");
  }

  let prompt = `You are ARIA — witty, warm, and genuinely curious.
- Dry humour, never at the user's expense
- Celebrate small wins
- Be honest when you don't know something
- Concise but never cold
- Vary your greetings naturally
- No corporate filler like "Certainly!" or "Of course!"
- Use contractions and plain English
- Under 200 words unless depth is needed`;

  if (name) prompt += `\n\nThe user's name is ${name}. Use it naturally, not constantly.`;
  if (topics.size > 0) prompt += `\n\nUser interests: ${[...topics].join(", ")}.`;
  if (history.length > 0) {
    prompt += `\n\nReturning user with ${history.length} previous messages. Skip the intro.`;
  } else {
    prompt += `\n\nFirst message — give a warm but brief intro.`;
  }

  return prompt;
}

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ status: "ARIA is alive and thinking..." });
});

app.post("/chat", async (req, res) => {
  const { message, userId = "anonymous" } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Provide a 'message' string in the request body." });
  }

  try {
    const history = loadConversations(userId);
    const systemPrompt = buildSystemPrompt(history);

    const recentMessages = history.slice(-10).flatMap((t) => [
      { role: "user", content: t.userMessage },
      { role: "assistant", content: t.assistantResponse },
    ]);

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [...recentMessages, { role: "user", content: message }],
      }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw new Error(err.error?.message || "API request failed");
    }

    const data = await apiRes.json();
    const assistantResponse = data.content[0]?.text || "I'm at a loss for words!";

    const turn = saveConversation(userId, message, assistantResponse);

    res.json({
      response: assistantResponse,
      conversationId: turn.id,
      timestamp: turn.timestamp,
    });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Something went sideways. Try again!" });
  }
});

app.get("/history/:userId?", (req, res) => {
  const userId = req.params.userId || "anonymous";
  const history = loadConversations(userId);
  res.json({ userId, totalTurns: history.length, history });
});

// ─────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`ARIA running on port ${PORT}`);
});
