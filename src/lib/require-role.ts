import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { UserRole, evaluateRoleAccess } from '@/lib/rbac-rules';

export interface AuthContext {
  session: any;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    shift?: string;
  };
}

export type RequireRoleResult =
  | { authorized: true; context: AuthContext; response?: never }
  | { authorized: false; response: NextResponse; context?: never };

/**
 * Reusable server-side RBAC helper for Next.js API route handlers.
 * Enforces session authentication and validates role authorization.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<RequireRoleResult> {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role as UserRole | undefined;
  const access = evaluateRoleAccess(role, allowedRoles);

  if (!access.allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: access.error, userRole: role || null },
        { status: access.statusCode }
      ),
    };
  }

  return {
    authorized: true,
    context: {
      session,
      user: session!.user as any,
    },
  };
}

