/**
 * personality.js
 * Defines the assistant's character and builds dynamic system prompts.
 * Expand this module to give your assistant a richer, more adaptive voice.
 */

const BASE_PERSONALITY = `
You are ARIA (Adaptive Responsive Intelligent Assistant) — witty, warm, and genuinely curious.

Your personality traits:
- You have a dry sense of humour but never at the user's expense
- You celebrate small wins ("Nice! You're building something cool.")
- You admit uncertainty honestly instead of bluffing
- You keep responses concise but never cold
- You occasionally use light metaphors to explain complex ideas
- You vary your greetings naturally — never repeat the same opener twice in a row

Style rules:
- Write in plain, conversational English
- Use contractions (you're, I'd, let's)
- Avoid corporate buzzwords and filler phrases like "Certainly!" or "Of course!"
- When you don't know something, say so with a bit of personality
- Keep responses under 200 words unless depth is genuinely needed
`;

/**
 * Builds the system prompt, optionally enriched with user-specific context.
 * @param {string} userId
 * @param {Array} history - previous conversation turns for this user
 * @returns {string}
 */
export async function buildSystemPrompt(userId, history) {
  const userContext = extractUserContext(history);

  let prompt = BASE_PERSONALITY.trim();

  if (userContext.name) {
    prompt += `\n\nUser context: The user's name appears to be ${userContext.name}. Use it naturally, not constantly.`;
  }

  if (userContext.topics.length > 0) {
    prompt += `\n\nTopics this user has shown interest in: ${userContext.topics.join(", ")}.`;
    prompt += ` Reference these naturally when relevant.`;
  }

  if (userContext.totalTurns > 0) {
    prompt += `\n\nThis is a returning user with ${userContext.totalTurns} previous messages. You have rapport — no need to re-introduce yourself.`;
  } else {
    prompt += `\n\nThis is the first message from this user. Give a warm but brief intro.`;
  }

  return prompt;
}

/**
 * Extracts lightweight signals from conversation history.
 * Placeholder: replace with smarter NLP or embeddings later.
 * @param {Array} history
 * @returns {{ name: string|null, topics: string[], totalTurns: number }}
 */
function extractUserContext(history) {
  const topics = new Set();
  let name = null;

  for (const turn of history) {
    const text = turn.userMessage.toLowerCase();

    // Naive name detection — swap for NER later
    const nameMatch = text.match(/(?:i'm|i am|my name is|call me)\s+([a-z]+)/i);
    if (nameMatch) name = capitalize(nameMatch[1]);

    // Topic tagging — extend this list or use embeddings
    if (/\b(code|programming|typescript|javascript|python)\b/.test(text)) topics.add("coding");
    if (/\b(saas|startup|product|launch|revenue)\b/.test(text)) topics.add("SaaS / entrepreneurship");
    if (/\b(ai|machine learning|llm|model|gpt|claude)\b/.test(text)) topics.add("AI / ML");
    if (/\b(design|ui|ux|figma|css)\b/.test(text)) topics.add("design");
  }

  return { name, topics: [...topics], totalTurns: history.length };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
