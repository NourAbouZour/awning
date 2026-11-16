import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

/**
 * Shown above the login and signup forms when someone is already logged in,
 * so they can carry on to their dashboard instead of signing in again.
 */
export async function SignedInNote() {
  const user = await getCurrentUser();
  if (!user) return null;
  const home = user.role === "superadmin" ? "/admin" : "/dashboard";
  return (
    <div className="mb-6 rounded-lg border border-line bg-paper px-3.5 py-3 text-sm text-ink-body">
      <p>
        You&apos;re logged in as{" "}
        <span className="font-medium text-ink">{user.email}</span>.
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link
          href={home}
          className="font-medium text-green underline-offset-4 hover:underline"
        >
          {user.role === "superadmin" ? "Go to the admin panel" : "Go to my dashboard"}
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
