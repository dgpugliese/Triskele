"use client";

import { useAuth } from "./auth-provider";
import { Icon } from "./icon";

/**
 * Sign-out affordance for the app top bar in Supabase mode.
 * Renders nothing in demo mode (the top-bar identity dropdown plays that role).
 */
export function SignedInBadge() {
  const { mode, user, signOut } = useAuth();
  if (mode !== "supabase" || !user) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-micro-mono font-mono text-ash truncate max-w-[180px]">
        {user.email}
      </span>
      <button
        onClick={() => void signOut()}
        className="text-micro-mono font-mono text-ash hover:text-breach-red transition-colors inline-flex items-center gap-1 py-1.5 px-2 rounded hover:bg-white/5"
        aria-label="Sign out"
        title="Sign out"
      >
        <Icon name="logout" className="text-base" />
        <span className="hidden md:inline">Sign out</span>
      </button>
    </div>
  );
}
