# ♠ Spades

A fully playable, real-time multiplayer Spades card game — built from scratch with React, Node.js, and Socket.io. Supports 2–52 players, flexible team modes, and a solo mode against a computer opponent.

**Live at → [spades.anudeep.space](https://spades.anudeep.space)**

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

- **Real-time multiplayer** — Socket.io keeps all clients in sync instantly
- **2–52 players** — dynamic team formation for any player count, including odd numbers
- **Team modes** — 2 teams, 3 teams, or individual (everyone for themselves)
- **CPU opponent** — play solo against a computer that bids and plays strategically
- **Emoji reactions** — send live reactions that appear as animated bubbles over your avatar
- **Round history** — detailed per-round score table showing bids, tricks won, and score deltas
- **Sound effects** — audio feedback when your team misses a bid or loses the game
- **Mobile responsive** — fully playable on phones and tablets
- **Rejoin support** — reconnect to an in-progress game if you lose connection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, Socket.io |
| Shared | TypeScript monorepo package (`@spades/shared`) |
| Styling | Inline styles with responsive logic via custom `useScreenSize` hook |
| Fonts | Playfair Display, DM Sans, JetBrains Mono (Google Fonts) |
| Deployment | Vercel (frontend) + Koyeb (backend) |
| Domain | Cloudflare DNS → `spades.anudeep.space` |

---

## Project Structure

```
spades_game/
├── apps/
│   ├── web/                        # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── GameTable.tsx   # Main game UI — table, hand, overlays
│   │   │   │   ├── BiddingPanel.tsx
│   │   │   │   ├── ScoreBoard.tsx
│   │   │   │   ├── CardComponent.tsx
│   │   │   │   ├── Lobby.tsx
│   │   │   │   └── WaitingRoom.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useGame.ts      # Socket.io event handling + game state
│   │   │   │   └── useScreenSize.ts
│   │   │   ├── lib/
│   │   │   │   └── socket.ts
│   │   │   └── App.tsx
│   │   └── public/
│   │       ├── fonts/
│   │       └── sounds/             # faaa.mp3, lost.mp3
│   └── server/
│       └── src/
│           ├── index.ts            # Express + Socket.io server
│           └── computer.ts         # CPU bid and play logic
└── packages/
    └── shared/
        └── src/
            ├── types.ts            # Shared TypeScript types
            ├── engine.ts           # Game engine — deal, bid, play, score
            └── index.ts
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

### Start the backend

```bash
npm run dev --workspace=apps/server
# Server runs on http://localhost:3001
```

### Start the frontend

In a separate terminal:

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

1. **Create a room** — enter your name, choose number of players and team format, click "Create Room"
2. **Share the room code** — send the 5-character code to your friends
3. **Or play vs CPU** — click the "🤖 CPU" tab for an instant solo game
4. **Bidding phase** — when it's your turn, tap a number to bid how many tricks you'll win
5. **Playing phase** — tap a card once to select it, tap again to play it
   - You must follow the led suit if you can
   - If you can't follow suit, play any card including a spade
   - Spades can't be led until broken (unless you only have spades)
   - The highest spade wins if any spade was played; otherwise highest of the led suit wins
6. **Scoring** — after each round, see who made their bid and track cumulative scores
7. **After 13 rounds** — the player or team with the most points wins

---

## Deployment

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

### Domain — Cloudflare

DNS is managed on Cloudflare for `anudeep.space`:

| Subdomain | Points to | Purpose |
|---|---|---|
| `spades.anudeep.space` | Vercel (CNAME) | Frontend |
| `api.anudeep.space` | Koyeb (CNAME) | Backend / WebSocket |

> Proxy is disabled (grey cloud) on both records so Vercel and Koyeb can manage their own SSL certificates.

---

## Known Limitations

- **In-memory state** — all game rooms live in server memory. If the server restarts, active games are lost.
- **Free tier cold starts** — Koyeb's free instance scales to zero after inactivity. The first connection after a quiet period may take a few seconds to wake up.
- **No authentication** — room codes are the only access control. Anyone with the code can join.

---

## License

MIT
