import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Store setup is only for someone with an account. Anyone else (no session,
 * or a session whose account was deleted or suspended) signs up or logs in
 * first; staff accounts can't open stores.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");
  if (user.role === "staff") redirect("/dashboard");
  return children;
}
