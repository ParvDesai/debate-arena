# DebateArena — Frontend Architecture & Build Spec

> Feed this file to any AI assistant (Antigravity, ChatGPT, etc.) to get targeted help building each part of the frontend. It contains the full backend reference, component tree, folder structure, hook contracts, and UI plan.

---

## Backend Reference (What Already Exists)

### Tech Stack
- Runtime: Node.js + Express.js
- Database: MongoDB + Mongoose
- Real-time: Socket.io
- Auth: JWT via cookies (cookie-parser)
- AI: @google/generative-ai (Gemini) + groq-sdk

---

### Database Models

#### User
```
username      String, unique
email         String, unique
passwordHash  String
wins          Number (default 0)
losses        Number (default 0)
totalScore    Number (default 0)
gamesPlayed   Number (default 0)
```

#### Room
```
topic         String
status        Enum: waiting | active | finished
debaterFor    ObjectId → User
debaterAgainst ObjectId → User
audienceIds   [ObjectId] → User[]
currentTurn   Enum: for | against (default: for)
turnNumber    Number (default 1)
maxTurns      Number (default 3)
winnerId      ObjectId → User
isSoloMode    Boolean (default false)
soloSide      Enum: for | against (default: for)
forVotes      Number (default 0)
againstVotes  Number (default 0)
timerEndsAt   Date
```

#### Argument
```
roomId        ObjectId → Room
userId        ObjectId → User
side          Enum: for | against
text          String
turnNumber    Number
aiScore       { coherence, evidence, logic, total }
aiFeedback    String
```

#### Vote
```
roomId        ObjectId → Room
userId        ObjectId → User
side          Enum: for | against
```

---

### REST API Endpoints

Base URL: `/api`
All routes (except auth) require JWT cookie set by `/api/auth/login`.

#### Auth — `/api/auth`
| Method | Path        | Description                        |
|--------|-------------|------------------------------------|
| POST   | /register   | Register new user                  |
| POST   | /login      | Login — sets JWT cookie            |
| POST   | /logout     | Clear JWT cookie                   |
| GET    | /me         | Get current authenticated user     |

#### Rooms — `/api/rooms`
| Method | Path         | Description                            |
|--------|--------------|----------------------------------------|
| GET    | /            | Get all rooms                          |
| POST   | /create      | Create room (body: { topic, isSoloMode }) |
| POST   | /join/:id    | Join room as debater                   |
| GET    | /replay/:id  | Get finished debate data               |
| GET    | /:id         | Get single room details                |

#### Arguments — `/api/arguments`
| Method | Path        | Description                     |
|--------|-------------|---------------------------------|
| POST   | /submit     | Submit argument (also via socket) |
| GET    | /:roomId    | Get all arguments for room      |

#### Leaderboard — `/api/leaderboard`
| Method | Path | Description                          |
|--------|------|--------------------------------------|
| GET    | /    | Top users sorted by totalScore/wins  |

#### Topics — `/api/topics`
| Method | Path | Description                 |
|--------|------|-----------------------------|
| GET    | /    | List of trending debate topics |

---

### Socket.io Events

Socket handshake requires JWT: `{ auth: { token: "..." } }`

#### Client → Server (Frontend Emits)
| Event            | Payload                   | Description                        |
|------------------|---------------------------|------------------------------------|
| join-room        | roomId                    | Join room channel (player/spectator) |
| start-timer      | roomId                    | Start 60s turn timer               |
| submit-argument  | { roomId, text }          | Submit argument → triggers AI scoring |
| audience-vote    | { roomId, side }          | Cast/change audience vote          |
| forfeit-debate   | { roomId }                | Current player forfeits            |
| leave-room       | roomId                    | Leave room channel                 |

#### Server → Client (Frontend Listens)
| Event              | Payload                                      | Description                           |
|--------------------|----------------------------------------------|---------------------------------------|
| spectator-count    | count                                        | Number of live viewers                |
| room-state         | { room, arguments, spectators }             | Initial state on join                 |
| timer-tick         | remainingSeconds                             | Every second while timer runs         |
| timer-expired      | —                                            | Timer hit 0                           |
| scoring-in-progress| { side, turnNumber }                        | AI is scoring — show loader           |
| argument-scored    | argument                                     | Scored argument object                |
| turn-changed       | { currentTurn, turnNumber }                 | Turn switched                         |
| debate-finished    | { room, forTotal, againstTotal, winner, forfeit? } | Match over                   |
| vote-updated       | { forVotes, againstVotes }                  | Audience vote changed                 |
| ai-thinking        | —                                            | Solo mode — AI opponent thinking      |
| error-msg          | message                                      | Generic error                         |

