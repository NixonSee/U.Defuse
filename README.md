# 🎮 U.DEFUSE

Real-time multiplayer bomb defusal with card strategy and quiz challenges. Race to defuse, outscore rivals, and be the last player standing.

## 🌟 Features

- 🎯 Real-time multiplayer (2–4 players)
- 💣 Bomb + quiz defusal loop with pressure timers
- 🃏 Card-based strategy and one-time abilities
- 🧩 Roles with unique perks (Hacker, Spy, Saboteur, Trickster, Gambler, Timekeeper)
- 📱 Mobile-friendly with QR code join and responsive UI
- 🔔 Non-blocking toasts for errors, status, and reconnection
- 🔐 Secure auth with HTTP-only cookies
- ⚡ Socket.IO realtime updates, disconnect/reconnect handling
- 🗂️ Game history (rendered in Malaysia time)

## 🚀 Live

- Vercel (frontend): https://u-defuse.vercel.app
- Backend (Render): configured via `VITE_API_URL`/`VITE_SOCKET_URL`

## 🛠️ Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS v4, React Router, Socket.IO Client, Axios
- Backend: Node.js, Express, Socket.IO, MySQL (Aiven), JWT, bcrypt
- Deploy: Vercel (static SPA), Render (Node/Socket.IO), Aiven (MySQL + SSL)

## 🎮 Gameplay

- Setup
   - Register/Login, Create Room or Join via QR/room code
   - 2–4 players; host starts when ready
<p align="center">
   <img src="client/public/vite.svg" alt="U.DEFUSE" width="64" />
</p>

<h1 align="center">U.DEFUSE</h1>
<p align="center">Real‑time multiplayer bomb defusal · Card strategy · Quiz under pressure</p>

<p align="center">
   <a href="https://u-defuse.vercel.app"><b>Live Demo</b></a>
   •
   <a href="#quick-start">Quick Start</a>
   •
   <a href="#how-to-play">How to Play</a>
   •
   <a href="./VERCEL_DEPLOY.md">Deploy</a>
</p>

<p align="center">
   <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
   <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white" />
   <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white" />
   <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white" />
</p>

---

## Table of Contents

- Features
- Quick Start
- How to Play
- Tech Stack
- Project Structure
- Environment & Deployment
- FAQ / Troubleshooting
- Contributing
- License

---

## Features

- 🎯 Real-time multiplayer (2–4 players)
- 💣 Bomb + quiz defusal loop with pressure timers
- 🃏 Card-based strategy and one-time abilities
- 🧩 Roles (Hacker, Spy, Saboteur, Trickster, Gambler, Timekeeper)
- 📱 Mobile-friendly join via QR code; responsive layouts
- 🔔 Toast notifications for errors/status; reconnect awareness
- 🔐 HTTP-only auth cookies; user-friendly error messages
- 🗂️ Game history in Malaysia time (Asia/Kuala_Lumpur)

---

## Quick Start

Local dev requires Node 18+ and a MySQL instance.

```bash
# 1) Install all deps (root + client + server)
npm run install-all

# 2) Create DB schema and seed questions
mysql -u root -p your_db < server/database/schema.sql
mysql -u root -p your_db < server/database/quiz_seed.sql

# 3) Create server/.env
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=your_db
# JWT_SECRET=your-32+char-secret
# NODE_ENV=development

# 4) Start both apps (client:5173, server:5000)
npm run dev
```

Notes
- Client auto-targets `http://localhost:5000` for API/Socket in dev.
- Cookies are `SameSite=Lax` in dev; `SameSite=None; Secure` in production.

---

## How to Play

1) Register/Login → Create Room or Join via QR/room code (2–4 players)
2) Host starts the game once players are ready
3) On your turn, draw cards and resolve effects; Bombs trigger quizzes
4) Defuse by answering correctly (score) — wrong answers eliminate you
5) Use role perks and cards for advantage
6) Win by being last standing or leading score at end

Roles (high level)
- Hacker: one-time auto-defuse, awards 0 points when used (still defuses)
- Timekeeper: extra time on quizzes
- Spy/Saboteur/Trickster/Gambler: impact information, scoring, or randomness

---

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind v4, React Router, Socket.IO Client, Axios
- Backend: Node.js, Express, Socket.IO, MySQL (Aiven), JWT, bcrypt
- Deploy: Vercel (static SPA), Render (Node/Socket.IO), Aiven (MySQL + SSL)

---

## Project Structure

```
U.Defuse/
├─ client/
│  ├─ index.html
│  └─ src/
│     ├─ components/Toast.tsx
│     ├─ pages/
│     ├─ utils/{ api.ts, socket.ts }
│     ├─ App.tsx
│     ├─ index.tsx
│     └─ main.tsx
├─ server/
│  ├─ routes/{ auth.js, game.js }
│  ├─ services/gameService.js
│  ├─ middleware/auth.js
│  ├─ database/{ schema.sql, quiz_seed.sql }
│  ├─ db.js
│  └─ server.js
├─ vercel.json
├─ VERCEL_DEPLOY.md
├─ DEPLOYMENT_SETUP.md
└─ package.json
```

---

## Environment & Deployment

Frontend (Vercel)
- `VITE_API_URL=https://<your-backend>.onrender.com`
- `VITE_SOCKET_URL=https://<your-backend>.onrender.com`

Backend (Render)
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true, DB_CA_CERT (base64)
- JWT_SECRET, `NODE_ENV=production`
- CORS: `CLIENT_ORIGIN` (+ `CLIENT_ORIGIN2` for previews) set to your Vercel domain(s)

See the full guide: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

---

## FAQ / Troubleshooting

- Login 404 on Vercel
   - Set `VITE_API_URL`/`VITE_SOCKET_URL` to your Render URL; redeploy
- CORS error
   - Set `CLIENT_ORIGIN` on Render to your Vercel URL; restart service
- “Authentication error: No cookies”
   - Ensure Render has `NODE_ENV=production` and HTTPS so cookies use `SameSite=None; Secure`
- Mobile 404
   - Confirm the latest `vercel.json` is deployed and the build succeeded

---

## Contributing

1) Fork → branch → PR
2) Keep changes focused; follow existing style
3) Avoid unrelated formatting churn

## License

MIT

## Links

- Issues: https://github.com/NixonSee/U.Defuse/issues
- Deploy guide: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

<p align="center">— Built with ❤️ —</p>
