import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Lobby from "./pages/Lobby";
import QRLogin from "./pages/QRLogin";
import History from "./pages/History";
import Settings from "./pages/Settings";
import StartGame from "./pages/StartGame";
import JoinGame from "./pages/JoinGame";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Register" />} />
      <Route path="/Lobby" element={<Lobby />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/QRLogin" element={<QRLogin />} />
      <Route path="/History" element={<History />} />
      <Route path="/Settings" element={<Settings />} />
      <Route path="/StartGame" element={<StartGame />} />
      <Route path="/JoinGame" element={<JoinGame />} />
    </Routes>
  );
};

export default App;
