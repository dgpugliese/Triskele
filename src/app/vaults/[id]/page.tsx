import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { VaultDetailScreen } from "./_detail";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <VaultDetailScreen vaultId={params.id} />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