---

## Frontend Tech Stack (To Be Built)

```
React 18 + Vite
React Router v6
socket.io-client
Zustand (global state)
Tailwind CSS
shadcn/ui (accessible primitives)
Framer Motion (animations)
Axios (HTTP)
Recharts (score charts in replay)
```

---

## Folder Structure

```
src/
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Lobby.jsx
│   ├── SoloMode.jsx
│   ├── DebateRoom.jsx         ← main arena page
│   ├── Leaderboard.jsx
│   └── Replay.jsx
│
├── components/
│   ├── debate/
│   │   ├── ScoreHeader.jsx        ← live FOR/AGAINST score totals
│   │   ├── TurnIndicator.jsx      ← pulsing whose-turn banner
│   │   ├── CountdownTimer.jsx     ← SVG circle countdown (60s)
│   │   ├── ArgumentFeed.jsx       ← two-column scrolling feed
│   │   ├── ArgumentCard.jsx       ← argument + AI score bars + feedback
│   │   ├── ScoringLoader.jsx      ← "AI Judging..." shimmer state
│   │   ├── ArgumentInput.jsx      ← textarea + char count + submit
│   │   ├── AudienceVoteBar.jsx    ← real-time poll bar
│   │   ├── VictoryOverlay.jsx     ← full-screen match-end screen
│   │   └── SpectatorBadge.jsx     ← live viewer count
│   │
│   ├── lobby/
│   │   ├── RoomCard.jsx           ← battle tile with LIVE/WAITING badge
│   │   ├── CreateRoomModal.jsx    ← create new room dialog
│   │   └── TopicChip.jsx          ← trending topic badge/chip
│   │
│   └── shared/
│       ├── Navbar.jsx
│       ├── AvatarVS.jsx           ← debater avatar pair with VS
│       ├── ScoreBar.jsx           ← animated thin progress bar
│       └── ProtectedRoute.jsx     ← redirect to /login if no auth
│
├── hooks/
│   ├── useAuth.js             ← GET /api/auth/me, login(), logout()
│   ├── useSocket.js           ← socket.io-client singleton with JWT
│   ├── useDebateRoom.js       ← all socket events + room state logic
│   └── useRooms.js            ← lobby room list polling
│
├── services/
│   ├── api.js                 ← axios instance, baseURL, interceptors
│   └── socket.js              ← socket.io-client singleton factory
│
└── store/
    ├── authStore.js           ← Zustand: { user, token, setUser }
    └── roomStore.js           ← Zustand: { room, args, votes, scores }
```

---

## Page-by-Page Spec

### 1. Login (`/login`) & Register (`/register`)

**Layout:** Centered card on a dark space-themed background with animated particle/star field.

**Login fields:**
- Email Address (input)
- Secret Key / Password (input, type=password)
- CTA Button: "ASCEND TO ARENA"
- Link: "New Challenger? REGISTER HERE"

**Register fields:**
- Gladiator Name (username)
- Email Address
- Secret Key (password)
- CTA Button: "CLAIM YOUR GLORY"
- Link: "Already a Legend? SIGN IN"

**API calls:**
- Login: `POST /api/auth/login` → sets cookie → redirect to `/lobby`
- Register: `POST /api/auth/register` → redirect to `/login`

**On mount:** Call `GET /api/auth/me` — if user is already authenticated, redirect to `/lobby`.

---

### 2. Lobby (`/lobby`)

**Layout:** Two-panel layout.
- **Left/Main:** Active Battles grid (`GET /api/rooms`)
- **Right Sidebar:** Top Gladiators (`GET /api/leaderboard`)

**RoomCard shows:**
- Topic text
- Debater avatars (initials circles) with VS between them (or A for AI slot)
- Status badge: `LIVE` (red pulsing dot) or `WAITING` (purple)
- Spectator count
- Buttons: JOIN (if waiting + debaterAgainst empty) or WATCH (if active)

**Header actions:**
- `LOBBY` nav tab
- `SOLO MODE` nav tab → `/solo`
- `+ NEW BATTLE` button → opens `CreateRoomModal`

**CreateRoomModal fields:**
- Topic text input
- Solo mode toggle (isSoloMode checkbox)
- Submit → `POST /api/rooms/create` → redirect to `/arena/:id`

**Join room:** `POST /api/rooms/join/:id` → redirect to `/arena/:id`

**Watch room:** Navigate to `/arena/:id` directly (will join as spectator via socket).

---

### 3. Solo Mode (`/solo`)

**Layout:** Full-width topic browser.

**Header:** "CHALLENGE GEMINI" with subtitle. Search bar.

