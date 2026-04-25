"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RoleToggle } from "@/components/auth/RoleToggle";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Department } from "@/types/auth";
import { authAPI } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const SLIDES = [
  {
    image: "/signup.png",
    title: "Track & Achieve",
    desc: "Your one-stop platform for discovering events, tracking credits, and competing with peers."
  },
  {
    image: "/signup.png",
    title: "Grow Your Network",
    desc: "Connect with industry professionals and ambitious peers to build your future."
  },
  {
    image: "/signup.png",
    title: "Unlock Opportunities",
    desc: "Gain exclusive access to workshops, hackathons, and tech talks."
  },
  {
    image: "/signup.png",
    title: "Unlock Opportunities",
    desc: "Gain exclusive access to workshops, hackathons, and tech talks."
  }
];

export default function Signup() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [role, setRole] = useState("student");

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [year, setYear] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [passoutYear, setPassoutYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  const { clearAuth } = useAuthStore();
  const { success, error: toastError } = useToast();

  // Redirect already-authenticated users away from the signup page
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (token && storedRole === 'admin') {
      router.replace('/admin/dashboard');
    } else if (token && storedRole === 'student') {
      router.replace('/student/events');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const isFormFilled =
    firstName.trim() !== "" &&
    surname.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    (role === "admin" || (department.trim() !== "" && passoutYear.trim() !== "")) &&
    (role !== "student" || (year.trim() !== "" && rollNumber.trim() !== ""));


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      let payload;
      if (role === "student") {
        payload = {
          name: `${firstName} ${surname}`,
          email: email,
          password: password,
          department: department as Department,
          year: Number(year),
          passoutYear: Number(passoutYear),
          roll: Number(rollNumber),
          hours: 0,
        };
      } else {
        payload = {
          name: `${firstName} ${surname}`,
          email: email,
          password: password,
        };
      }

      const res =
        role === "admin"
          ? await authAPI.adminRegister(payload)
          : await authAPI.userRegister(payload);

      const data = res.data;

      if (data.success) {
        // Ensure no accidental session is kept from before
        clearAuth();
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        document.cookie =
          "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie =
          "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";

        success('Account Created!', 'Your account was created successfully. Please sign in to continue.');
        // Strictly force manual login after signup
        router.push("/auth/login");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err: any) {
      console.log(err.response?.data);
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-10 px-4 sm:p-8 bg-[var(--color-background)] overflow-hidden transition-colors duration-200">
      {/* Decorative Background Matches Home Page Vibe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 dark:opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(43, 166, 223, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(43, 166, 223, 0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <motion.div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#2BA6DF]/15 dark:bg-[#2BA6DF]/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-[-10%] w-[400px] h-[400px] bg-[#FDB811]/10 dark:bg-[#FDB811]/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], y: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col sm:flex-row w-full max-w-[1100px] min-h-[600px] rounded-[2.5rem] bg-[var(--color-card)] shadow-[0_2px_8px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.05)] overflow-hidden border border-[var(--color-border)] my-4"
      >
        <div className="w-full sm:w-[50%] p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[var(--color-surface)] border-r border-[var(--color-border)] relative z-20 transition-colors duration-200">
          <div className="w-full max-w-[420px] mx-auto">
            <div className="mb-4 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight lead">
                Join the PICT ACM <br className="hidden sm:block" />Community
              </h2>
              <p className="text-[var(--color-text-primary)] mt-2 text-sm font-medium">
                Get access to events, hackathons, and a network of passionate students.
              </p>
            </div>

            <RoleToggle onRoleChange={handleRoleChange} />

            <form onSubmit={handleSignup} className="mt-3">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-1/2 space-y-1">
                      <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal shadow-sm"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-full sm:w-1/2 space-y-1">
                      <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Surname</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal shadow-sm"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal shadow-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative space-y-1 w-full sm:w-1/2">
                      <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal pr-12 shadow-sm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="relative space-y-1 w-full sm:w-1/2">
                      <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal pr-12 shadow-sm"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {role === "student" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col sm:flex-row gap-3 pt-1"
                    >
                      <div className="w-full sm:w-1/2 space-y-1">
                        <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Year</label>
                        <select
                          className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] appearance-none shadow-sm"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          required
                        >
                          <option value="" disabled hidden>Select Year</option>
                          <option value="1">First Year (FE)</option>
                          <option value="2">Second Year (SE)</option>
                          <option value="3">Third Year (TE)</option>
                          <option value="4">Final Year (BE)</option>
                        </select>
                      </div>
                      <div className="w-full sm:w-1/2 space-y-1">
                        <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Roll Number</label>
                        <input
                          type="text"
                          placeholder="Roll Number"
                          className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal shadow-sm"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {role === "student" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col sm:flex-row gap-3 pb-1"
                    >
                      <div className="w-full sm:w-1/2 space-y-1">
                        <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Department</label>
                        <select
                          className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] appearance-none shadow-sm"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required
                        >
                          <option value="" disabled hidden>Department</option>
                          <option value="CE">CE</option>
                          <option value="IT">IT</option>
                          <option value="ENTC">ENTC</option>
                          <option value="ECE">ECE</option>
                          <option value="AIDS">AIDS</option>
                        </select>
                      </div>
                      <div className="w-full sm:w-1/2 space-y-1">
                        <label className="text-[11px] font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">Passout Year</label>
                        <input
                          type="text"
                          placeholder="Passout Year"
                          className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal shadow-sm"
                          value={passoutYear}
                          onChange={(e) => setPassoutYear(e.target.value)}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-[11px] bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2 font-medium">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={!isFormFilled || loading}
                    className="w-full py-3.5 mt-4 bg-[var(--color-button-primary)] hover:bg-[var(--color-button-primary-hover)] disabled:bg-[var(--color-surface-hover)] disabled:text-[var(--color-text-primary)] text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 border border-transparent disabled:border-[var(--color-border-light)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-[var(--color-text-primary)] text-sm font-medium">
                      Already have an account?{" "}
                      <Link href="/auth/login" className="text-[var(--color-primary)] font-bold hover:underline transition-colors">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Illustration Section - Slider */}
        <div className="w-full sm:w-[50%] bg-gradient-to-br from-[#134467] to-[#0A2540] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden hidden sm:flex">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-bl from-[#2BA6DF]/20 to-[#134467]/15 rounded-full blur-3xl" />

          <div className="relative z-10 w-full h-full max-w-[360px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center mb-4">
                  <Image
                    src={SLIDES[currentSlide].image}
                    alt={SLIDES[currentSlide].title}
                    width={350}
                    height={350}
                    className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:drop-shadow-2xl"
                    priority
                  />
                </div>
                <div className="text-center h-20">
                  <h3 className="text-white font-extrabold text-xl mb-1">
                    {SLIDES[currentSlide].title}
                  </h3>
                  <p className="text-blue-100/70 text-[13px] max-w-xs mx-auto leading-relaxed font-medium">
                    {SLIDES[currentSlide].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots */}
            <div className="flex gap-2.5 mt-6 z-10 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide
                    ? "w-6 bg-[#2BA6DF] shadow-[0_0_10px_#2BA6DF]"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

