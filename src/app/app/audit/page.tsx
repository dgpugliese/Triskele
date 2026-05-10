import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { AuditLog } from "./_audit";

export default function Page() {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <AuditLog />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
