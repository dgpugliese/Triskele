import { Shell } from "@/components/shell";
import { IdentityProvider } from "@/components/identity-provider";
import { OnboardingGate } from "@/components/onboarding";
import { Recover } from "./_recover";

export const runtime = "edge";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <IdentityProvider>
      <OnboardingGate>
        <Shell>
          <Recover vaultId={id} />
        </Shell>
      </OnboardingGate>
    </IdentityProvider>
  );
}
