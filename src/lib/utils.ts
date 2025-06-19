import { Event } from "@/types/events";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export   const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'Upcoming':
        return 'text-blue-600';
      case 'Ongoing':
        return 'text-green-600';
      case 'Completed':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }


export const getStatusBadgeVariant = (status: Event['status']) => {
    switch (status) {
      case 'Upcoming':
        return 'default';
      case 'Ongoing':
        return 'secondary';
      case 'Completed':
        return 'outline';
      default:
        return 'default';
    }
  };