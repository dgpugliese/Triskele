"use client";

import { useEffect, useState } from "react";

export function NoSSR({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="min-h-screen grid place-items-center text-ash text-micro-mono font-mono">
        DERIVING SESSION KEY…
      </div>
    );
  }
  return <>{children}</>;
}
