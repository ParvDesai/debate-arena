# ⚔️ Debate Arena

A **real-time AI-powered debate platform** where users debate each other or challenge an AI opponent. Arguments are scored live by LLaMA 3.3, with spectator mode, audience voting, and full replay support.

> 🔴 **[Live Demo](https://debate-arena-frontend-three.vercel.app)** &nbsp;|&nbsp; 📄 **[Backend API](https://debate-arena-backend-0var.onrender.com)**

---

## ✨ Features

### 🤖 Solo Mode (vs AI)
- Choose your side — **FOR** or **AGAINST** the topic
- AI opponent powered by **LLaMA 3.3 via Groq API** generates real counter-arguments
- 15-second reading cooldown after AI responds so you can read before replying
- Solo debates excluded from leaderboard to keep rankings fair

### ⚔️ Multiplayer Battles
- Create or join debate rooms in real time via **Socket.io**
- 60-second turn timer per argument with auto-submit on expiry
- Live presence tracking — debate pauses if opponent disconnects
- Forfeit system with immediate verdict

### 📊 AI Scoring
- Every argument scored on **Coherence**, **Evidence**, and **Logic** (0–10 each)
- Constructive feedback generated per argument
- Live score updates visible to both debaters and spectators

### 👥 Spectator & Audience
- Anyone can watch live debates as a spectator
- Audience can vote FOR or AGAINST in real time
- Spectator count badge shown in the arena

### 🏆 Leaderboard & Replays
- Global leaderboard ranked by wins, win rate, and total score
- Full debate replay system — read every argument and score after the fact
- Downloadable transcript of any debate

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Real-time** | Socket.io (WebSockets) |
| **Backend** | Node.js, Express |
| **Database** | MongoDB with Mongoose |
| **AI / LLM** | LLaMA 3.3-70B via Groq API |
| **Auth** | JWT (stored in localStorage) |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│  React Frontend │◄──────►│   Express Backend     │
│   (Vercel)      │  REST   │   (Render)            │
│                 │◄──────►│                       │
│                 │ Socket  │  ┌────────────────┐   │
└─────────────────┘  .io   │  │  Socket Handler│   │
                           │  │  debateHandler │   │
                           │  └───────┬────────┘   │
                           │          │             │
                           │  ┌───────▼────────┐   │
                           │  │   MongoDB      │   │
                           │  │  (Atlas)       │   │
                           │  └───────┬────────┘   │
                           │          │             │
                           │  ┌───────▼────────┐   │
                           │  │   Groq API     │   │
                           │  │  LLaMA 3.3-70B │   │
                           │  └────────────────┘   │
                           └──────────────────────┘
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo
```bash
git clone https://github.com/your-username/debate-arena.git
cd debate-arena
```

### 2. Set up the backend
```bash
cd backend
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, and GROQ_API_KEY in .env
npm install
npm run dev
```

### 3. Set up the frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL and VITE_SOCKET_URL should point to your backend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 🌍 Deployment

### Backend → Render
1. Connect your GitHub repo on [render.com](https://render.com)
2. Render auto-detects `render.yaml` and configures the service
3. Set these environment variables in the Render dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `GROQ_API_KEY` — your Groq API key
   - `FRONTEND_URL` — your Vercel frontend URL (after deploying frontend)

### Frontend → Vercel
1. Connect your GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set these environment variables in Vercel:
   - `VITE_API_URL` — `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL` — `https://your-backend.onrender.com`

Every `git push` auto-redeploys both services.

---

## 📁 Project Structure

```
debate-arena/
├── backend/
│   ├── controllers/        # Route handlers
│   ├── models/             # Mongoose schemas (Room, User, Argument, Vote)
│   ├── routes/             # Express routes
│   ├── services/
│   │   └── geminiService.js  # Groq/LLaMA scoring & counter-argument generation
│   ├── socket/
│   │   └── debateHandler.js  # All real-time Socket.io logic
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── debate/     # Arena UI (ArgumentFeed, Timer, VictoryOverlay…)
        │   ├── lobby/      # Room cards, create modal
        │   └── shared/     # Navbar, ProtectedRoute
        ├── hooks/
        │   ├── useDebateRoom.js  # All socket state management
        │   └── useRooms.js
        ├── pages/          # Lobby, DebateRoom, SoloMode, Leaderboard, Replay
        ├── services/       # axios (api.js) + socket.io (socket.js)
        └── store/          # Zustand state (auth, room)
```

---

## 🔑 Key Technical Decisions

- **Socket.io over plain WebSockets** — built-in reconnection, room namespacing, and event-based API made real-time turn management much cleaner
- **Server-side turn validation** — the backend validates whose turn it is before accepting arguments, preventing cheating
- **Groq over OpenAI** — LLaMA 3.3-70B on Groq is faster and free-tier friendly, critical for a portfolio project with real users
- **Solo mode excluded from stats** — AI opponents are easy to beat; keeping them out of the leaderboard preserves competitive integrity
- **Presence-based timer** — the 60s turn timer only runs when both debaters are connected, pausing automatically on disconnect

---

## 📝 License

MIT
