import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";

const JoinGame: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (!userData) {
      navigate("/Login");
      return;
    }

    setCurrentUser(JSON.parse(userData));
  }, [navigate]);

  const handleQRCodeScanned = (result: any) => {
    if (!result || !result[0]?.rawValue) return;

    let decodedText = result[0].rawValue;
    console.log("✅ QR Code scanned:", decodedText);

    // Extract code if it's a URL (e.g., http://localhost:5173/join/ABC123)
    let extractedCode = decodedText.includes("/join/")
      ? decodedText.split("/join/")[1]
      : decodedText;

    setRoomCode(extractedCode.toUpperCase());
    setIsScanning(false);

    // Automatically go to the StartGame page
    navigate("/StartGame", {
      state: {
        roomCode: extractedCode.toUpperCase(),
        isHost: false,
        joinAsPlayer: true,
      },
    });
  };

  const handleJoinGame = async () => {
    if (!roomCode.trim()) return setError("Please enter a room code");
    if (roomCode.length !== 6)
      return setError("Room code must be 6 characters");
    setError("");

    navigate("/StartGame", {
      state: {
        roomCode: roomCode.toUpperCase(),
        isHost: false,
        joinAsPlayer: true,
      },
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setRoomCode(value);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#060606] text-yellow-400 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6 border-b border-yellow-400/20">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-wider sm:tracking-[0.15em]">
            JOIN GAME
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Enter the 6-character room code
          </p>
        </div>
        <button
          onClick={() => navigate("/Lobby")}
          className="bg-red-600/80 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-sm sm:text-base font-bold"
        >
          Back
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info */}
          {currentUser && (
            <div className="bg-[#0d0d0f]/80 border border-yellow-400/20 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-center text-gray-400">
                Joining as:{" "}
                <span className="text-yellow-300 font-bold">
                  {currentUser.username}
                </span>
              </p>
            </div>
          )}

          {/* QR Scanner */}
          <div className="bg-[#0d0d0f]/80 border-2 border-yellow-400/30 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 text-center">
              Scan QR Code
            </h2>

            {!isScanning ? (
              <div className="text-center">
                <button
                  onClick={() => setIsScanning(true)}
                  className="bg-blue-600/90 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl uppercase tracking-widest transition-all transform hover:scale-[1.02]"
                >
                  📷 Start Camera Scanner
                </button>
              </div>
            ) : (
              <div>
                <div className="rounded-xl overflow-hidden mb-4 border-2 border-yellow-400/40">
                  <Scanner
                    onScan={handleQRCodeScanned}
                    onError={(err) => console.error("Scanner error:", err)}
                    constraints={{ facingMode: "environment" }}
                    styles={{
                      container: { width: "100%" }, // ✅ valid key
                      video: { width: "100%", borderRadius: "8px" },
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full bg-red-600/90 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl uppercase tracking-widest transition-all"
                >
                  Stop Scanner
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-yellow-400/20"></div>
            <span className="text-gray-400 text-sm font-semibold">OR</span>
            <div className="flex-1 h-px bg-yellow-400/20"></div>
          </div>

          {/* Manual Code Entry */}
          <div className="bg-[#0d0d0f]/80 border-2 border-yellow-400/30 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-yellow-300 text-center">
              Enter Room Code
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  6-Character Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={handleCodeChange}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-black/50 border-2 border-yellow-400/40 rounded-xl p-4 text-center text-3xl sm:text-4xl font-mono font-bold text-yellow-400 tracking-[0.3em] placeholder-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all uppercase"
                />
              </div>

              {error && (
                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3 text-center">
                  <p className="text-red-400 text-sm font-semibold">{error}</p>
                </div>
              )}

              <button
                onClick={handleJoinGame}
                disabled={roomCode.length !== 6}
                className="w-full bg-yellow-400/90 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-black disabled:text-gray-400 font-bold py-4 px-6 rounded-xl uppercase tracking-widest transition-all transform hover:scale-[1.02] disabled:hover:scale-100 text-lg"
              >
                Join Game
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#0d0d0f]/60 border border-yellow-400/10 rounded-xl p-4 backdrop-blur-md">
            <h3 className="text-sm font-bold text-yellow-300 mb-2">How to Join:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Scan the QR code from the host's screen using the camera scanner</li>
              <li>• OR ask the host for the 6-character room code</li>
              <li>• Enter the code manually and click "Join Game"</li>
              <li>• You'll be added to the game room</li>
              <li>• Wait for the host to start the game</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
