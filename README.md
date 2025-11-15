# 🎮 U.DEFUSE

A real-time multiplayer bomb defusal card game with quiz challenges. Test your knowledge under pressure as you race to defuse bombs before time runs out!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/u-defuse)

## 🌟 Features

- 🎯 **Real-time Multiplayer**: 2-4 players per game room
- 💣 **Bomb Defusal Mechanics**: Answer quiz questions to defuse bombs
- 🃏 **Card-Based Gameplay**: 60-card deck with strategic elements
- 👤 **6 Unique Roles**: Hacker, Spy, Saboteur, Trickster, Gambler, Timekeeper
- 📱 **Mobile-Friendly**: QR code scanning for easy room joining
- 🔐 **Secure Authentication**: JWT-based user sessions
- ⚡ **Real-time Updates**: Socket.IO for instant game state synchronization
- 🏆 **Score Tracking**: Complete game history and statistics

## 🚀 Live Demo

**Deployed on Vercel:** [https://your-app.vercel.app](https://your-app.vercel.app)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Socket.IO Client** - Real-time communication
- **React Router** - Navigation
- **Axios** - API requests

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server
- **MySQL** - Database (Aiven)
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Deployment
- **Vercel** - Hosting & serverless functions
- **Aiven** - Managed MySQL database

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MySQL database (local or Aiven)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/u-defuse.git
cd u-defuse
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Set up database**

Create a MySQL database and run:
```bash
# Run schema
mysql -u root -p your_database < server/database/schema.sql

# Seed quiz questions
mysql -u root -p your_database < server/database/quiz_seed.sql
```

4. **Configure environment variables**

Create `server/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u_defuse
JWT_SECRET=your-secret-key-minimum-32-characters
NODE_ENV=development
```

5. **Run development servers**
```bash
npm run dev
```

This starts:
- Client: http://localhost:5173
- Server: http://localhost:5000

## 🌐 Deployment to Vercel

### Quick Deploy

1. **Fork this repository**

2. **Set up Aiven MySQL**
   - Sign up at [aiven.io](https://aiven.io) ($300 free credits)
   - Create a MySQL service
   - Note connection details

3. **Deploy to Vercel**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

4. **Add Environment Variables** in Vercel:
   ```
   DB_HOST=your-mysql.aivencloud.com
   DB_PORT=12345
   DB_USER=avnadmin
   DB_PASSWORD=your-password
   DB_NAME=defaultdb
   DB_SSL=true
   JWT_SECRET=random-32-character-string
   NODE_ENV=production
   ```

5. **Deploy!**

📖 **Detailed Guide**: See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

## 🎮 How to Play

### Game Setup
1. **Register/Login** to your account
2. **Create a Room** or **Join** via QR code/room code
3. Wait for 2-4 players
4. Host starts the game

### Gameplay
- Each player receives cards and a role
- Take turns drawing cards
- **Draw a Bomb?** Answer a quiz question to defuse!
  - Correct answer: +10 points (or more with bonuses)
  - Wrong answer: Eliminated!
- Use action cards strategically
- Last player standing wins!

### Roles
- 🔓 **Hacker**: Skip one quiz (one-time ability)
- 🕵️ **Spy**: See future cards
- 💣 **Saboteur**: Extra points when others fail
- 🎭 **Trickster**: Randomize card effects
- 🎲 **Gambler**: Double or nothing on quizzes
- ⏱️ **Timekeeper**: Extra time for quizzes

## 📁 Project Structure

```
u-defuse/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # API & Socket utilities
│   │   └── styles/        # Global styles
│   └── dist/              # Build output
├── server/                 # Backend Express server
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Auth middleware
│   ├── database/          # SQL schemas
│   └── server.js          # Main server file
├── api/                    # Vercel serverless entry
├── vercel.json            # Vercel configuration
└── package.json           # Root dependencies
```

## 🔒 Security

- ✅ HTTP-only cookies for JWT
- ✅ bcrypt password hashing
- ✅ SSL database connections
- ✅ CORS protection
- ✅ Environment variable protection
- ✅ SQL injection prevention (parameterized queries)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **NixonSee** - Initial work

## 🙏 Acknowledgments

- Socket.IO for real-time capabilities
- Aiven for database hosting
- Vercel for deployment platform
- Tailwind CSS for styling framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR-USERNAME/u-defuse/issues)
- **Deployment Help**: See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- **Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## 🗺️ Roadmap

- [ ] Score Mode implementation
- [ ] Tournament system
- [ ] Spectator mode
- [ ] Custom quiz categories
- [ ] Player statistics dashboard
- [ ] Mobile app (React Native)
- [ ] Replay system

---

**Built with ❤️ by the U.DEFUSE Team**

⭐ Star this repo if you find it useful!