**Topic grid:** Cards from `GET /api/topics`, each with:
- Topic text
- TRENDING badge (if applicable)
- Category icon
- CHALLENGE button

**On CHALLENGE click:**
- `POST /api/rooms/create` with `{ topic, isSoloMode: true }`
- Redirect to `/arena/:roomId`

**In DebateRoom (solo mode):**
- When `ai-thinking` socket event fires → show "GEMINI IS FORMULATING..." overlay on the AGAINST column with animated dots.
- AI response will come via `argument-scored` event automatically.

---

### 4. DebateRoom (`/arena/:id`) — THE CORE PAGE

This is the most complex page. It handles all real-time socket events.

**On mount:**
```js
emit('join-room', roomId)
listen('room-state') → initialize all state
```

**On unmount:**
```js
emit('leave-room', roomId)
```

#### Layout: Three zones

**Zone 1 — Top Bar:**
- `ScoreHeader`: FOR [score] | [TOPIC TEXT] | [score] AGAINST
- `TurnIndicator`: "🔥 FOR — MAKE YOUR ARGUMENT" or "❄️ AGAINST — YOUR TURN" (pulsing)
- `CountdownTimer`: SVG circle, animates via `timer-tick` events
- `SpectatorBadge`: 👁 {count} viewers

**Zone 2 — Middle: Argument Feed**
- Two columns side by side
- Left column (FOR): fire/amber tinted cards
- Right column (AGAINST): ice/blue tinted cards
- `ArgumentCard` structure:
  - Username + timestamp + turn number header
  - Argument body text
  - AI Score bars (only after `argument-scored` fires):
    - C (Coherence) — animated width bar out of 10
    - E (Evidence) — animated width bar out of 10
    - L (Logic) — animated width bar out of 10
    - Total score badge
  - AI Feedback text (italic, muted)
- When `scoring-in-progress` fires: show `ScoringLoader` at bottom of active column
- New cards animate in from bottom (Framer Motion layoutId)

**Zone 3 — Bottom Input:**
- `ArgumentInput`:
  - Textarea (disabled when it's not the logged-in user's turn)
  - Character counter
  - "Submit Argument" button → emits `submit-argument`
  - Timer is started by emitting `start-timer` when user focuses textarea
- `AudienceVoteBar` (visible to spectators and non-debaters):
  - FOR [count] / [count] AGAINST
  - Click FOR → emit `audience-vote { roomId, side: 'for' }`
  - Click AGAINST → emit `audience-vote { roomId, side: 'against' }`
  - Updates live on `vote-updated` events

**VictoryOverlay** (triggered by `debate-finished`):
- Full-screen overlay (Framer Motion scale-in)
- Winner username: "[name] CLAIMS THE TITLE"
- Score breakdown: FOR [total] vs AGAINST [total]
- Audience sentiment: {forVotes}F / {againstVotes}F / {abstain}A
- Battle Log History (argument list with scores from the match)
- "RETURN TO ARENA" button → navigate to `/lobby`
- If `forfeit: true` in payload → show forfeit message

**Live Score Feed (Left sidebar, optional):**
- Running log of scored arguments with scores
- Shows: username, snippet, AI score

---

### 5. Leaderboard (`/leaderboard`)

**Data:** `GET /api/leaderboard`

**Table columns:** Rank | Avatar | Username | Victory Rate | ELO Rating (totalScore)

**Sort by totalScore descending. Top 3 get gold/silver/bronze styling.**

---

### 6. Replay (`/replay/:id`)

**Data:** `GET /api/rooms/replay/:id` + `GET /api/arguments/:roomId`

**Layout:** Read-only version of DebateRoom — no input, no timer. Shows full argument history with all AI scores. Winner banner at top. Useful for reviewing past matches.

---

## Hook Contracts

### `useAuth.js`
```js
// Returns:
{
  user,          // { _id, username, email, wins, losses, ... } | null
  loading,       // boolean
  login(email, password),   // POST /api/auth/login
  logout(),                 // POST /api/auth/logout
  register(username, email, password)  // POST /api/auth/register
}
```

### `useSocket.js`
```js
// Singleton socket.io-client, connected with JWT from authStore
// Usage: const socket = useSocket()
// socket.emit('join-room', roomId)
// socket.on('room-state', cb)

// Init:
const socket = io(BACKEND_URL, {
  auth: { token: authStore.token },
  autoConnect: false
})
// Call socket.connect() on entering arena, socket.disconnect() on leaving
```

