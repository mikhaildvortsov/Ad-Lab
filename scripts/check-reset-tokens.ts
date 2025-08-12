require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';

async function checkResetTokens() {
  try {
    console.log('🔍 Checking password reset tokens...\n');
    
    const result = await query(
      `SELECT token, user_id, expires_at, used_at, created_at 
       FROM password_reset_tokens 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    console.log(`📊 Found ${result.rows.length} recent tokens:\n`);
    
    for (const row of result.rows) {
      const now = new Date();
      const expiresAt = new Date(row.expires_at);
      const isExpired = now > expiresAt;
      const isUsed = !!row.used_at;
      
      console.log(`🔑 Token: ${row.token.substring(0, 10)}...`);
      console.log(`👤 User ID: ${row.user_id}`);
      console.log(`⏰ Created: ${new Date(row.created_at).toLocaleString()}`);
      console.log(`⏳ Expires: ${expiresAt.toLocaleString()}`);
      console.log(`📅 Status: ${isUsed ? '✅ Used' : isExpired ? '❌ Expired' : '🟢 Valid'}`);
      
      if (!isUsed && !isExpired) {
        const resetUrl = `http://localhost:3000/ru/auth/reset-password?token=${row.token}`;
        console.log(`🔗 Reset URL: ${resetUrl}`);
      }
      
      console.log('─'.repeat(50));
    }
    
  } catch (error) {
    console.error('❌ Error checking tokens:', error);
  }
}

checkResetTokens();