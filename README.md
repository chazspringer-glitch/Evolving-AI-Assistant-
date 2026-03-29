# 🧠 ARIA — Adaptive Responsive Intelligent Assistant

A witty, evolving AI assistant built with **Node.js + Express**, powered by the **Anthropic Claude API**. Conversations persist in a local JSON file and a learning module adapts the assistant's personality over time.

---

## 🗂️ Project Structure

```
ai-assistant/
├── server.js                  # Express server + endpoints
├── conversations.json         # Auto-created: persistent conversation store
├── package.json
├── .env                       # Your API key (not committed)
└── assistant/
    ├── personality.js         # System prompt builder + user context
    ├── memory.js              # Read/write conversations.json
    └── learning.js            # Adaptive learning (expand this over time)
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Add your API key

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
```

> **Note:** The project reads `ANTHROPIC_API_KEY` from the environment automatically. No extra config needed.

### 3. Run in development

```bash
npm run dev
```

### 4. Run in production

```bash
npm start
```

---

## 📡 API Endpoints

### `POST /chat`

Send a message to the assistant.

**Request body:**
```json
{
  "message": "Hey, what's the best way to structure a SaaS app?",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "response": "Great question! Think of it like building a house...",
  "conversationId": "uuid-...",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

### `GET /history/:userId`

Fetch all conversation turns for a user.

```bash
curl http://localhost:3000/history/user_123
```

---

### `GET /`

Health check — confirms the server is alive.

---

## 🚂 Deploy to Railway

1. Push this repo to GitHub.
2. Create a new project on [Railway](https://railway.app) → **Deploy from GitHub repo**.
3. Add your environment variable in the Railway dashboard:
   - `ANTHROPIC_API_KEY` = your key
4. Railway auto-detects the `start` script and deploys. Done.

> Railway will assign a public URL automatically. No extra config needed.

---

## 🧩 Extending the Assistant

| File | What to expand |
|---|---|
| `assistant/personality.js` | Add richer user context, tone modes, or persona switching |
| `assistant/learning.js` | Plug in real sentiment models, embeddings, or RLHF signals |
| `assistant/memory.js` | Swap JSON storage for PostgreSQL, Redis, or a vector DB |
| `server.js` | Add `/feedback` endpoint to collect thumbs-up / thumbs-down ratings |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Claude API key |
| `PORT` | Optional | Server port (default: 3000) |

---

## 📋 Requirements

- Node.js ≥ 18
- An [Anthropic API key](https://console.anthropic.com)
