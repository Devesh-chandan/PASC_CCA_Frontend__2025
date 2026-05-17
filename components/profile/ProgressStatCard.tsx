"use client";

import { ProgressStatCardProps} from "./types";

export const ProgressStatCard: React.FC<ProgressStatCardProps> = ({
  icon,
  title,
  progress,
  color,
}) => {
  const textColor = color.replace('bg-', 'text-')
  return (
    <div className="bg-card rounded-2xl p-5 flex flex-col gap-4 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
        {icon}
        {title}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-full h-2.5 bg-[var(--color-button-disabled)] rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} // Use barColor directly
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${textColor}`}>
        {progress}%
      </span>
    </div>
  );
};