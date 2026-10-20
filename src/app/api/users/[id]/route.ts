import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentRole = session.user.role;
    if (currentRole !== 'admin' && currentRole !== 'sector_head') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can delete user accounts' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const targetUserId = parseInt(id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent deleting own logged in account
    const currentUserId = parseInt(session.user.id);
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account while logged in' },
        { status: 400 }
      );
    }

    if (!sql) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
    }

    // Check if target user exists and check email
    const targetUser = await sql`
      SELECT id, email, name, role FROM users WHERE id = ${targetUserId}
    `;

    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = (targetUser[0].email || '').toLowerCase().trim();
    if (email === 'admin@pcc.gov.gh') {
      return NextResponse.json(
        { error: 'Cannot delete the primary root administrator account' },
        { status: 400 }
      );
    }

    // Delete user
    await sql`
      DELETE FROM users WHERE id = ${targetUserId}
    `;

    return NextResponse.json({
      success: true,
      message: `User "${targetUser[0].name || email}" has been deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: String(error) },
      { status: 500 }
    );
  }
}
