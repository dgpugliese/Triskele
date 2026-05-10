import { Suspense } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { LoginScreen } from "./_login";

export default function Page() {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <LoginScreen />
      </Suspense>
    </AuthProvider>
  );
}
