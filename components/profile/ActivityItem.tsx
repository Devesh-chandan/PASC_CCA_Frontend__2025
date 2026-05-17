"use client";

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  date: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ icon, title, date }) => {
  return (
    <li className="flex items-center justify-between bg-[var(--color-profile)]/50 hover:bg-[var(--color-profile)] rounded-xl p-4 transition-colors duration-200 border border-transparent hover:border-[var(--color-border)]/30 group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--color-background)]/50 group-hover:bg-[var(--color-background)] transition-colors shadow-sm">
          {icon}
        </div>
        <span className="font-semibold text-[var(--color-text-primary)] tracking-tight">{title}</span>
      </div>
      <span className="text-muted-foreground text-sm font-medium">{date}</span>
    </li>
  );
};