import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { GuardianInbox } from "./_inbox";

export default function Page() {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <GuardianInbox />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
