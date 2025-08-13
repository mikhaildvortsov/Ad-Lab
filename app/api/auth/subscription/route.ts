import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { BillingService } from '@/lib/services/billing-service';
import { PromoService } from '@/lib/services/promo-service';
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    
    // Check for active promo access first
    const promoResult = await PromoService.getUserActivePromoAccess(userId);
    if (promoResult.success && promoResult.data) {
      const now = new Date();
      const promoExpiresAt = new Date(promoResult.data.expires_at);
      const promoDaysUntilExpiry = Math.ceil((promoExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return NextResponse.json({
        success: true,
        data: {
          hasActiveSubscription: true,
          subscription: {
            id: 'promo-access',
            planName: 'Промо доступ',
            status: 'active',
            expiresAt: promoResult.data.expires_at,
            isExpired: false,
            isPromoAccess: true,
            daysUntilExpiry: promoDaysUntilExpiry
          }
        }
      });
    }
    
    const subscriptionResult = await BillingService.getUserSubscription(userId);
    if (!subscriptionResult.success) {
      // Log the actual error for debugging
      console.log('BillingService.getUserSubscription failed:', subscriptionResult.error);
      
      // Return that no subscription exists (this is normal for users without subscriptions)
      return NextResponse.json({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscription: null
        }
      });
    }
    const subscription = subscriptionResult.data;
    const now = new Date();
    const expiresAt = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const isExpired = expiresAt && expiresAt < now;
    // Вычисляем дни до истечения
    const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    return NextResponse.json({
      success: true,
      data: {
        hasActiveSubscription: !isExpired && subscription.status === 'active',
        subscription: {
          id: subscription.id,
          planName: subscription.plan_name,
          status: subscription.status,
          startsAt: subscription.current_period_start,
          expiresAt: subscription.current_period_end,
          isExpired: isExpired,
          daysUntilExpiry: daysUntilExpiry,
          maxQueriesPerMonth: subscription.max_queries_per_month,
          maxTokensPerQuery: subscription.max_tokens_per_query,
          priceMonthly: subscription.price_monthly,
          currency: subscription.currency || 'RUB',
          canRenew: !isExpired && subscription.status === 'active' // Можно продлить если активна
        }
      }
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
