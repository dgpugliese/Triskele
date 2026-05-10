import { AuthProvider } from "@/components/auth-provider";
import { SignupScreen } from "./_signup";

export default function Page() {
  return (
    <AuthProvider>
      <SignupScreen />
    </AuthProvider>
  );
}
