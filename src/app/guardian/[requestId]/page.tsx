import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { GuardianApproval } from "./_approval";

export default function Page({ params }: { params: { requestId: string } }) {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <GuardianApproval requestId={params.requestId} />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
