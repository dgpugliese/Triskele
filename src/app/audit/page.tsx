import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { Icon } from "@/components/icon";

export default function Page() {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <div className="panel p-10 text-center space-y-3">
            <Icon name="history" className="text-3xl text-ash" />
            <h1 className="text-section-title font-display text-white">Audit Log</h1>
            <p className="text-body text-mist">
              Per-vault audit trails are visible inside each vault&apos;s detail page.
            </p>
          </div>
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
