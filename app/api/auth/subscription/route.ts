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
            isPromoAccess: true
          }
        }
      });
    }
    
    const subscriptionResult = await BillingService.getUserSubscription(userId);
    if (!subscriptionResult.success) {
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
    return NextResponse.json({
      success: true,
      data: {
        hasActiveSubscription: !isExpired && subscription.status === 'active',
        subscription: {
          id: subscription.id,
          planName: subscription.plan_name,
          status: subscription.status,
          expiresAt: subscription.current_period_end,
          isExpired: isExpired
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
