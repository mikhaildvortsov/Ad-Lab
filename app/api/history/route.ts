import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { QueryService } from '@/lib/services/query-service';

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'DESC';
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const allowedSortFields = ['created_at', 'tokens_used', 'processing_time_ms'];
    if (!allowedSortFields.includes(sort_by)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }

    const allowedSortOrders = ['ASC', 'DESC'];
    if (!allowedSortOrders.includes(sort_order.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid sort order' },
        { status: 400 }
      );
    }

    // Build query options
    const queryOptions = {
      page,
      limit,
      sort_by,
      sort_order: sort_order.toUpperCase() as 'ASC' | 'DESC',
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined
    };

    // Get user's query history
    const result = await QueryService.getUserQueries(userId, queryOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch query history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error in history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get query statistics for the user
export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { action } = await request.json();

    if (action === 'stats') {
      // Get user's query statistics
      const result = await QueryService.getUserQueryStats(userId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch query statistics' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in history POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete query from history
export async function DELETE(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('queryId');

    if (!queryId) {
      return NextResponse.json(
        { error: 'Query ID is required' },
        { status: 400 }
      );
    }

    // First verify that the query belongs to the current user
    const queryResult = await QueryService.getQueryById(queryId);
    if (!queryResult.success || !queryResult.data) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    if (queryResult.data.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the query
    const deleteResult = await QueryService.deleteQuery(queryId);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || 'Failed to delete query' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Query deleted successfully'
    });

  } catch (error) {
    console.error('Error in history DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 