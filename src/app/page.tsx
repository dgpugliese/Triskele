import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { Dashboard } from "./_dashboard";

export default function Page() {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <Dashboard />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
