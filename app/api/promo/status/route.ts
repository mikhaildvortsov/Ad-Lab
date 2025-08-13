import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Код промокода обязателен' },
        { status: 400 }
      );
    }

    // Проверяем статус промокода
    const promoResult = await query(`
      SELECT 
        id,
        code,
        description,
        max_uses,
        current_uses,
        expires_at,
        access_duration_days,
        is_active,
        created_at
      FROM promo_codes 
      WHERE code = $1
    `, [code.toUpperCase()]);
    
    if (promoResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Промокод не найден'
      });
    }

    const promo = promoResult.rows[0];

    // Проверяем активации этого промокода
    const activationsResult = await query(`
      SELECT 
        COUNT(*) as total_activations,
        COUNT(CASE WHEN is_active = true AND expires_at > NOW() THEN 1 END) as active_activations
      FROM user_promo_activations upa
      WHERE promo_code_id = $1
    `, [promo.id]);
    
    const stats = activationsResult.rows[0];

    // Получаем последние активации
    const recentActivationsResult = await query(`
      SELECT 
        u.email,
        upa.activated_at,
        upa.expires_at,
        upa.is_active
      FROM user_promo_activations upa
      JOIN users u ON upa.user_id = u.id
      WHERE upa.promo_code_id = $1
      ORDER BY upa.activated_at DESC
      LIMIT 5
    `, [promo.id]);

    // Анализ проблемы
    const now = new Date();
    let status = 'working';
    let problem = null;

    if (!promo.is_active) {
      status = 'inactive';
      problem = 'Промокод неактивен';
    } else if (promo.expires_at && new Date(promo.expires_at) < now) {
      status = 'expired';
      problem = 'Срок действия промокода истек';
    } else if (promo.current_uses >= promo.max_uses) {
      status = 'exhausted';
      problem = 'Промокод исчерпал лимит использований';
    }

    return NextResponse.json({
      success: true,
      data: {
        promo: {
          id: promo.id,
          code: promo.code,
          description: promo.description,
          max_uses: promo.max_uses,
          current_uses: promo.current_uses,
          remaining_uses: promo.max_uses - promo.current_uses,
          expires_at: promo.expires_at,
          access_duration_days: promo.access_duration_days,
          is_active: promo.is_active,
          created_at: promo.created_at
        },
        statistics: {
          total_activations: parseInt(stats.total_activations),
          active_activations: parseInt(stats.active_activations)
        },
        recent_activations: recentActivationsResult.rows,
        status,
        problem
      }
    });

  } catch (error) {
    console.error('Error checking promo status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}