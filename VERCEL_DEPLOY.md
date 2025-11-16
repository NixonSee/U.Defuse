# U.DEFUSE – Vercel (Frontend) + Render (Backend) Deployment Guide

This project is designed for a split deployment:
- Frontend: Vercel (static SPA built with Vite)
- Backend: Render (Node.js + Express + Socket.IO)
- Database: Aiven MySQL (SSL)

The backend runs on Render to support persistent WebSockets; the Vercel frontend connects to it using environment variables.

---

## 1) Prerequisites
- GitHub repository for this project
- Vercel account (for the frontend)
- Render account (for the backend)
- Aiven account (or any managed MySQL provider)

---

## 2) Database (Aiven MySQL)
1. Create a MySQL service in Aiven (region close to your Render backend).
2. Note connection details (Host, Port, User `avnadmin`, Password, Database `defaultdb`).
3. Download the CA certificate `ca.pem` and convert it to base64 for an environment variable.
   - Windows PowerShell:
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("ca.pem")) | Out-File ca-base64.txt
     ```
   - Mac/Linux:
     ```bash
     base64 -i ca.pem | tr -d '\n' > ca-base64.txt
     ```
4. Initialize the schema and seed (optional):
   ```bash
   mysql -h HOST -P PORT -u avnadmin -p --ssl-mode=REQUIRED defaultdb < server/database/schema.sql
   mysql -h HOST -P PORT -u avnadmin -p --ssl-mode=REQUIRED defaultdb < server/database/quiz_seed.sql
   ```

---

## 3) Backend on Render (Socket.IO compatible)
Create a Web Service from this repo.
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`
  - `DB_CA_CERT=<base64 CA cert>`
  - `JWT_SECRET=<long random string>`
  - `NODE_ENV=production`
  - `CLIENT_ORIGIN=https://your-app.vercel.app`
  - `CLIENT_ORIGIN2=https://your-app-git-<branch>-<account>.vercel.app` (optional for previews)

Notes:
- CORS for REST + Socket.IO is already handled in `server/server.js` using the origin function.
- Auth cookies are set with `SameSite=None; Secure` in production (cross-origin friendly).
- After the first deploy, copy your Render URL (e.g., `https://u-defuse-backend.onrender.com`).

---

## 4) Frontend on Vercel (static SPA)
Import this repo as a Vercel Project.

Environment Variables (Project → Settings → Environment Variables):
- `VITE_API_URL=https://your-backend.onrender.com`
- `VITE_SOCKET_URL=https://your-backend.onrender.com`
Apply to Production, Preview, Development.

Build/Output is controlled by `vercel.json` in the repo root:
```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "cleanUrls": true,
  "trailingSlash": false
}
```
Vercel serves static files from `client/dist` at the deployment root.

---

## 5) Verify & Test
1. Ensure Render backend is running and reachable.
2. Deploy on Vercel. After deployment:
   - Open browser console and confirm logs from the app show the API base as your Render URL.
   - Navigate directly to routes like `/Register` and `/Lobby` (SPA fallback should work).
   - Login and confirm a cookie `auth_token` is present with `SameSite=None; Secure`.
3. Test Socket.IO (open DevTools → Network → WS) and gameplay flows end-to-end.

---

## 6) Troubleshooting
- 404 on login/API:
  - Ensure `VITE_API_URL`/`VITE_SOCKET_URL` are set on Vercel and you redeployed.
  - The app logs the resolved API base URL in the console.
- CORS errors:
  - On Render, set `CLIENT_ORIGIN` (and `CLIENT_ORIGIN2` if needed) to your Vercel domain(s).
  - Restart the Render service after editing env vars.
- Cookies/auth rejected:
  - Ensure Render has `NODE_ENV=production` so cookies use `SameSite=None; Secure`.
  - Make sure you are using HTTPS on both Vercel and Render.
- Socket.IO not connecting:
  - Verify `VITE_SOCKET_URL` is your Render URL.
  - Check DevTools → Network → WS for connection attempts and errors.
- Mobile shows 404 page:
  - Make sure the latest `vercel.json` is deployed and build succeeded. Vercel serves `client/dist` correctly with SPA fallback.

---

## 7) Local Development
Frontend:
```powershell
cd client
npm install
npm run dev
```
Backend:
```powershell
cd server
npm install
npm start
```
The app auto-detects localhost and uses `http://localhost:5000` for API/Socket.IO in dev.

---

## 8) Redeploy
Push to your default branch to trigger deployments:
```powershell
git add .
git commit -m "Deploy updates"
git push origin master
```
- Vercel builds and deploys the frontend.
- Render redeploys the backend (if connected to your GitHub repo), or you can trigger a manual deploy.

---

Happy shipping! 🚀
