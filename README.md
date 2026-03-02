# ♠ Spades — Full-Stack Multiplayer Card Game

A real-time multiplayer Spades game built with a modern TypeScript monorepo.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Real-time | Socket.io |
| Backend | Node.js + Express + Socket.io |
| Shared Logic | Pure TypeScript game engine |
| Monorepo | npm workspaces |

## Project Structure

```
spades/
├── packages/
│   └── shared/          # Shared types + pure game engine
│       └── src/
│           ├── types.ts     # All TypeScript types
│           ├── engine.ts    # Game logic (pure functions)
│           └── index.ts
├── apps/
│   ├── server/          # Node.js + Socket.io backend
│   │   └── src/index.ts
│   └── web/             # React frontend
│       └── src/
│           ├── components/  # UI components
│           ├── hooks/       # useGame hook
│           ├── lib/         # socket.ts singleton
│           └── App.tsx
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+

### Install dependencies
```bash
npm install
```

### Run in development
```bash
# Terminal 1 — start server
cd apps/server
npm install
npx ts-node-dev --respawn -r tsconfig-paths/register src/index.ts

# Terminal 2 — start frontend
cd apps/web
npm install
npm run dev
```

Then open http://localhost:3000

### Quick setup (one-time)
```bash
# In apps/server
npm install

# In apps/web  
npm install

# Copy env files
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

## How to Play

1. Open http://localhost:3000
2. Enter your name and click **Create Room** (or join with a room code)
3. Share the **5-letter room code** with friends
4. The host clicks **Start Game** when everyone has joined
5. Bid, then play tricks!

## Game Rules

- **Spades are always trump**
- Bid the number of tricks you expect to win
- Making your bid earns `bid × 10` points; missing loses the same
- Overtricks ("bags") earn 1 point each but every 10 bags = -100 penalty
- **Nil bid**: Bet on winning zero tricks for ±100 points
- **Blind Nil**: Bid before seeing your cards for ±200 points
- First team to reach the target score wins

## Deployment

### Server (Railway / Render / Fly.io)
```bash
cd apps/server
npm run build
# Set PORT env var, then:
npm start
```

### Frontend (Vercel / Netlify)
```bash
cd apps/web
# Set VITE_SERVER_URL=https://your-server.railway.app
npm run build
# Deploy the dist/ folder
```
