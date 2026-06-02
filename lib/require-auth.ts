import { redirect } from "next/navigation";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth-server";

function buildLoginUrl(nextPath: string): string {
  const encodedNext = encodeURIComponent(nextPath);
  return `/login?next=${encodedNext}`;
}

export async function requireCurrentUser(nextPath: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(buildLoginUrl(nextPath));
  }
  return user;
}
