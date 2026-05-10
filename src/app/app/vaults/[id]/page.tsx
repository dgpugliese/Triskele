import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { VaultDetailScreen } from "./_detail";

export const runtime = "edge";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <VaultDetailScreen vaultId={id} />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
