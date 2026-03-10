# ♠ Spades — Real-Time Multiplayer Card Game

A fully playable, real-time multiplayer Spades card game — built from scratch with React, Node.js, and Socket.io. Supports many players, flexible team modes, and a solo mode against a computer opponent.

**Play now → [spades.anudeep.space](https://spades.anudeep.space)**

---

## The Game

Spades is a classic trick-taking card game played over 13 rounds. Each round, players are dealt more cards than the last (Round 1: 1 card each, Round 13: 13 cards each). Before playing, every player bids how many tricks they expect to win. Spades are always trump — they beat every other suit.

**Scoring:**
- Make your bid → **+10 × bid**
- Miss your bid → **−10 × bid**
- Each overtrick (bag) → **+1 bag**
- Every 3 bags → **−30 pts penalty**, bags reset

The player or team with the highest score after all 13 rounds wins.

---

## Features

- **Real-time multiplayer** — create a room, share the code, and play with friends instantly
- **Teams** — dynamic team formation, including odd numbers
- **Modes** — Team Modes, or individual (everyone for themselves)
- **13-round progressive dealing** — round 1 deals 1 card each, round 2 deals 2, and so on up to 13
- **CPU opponent** — play solo against an AI-powered computer that bids and plays strategically
- **Emoji reactions** — send emoji reactions to other players during the game
- **Score tracking** — complete round-by-round history with bid/trick breakdowns, bags, and penalties
- **Responsive design** — fully playable on both desktop and mobile browsers
- **Rejoin support** — reconnect to an in-progress game if you lose connection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, Socket.io |
| Game Engine | TypeScript monorepo package (`@spades/shared`) |
| Real-time | Socket.io (WebSockets) |
| Styling | Tailwind CSS, Inline styles with responsive logic via custom `useScreenSize` hook |
| Fonts | Playfair Display, DM Sans, JetBrains Mono (Google Fonts) |
| Deployment | Vercel (frontend) + Koyeb (backend) |
| Domain | `spades.anudeep.space` |

---

## Project Structure

```
spades_game/
├── packages/
│   └── shared/                  # Shared game engine & types
│       └── src/
│           ├── types.ts            # TypeScript interfaces (Player, Card, GameState, etc.)
│           ├── engine.ts           # Pure game logic (dealing, bidding, trick resolution, scoring)
│           └── index.ts            # Package entry point
├── apps/
│   ├── server/                  # Backend server
│   │   └── src/
│   │       ├── index.ts            # Express + Socket.io server, room management
│   │       └── computer.ts         # CPU player AI logic
│   └── web/                     # Frontend React app
│       └── src/
│           ├── App.tsx             # Root component, game phase routing
│           ├── components/
│           │   ├── Lobby.tsx          # Room creation & joining
│           │   ├── WaitingRoom.tsx     # Pre-game lobby with player list
│           │   ├── GameTable.tsx       # Main game board (table, cards, opponents, overlays)
│           │   ├── BiddingPanel.tsx    # Bid selection UI
│           │   ├── ScoreBoard.tsx      # Round results & score history table
│           │   └── CardComponent.tsx   # Card rendering (face & back)
│           ├── hooks/
│           │   ├── useGame.ts         # Game state management & socket communication
│           │   └── useScreenSize.ts   # Responsive breakpoint detection
│           └── lib/
│               └── socket.ts         # Socket.io client singleton
├── package.json                 # Root workspace config
└── README.md
```

---

## Running Locally

### Prerequisites

- Node.js v18+
- npm v8+ (with workspaces support)

### Setup

```bash
# Clone the repo
git clone https://github.com/anudeepreddyv/Spades.git
cd Spades

# Install all dependencies
npm install

# Build the shared package first (required before running anything)
npm run build --workspace=packages/shared
```

You need two terminals — one for the backend server and one for the frontend dev server.

### Terminal 1 - Start the backend

```bash
npm run dev --workspace=apps/server
# Server runs on http://localhost:3001
```

### Terminal 2 - Start the frontend

```bash
# Create the env file for local dev
echo "VITE_SERVER_URL=http://localhost:3001" > apps/web/.env

npm run dev --workspace=apps/web
# Frontend runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** Every time you modify `packages/shared`, re-run `npm run build --workspace=packages/shared` before restarting the server.

---

## How to Play

1. Open the game in your browser
2. **Enter your name** on the lobby screen, choose number of players and team format
3. Choose one of:
   - **Create a Room** — generates a 5-letter room code
   - **Play vs CPU** — click the "🤖 CPU" tab for an instant solo game against the computer
   - **Join Room** — enter a friend's room code to join their game
4. **Bidding phase** — when it's your turn, tap a number to bid how many tricks you'll win
5. **Playing phase** — tap a card once to select it, tap again to play it
   - You must follow the led suit if you can
   - If you can't follow suit, play any card including a spade; spades are always trump
   - Spades can't be led until broken (unless you only have spades)
   - The highest spade wins if any spade was played; otherwise highest of the led suit wins
6. **Scoring** — after each round, when all tricks are played, scores are calculated and the next round begins
7. **After 13 rounds** — the player or team with the most points wins

---

## Live Deployment

The game is hosted and playable at:

🌐 **[spades.anudeep.space](https://spades.anudeep.space)**

The domain `anudeep.space` is a custom domain.


### Frontend — Vercel

The `apps/web` directory is deployed to Vercel with:
- **Root Directory:** `apps/web`
- **Build Command:** `vite build` (Vite default)
- **Environment Variable:** `VITE_SERVER_URL=https://api.anudeep.space`

Vercel auto-deploys on every push to `main`.

### Backend — Koyeb

The server is deployed on Koyeb's free tier (always-on WebSocket support) with:
- **Build Command:** `npm install && npm run build --workspace=packages/shared && npm run build --workspace=apps/server`
- **Run Command:** `node apps/server/dist/index.js`
- **Port:** `3001`
- **Environment Variable:** `PORT=3001`

---

## Known Limitations

- **In-memory state** — all game rooms live in server memory. If the server restarts, active games are lost.
- **Free tier cold starts** — Koyeb's free instance scales to zero after inactivity. The first connection after a quiet period may take a few seconds to wake up.
- **No authentication** — room codes are the only access control. Anyone with the code can join.

---
