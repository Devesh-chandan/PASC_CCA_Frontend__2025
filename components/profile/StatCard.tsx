"use client";

import { StatCardProps } from "./types";

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtext,
  color,
}) => {
  return (
    <div className="bg-card rounded-2xl p-5 flex flex-col gap-2 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
        {icon}
        {title}
      </div>
      <div className={`text-4xl font-extrabold tracking-tight ${color}`}>{value}</div>
      <div className="text-xs font-medium text-muted-foreground/80">{subtext}</div>
    </div>
  );
};