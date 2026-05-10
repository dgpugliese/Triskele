import Link from "next/link";
import { Icon } from "./icon";

/**
 * Minimal chrome shared by /login and /signup. Keeps a back-to-home link and
 * the wordmark so the auth pages still feel like part of the marketing site.
 */
export function AuthChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-void">
      <header className="px-5 sm:px-6 md:px-10 h-16 md:h-20 flex items-center border-b border-white/5">
        <div className="max-w-container-max mx-auto w-full flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded bg-cipher-blue grid place-items-center shadow-cipher-glow shrink-0">
              <Icon name="shield" filled className="text-void text-base" />
            </span>
            <span className="text-card-title md:text-section-title font-display font-semibold tracking-tight truncate">
              Triskele
            </span>
          </Link>
          <Link
            href="/"
            className="text-micro-mono font-mono uppercase tracking-wider text-ash hover:text-white transition-colors py-2"
          >
            ← Back to home
          </Link>
        </div>
      </header>
      <main className="flex-1 grid place-items-center px-5 sm:px-6 md:px-10 py-10 sm:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
