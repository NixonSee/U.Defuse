import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check for multiple tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "userData" && e.oldValue !== e.newValue) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme-preference") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (selectedTheme: "dark" | "light") => {
    if (selectedTheme === "light") {
      document.body.classList.add("light-mode");
      document.documentElement.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
      document.documentElement.classList.remove("light-mode");
    }
  };

  const handleThemeChange = (selectedTheme: "dark" | "light") => {
    setTheme(selectedTheme);
    // Use a unique key that won't conflict with user data
    localStorage.setItem("app-theme-preference", selectedTheme);
    applyTheme(selectedTheme);
  };

  return (
    <div className="min-h-screen bg-[#060606] text-yellow-400 font-sans relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6 border-b border-yellow-400/20">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-wider sm:tracking-[0.15em]">SETTINGS</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Customize your experience</p>
        </div>
        <button
          onClick={() => navigate("/lobby")}
          className="bg-yellow-400/90 hover:bg-yellow-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all font-bold text-sm sm:text-base"
        >
          Back to Lobby
        </button>
      </div>

      {/* Settings Content */}
      <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Multi-tab Warning */}
        {showWarning && (
          <div className="bg-red-600/20 border-2 border-red-600/40 rounded-xl p-4 backdrop-blur-md">
            <p className="text-red-400 font-semibold">⚠️ Multiple tabs detected!</p>
            <p className="text-red-300 text-sm mt-1">
              Using different accounts in multiple tabs may cause conflicts. Please use separate browser profiles or windows.
            </p>
          </div>
        )}
        
        {/* Appearance Settings */}
        <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 flex items-center gap-2">
            🎨 Appearance
          </h2>

          {/* Theme Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Theme
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  theme === "dark"
                    ? "bg-yellow-400 text-black border-2 border-yellow-400"
                    : "bg-yellow-400/10 text-yellow-300 border-2 border-yellow-400/20 hover:border-yellow-400/40"
                }`}
              >
                🌙 Dark Mode
              </button>
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  theme === "light"
                    ? "bg-yellow-400 text-black border-2 border-yellow-400"
                    : "bg-yellow-400/10 text-yellow-300 border-2 border-yellow-400/20 hover:border-yellow-400/40"
                }`}
              >
                ☀️ Light Mode
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Choose your preferred theme for the game interface
            </p>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 flex items-center gap-2">
            🔊 Sound
          </h2>

          <div className="space-y-4">
            {/* Master Volume */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Master Volume
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                className="w-full h-2 bg-yellow-400/20 rounded-lg appearance-none cursor-pointer slider"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>

            {/* Sound Effects */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Sound Effects
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-full h-2 bg-yellow-400/20 rounded-lg appearance-none cursor-pointer slider"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>

            {/* Music */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Background Music
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="50"
                className="w-full h-2 bg-yellow-400/20 rounded-lg appearance-none cursor-pointer slider"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 flex items-center gap-2">
            🎮 Game
          </h2>

          <div className="space-y-4">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                className="w-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 rounded-lg px-4 py-2 cursor-not-allowed"
                disabled
              >
                <option>Easy</option>
                <option selected>Normal</option>
                <option>Hard</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </div>

            {/* Auto-save */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-300">
                  Auto-save Progress
                </label>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input type="checkbox" className="sr-only peer" disabled defaultChecked />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-yellow-400/50 opacity-50"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </label>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-300">
                  Push Notifications
                </label>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input type="checkbox" className="sr-only peer" disabled defaultChecked />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-yellow-400/50 opacity-50"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,0,0.1)]">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 flex items-center gap-2">
            👤 Account
          </h2>

          <div className="space-y-3">
            <button
              className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 text-yellow-300 py-3 px-4 rounded-lg transition-all text-left cursor-not-allowed opacity-50"
              disabled
            >
              Change Password
            </button>
            <button
              className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 text-yellow-300 py-3 px-4 rounded-lg transition-all text-left cursor-not-allowed opacity-50"
              disabled
            >
              Edit Profile
            </button>
            <button
              className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 py-3 px-4 rounded-lg transition-all text-left cursor-not-allowed opacity-50"
              disabled
            >
              Delete Account
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Coming soon</p>
        </div>

      </div>
    </div>
  );
};

export default Settings;
