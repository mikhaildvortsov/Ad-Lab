import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { 
  blacklistUser, 
  removeFromBlacklist, 
  getBlacklistedUsers, 
  isUserBlacklisted,
  cleanOldBlacklistEntries,
  loadFromFile,
  persistToFile
} from '@/lib/token-blacklist';

// Admin endpoint to manage session blacklist
export async function POST(request: NextRequest) {
  try {
    // Load blacklist from file if available
    await loadFromFile();
    
    // Get current session to verify admin access
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, any authenticated user can use this in development
    if (process.env.NODE_ENV === 'production') {
      // In production, check if user is admin
      // This would require database connection for proper admin check
      console.log('Admin blacklist action by user:', session.user.email);
    }

    const { action, ...params } = await request.json();

    switch (action) {
      case 'blacklist_user_by_name':
        const { userName, reason } = params;
        if (!userName) {
          return NextResponse.json(
            { error: 'userName is required' },
            { status: 400 }
          );
        }

        blacklistUser({
          userName: userName.trim(),
          reason: reason || `Blacklisted by admin: ${session.user.email}`
        });

        // Persist to file
        await persistToFile();

        return NextResponse.json({
          success: true,
          message: `User "${userName}" has been blacklisted. Their session will be invalidated on next request.`
        });

      case 'blacklist_user_by_email':
        const { userEmail, reason: emailReason } = params;
        if (!userEmail) {
          return NextResponse.json(
            { error: 'userEmail is required' },
            { status: 400 }
          );
        }

        blacklistUser({
          userEmail: userEmail.trim(),
          reason: emailReason || `Blacklisted by admin: ${session.user.email}`
        });

        // Persist to file
        await persistToFile();

        return NextResponse.json({
          success: true,
          message: `User with email "${userEmail}" has been blacklisted.`
        });

      case 'blacklist_user_by_id':
        const { userId, reason: idReason } = params;
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required' },
            { status: 400 }
          );
        }

        blacklistUser({
          userId: userId.trim(),
          reason: idReason || `Blacklisted by admin: ${session.user.email}`
        });

        // Persist to file
        await persistToFile();

        return NextResponse.json({
          success: true,
          message: `User with ID "${userId}" has been blacklisted.`
        });

      case 'check_blacklist':
        const { checkUserId, checkUserEmail, checkUserName } = params;
        
        const isBlacklisted = isUserBlacklisted({
          id: checkUserId,
          email: checkUserEmail,
          name: checkUserName
        });

        return NextResponse.json({
          success: true,
          isBlacklisted,
          message: isBlacklisted ? 'User is blacklisted' : 'User is not blacklisted'
        });

      case 'remove_from_blacklist':
        const { removeUserId, removeUserEmail, removeUserName } = params;
        
        const removed = removeFromBlacklist({
          userId: removeUserId,
          userEmail: removeUserEmail,
          userName: removeUserName
        });

        // Persist to file if something was removed
        if (removed) {
          await persistToFile();
        }

        return NextResponse.json({
          success: true,
          removed,
          message: removed ? 'User removed from blacklist' : 'User not found in blacklist'
        });

      case 'list_blacklisted':
        const blacklistedUsers = getBlacklistedUsers();
        return NextResponse.json({
          success: true,
          data: blacklistedUsers,
          count: blacklistedUsers.length
        });

      case 'clean_old_entries':
        const { days = 7 } = params;
        const removedCount = cleanOldBlacklistEntries(days);
        
        // Persist to file if something was removed
        if (removedCount > 0) {
          await persistToFile();
        }
        
        return NextResponse.json({
          success: true,
          message: `Cleaned ${removedCount} old blacklist entries older than ${days} days`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available actions: blacklist_user_by_name, blacklist_user_by_email, blacklist_user_by_id, check_blacklist, remove_from_blacklist, list_blacklisted, clean_old_entries' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in blacklist endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to retrieve blacklist info
export async function GET(request: NextRequest) {
  try {
    // Load blacklist from file if available
    await loadFromFile();
    
    // Get current session to verify admin access
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const blacklistedUsers = getBlacklistedUsers();
    
    return NextResponse.json({
      success: true,
      data: blacklistedUsers,
      count: blacklistedUsers.length,
      message: `Found ${blacklistedUsers.length} blacklisted users`
    });

  } catch (error) {
    console.error('Error getting blacklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 