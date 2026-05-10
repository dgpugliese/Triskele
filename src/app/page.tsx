import Link from "next/link";
import { Icon } from "@/components/icon";
import { TriskeleMark } from "@/components/triskele-mark";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-on-surface">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <UseCases />
        <Mechanics />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-6 md:px-10 h-20 flex items-center">
      <div className="max-w-container-max mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-8 h-8 rounded bg-cipher-blue grid place-items-center shadow-cipher-glow">
            <Icon name="shield" filled className="text-void text-base" />
          </span>
          <span className="text-section-title font-display font-semibold tracking-tight">
            Triskele
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-small text-mist">
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How it works
          </a>
          <a href="#use-cases" className="hover:text-white transition-colors">
            Who it&apos;s for
          </a>
          <a href="#mechanics" className="hover:text-white transition-colors">
            What we can&apos;t do
          </a>
        </nav>
        <Link
          href="/app"
          className="text-micro-mono font-mono uppercase tracking-wider px-4 py-2 border border-white/10 rounded
                     hover:border-cipher-blue/40 hover:text-cipher-blue transition-colors"
        >
          Open the app →
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-28 md:pt-48 md:pb-40 overflow-hidden">
      <BackgroundGrid />
      <div className="relative max-w-container-max mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="chip chip-cipher inline-flex">PRIVATE BY DESIGN</span>
            <h1 className="text-[44px] leading-[1.05] md:text-[64px] md:leading-[1.02] font-display font-semibold tracking-[-0.03em] text-white">
              The vault that opens
              <br />
              <span className="text-cipher-blue">when your circle agrees.</span>
            </h1>
            <p className="text-body md:text-[17px] text-mist max-w-xl leading-relaxed">
              Triskele encrypts your most important secrets and only releases them when
              three people you trust say yes. Your family&apos;s executor instructions. Your
              team&apos;s break-glass keys. The plan you hope no one ever needs.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <Link href="/app" className="btn-primary text-small">
                <Icon name="enhanced_encryption" /> Open your first vault
              </Link>
              <Link
                href="#how-it-works"
                className="text-small text-ash hover:text-white transition-colors inline-flex items-center gap-1"
              >
                See how it works
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-6 text-micro-mono font-mono text-ash">
              <span className="inline-flex items-center gap-2">
                <Icon name="check_circle" className="text-proof-green text-sm" filled />
                ZERO-KNOWLEDGE
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="check_circle" className="text-proof-green text-sm" filled />
                AES-GCM-256
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="check_circle" className="text-proof-green text-sm" filled />
                NO MASTER KEY
              </span>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <TriskeleMark className="w-72 h-72 md:w-96 md:h-96" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BackgroundGrid() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #5EE7FF 1px, transparent 1px), linear-gradient(to bottom, #5EE7FF 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(94,231,255,0.10) 0%, transparent 60%)",
        }}
      />
    </>
  );
}

