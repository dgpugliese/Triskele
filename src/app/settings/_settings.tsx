"use client";

import { Icon } from "@/components/icon";
import { useIdentity } from "@/components/identity-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function Settings() {
  const { identities } = useIdentity();
  const supa = isSupabaseConfigured();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="chip chip-cipher">SESSION</span>
        <h1 className="text-page-title font-display text-white">Settings</h1>
      </header>

      <div className="panel p-6 space-y-3">
        <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">Storage backend</h3>
        <div className="flex items-center gap-3">
          <Icon
            name={supa ? "cloud_done" : "save"}
            className={supa ? "text-proof-green" : "text-cipher-blue"}
          />
          <p className="text-body text-white">
            {supa
              ? "Supabase: ciphertext + wrapped fragments are persisted to your project."
              : "LocalStorage demo mode: state lives only in this browser. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to switch to Supabase."}
          </p>
        </div>
      </div>

      <div className="panel p-6 space-y-3">
        <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">Identities on this device</h3>
        <ul className="divide-y divide-white/5">
          {identities.map((i) => (
            <li key={i.userId} className="py-3 flex items-center justify-between">
              <span className="text-body text-white">{i.displayName}</span>
              <span className="text-micro-mono font-mono text-ash">
                {i.userId.slice(0, 8)}…
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel p-6 space-y-3">
        <h3 className="text-micro-mono font-mono font-bold text-ash uppercase">Reset demo</h3>
        <p className="text-small text-mist">
          Clears all local identities, vaults, fragments, and audit events. Cannot be undone.
        </p>
        <button
          onClick={() => {
            if (confirm("Erase all local Triskele state?")) {
              for (const k of Object.keys(localStorage)) {
                if (k.startsWith("triskele.")) localStorage.removeItem(k);
              }
              location.href = "/";
            }
          }}
          className="btn-danger"
        >
          <Icon name="delete_forever" /> Reset
        </button>
      </div>
    </div>
  );
}
