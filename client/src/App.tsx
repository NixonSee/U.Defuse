import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import QRLogin from "./pages/QRLogin";
import History from "./pages/History";
import Settings from "./pages/Settings";
import StartGame from "./pages/StartGame";
import JoinGame from "./pages/JoinGame";
import GameDashboard from "./pages/GameDashboard";
import BombQuiz from "./pages/BombQuiz";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Register" />} />
      <Route path="/Lobby" element={<Lobby />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/QRLogin" element={<QRLogin />} />
      <Route path="/History" element={<History />} />
      <Route path="/Settings" element={<Settings />} />
      <Route path="/StartGame" element={<StartGame />} />
      <Route path="/JoinGame" element={<JoinGame />} />
      <Route path="/game-dashboard" element={<GameDashboard />} />
      <Route path="/bomb-quiz/:gameSessionId" element={<BombQuiz />} />
    </Routes>
  );
};

export default App;
