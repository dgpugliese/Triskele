import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { Recover } from "./_recover";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <Recover vaultId={params.id} />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
