import React from "react";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";

const QRLogin: React.FC = () => {
  // Prefer explicit LAN IP (for mobile scanning) if provided via env
  const lanIp = import.meta.env.VITE_LOCAL_LAN_IP as string | undefined;
  const isLocalhost = window.location.hostname === 'localhost';
  const computedOrigin = (() => {
    if (lanIp && /^\d+\.\d+\.\d+\.\d+$/.test(lanIp)) {
      return `http://${lanIp}:5173`;
    }
    return window.location.origin;
  })();
  const qrValue = `${computedOrigin}/login`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060606] overflow-hidden relative font-sans">
      {/* Animated circuit grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40"></div>

      {/* Glowing border frame */}
      <div className="absolute -inset-2 rounded-2xl blur-xl bg-yellow-500/10 animate-borderPulse"></div>

      {/* QR Login container */}
      <div className="relative z-10 bg-[#0d0d0f]/80 border border-yellow-400/30 rounded-2xl p-10 w-[90%] max-w-md backdrop-blur-md animate-borderPulse shadow-[0_0_15px_rgba(255,255,0,0.1)] text-center">
        <h1 className="text-center text-4xl font-bold text-yellow-300 mb-6 tracking-[0.15em]">
          U.DEFUSE
        </h1>
        <p className="text-center text-gray-400 text-sm mb-10 tracking-widest uppercase">
          QR Login Terminal
        </p>

        <div className="bg-white p-5 rounded-lg inline-block shadow-[0_0_25px_rgba(255,255,0,0.5)]">
          <QRCode value={qrValue} size={220} level="M" />
        </div>


        {isLocalhost && !lanIp && (
          <div className="mt-4 p-2 bg-orange-600/20 border border-orange-600/50 rounded-lg">
            <p className="text-orange-400 text-xs font-semibold">
              ⚠️ QR currently points to localhost.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Set VITE_LOCAL_LAN_IP in client/.env to force LAN IP for mobile.
            </p>
            <p className="text-yellow-300 text-xs mt-1">
              Example: VITE_LOCAL_LAN_IP=10.141.187.24
            </p>
          </div>
        )}

        {lanIp && isLocalhost && (
          <div className="mt-4 p-2 bg-green-600/20 border border-green-600/50 rounded-lg">
            <p className="text-green-400 text-xs font-semibold">
              ✅ Forced LAN IP mode: {lanIp}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              QR uses http://{lanIp}:5173/login for mobile devices.
            </p>
          </div>
        )}

        <p className="mt-6 text-gray-400 text-sm">
          Scan this QR with your phone to open the login page.
        </p>

        <p className="mt-2 text-xs text-yellow-300 break-all">
          or manually open: <span className="text-yellow-400">{qrValue}</span>
        </p>

        <Link
          to="/login"
          className="inline-block mt-8 text-yellow-400 hover:text-yellow-300 transition-all"
        >
          ← Back to Login
        </Link>

        {/* Futuristic flicker effect */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 animate-pulse">
          <div className="w-full h-full bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,0,0.05)_50%,transparent_52%)] bg-size-[4px_4px]"></div>
        </div>
      </div>
    </div>
  );
};

export default QRLogin;
