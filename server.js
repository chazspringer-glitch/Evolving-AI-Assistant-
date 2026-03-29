import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { buildSystemPrompt } from "./assistant/personality.js";
import { saveConversation, loadConversations } from "./assistant/memory.js";
import { learnFromConversation } from "./assistant/learning.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "🧠 AI Assistant is alive and thinking..." });
});

// ─── Chat Endpoint ────────────────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  const { message, userId = "anonymous" } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Please provide a 'message' string in the request body." });
  }

  try {
    // Load past conversations for context
    const history = await loadConversations(userId);

    // Build the system prompt (personality + memory context)
    const systemPrompt = await buildSystemPrompt(userId, history);

    // Format conversation history for the API (last 10 turns for context)
    const recentHistory = history.slice(-10).flatMap((turn) => [
      { role: "user", content: turn.userMessage },
      { role: "assistant", content: turn.assistantResponse },
    ]);

    // Call Anthropic API
    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [...recentHistory, { role: "user", content: message }],
      }),
    });

    if (!apiResponse.ok) {
      const err = await apiResponse.json();
      throw new Error(err.error?.message || "API request failed");
    }

    const data = await apiResponse.json();
    const assistantResponse = data.content[0]?.text || "I'm at a loss for words!";

    // Save the conversation turn
    const turn = await saveConversation(userId, message, assistantResponse);

    // Trigger background learning (non-blocking)
    learnFromConversation(userId, history, turn).catch(console.error);

    res.json({
      response: assistantResponse,
      conversationId: turn.id,
      timestamp: turn.timestamp,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Something went sideways on my end. Try again!" });
  }
});

// ─── Conversation History Endpoint ───────────────────────────────────────────
app.get("/history/:userId?", async (req, res) => {
  const userId = req.params.userId || "anonymous";
  try {
    const history = await loadConversations(userId);
    res.json({ userId, totalTurns: history.length, history });
  } catch {
    res.json({ userId, totalTurns: 0, history: [] });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AI Assistant running on port ${PORT}`);
  console.log(`   POST /chat        → Send a message`);
  console.log(`   GET  /history/:id → View conversation history\n`);
});
