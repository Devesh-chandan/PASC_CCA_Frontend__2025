"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const { success, error: showToastError } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      success("Email Sent", "A password reset code has been sent to your email.");
      // Move to reset page and pass email as query param
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      showToastError("Error", err.response?.data?.error || "Failed to send reset code.");
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
              href="/auth/login" 
              className="inline-flex items-center text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Login
            </Link>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                Forgot Password?
              </h2>
              <p className="text-[var(--color-text-muted)] mt-2 font-medium">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] ml-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] transition-all font-medium text-[var(--color-text-primary)] shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!email || loading}
                className="w-full py-4 bg-[#1A90FF] hover:bg-[#1A90FF]/90 disabled:bg-[var(--color-surface-hover)] disabled:text-[var(--color-text-muted)] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 border border-transparent"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Code
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
              src="/login.png"
              alt="Forgot Password"
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
