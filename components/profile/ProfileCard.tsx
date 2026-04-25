"use client";

import { User as UserIcon} from "lucide-react";
import { User } from "./types";

interface ProfileCardProps {
  user: User;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  return (
    <div className="w-full lg:w-1/3 flex flex-col">
      <div className="bg-[var(--color-card)] rounded-lg shadow-lg border border-[var(--color-border)] p-6 flex flex-col h-full">
        {/* User Info Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--color-border)]">
          <div className="bg-[var(--color-nav-active-bg)] p-3 rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] truncate">{user.name}</h2>
            <p className="text-sm text-[var(--color-text-muted)] truncate">{user.email}</p>
          </div>
        </div>
        
        {/* User Info Details */}
        <div className="space-y-3 text-sm flex-1 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Department:</span>
            <span className="font-medium text-[var(--color-text-primary)]">{user.department}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Pass out Year:</span>
            <span className="font-medium text-[var(--color-text-primary)]">{user.passOutYear}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Roll No:</span>
            <span className="font-medium text-[var(--color-text-primary)]">{user.rollNo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Year:</span>
            <span className="font-medium text-[var(--color-text-primary)]">{user.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
};