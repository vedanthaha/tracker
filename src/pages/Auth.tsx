import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { getStrength, validatePassword, requirements } from "../lib/passwordStrength";

/**
 * Renders the login, signup, and email verification interfaces.
 *
 * Redirects authenticated users to the dashboard and supports Google OAuth, password authentication, OTP verification, and OTP resending.
 *
 * @returns The authentication page interface.
 */
export default function Auth() {
  const location = useLocation();
  const isSignup = location.pathname === "/signup";
  const navigate = useNavigate();
  const { login, signup, signInWithOAuth, verifyOtp, resendOtp, user, loading: authLoading } = useApp();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Three.js background
  useEffect(() => {
    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      geometry = new THREE.BufferGeometry();
      const count = 3000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      material = new THREE.PointsMaterial({ size: 0.02, color: 0x888888, transparent: true, opacity: 0.8 });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      camera.position.z = 5;

      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        points.rotation.x += 0.0005;
        points.rotation.y += 0.001;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    };

    if ((window as any).THREE) {
      initThree((window as any).THREE);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        if ((window as any).THREE) {
          initThree((window as any).THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  useEffect(() => {
    if (!needsVerification) return;
    setCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [needsVerification]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setOtpError("");
    const { error: err } = await resendOtp(email);
    setResending(false);
    if (err) {
      setOtpError(err);
      return;
    }
    setCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 8) {
      setOtpError("Enter 8-digit code");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const { error: err } = await verifyOtp(email, otp);
    setOtpLoading(false);
    if (err) {
      setOtpError(err);
      return;
    }
    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignup) {
      const pwErr = validatePassword(password);
      if (pwErr) {
        setError(pwErr);
        return;
      }
    }

    setLoading(true);

    if (isSignup) {
      const res = await signup(email, password, name);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      if (res.needsVerification) {
        setNeedsVerification(true);
        setLoading(false);
        return;
      }
    } else {
      const res = await login(email, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
    }

    navigate("/dashboard");
  };

  const strength = getStrength(password);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-black relative">
      
      {/* Full-screen WebGL Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, color-mix(in srgb, var(--background) 75%, transparent) 0%, rgba(0,0,0,0) 100%)" }} />
      </div>

      {/* Left Side - Visual/Copy */}
      <div className="hidden lg:flex flex-1 relative z-10 flex-col items-center justify-center px-8 text-center pointer-events-none">
        <div className="max-w-lg">
          <motion.h2 
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl font-display text-white mb-6 leading-tight tracking-tight"
          >
            You're 2 clicks away from your best workflow.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="text-white font-mono-data text-sm tracking-wide"
          >
            Track daily progress effortlessly without the noise.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div 
        className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 min-h-screen relative z-10 flex flex-col justify-center px-8 sm:px-12 py-12 overflow-y-auto"
        style={{ background: "var(--background)", borderLeft: "1px solid #222" }}
      >
        <div className="w-full max-w-sm mx-auto">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: "easeOut" }}
            className="mb-10"
          >
            <Link to="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-black border border-[#222]"
              >
                <img src="/DailysLogo.png" alt="Dailys" className="w-full h-full object-cover scale-[2.4]" />
              </motion.div>
              <span className="font-display text-3xl" style={{ color: "var(--foreground)", paddingTop: "4px" }}>Dailys</span>
            </Link>
          </motion.div>

          {needsVerification ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="w-full text-left"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#111", border: "1px solid #222" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="font-display text-3xl mb-3 text-white">Verify your email</h2>
              <p className="text-sm leading-relaxed mb-1" style={{ color: "#888" }}>
                We sent an 8-digit code to <strong className="text-white">{email}</strong>.
              </p>
              <p className="text-xs mb-8" style={{ color: "#666" }}>
                Enter it below or click the link in the email.
              </p>

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="12345678"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  className="w-full px-4 py-4 rounded-xl text-center text-xl tracking-[0.3em] outline-none transition-all duration-150"
                  style={{ background: "#111", border: "1px solid #333", color: "white", letterSpacing: "0.3em" }}
                  onFocus={(e) => (e.target.style.borderColor = "#666")}
                  onBlur={(e) => (e.target.style.borderColor = "#333")}
                />
                <AnimatePresence>
                  {otpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="text-sm px-4 py-3 rounded-lg"
                      style={{ background: "rgba(255,80,80,0.1)", color: "rgba(255,100,100,0.9)", border: "1px solid rgba(255,80,80,0.2)" }}
                    >
                      {otpError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: otpLoading ? 1 : 1.02 }} whileTap={{ scale: otpLoading ? 1 : 0.98 }}
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-4 rounded-xl font-medium text-base flex items-center justify-center gap-2 mt-2"
                  style={{ background: "white", color: "black", opacity: otpLoading ? 0.7 : 1 }}
                >
                  {otpLoading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  {otpLoading ? "Verifying..." : "Verify code"}
                </motion.button>
              </form>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-sm py-3 rounded-xl transition-all"
                  style={{
                    background: cooldown > 0 ? "transparent" : "#111",
                    color: cooldown > 0 ? "#666" : "white",
                    border: cooldown > 0 ? "1px solid transparent" : "1px solid #333",
                    opacity: cooldown > 0 || resending ? 0.6 : 1,
                    cursor: cooldown > 0 || resending ? "not-allowed" : "pointer",
                  }}
                >
                  {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  onClick={() => setNeedsVerification(false)}
                  className="text-sm hover:opacity-80 transition-opacity mt-2"
                  style={{ color: "#888", textDecoration: "none", background: "none", border: "none", cursor: "pointer" }}
                >
                  Back to sign in
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.32, delay: 0.1 }}
                className="mb-8"
              >
                <h1 className="font-display text-4xl mb-3 text-white">
                  {isSignup ? "Create account" : "Welcome back"}
                </h1>
                <p className="text-base" style={{ color: "#888" }}>
                  {isSignup
                    ? "Start tracking your habits and notes today."
                    : "Sign in to continue to your dashboard."}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.15 }}
              >
                {/* OAuth */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={async () => {
                    setError("");
                    const { error: oauthError } = await signInWithOAuth("google");
                    if (oauthError) setError(oauthError);
                  }}
                  className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-3 transition-all duration-150"
                  style={{ background: "#111", color: "white", border: "1px solid #333" }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 24.5v8.3H34.1c-.4 2.1-2.1 3.9-4.4 4.9l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16 0-1.5-.1-2.9-.4-4.3H24z" />
                    <path fill="#4285F4" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.7 0-12.4-4.5-14.4-10.6L2.2 33.5C4.2 42.1 13.5 48 24 48z" />
                    <path fill="#FBBC05" d="M9.6 28.2A14.9 14.9 0 019 24c0-1.5.2-3 .6-4.2L2.2 14.5A23 23 0 000 24c0 3.7.9 7.2 2.2 10.2l7.4-6z" />
                    <path fill="#34A853" d="M24 14c3.6 0 6.8 1.2 9.3 3.2l6.9-6.9C36.2 6.1 30.6 4 24 4 13.5 4 4.2 9.9 2.2 14.5l7.4 5.7C11.6 14.1 17.3 14 24 14z" />
                  </svg>
                  Continue with Google
                </motion.button>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: "#222" }} />
                  <span className="font-mono-data text-xs" style={{ color: "#666" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "#222" }} />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {isSignup && (
                      <motion.div
                        key="name"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                        <label className="font-mono-data text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#888" }}>
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Smith"
                          required={isSignup}
                          className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-150"
                          style={{ background: "#111", border: "1px solid #222", color: "white" }}
                          onFocus={(e) => (e.target.style.borderColor = "#666")}
                          onBlur={(e) => (e.target.style.borderColor = "#222")}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="font-mono-data text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#888" }}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-150"
                      style={{ background: "#111", border: "1px solid #222", color: "white" }}
                      onFocus={(e) => (e.target.style.borderColor = "#666")}
                      onBlur={(e) => (e.target.style.borderColor = "#222")}
                    />
                  </div>

                  <div>
                    <label className="font-mono-data text-xs tracking-widest uppercase block mb-1.5" style={{ color: "#888" }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                        minLength={8}
                        className="w-full px-4 py-3.5 pr-10 rounded-xl text-sm outline-none transition-all duration-150"
                        style={{ background: "#111", border: "1px solid #222", color: "white" }}
                        onFocus={(e) => (e.target.style.borderColor = "#666")}
                        onBlur={(e) => (e.target.style.borderColor = "#222")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium"
                        style={{ color: "#888", background: "none", border: "none", cursor: "pointer" }}
                      >
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>

                    {isSignup && password.length > 0 && (
                      <div className="mt-3">
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-colors duration-200"
                              style={{ background: i < strength.score ? strength.color : "#222" }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono-data text-xs" style={{ color: strength.color }}>{strength.label}</span>
                          <span className="font-mono-data text-xs" style={{ color: "#666" }}>{password.length}/8 min</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {requirements.map((r) => {
                            const ok = r.test(password);
                            return (
                              <span
                                key={r.label}
                                className="font-mono-data text-[10px] px-2 py-1 rounded-full transition-colors"
                                style={{
                                  background: ok ? "rgba(111,207,138,0.1)" : "#111",
                                  color: ok ? "#6fcf8a" : "#666",
                                  border: `1px solid ${ok ? "rgba(111,207,138,0.2)" : "#222"}`,
                                }}
                              >
                                {ok ? "✓ " : ""}{r.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isSignup && (
                    <div className="flex justify-end -mt-2">
                      <a href="#" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "#888", textDecoration: "none" }}>
                        Forgot password?
                      </a>
                    </div>
                  )}

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="text-sm px-4 py-3 rounded-xl mt-1"
                        style={{ background: "rgba(255,80,80,0.1)", color: "rgba(255,100,100,0.9)", border: "1px solid rgba(255,80,80,0.2)" }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.22 }}
                    whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full py-4 rounded-xl font-medium text-base transition-all duration-150 flex items-center justify-center gap-2"
                    style={{
                      background: loading ? "#222" : "white",
                      color: loading ? "#888" : "black",
                    }}
                  >
                    {loading && (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 24" />
                      </svg>
                    )}
                    {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
                  </motion.button>
                </form>

                <p className="text-sm text-center mt-8" style={{ color: "#888" }}>
                  {isSignup ? "Already have an account?" : "New to Dailys?"}{" "}
                  <Link
                    to={isSignup ? "/login" : "/signup"}
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: "white", textDecoration: "none", fontWeight: 500 }}
                  >
                    {isSignup ? "Sign in" : "Create account"}
                  </Link>
                </p>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
