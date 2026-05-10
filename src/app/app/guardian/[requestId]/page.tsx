import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { GuardianApproval } from "./_approval";

export const runtime = "edge";

export default async function Page({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <GuardianApproval requestId={requestId} />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
