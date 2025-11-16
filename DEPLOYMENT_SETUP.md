# U.DEFUSE Deployment Setup Guide

**Frontend**: Vercel (static React SPA)  
**Backend**: Render (Node.js + Socket.IO)  
**Database**: Aiven MySQL with SSL

---

## Environment Variables Quick Reference

### Vercel (Frontend)
Add these in Vercel Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### Render (Backend)
Add these in Render Service → Environment:

```bash
# Database (Aiven)
DB_HOST=your-mysql-instance.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password
DB_NAME=defaultdb
DB_SSL=true
DB_CA_CERT=<paste-base64-ca-certificate-here>

# JWT Secret (generate a random 32+ char string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Node Environment
NODE_ENV=production

# CORS - Frontend URLs
CLIENT_ORIGIN=https://your-app.vercel.app
CLIENT_ORIGIN2=https://your-app-git-master-username.vercel.app
```

---

## Step-by-Step Deployment

### 1. Deploy Database (Aiven)

1. Create MySQL service at [aiven.io](https://aiven.io)
2. Download CA certificate (`ca.pem`)
3. Convert to base64:
   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("ca.pem")) | Out-File ca-base64.txt
   ```
4. Initialize schema:
   ```bash
   mysql -h HOST -P PORT -u avnadmin -p --ssl-mode=REQUIRED defaultdb < server/database/schema.sql
   mysql -h HOST -P PORT -u avnadmin -p --ssl-mode=REQUIRED defaultdb < server/database/quiz_seed.sql
   ```

### 2. Deploy Backend (Render)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect GitHub repo
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add all environment variables from the "Render (Backend)" section above
5. Deploy and note the URL: `https://your-backend.onrender.com`

### 3. Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Connect GitHub repo
3. Configure:
   - Framework: **Vite**
   - Root Directory: `./` (keep default)
   - Build Command: Auto-detected
   - Output Directory: Auto-detected
4. Add environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
5. Deploy

### 4. Update Backend CORS

After Vercel deploys, note your production URL: `https://your-app.vercel.app`

1. Go back to Render service → Environment
2. Update:
   - `CLIENT_ORIGIN=https://your-app.vercel.app`
   - `CLIENT_ORIGIN2=https://your-app-git-master-username.vercel.app` (for previews)
3. Restart Render service

---

## Testing Checklist

- [ ] Visit Vercel URL and check browser console (no 404s for `/api` or `/socket.io`)
- [ ] Register a new user
- [ ] Login successfully
- [ ] Create a game room
- [ ] Join game room from another tab/device
- [ ] Start game and play through a bomb defusal
- [ ] Check History shows game data

---

## Troubleshooting

### 404 on API calls
- Check `VITE_API_URL` is set in Vercel
- Verify Render backend is running
- Check browser console for the API URL being used

### CORS errors
- Ensure `CLIENT_ORIGIN` on Render matches your Vercel URL exactly
- Check for trailing slashes (remove them)
- Restart Render service after changing CORS env vars

### Socket.IO connection fails
- Check `VITE_SOCKET_URL` is set in Vercel
- Verify Render allows WebSocket connections (it does by default)
- Check browser DevTools → Network → WS for connection attempts

### Database connection errors
- Verify `DB_CA_CERT` is the full base64 string (no line breaks)
- Check `DB_SSL=true` is set
- Test direct MySQL connection from local machine first

---

## Local Development

Frontend (port 5173):
```powershell
cd client
npm install
npm run dev
```

Backend (port 5000):
```powershell
cd server
npm install
# Create .env with local DB credentials
npm start
```

Frontend will auto-detect localhost and use `http://localhost:5000` for API/Socket.IO.
