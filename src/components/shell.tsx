"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdentity } from "./identity-provider";
import { Icon } from "./icon";

const NAV = [
  { href: "/", label: "Vaults", icon: "lock" },
  { href: "/guardian", label: "Guardian Inbox", icon: "shield" },
  { href: "/audit", label: "Audit Log", icon: "history" },
  { href: "/settings", label: "Settings", icon: "terminal" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { identity, identities, switchTo } = useIdentity();

  return (
    <div className="min-h-screen bg-void">
      <TopBar identity={identity} identities={identities} onSwitch={switchTo} />
      <SideNav pathname={pathname} />
      <main className="md:pl-64 pt-24 pb-24 md:pb-12 px-gutter">
        <div className="max-w-container-max mx-auto">{children}</div>
      </main>
      <BottomNav pathname={pathname} />
    </div>
  );
}

function TopBar({
  identity,
  identities,
  onSwitch,
}: {
  identity: ReturnType<typeof useIdentity>["identity"];
  identities: ReturnType<typeof useIdentity>["identities"];
  onSwitch: (id: string) => Promise<void>;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-obsidian border-b border-white/10 px-gutter flex items-center">
      <div className="max-w-container-max mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-cipher-blue grid place-items-center">
              <Icon name="shield" filled className="text-void text-base" />
            </span>
            <span className="text-page-title font-display font-semibold tracking-tight">
              Triskele
            </span>
          </Link>
          <span className="hidden md:inline-flex chip chip-cipher">
            CLIENT-ENCRYPTED · QUORUM-SEALED
          </span>
        </div>
        <div className="flex items-center gap-3">
          {identities.length > 0 && (
            <select
              aria-label="Switch identity"
              value={identity?.userId ?? ""}
              onChange={(e) => onSwitch(e.target.value)}
              className="bg-graphite text-white text-micro-mono font-mono border border-slate rounded px-3 py-2"
            >
              {identities.map((i) => (
                <option key={i.userId} value={i.userId}>
                  {i.displayName}
                </option>
              ))}
            </select>
          )}
          <div className="w-8 h-8 rounded-full bg-slate grid place-items-center border border-white/10">
            <Icon name="person" className="text-mist text-base" />
          </div>
        </div>
      </div>
    </header>
  );
}

function SideNav({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 pt-20 bg-void border-r border-white/5 hidden md:flex flex-col">
      <div className="px-6 mb-8">
        <h2 className="text-section-title font-display font-semibold text-cipher-blue">
          Secure Command
        </h2>
        <span className="text-micro-mono font-mono text-ash uppercase tracking-widest">
          [encrypted session]
        </span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 py-3 px-6 text-body transition-colors ${
                active
                  ? "text-cipher-blue bg-slate/30 border-r-2 border-cipher-blue"
                  : "text-ash hover:bg-graphite hover:text-white"
              }`}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-6 pb-8">
        <Link href="/vaults/new" className="btn-primary w-full">
          <Icon name="add_moderator" />
          Provision Vault
        </Link>
      </div>
    </aside>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden h-16 bg-obsidian border-t border-white/10 flex items-center justify-around">
      {NAV.map((n) => {
        const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center text-micro-mono font-mono ${
              active ? "text-cipher-blue" : "text-ash"
            }`}
          >
            <Icon name={n.icon} />
            <span>{n.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
