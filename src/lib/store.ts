import { create } from 'zustand';
import { IUser, IAdmin } from '@/types/auth';
import { EventWithRsvp, RsvpStatus } from '@/types/events';
import axios from 'axios';

// Helper function to format date
const formatDateToDDMMYY = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

interface AuthStore {
  user?: IUser;
  admin?: IAdmin;
  role: "student" | "admin" | null;
  setAuth: (auth: { user?: IUser; admin?: IAdmin; role: "student" | "admin" }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  admin: undefined,
  role: null,

  setAuth: ({ user, admin, role }) => set(() => ({
    user,
    admin,
    role,
  })),
  clearAuth: () => set(() => ({
    user: undefined,
    admin: undefined,
    role: null,
  })),
}));

