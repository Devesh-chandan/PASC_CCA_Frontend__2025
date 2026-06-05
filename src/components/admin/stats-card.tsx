import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  Icon?: React.ComponentType<{ className?: string }>;
}

export const StatsCard = ({ title, value, Icon }: StatsCardProps) => (
  <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
      <span className="text-sm sm:text-base font-semibold text-[var(--color-text-muted)]">{title}</span>
      {Icon && (
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shrink-0">
          <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        </span>
      )}
    </div>
    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">{value}</div>
  </div>
);
