import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PromoService } from '@/lib/services/promo-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await PromoService.getUserActivePromoAccess(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        hasActivePromoAccess: result.data !== null,
        promoAccess: result.data
      }
    });
  } catch (error) {
    console.error('Error in promo status API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}