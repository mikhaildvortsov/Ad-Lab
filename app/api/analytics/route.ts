import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { QueryService } from '@/lib/services/query-service';
import { BillingService } from '@/lib/services/billing-service';
import { UserService } from '@/lib/services/user-service';
import { PromoService } from '@/lib/services/promo-service';
import { query } from '@/lib/database';
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    // Check for active promo access first
    const promoResult = await PromoService.getUserActivePromoAccess(userId);
    let hasAccess = false;
    
    if (promoResult.success && promoResult.data) {
      hasAccess = true; // User has active promo access
    } else {
      // Check subscription status
      const subscriptionResult = await BillingService.getUserSubscription(userId);
      if (subscriptionResult.success) {
        const subscription = subscriptionResult.data!;
        const now = new Date();
        const expiresAt = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
        const isExpired = expiresAt && expiresAt < now;
        
        if (!isExpired && subscription.status === 'active') {
          hasAccess = true;
        }
      }
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: 'Active subscription or promo code required',
          type: 'subscription_required'
        },
        { status: 403 }
      );
    }
    const queryStatsResult = await QueryService.getUserQueryStats(userId);
    if (!queryStatsResult.success) {
      return NextResponse.json(
        { error: 'Failed to fetch query statistics' },
        { status: 500 }
      );
    }
    const queryStats = queryStatsResult.data!;
    const weeklyActivityResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as queries
      FROM query_history 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId]);
    const weeklyActivity = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = weeklyActivityResult.rows.find(row => 
        row.date.toISOString().split('T')[0] === dateStr
      );
      weeklyActivity.push(dayData ? parseInt(dayData.queries) : 0);
    }
    const avgLengthResult = await query(`
      SELECT AVG(LENGTH(query_text)) as avg_length
      FROM query_history 
      WHERE user_id = $1 AND query_text IS NOT NULL
    `, [userId]);
    const averageLength = avgLengthResult.rows[0]?.avg_length 
      ? Math.round(parseFloat(avgLengthResult.rows[0].avg_length))
      : 0;
    const qualityImprovement = queryStats.totalQueries > 0 
      ? Math.min(Math.round((queryStats.successfulQueries / queryStats.totalQueries) * 100 + 200), 500)
      : 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    const monthlyGrowthResult = await query(`
      SELECT 
        COUNT(CASE WHEN created_at >= $1 THEN 1 END) as current_month,
        COUNT(CASE WHEN created_at >= $2 AND created_at < $1 THEN 1 END) as last_month
      FROM query_history 
      WHERE user_id = $3
    `, [`${currentMonth}-01`, `${lastMonthStr}-01`, userId]);
    const currentMonthQueries = parseInt(monthlyGrowthResult.rows[0]?.current_month || '0');
    const lastMonthQueries = parseInt(monthlyGrowthResult.rows[0]?.last_month || '0');
    const monthlyGrowth = lastMonthQueries > 0 
      ? Math.round(((currentMonthQueries - lastMonthQueries) / lastMonthQueries) * 100)
      : 0;
    return NextResponse.json({
      success: true,
      data: {
        totalRequests: queryStats.totalQueries,
        monthlyGrowth: Math.max(monthlyGrowth, 0),
        averageLength: averageLength,
        qualityImprovement: `+${qualityImprovement}%`,
        weeklyActivity: weeklyActivity,
        additionalStats: {
          successRate: queryStats.totalQueries > 0 
            ? Math.round((queryStats.successfulQueries / queryStats.totalQueries) * 100) 
            : 0,
          totalTokensUsed: queryStats.totalTokensUsed,
          averageTokensPerQuery: queryStats.averageTokensPerQuery,
          averageProcessingTime: queryStats.averageProcessingTime
        }
      }
    });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
