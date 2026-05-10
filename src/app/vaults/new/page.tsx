import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { CreateVault } from "./_create";

export default function Page() {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <CreateVault />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
