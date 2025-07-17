import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get current user session (optional for public plans)
    const session = await getSession();
    
    // Get all active subscription plans
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        price_monthly as price,
        price_yearly,
        currency,
        features,
        max_queries_per_month,
        max_tokens_per_query,
        created_at
      FROM subscription_plans 
      WHERE is_active = true
      ORDER BY price_monthly ASC
    `);

    // Transform database format to frontend format
    const plans = result.rows.map(plan => ({
      id: mapDbNameToFrontendId(plan.name),
      name: plan.name,
      price: parseFloat(plan.price),
      originalPrice: plan.price_yearly ? parseFloat(plan.price_yearly) : undefined,
      features: plan.features || [],
      improvements: plan.max_queries_per_month || -1,
      popular: plan.name === 'Month' // Mark monthly as popular
    }));

    return NextResponse.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Map database plan names to frontend IDs
function mapDbNameToFrontendId(dbName: string): string {
  const mapping: Record<string, string> = {
    'Week': 'week',
    'Month': 'month',
    'Quarter': 'quarter'
  };
  
  return mapping[dbName] || dbName.toLowerCase();
} 