"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, X, AlertCircle, CheckCircle2, ChevronLeft, UserPlus } from "lucide-react";
import { authAPI } from "@/lib/api";

export default function AdminInvites() {
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ sent: string[]; failed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    // Parse emails: split by comma or newline, trim, and filter empties
    const emailList = emails
      .split(/[\n,]+/)
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emailList.length === 0) {
      setError("Please enter at least one valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.sendInvites(emailList);
      if (res.data?.success) {
        setResults(res.data.data);
        setEmails(""); // Clear input on success
      } else {
        setError(res.data?.error || "Failed to send invitations.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-xl overflow-hidden"
        >
          <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary dark:bg-primary/15">
                <Mail size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Send Invitations</h1>
                <p className="text-muted-foreground text-sm">Bulk invite students for the closed review</p>
              </div>
            </div>
            <div className="hidden sm:block">
               <UserPlus className="text-muted-foreground/20 italic" size={48} />
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSendInvites}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Recipient Emails
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter emails separated by commas or new lines..."
                  className="w-full min-h-[200px] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-foreground focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none font-mono text-sm"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Invalid email formats will be automatically filtered out.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !emails.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-[var(--color-button-primary)] text-white rounded-xl font-bold hover:bg-[var(--color-button-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Invites
                    </>
                  )}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400"
                >
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 space-y-6"
                >
                  <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4 font-bold text-lg">
                    <CheckCircle2 size={24} />
                    Processing Complete
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30">
                      <h4 className="text-green-700 dark:text-green-400 font-bold mb-2 flex items-center gap-2">
                        Sent Successfully ({results.sent.length})
                      </h4>
                      <ul className="text-sm text-green-600 dark:text-green-400/80 space-y-1 max-h-[150px] overflow-y-auto no-scrollbar">
                        {results.sent.map((email) => <li key={email}>{email}</li>)}
                        {results.sent.length === 0 && <li className="italic opacity-50">None</li>}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
                      <h4 className="text-red-700 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                        Failed to Send ({results.failed.length})
                      </h4>
                      <ul className="text-sm text-red-600 dark:text-red-400/80 space-y-1 max-h-[150px] overflow-y-auto no-scrollbar">
                        {results.failed.map((email) => <li key={email}>{email}</li>)}
                        {results.failed.length === 0 && <li className="italic opacity-50">None</li>}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
