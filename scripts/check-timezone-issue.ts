require('dotenv').config({ path: '.env.local' });

async function checkTimezoneIssue() {
  const { query } = require('../lib/database');
  
  console.log('🕐 Checking timezone and time synchronization issues...\n');

  // Проверяем текущее время базы данных vs системное время
  console.log('📅 System time (Node.js):', new Date().toISOString());
  
  const dbTimeResult = await query('SELECT CURRENT_TIMESTAMP as db_time');
  const dbTime = dbTimeResult.rows[0].db_time;
  console.log('📅 Database time (PostgreSQL):', new Date(dbTime).toISOString());
  
  const timeDiff = Math.abs(new Date().getTime() - new Date(dbTime).getTime());
  console.log(`⏱️  Time difference: ${timeDiff}ms (${(timeDiff / 1000).toFixed(2)} seconds)`);
  
  if (timeDiff > 5000) { // 5 seconds
    console.log('⚠️  WARNING: Significant time difference detected!');
  } else {
    console.log('✅ Time synchronization looks good');
  }

  // Проверяем все неиспользованные токены и их время истечения
  console.log('\n🔍 Checking unused tokens and their expiration...');
  
  const tokensResult = await query(`
    SELECT 
      token, 
      user_id, 
      created_at, 
      expires_at, 
      used_at,
      CASE 
        WHEN expires_at > CURRENT_TIMESTAMP THEN 'VALID'
        ELSE 'EXPIRED'
      END as status,
      EXTRACT(EPOCH FROM (expires_at - CURRENT_TIMESTAMP)) as seconds_until_expiry
    FROM password_reset_tokens 
    WHERE used_at IS NULL 
    ORDER BY created_at DESC
  `);

  if (tokensResult.rows.length === 0) {
    console.log('❌ No unused tokens found');
    return;
  }

  tokensResult.rows.forEach((row, index) => {
    console.log(`\n🔑 Token ${index + 1}: ${row.token.substring(0, 10)}...`);
    console.log(`   👤 User: ${row.user_id}`);
    console.log(`   ⏰ Created: ${new Date(row.created_at).toISOString()}`);
    console.log(`   ⏳ Expires: ${new Date(row.expires_at).toISOString()}`);
    console.log(`   📅 Status: ${row.status}`);
    
    if (row.status === 'VALID') {
      const hoursLeft = row.seconds_until_expiry / 3600;
      console.log(`   ⏱️  Time left: ${hoursLeft.toFixed(2)} hours`);
    } else {
      const hoursAgo = Math.abs(row.seconds_until_expiry) / 3600;
      console.log(`   ⏱️  Expired: ${hoursAgo.toFixed(2)} hours ago`);
    }
  });

  console.log('\n🏁 Timezone check completed!');
}

checkTimezoneIssue();