"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export function RoleToggle({
  onRoleChange,
}: {
  onRoleChange: (role: string) => void;
}) {
  const [role, setRole] = useState("student");
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    // Ensure the component re-renders when theme changes
  }, [theme, systemTheme]);

  const handleToggle = (selectedRole: string) => {
    setRole(selectedRole);
    onRoleChange(selectedRole);
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="relative flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 w-full max-w-[320px] shadow-inner">
        {/* Sliding Background */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-[var(--color-card)] shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-[var(--color-border-light)]"
          layout
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            left: role === "student" ? "6px" : "calc(50% + 2px)",
            width: "calc(50% - 8px)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{ zIndex: 10 }}
        />
        {/* Student Button */}
        <button
          type="button"
          onClick={() => handleToggle("student")}
          className={`relative flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 z-20 ${
            role === "student"
              ? "text-[var(--color-primary)] drop-shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Student
        </button>
        {/* Admin Button */}
        <button
          type="button"
          onClick={() => handleToggle("admin")}
          className={`relative flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 z-20 ${
            role === "admin"
              ? "text-[var(--color-primary)] drop-shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  );
}
