require('dotenv').config({ path: '.env.local' });
import { query } from '@/lib/database';

async function checkUsers() {
  try {
    console.log('👥 Checking users...\n');
    
    const result = await query(
      'SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log(`Found ${result.rows.length} users:\n`);
    
    for (const user of result.rows) {
      console.log(`👤 ID: ${user.id}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`📅 Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('─'.repeat(50));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();