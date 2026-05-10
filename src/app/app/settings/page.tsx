import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { Settings } from "./_settings";

export default function Page() {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <Settings />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
