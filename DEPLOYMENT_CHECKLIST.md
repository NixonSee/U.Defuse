# ✅ Vercel Deployment Checklist

## Before Deploying

### 1. Database Setup (Aiven)
- [ ] Created Aiven MySQL service
- [ ] Service is running (status: Running)
- [ ] Noted connection details (host, port, user, password)
- [ ] Created database tables from `server/database/schema.sql`
- [ ] Seeded quiz questions from `server/database/quiz_seed.sql`
- [ ] Tested connection from Aiven Query Editor

### 2. Code Preparation
- [ ] All changes committed to Git
- [ ] `.env` file is NOT committed (in .gitignore)
- [ ] Tested build locally: `cd client && npm run build`
- [ ] No console errors in production build
- [ ] All dependencies listed in package.json

### 3. GitHub Repository
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Repository is public or accessible to Vercel
- [ ] Main branch is named `main` or `master`

## Vercel Configuration

### 4. Project Import
- [ ] Imported repository in Vercel
- [ ] Framework preset: Other
- [ ] Build command: `npm run build`
- [ ] Output directory: `client/dist`
- [ ] Install command: `npm install`

### 5. Environment Variables (Critical!)

Add these in Vercel → Settings → Environment Variables:

```
DB_HOST = mysql-xxxxx.aivencloud.com
DB_PORT = 12345
DB_USER = avnadmin
DB_PASSWORD = your-aiven-password
DB_NAME = defaultdb
DB_SSL = true
JWT_SECRET = generate-a-random-32-character-string-here
NODE_ENV = production
```

- [ ] All variables added
- [ ] No quotes around values
- [ ] JWT_SECRET is 32+ characters
- [ ] Applied to Production, Preview, and Development

### 6. Deployment
- [ ] Clicked "Deploy"
- [ ] Build succeeded (check logs)
- [ ] No errors in Function logs
- [ ] Deployment URL generated

## After Deployment

### 7. Testing
- [ ] App loads at Vercel URL
- [ ] No errors in browser console (F12)
- [ ] Register new user works
- [ ] Login works
- [ ] Lobby loads
- [ ] Socket.IO connects (check console: "Connected to Socket.IO server")
- [ ] Can create game room
- [ ] Can join game room
- [ ] QR code displays
- [ ] Game mechanics work

### 8. Mobile Testing
- [ ] Access from mobile browser
- [ ] HTTPS is enabled
- [ ] Camera permission works
- [ ] QR scanner works
- [ ] Touch controls responsive

### 9. Database Verification
- [ ] Check Aiven dashboard for connections
- [ ] Verify users table has entries
- [ ] Check game_sessions table
- [ ] Monitor for any errors in Aiven logs

### 10. Performance
- [ ] Page load time acceptable
- [ ] API responses fast
- [ ] Socket.IO latency low
- [ ] No memory leaks visible

## Common Issues & Fixes

### ❌ Build Failed
- Check Vercel build logs
- Test locally: `npm run build`
- Verify all dependencies in package.json

### ❌ Database Connection Failed
- Verify env vars (no quotes!)
- Check Aiven service is running
- Ensure DB_SSL=true
- Test from Aiven Query Editor

### ❌ Socket.IO Not Working
- Check browser console
- Verify CORS configuration
- Test API endpoint: /api/auth/verify
- Check Function logs in Vercel

### ❌ 404 Errors
- Check vercel.json routing
- Verify client/dist exists after build
- Check Function deployment

## Success Criteria

✅ App accessible at Vercel URL
✅ All features working
✅ Mobile access enabled
✅ Database connected
✅ Socket.IO functional
✅ No console errors
✅ Production-ready!

## Next Steps

- [ ] Add custom domain (optional)
- [ ] Enable Vercel Analytics
- [ ] Set up monitoring
- [ ] Share with users
- [ ] Monitor logs for issues

---

**Deployment URL:** https://your-project.vercel.app

**Deployed:** [Date]

**Status:** ✅ Live / ❌ Issues / 🔄 In Progress
