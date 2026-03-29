/**
 * memory.js
 * Handles reading and writing conversation history to conversations.json.
 * Each user gets their own bucket of turns.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../conversations.json");

/**
 * Loads the full conversations store from disk.
 * Returns an empty object if the file doesn't exist yet.
 */
async function loadStore() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Persists the store back to disk.
 */
async function saveStore(store) {
  await fs.writeFile(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/**
 * Returns the conversation history for a specific user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function loadConversations(userId) {
  const store = await loadStore();
  return store[userId] ?? [];
}

/**
 * Appends a new conversation turn and persists it.
 * @param {string} userId
 * @param {string} userMessage
 * @param {string} assistantResponse
 * @returns {Promise<Object>} the saved turn
 */
export async function saveConversation(userId, userMessage, assistantResponse) {
  const store = await loadStore();

  if (!store[userId]) store[userId] = [];

  const turn = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userMessage,
    assistantResponse,
    metadata: {}, // reserved for tags, sentiment, topics — see learning.js
  };

  store[userId].push(turn);
  await saveStore(store);

  return turn;
}

/**
 * Deletes all conversations for a user (GDPR-friendly hook).
 * @param {string} userId
 */
export async function clearConversations(userId) {
  const store = await loadStore();
  delete store[userId];
  await saveStore(store);
}