### `useDebateRoom.js`
```js
// Usage: const { room, args, scores, ... } = useDebateRoom(roomId)
// Handles ALL socket events internally
// Returns:
{
  room,             // Room object
  arguments,        // Argument[] sorted by turnNumber
  isMyTurn,         // boolean
  mySide,           // 'for' | 'against' | null
  isSpectator,      // boolean
  timerSeconds,     // number (0-60)
  scoringInProgress,// boolean
  debateFinished,   // { winner, forTotal, againstTotal, ... } | null
  aiThinking,       // boolean (solo mode)

  submitArgument(text),   // emit 'submit-argument'
  startTimer(),           // emit 'start-timer'
  castVote(side),         // emit 'audience-vote'
  forfeit(),              // emit 'forfeit-debate'
}
```

---

## Zustand Stores

### `authStore.js`
```js
{
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null })
}
```

### `roomStore.js`
```js
{
  room: null,
  arguments: [],
  forVotes: 0,
  againstVotes: 0,
  setRoom: (room) => set({ room }),
  addArgument: (arg) => set(state => ({ arguments: [...state.arguments, arg] })),
  updateVotes: ({ forVotes, againstVotes }) => set({ forVotes, againstVotes }),
  reset: () => set({ room: null, arguments: [], forVotes: 0, againstVotes: 0 })
}
```

---

## Services

### `services/api.js`
```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true  // Required for JWT cookie
})

export default api
```

### `services/socket.js`
```js
import { io } from 'socket.io-client'

let socket = null

export const getSocket = (token) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      autoConnect: false
    })
  }
  return socket
}
```

---

## UI Aesthetic Guide

### Color Palette
```css
/* Dark space theme */
--bg-primary:     #0a0a12;   /* Deep space dark */
--bg-card:        #12121e;   /* Card surfaces */
--bg-elevated:    #1a1a2e;   /* Elevated panels */

/* Accent */
--accent-purple:  #7c3aed;
--accent-cyan:    #06b6d4;
--gradient-cta:   linear-gradient(135deg, #7c3aed, #06b6d4);

/* FOR side — fire/amber */
--for-primary:    #f97316;
--for-bg:         rgba(249, 115, 22, 0.08);
--for-border:     rgba(249, 115, 22, 0.3);

/* AGAINST side — ice/blue */
--against-primary: #3b82f6;
--against-bg:      rgba(59, 130, 246, 0.08);
--against-border:  rgba(59, 130, 246, 0.3);

/* Status */
--live-red:       #ef4444;
--waiting-purple: #8b5cf6;
--score-gold:     #fbbf24;
```

### Typography
- **Display / Score numbers:** `Rajdhani` or `Barlow Condensed` — tall, punchy, arena feel
- **Body / Argument text:** `Inter` — clean, readable
- **Import:** Google Fonts: `Rajdhani:wght@600;700` + `Inter:wght@400;500`

### Key Animations (Framer Motion)

**VictoryOverlay entrance:**
```js
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: 'spring', stiffness: 200, damping: 20 }}
```

**New ArgumentCard:**
```js
initial={{ y: 40, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.3 }}
```

**AI Score bars (animate width 0 → value):**
```js
initial={{ width: 0 }}
animate={{ width: `${(score / 10) * 100}%` }}
transition={{ duration: 0.8, ease: 'easeOut' }}
```

**LIVE badge pulse:**
```css
@keyframes pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.3); }
}
.live-dot {
  animation: pulse-live 1.5s ease-in-out infinite;
  background: #ef4444;
  border-radius: 50%;
  width: 8px; height: 8px;
}
```

**CountdownTimer SVG circle:**
- Circle with `stroke-dasharray` and `stroke-dashoffset` controlled by `timerSeconds`
- Color transitions: teal (>30s) → amber (15-30s) → red (<15s)

---

## Environment Variables (`.env`)
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Build & Run

```bash
npm create vite@latest debatearena-frontend -- --template react
cd debatearena-frontend
npm install
npm install react-router-dom socket.io-client zustand framer-motion axios recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui setup
npx shadcn-ui@latest init

npm run dev   # runs on port 5173 by default
```

---

## Priority Build Order

1. `services/api.js` + `services/socket.js` — foundation
2. `store/authStore.js` + `hooks/useAuth.js`
3. `Login.jsx` + `Register.jsx` + `ProtectedRoute.jsx`
4. `Lobby.jsx` + `RoomCard.jsx` + `CreateRoomModal.jsx`
5. `hooks/useSocket.js` + `hooks/useDebateRoom.js`
6. `DebateRoom.jsx` (all sub-components)
7. `VictoryOverlay.jsx`
8. `SoloMode.jsx`
9. `Leaderboard.jsx` + `Replay.jsx`

---

*This document was generated from the DebateArena backend structure. Use it as a complete handoff spec for any AI assistant to help build individual components, hooks, or pages.*

