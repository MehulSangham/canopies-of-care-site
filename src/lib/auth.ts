import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Admin emails — users with these emails get admin access.
 * You can also set role: "admin" in Clerk's user public_metadata.
 */
const ADMIN_EMAILS = [
  'mehulsangham@gmail.com',
];

/**
 * Server-side admin check.
 *
 * Checks (in order):
 * 1. Clerk user signed in → check email or public_metadata.role
 * 2. ENABLE_EDIT env var → allow (for headless/CI environments)
 * 3. Otherwise → not admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  // Explicit env var override (useful for build-time, CI, etc.)
  if (process.env.ENABLE_EDIT === 'true') return true;

  try {
    const { userId } = await auth();
    if (!userId) return false;

    const user = await currentUser();
    if (!user) return false;

    // Check admin email list
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email && ADMIN_EMAILS.includes(email)) return true;

    // Check public_metadata.role
    const metadata = user.publicMetadata as Record<string, unknown> | undefined;
    if (metadata?.role === 'admin') return true;

    return false;
  } catch {
    // If Clerk throws (e.g. during static generation), fall back
    return process.env.NODE_ENV === 'development';
  }
}