function TrustStrip() {
  const items = [
    "Open source",
    "Encrypted in your browser",
    "We can't read it",
    "We can't override the quorum",
  ];
  return (
    <section className="border-y border-white/5 bg-obsidian/40">
      <div className="max-w-container-max mx-auto px-6 md:px-10 py-6 flex flex-wrap items-center justify-center md:justify-between gap-6">
        {items.map((it) => (
          <div
            key={it}
            className="flex items-center gap-2 text-micro-mono font-mono text-ash uppercase tracking-widest"
          >
            <Icon name="bolt" className="text-cipher-blue text-base" />
            {it}
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: "edit_note",
      title: "Write what matters.",
      body:
        "A will. The recovery codes. The password to the password manager. Triskele locks it in your browser before it ever leaves your device.",
    },
    {
      n: "02",
      icon: "groups",
      title: "Choose three people you trust.",
      body:
        "Each guardian gets a piece of the key — never the whole thing. Alone, none of them can open the vault. Together, they can.",
    },
    {
      n: "03",
      icon: "key",
      title: "They agree, or it stays sealed.",
      body:
        "When it's time to unseal — by you, or by someone you've named — every guardian has to approve. The server can't bypass them. Neither can we.",
    },
  ];
  return (
    <section id="how-it-works" className="py-28 md:py-36">
      <div className="max-w-container-max mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-16 space-y-4">
          <span className="chip chip-cipher inline-flex">HOW IT WORKS</span>
          <h2 className="text-[36px] md:text-[44px] leading-tight font-display font-semibold tracking-tight text-white">
            Three keys. One vault. No shortcuts.
          </h2>
          <p className="text-body text-mist">
            Triskele uses a 60-year-old idea called Shamir secret sharing. Your secret is
            split into three pieces; you decide who holds them.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="panel p-8 space-y-5 hover:border-cipher-blue/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-micro-mono font-mono text-cipher-blue tracking-widest">
                  {s.n}
                </span>
                <Icon name={s.icon} className="text-cipher-blue text-2xl" />
              </div>
              <h3 className="text-section-title font-display font-semibold text-white tracking-tight">
                {s.title}
              </h3>
              <p className="text-small text-mist leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cards = [
    {
      icon: "family_restroom",
      title: "Estate planning",
      body:
        "When you're not around, the right person can still get in. No probate scavenger hunt.",
    },
    {
      icon: "vpn_key",
      title: "The family password",
      body:
        "Share access to the joint accounts — Apple ID, banking, the router — without telling anyone the password.",
    },
    {
      icon: "domain",
      title: "Business continuity",
      body:
        "Founder hit by a bus? The break-glass keys are still reachable, but only if the board agrees.",
    },
    {
      icon: "savings",
      title: "Cold storage",
      body:
        "Seed phrases, two-factor backup codes, lawyer's contact info — somewhere safer than a sticky note.",
    },
  ];
  return (
    <section id="use-cases" className="py-28 md:py-36 bg-gradient-to-b from-void to-obsidian/40">
      <div className="max-w-container-max mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-16 space-y-4">
          <span className="chip chip-cipher inline-flex">WHO IT&apos;S FOR</span>
          <h2 className="text-[36px] md:text-[44px] leading-tight font-display font-semibold tracking-tight text-white">
            For the secret that has to outlive a bad day.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c) => (
            <div
              key={c.title}
              className="panel-raised p-8 flex items-start gap-5 hover:border-white/15 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg border border-cipher-blue/20 bg-cipher-blue/5 grid place-items-center shrink-0">
                <Icon name={c.icon} className="text-cipher-blue text-2xl" />
              </div>
              <div className="space-y-2">
                <h3 className="text-card-title font-semibold text-white">{c.title}</h3>
                <p className="text-small text-mist leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mechanics() {
  return (
    <section id="mechanics" className="py-28 md:py-36">
      <div className="max-w-container-max mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-5 max-w-lg">
            <span className="chip chip-cipher inline-flex">WHAT WE CAN&apos;T DO</span>
            <h2 className="text-[36px] md:text-[44px] leading-tight font-display font-semibold tracking-tight text-white">
              Trust through constraint.
            </h2>
            <p className="text-body text-mist leading-relaxed">
              The fastest way to know your secret is safe is to know what we&apos;re
              physically incapable of doing with it. Here&apos;s the unflattering version
              of our marketing site.
            </p>
          </div>

          <ul className="space-y-3">
            <ConstraintRow
              kind="cant"
              text="Read your vault. The blob you upload is already encrypted in your browser."
            />
            <ConstraintRow
              kind="cant"
              text="Reconstruct your key. Every fragment is sealed to a specific guardian's device."
            />
            <ConstraintRow
              kind="cant"
              text="Override the quorum. There is no admin button. There is no master key."
            />
            <ConstraintRow
              kind="can"
              text="Store opaque ciphertext and coordinate guardian approvals."
            />
            <ConstraintRow
              kind="can"
              text="Append every action to a tamper-evident audit log."
            />
            <ConstraintRow
              kind="can"
              text="Notify your guardians when their attention is needed."
            />
          </ul>
        </div>
      </div>
    </section>
  );
}

function ConstraintRow({ kind, text }: { kind: "can" | "cant"; text: string }) {
  const isCant = kind === "cant";
  return (
    <li className="flex items-start gap-4 px-5 py-4 rounded-lg border border-white/5 hover:border-white/15 transition-colors">
      <Icon
        name={isCant ? "block" : "check_circle"}
        filled
        className={`text-xl mt-0.5 ${isCant ? "text-breach-red" : "text-proof-green"}`}
      />
      <div className="space-y-0.5">
        <span
          className={`text-micro-mono font-mono uppercase tracking-widest ${
            isCant ? "text-breach-red" : "text-proof-green"
          }`}
        >
          {isCant ? "Cannot" : "Can"}
        </span>
        <p className="text-small text-mist">{text}</p>
      </div>
    </li>
  );
}

function FinalCta() {
  return (
    <section className="py-28 md:py-36">
      <div className="max-w-container-max mx-auto px-6 md:px-10">
        <div className="panel p-10 md:p-16 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(94,231,255,0.10) 0%, transparent 60%)",
            }}
          />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
            <div className="space-y-4">
              <h2 className="text-[36px] md:text-[44px] leading-tight font-display font-semibold tracking-tight text-white">
                Set yours up in two minutes.
              </h2>
              <p className="text-body text-mist max-w-md">
                You don&apos;t need to understand the cryptography. The app will guide
                you through it. Your guardians don&apos;t need an account either —
                they&apos;ll get a link when you&apos;re ready.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <Link href="/app" className="btn-primary">
                <Icon name="enhanced_encryption" /> Get started — it&apos;s free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="max-w-container-max mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded bg-cipher-blue/80 grid place-items-center">
            <Icon name="shield" filled className="text-void text-sm" />
          </span>
          <span className="text-small text-ash">
            Triskele · privacy-first encrypted vault
          </span>
        </div>
        <div className="flex items-center gap-6 text-micro-mono font-mono uppercase tracking-widest text-ash">
          <a href="https://github.com/dgpugliese/Triskele" className="hover:text-white">
            GitHub
          </a>
          <Link href="/app" className="hover:text-white">
            Open app
          </Link>
        </div>
      </div>
    </footer>
  );
}
