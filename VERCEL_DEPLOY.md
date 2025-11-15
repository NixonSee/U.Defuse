# 🚀 U.DEFUSE - Vercel Deployment Guide

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Aiven account for MySQL database (https://aiven.io) - **$300 free credits**

---

## 🗄️ Step 1: Set Up Aiven MySQL Database

### 1.1 Create Aiven Service

1. Sign up at https://aiven.io
2. Click **"Create Service"**
3. Select **MySQL 8**
4. Choose cloud provider and region (closest to your users)
5. Select plan: **Hobbyist** (free tier) or **Startup**
6. Name it (e.g., `u-defuse-db`)
7. Click **"Create Service"**
8. Wait 5-10 minutes for service to start

### 1.2 Get Connection Details

Once running, go to **Overview** tab and note:

```
Service URI: mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED
Host: mysql-xxxxx.aivencloud.com
Port: 12345
User: avnadmin
Password: (click to reveal)
Database: defaultdb
```

### 1.3 Create Database Tables

1. Go to **Query Editor** tab
2. Copy and paste from `server/database/schema.sql`
3. Execute all CREATE TABLE statements
4. Optionally run `server/database/quiz_seed.sql` for quiz questions

---

## 📦 Step 2: Prepare Your Project

### 2.1 Verify Configuration Files

Ensure these files exist (they've been created for you):

- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `.env.vercel.example` - Environment variables template
- ✅ `api/index.js` - Serverless function entry point

### 2.2 Update Package Dependencies

Your project is already configured with:
- Client: Vite build with static export
- Server: Express.js with Socket.IO
- Database: MySQL with SSL support

---

## 🔧 Step 3: Push to GitHub

### 3.1 Initialize Git (if not already done)

```powershell
git init
git add .
git commit -m "Prepare for Vercel deployment"
```

### 3.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `u-defuse`)
3. **Don't** initialize with README

### 3.3 Push Code

```powershell
git remote add origin https://github.com/YOUR-USERNAME/u-defuse.git
git branch -M main
git push -u origin main
```

---

## 🚀 Step 4: Deploy (Render backend + Vercel frontend)

This setup uses:
- Aiven: MySQL database
- Render: Node/Express + Socket.IO backend
- Vercel: Static frontend (React/Vite)

### 4.1 Backend on Render (recommended for Socket.IO)

1. Go to https://render.com
2. New → Web Service → Connect your repo
3. Set Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Instance Type: Starter (or as needed)
7. Environment → Add variables:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - CORS (allow your Vercel app):
     - `CLIENT_ORIGIN=https://your-app.vercel.app`
     - `CLIENT_ORIGIN2=https://your-app-git-<branch>-<account>.vercel.app`
8. Deploy and note the Render URL, e.g. `https://u-defuse-backend.onrender.com`

### 4.2 Frontend on Vercel

1. Go to https://vercel.com/dashboard
2. Add New Project → Import this repo
3. Build settings (auto from `vercel.json`, verify):
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`
4. Environment Variables (Frontend):
   - `VITE_API_URL=https://u-defuse-backend.onrender.com`
   - `VITE_SOCKET_URL=https://u-defuse-backend.onrender.com`
   - (Optional) `VITE_LOCAL_LAN_IP` for QRLogin hints in dev
5. Deploy → Your app: `https://your-app.vercel.app`

Notes:
- The client is already coded to use these envs (`api.ts` and `socket.ts`).
- If you later move backend, just update these two Vercel env vars.

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Build Logs

- Watch the deployment logs in Vercel dashboard
- Ensure no errors during build
- Check for successful database connection

### 5.2 Test Your App

Visit: `https://your-project.vercel.app`

Test these features:
- ✅ **Registration**: Create a new account
- ✅ **Login**: Sign in with credentials
- ✅ **Lobby**: Access game lobby
- ✅ **Socket.IO**: Check browser console for connection
- ✅ **Create Room**: Start a new game
- ✅ **Join Room**: Join with QR code or room code
- ✅ **Mobile Access**: Test on phone (HTTPS enabled!)
- ✅ **QR Scanner**: Camera access should work

### 5.3 Check Browser Console

Open DevTools (F12) and verify:
```
🔌 Creating Socket.IO connection to: https://your-project.vercel.app
✅ Connected to Socket.IO server, Socket ID: abc123xyz
🌐 API Base URL: /api
```

---

## 🔍 Troubleshooting

### Issue: Build Failed

**Error:** `Command failed with exit code 1`

**Solution:**
1. Check Vercel build logs for specific error
2. Verify `package.json` scripts are correct
3. Test build locally: `npm run build`
4. Ensure all dependencies are in `dependencies` (not `devDependencies`)

### Issue: Database Connection Failed

**Error:** `ER_ACCESS_DENIED_ERROR` or `ETIMEDOUT`

**Solution:**
1. Verify environment variables in Vercel are correct (no quotes!)
2. Check Aiven service is "Running"
3. Ensure `DB_SSL=true` is set
4. Test connection from Aiven Query Editor
5. Check Aiven firewall allows all IPs (default)

### Issue: Socket.IO Not Connecting

**Error:** `WebSocket connection failed` or `polling error`

**Solution:**
1. Check browser console for connection URL
2. Verify API routes are accessible: `https://your-app.vercel.app/api/auth/verify`
3. Check Socket.IO path: `https://your-app.vercel.app/socket.io/`
4. Ensure CORS is configured for Vercel domains
5. Try hard refresh (Ctrl+Shift+R)

### Issue: 404 Not Found

**Error:** Routes return 404

**Solution:**
1. Check `vercel.json` routing configuration
2. Ensure client `dist` folder is generated
3. Verify Vercel build completed successfully
4. Check Function logs in Vercel dashboard

### Issue: CORS Errors

**Error:** `Access-Control-Allow-Origin` error

**Solution:**
1. Check `server/server.js` CORS configuration includes Vercel domains
2. Verify `withCredentials: true` in socket client
3. Add your Vercel URL to `CLIENT_ORIGIN` env var if needed
4. Check browser is not blocking cookies

---

## 🎯 Advanced Configuration

### Custom Domain

1. Go to Vercel project settings → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate generation

### Environment Variables Per Branch

- **Production**: Used for `main` branch
- **Preview**: Used for pull requests
- **Development**: Used for local development

### Automatic Deployments

- Every push to `main` → Production deployment
- Every pull request → Preview deployment with unique URL
- Instant rollbacks available in Vercel dashboard

### Performance Monitoring

1. Enable Vercel Analytics in project settings
2. Monitor:
   - Page load times
   - API response times
   - Error rates
   - User geography

---

## 📊 Database Management

### Aiven Console

- **Query Editor**: Run SQL queries
- **Metrics**: Monitor performance
- **Backups**: Automatic backups enabled
- **Logs**: View connection and query logs

### Recommended Practices

1. **Backup**: Enable automatic backups in Aiven
2. **Indexes**: Add indexes to frequently queried columns
3. **Connection Pooling**: Already configured (10 connections)
4. **SSL**: Always enabled for security

---

## 🔒 Security Best Practices

### Environment Variables

- ✅ Never commit `.env` files to Git
- ✅ Use Vercel Environment Variables
- ✅ Rotate JWT_SECRET regularly
- ✅ Use strong database passwords

### HTTPS

- ✅ Vercel provides free SSL
- ✅ All traffic encrypted
- ✅ Mobile camera access works

### Database

- ✅ SSL connections enforced
- ✅ IP whitelist (if needed)
- ✅ Strong passwords required

---

## 📱 Mobile Access

Your app is now accessible on mobile devices:

1. **Share URL**: Send Vercel URL to friends
2. **QR Code**: Generate QR code for easy sharing
3. **Camera Access**: Works on HTTPS (Vercel provides this)
4. **Progressive Web App**: Can be added to home screen

---

## 🎉 Success!

Your U.DEFUSE app is now live at: `https://your-project.vercel.app`

**Next Steps:**
- Share with friends for testing
- Monitor Vercel analytics
- Check Aiven metrics
- Add custom domain (optional)
- Enable preview deployments for testing

---

## 📞 Support

### Vercel
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://vercel-status.com

### Aiven
- Docs: https://docs.aiven.io
- Support: https://aiven.io/support
- Console: https://console.aiven.io

### Common Issues
- Check Vercel Function logs
- Check Aiven service logs
- Check browser console (F12)
- Review deployment logs

---

## 🔄 Updates & Redeployment

To update your app:

```powershell
# Make your changes
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy to production
4. Keep previous version for rollback

**Instant rollback** available in Vercel dashboard if needed!

---

**Happy Deploying! 🚀**
