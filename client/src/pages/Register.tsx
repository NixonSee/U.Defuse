import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Basic password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData.username, formData.email, formData.password);
      
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060606] overflow-hidden relative font-sans">
      {/* === Background Effects === */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,0,0.05)_0%,transparent_30%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>

      {/* Glowing border frame (same as login, synced animation) */}
      <div className="absolute -inset-2 rounded-2xl blur-xl bg-yellow-500/10 animate-borderPulse"></div>

      {/* === Register container === */}
      <div className="relative z-10 bg-[#0d0d0f]/80 border border-yellow-400/30 rounded-2xl p-10 w-[90%] max-w-md backdrop-blur-md animate-borderPulse shadow-[0_0_15px_rgba(255,255,0,0.1)]">
        <h1 className="text-center text-4xl font-bold text-yellow-300 mb-6 tracking-[0.15em]">
          U.DEFUSE
        </h1>
        <p className="text-center text-gray-400 text-sm mb-10 tracking-widest uppercase">
          Player Registration Terminal
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-gray-300 text-sm mb-2 uppercase tracking-widest">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Player123"
              className="w-full bg-[#141418] text-yellow-100 placeholder-gray-500 rounded-lg px-4 py-3 border border-yellow-500/20 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-300 text-sm mb-2 uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@gmail.com"
              className="w-full bg-[#141418] text-yellow-100 placeholder-gray-500 rounded-lg px-4 py-3 border border-yellow-500/20 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-300 text-sm mb-2 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="•••••••••••"
                className="w-full bg-[#141418] text-yellow-100 placeholder-gray-500 rounded-lg px-4 py-3 pr-12 border border-yellow-500/20 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400/60 hover:text-yellow-400 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-300 text-sm mb-2 uppercase tracking-widest">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="•••••••••••"
                className="w-full bg-[#141418] text-yellow-100 placeholder-gray-500 rounded-lg px-4 py-3 pr-12 border border-yellow-500/20 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400/60 hover:text-yellow-400 transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-600/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400/90 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,0,0.5)]"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Back to Login */}
        <p className="text-center text-gray-400 mt-8 tracking-widest text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-yellow-400 hover:text-yellow-300 font-semibold transition-all"
          >
            Login
          </Link>
        </p>

        {/* Flicker overlay (same as login) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 animate-pulse">
          <div className="w-full h-full bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,0,0.05)_50%,transparent_52%)] bg-[length:4px_4px]"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
