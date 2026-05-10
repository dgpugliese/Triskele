// Back-compat shim. The real implementation now lives in auth-provider.tsx,
// which handles both Supabase auth and demo-mode local identities.
export { AuthProvider as IdentityProvider, useIdentity, useAuth } from "./auth-provider";
