import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Rough token estimation: ~4 chars per token
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Efficiency score: 100 - (retries * 15), floor of 10
export function calculateEfficiency(retries: number): number {
  return Math.max(10, 100 - retries * 15);
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return `Today ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  } else if (days === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString();
  }
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
