# 🚀 Vercel + Aiven Deployment Guide

## 📋 Overview

This guide will help you deploy U.DEFUSE to Vercel with Aiven MySQL database.

---

## 🗄️ Step 1: Set Up Aiven MySQL Database

### 1.1 Create Aiven Account
1. Go to https://aiven.io
2. Sign up for free account
3. You get **$300 free credits** for 30 days

### 1.2 Create MySQL Service
1. Click **"Create Service"**
2. Select **MySQL**
3. Choose **Cloud Provider**: AWS, Google Cloud, or Azure
4. Choose **Region**: Select closest to your users
5. Select **Service Plan**: 
   - **Hobbyist** (Free tier) - Good for testing
   - **Startup** - For production
6. Give it a name (e.g., `u-defuse-mysql`)
7. Click **"Create Service"**

### 1.3 Wait for Service to Start
- Takes 5-10 minutes
- Status will change from "Rebuilding" to "Running"

### 1.4 Get Connection Details
Once running, go to **"Overview"** tab:

```
Host: mysql-xxxxx-yourname.aivencloud.com
Port: 12345
User: avnadmin
Password: (click "Show" to reveal)
Database: defaultdb
```

**Save these details!** You'll need them for Vercel.

### 1.5 Create Your Database Tables

1. Go to **"Query Editor"** tab in Aiven
2. Run your schema from `server/database/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Step 2: Prepare Your Code for Vercel

### 2.1 Update Database Connection

Open `server/db.js` and make sure it uses environment variables:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true // Aiven requires SSL
  }
});

export default pool;
```

### 2.2 Install Vercel CLI (Optional but Recommended)

```powershell
npm install -g vercel
```

---

## 🚀 Step 3: Deploy to Vercel

### 3.1 Push Code to GitHub

```powershell
# Initialize git if you haven't
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Create repo on GitHub and push
git remote add origin https://github.com/yourusername/u-defuse.git
git push -u origin main
```

### 3.2 Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install && npm run install-all`

### 3.3 Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

```
DB_HOST=mysql-xxxxx-yourname.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password-here
DB_NAME=defaultdb
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NODE_ENV=production
```

**Important:** Don't use quotes around the values!

### 3.4 Deploy

Click **"Deploy"**

Vercel will:
1. Install dependencies
2. Build your frontend
3. Deploy both frontend and backend
4. Give you a URL: `https://your-project.vercel.app`

---

## 📱 Step 4: Test Your Deployment

### 4.1 Open Your App

Visit: `https://your-project.vercel.app`

### 4.2 Test Features

- ✅ Register new account
- ✅ Login
- ✅ Create game room
- ✅ Socket.IO connection
- ✅ Mobile access (HTTPS enabled!)
- ✅ QR code scanner works

---

## 🔍 Troubleshooting

### Database Connection Failed

**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solutions:**
1. Check environment variables in Vercel are correct
2. Verify Aiven service is "Running"
3. Check Aiven firewall settings (should allow all IPs by default)
4. Ensure SSL is enabled in `db.js`

### Socket.IO Not Connecting

**Error:** `WebSocket connection failed`

**Solutions:**
1. Vercel **does NOT support** WebSocket for serverless functions
2. You need to use **polling transport only**

Update `server/server.js`:
```javascript
const io = new Server(httpServer, {
  cors: { /* ... */ },
  transports: ['polling'], // Only use polling on Vercel
  allowEIO3: true
});
```

Update `client/src/utils/socket.ts`:
```typescript
this.socket = io(socketUrl, {
  withCredentials: true,
  transports: ['polling'], // Only use polling
  timeout: 20000,
  forceNew: true
});
```

### CORS Errors

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS`

**Solution:**
- Check CORS patterns in `server.js` include Vercel domains
- Verify `credentials: true` is set
- Check environment variables are loaded

### Build Failed

**Error:** `Command failed with exit code 1`

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure `package.json` scripts are correct
3. Try building locally: `npm run build`
4. Check for TypeScript errors

---

## 🎯 Alternative: Socket.IO on Separate Service

Since Vercel doesn't fully support WebSocket, consider:

### Option A: Deploy Socket.IO to Railway.app

1. Create Railway account (free tier)
2. Deploy only your server to Railway
3. Update frontend to point Socket.IO to Railway URL
4. Keep frontend/API on Vercel

### Option B: Use Vercel for Frontend, Railway for Everything Else

1. Deploy entire backend + Socket.IO to Railway
2. Deploy only frontend to Vercel
3. Update frontend `.env` to point to Railway

---

## 📝 Deployment Checklist

**Before deploying:**
- [ ] Aiven MySQL service is running
- [ ] Database tables created
- [ ] `.env.example` filled with Aiven credentials locally
- [ ] Code pushed to GitHub
- [ ] No secrets in code (use environment variables)

**In Vercel:**
- [ ] Project imported from GitHub
- [ ] Environment variables added
- [ ] Build settings configured
- [ ] First deployment successful

**Testing:**
- [ ] App loads at Vercel URL
- [ ] Can register new user
- [ ] Can login
- [ ] Socket.IO connects (check browser console)
- [ ] Can create/join game rooms
- [ ] Mobile access works with HTTPS

---

## 🎉 Success!

Your app is now live at: `https://your-project.vercel.app`

**Share with friends:** They can access on any device with HTTPS support (including camera for QR scanning)!

---

## 💡 Pro Tips

1. **Custom Domain:** Add your own domain in Vercel settings
2. **Automatic Deployments:** Every git push to `main` auto-deploys
3. **Preview Deployments:** Pull requests get unique preview URLs
4. **Analytics:** Enable Vercel Analytics for user insights
5. **Environment Variables:** Use different values for production vs preview

---

## 📞 Need Help?

**Vercel Issues:**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

**Aiven Issues:**
- Aiven Docs: https://docs.aiven.io
- Aiven Support: https://aiven.io/support

**App Issues:**
- Check Vercel deployment logs
- Check Aiven service logs
- Check browser console for errors
