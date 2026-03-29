/**
 * learning.js
 * Placeholder for adaptive learning logic.
 *
 * As your assistant grows, this is where you'd plug in:
 *   - Sentiment analysis (happy user? frustrated?)
 *   - Topic extraction / embedding generation
 *   - Preference inference (response length, tone, depth)
 *   - Fine-tuning data collection
 *   - Feedback loop from thumbs-up / thumbs-down ratings
 *
 * Right now it tags basic metadata onto conversation turns.
 * Replace the placeholder functions with real ML calls as you go.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../conversations.json");

/**
 * Main entry point — called after every conversation turn.
 * Non-blocking (fire-and-forget from server.js).
 *
 * @param {string} userId
 * @param {Array}  history  - all previous turns for this user
 * @param {Object} newTurn  - the turn that was just saved
 */
export async function learnFromConversation(userId, history, newTurn) {
  try {
    const tags = await extractTags(newTurn.userMessage);
    const sentiment = await analyzeSentiment(newTurn.userMessage);
    const responseQuality = await scoreResponseQuality(newTurn.assistantResponse);

    // Patch the turn's metadata in the store
    await patchTurnMetadata(userId, newTurn.id, { tags, sentiment, responseQuality });

    // Placeholder: adapt personality weights based on engagement signals
    await updateUserPreferences(userId, history, { tags, sentiment });

    console.log(`[learn] user=${userId} sentiment=${sentiment} tags=${tags.join(",")}`);
  } catch (err) {
    console.warn("[learn] Non-fatal learning error:", err.message);
  }
}

// ─── Placeholder Implementations ─────────────────────────────────────────────

/**
 * Extract topic tags from a message.
 * TODO: Replace with embeddings + clustering, or a lightweight classifier.
 */
async function extractTags(message) {
  const lower = message.toLowerCase();
  const tags = [];
  if (/\b(code|function|bug|error|typescript|javascript|python)\b/.test(lower)) tags.push("coding");
  if (/\b(saas|startup|launch|monetize|revenue|stripe)\b/.test(lower)) tags.push("saas");
  if (/\b(ai|llm|model|prompt|claude|gpt|embedding)\b/.test(lower)) tags.push("ai");
  if (/\b(help|stuck|confused|how do i|what is)\b/.test(lower)) tags.push("help-seeking");
  if (/\b(great|awesome|thanks|love|perfect)\b/.test(lower)) tags.push("positive-feedback");
  return tags;
}

/**
 * Naive sentiment detection.
 * TODO: Replace with a real sentiment model (e.g., Hugging Face API or local model).
 */
async function analyzeSentiment(message) {
  const lower = message.toLowerCase();
  const positiveWords = ["great", "awesome", "love", "perfect", "thanks", "nice", "cool", "amazing"];
  const negativeWords = ["bad", "wrong", "frustrated", "confused", "broken", "hate", "terrible"];

  const posScore = positiveWords.filter((w) => lower.includes(w)).length;
  const negScore = negativeWords.filter((w) => lower.includes(w)).length;

  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

/**
 * Scores a response by simple heuristics.
 * TODO: Use an LLM-as-judge or RLHF signals when you have user ratings.
 */
async function scoreResponseQuality(response) {
  const wordCount = response.split(/\s+/).length;
  return {
    wordCount,
    tooShort: wordCount < 10,
    tooLong: wordCount > 300,
    score: Math.min(1, wordCount / 80), // naive: longer up to ~80 words = higher score
  };
}

/**
 * Updates a user's learned preferences.
 * TODO: Persist and use these to shape future system prompts or temperature settings.
 */
async function updateUserPreferences(userId, history, { tags, sentiment }) {
  // Example: if user keeps asking coding questions, note their technical depth preference.
  // For now, this is a no-op placeholder.
  //
  // Future: load a user_preferences.json, increment topic counters, adjust tone params.
}

// ─── Utility ─────────────────────────────────────────────────────────────────

async function patchTurnMetadata(userId, turnId, metadata) {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const store = JSON.parse(raw);
    const turns = store[userId] ?? [];
    const turn = turns.find((t) => t.id === turnId);
    if (turn) {
      turn.metadata = { ...turn.metadata, ...metadata };
      await fs.writeFile(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("[learn] Could not patch metadata:", err.message);
  }
}
