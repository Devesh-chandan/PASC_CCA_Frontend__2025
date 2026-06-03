"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const { success, error: showToastError } = useToast();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToastError("Error", "Passwords do not match.");
      return;
    }

    if (token.length !== 6) {
      showToastError("Error", "Reset code must be 6 digits.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      success("Success", "Your password has been reset successfully.");
      router.push("/auth/login");
    } catch (err: any) {
      showToastError("Error", err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[var(--color-background)] overflow-hidden transition-colors duration-200">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 dark:opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(43, 166, 223, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(43, 166, 223, 0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[1000px] bg-[var(--color-card)] rounded-[2.5rem] shadow-2xl overflow-hidden border border-[var(--color-border)] flex flex-col md:flex-row"
      >
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 bg-[var(--color-surface)] flex flex-col justify-center">
          <div className="max-w-[400px] mx-auto w-full">
            <Link 
              href="/auth/forgot-password" 
              className="inline-flex items-center text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back
            </Link>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                Reset Password
              </h2>
              <p className="text-[var(--color-text-muted)] mt-2 font-medium">
                Enter the 6-digit code sent to <span className="text-[var(--color-primary)]">{initialEmail || "your email"}</span> and choose a new password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">
                  Reset Code (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-center text-2xl font-bold tracking-[10px] focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all text-[var(--color-text-primary)] shadow-sm"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-4 py-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] pr-12 shadow-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] shadow-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!token || !newPassword || loading}
                className="w-full py-4 bg-[#1A90FF] hover:bg-[#1A90FF]/90 disabled:bg-[var(--color-surface-hover)] disabled:text-[var(--color-text-muted)] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 border border-transparent"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Image Section */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#134467] to-[#0A2540] items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#2BA6DF]/20 rounded-full blur-3xl" />
          <div className="relative z-10 w-full max-w-[320px] aspect-square">
            <Image
              src="/otp.png"
              alt="Reset Password"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
