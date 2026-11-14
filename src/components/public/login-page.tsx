"use client";

import AuthSwitch from "@/components/ui/auth-switch";

/**
 * LoginPage
 * --------
 * Renders the animated AuthSwitch panel (sliding sign-in / sign-up
 * transition). The full implementation lives in
 * `@/components/ui/auth-switch` so it can be reused independently.
 */
export function LoginPage() {
  return <AuthSwitch />;
}
