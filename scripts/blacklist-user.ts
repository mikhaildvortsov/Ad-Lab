#!/usr/bin/env tsx

import { 
  blacklistUser, 
  removeFromBlacklist, 
  getBlacklistedUsers, 
  isUserBlacklisted,
  cleanOldBlacklistEntries,
  loadFromFile,
  persistToFile
} from '@/lib/token-blacklist';

// CLI interface for blacklist management
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    return;
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'add':
    case 'blacklist':
      await handleBlacklist(args.slice(1));
      break;
    
    case 'remove':
    case 'unblacklist':
      await handleRemove(args.slice(1));
      break;
    
    case 'check':
      await handleCheck(args.slice(1));
      break;
    
    case 'list':
      await handleList();
      break;
    
    case 'clean':
      await handleClean(args.slice(1));
      break;
    
    default:
      console.log(`❌ Unknown command: ${command}`);
      printUsage();
      break;
  }
}

function printUsage() {
  console.log(`
🚫 Session Blacklist Management Tool

Usage:
  npx tsx scripts/blacklist-user.ts <command> [options]

Commands:
  add/blacklist    - Add user to blacklist
  remove/unblacklist - Remove user from blacklist  
  check           - Check if user is blacklisted
  list            - List all blacklisted users
  clean           - Clean old blacklist entries

Examples:
  # Blacklist user by name
  npx tsx scripts/blacklist-user.ts add --name "Михаил Дворцов"
  
  # Blacklist user by email
  npx tsx scripts/blacklist-user.ts add --email "user@example.com"
  
  # Check if user is blacklisted
  npx tsx scripts/blacklist-user.ts check --name "Михаил Дворцов"
  
  # Remove user from blacklist
  npx tsx scripts/blacklist-user.ts remove --name "Михаил Дворцов"
  
  # List all blacklisted users
  npx tsx scripts/blacklist-user.ts list
  
  # Clean entries older than 7 days
  npx tsx scripts/blacklist-user.ts clean --days 7
`);
}

async function handleBlacklist(args: string[]) {
  // Load existing blacklist from file
  await loadFromFile();
  
  const criteria = parseUserCriteria(args);
  const reason = getArgValue(args, '--reason') || 'Manual blacklist via CLI';
  
  if (!criteria.userName && !criteria.userEmail && !criteria.userId) {
    console.log('❌ Error: Must specify --name, --email, or --id');
    return;
  }

  blacklistUser({
    ...criteria,
    reason
  });

  // Save to file
  await persistToFile();

  const identifier = criteria.userName || criteria.userEmail || criteria.userId;
  console.log(`✅ User "${identifier}" has been blacklisted.`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Session will be invalidated on next request.`);
}

async function handleRemove(args: string[]) {
  // Load existing blacklist from file
  await loadFromFile();
  
  const criteria = parseUserCriteria(args);
  
  if (!criteria.userName && !criteria.userEmail && !criteria.userId) {
    console.log('❌ Error: Must specify --name, --email, or --id');
    return;
  }

  const removed = removeFromBlacklist(criteria);
  const identifier = criteria.userName || criteria.userEmail || criteria.userId;
  
  if (removed) {
    // Save to file
    await persistToFile();
    console.log(`✅ User "${identifier}" has been removed from blacklist.`);
  } else {
    console.log(`⚠️  User "${identifier}" was not found in blacklist.`);
  }
}

async function handleCheck(args: string[]) {
  // Load existing blacklist from file
  await loadFromFile();
  
  const criteria = parseUserCriteria(args);
  
  if (!criteria.userName && !criteria.userEmail && !criteria.userId) {
    console.log('❌ Error: Must specify --name, --email, or --id');
    return;
  }

  const isBlacklisted = isUserBlacklisted({
    id: criteria.userId,
    email: criteria.userEmail,
    name: criteria.userName
  });

  const identifier = criteria.userName || criteria.userEmail || criteria.userId;
  
  if (isBlacklisted) {
    console.log(`🚫 User "${identifier}" IS blacklisted.`);
  } else {
    console.log(`✅ User "${identifier}" is NOT blacklisted.`);
  }
}

async function handleList() {
  // Load existing blacklist from file
  await loadFromFile();
  
  const blacklistedUsers = getBlacklistedUsers();
  
  if (blacklistedUsers.length === 0) {
    console.log('✅ No users are currently blacklisted.');
    return;
  }

  console.log(`🚫 Found ${blacklistedUsers.length} blacklisted user(s):`);
  console.log('='.repeat(80));
  
  for (const entry of blacklistedUsers) {
    console.log(`👤 User: ${entry.userName || entry.userEmail || entry.userId || 'Unknown'}`);
    if (entry.userName) console.log(`   Name: ${entry.userName}`);
    if (entry.userEmail) console.log(`   Email: ${entry.userEmail}`);
    if (entry.userId) console.log(`   ID: ${entry.userId}`);
    console.log(`   Blacklisted: ${new Date(entry.timestamp).toLocaleString()}`);
    console.log(`   Reason: ${entry.reason || 'No reason specified'}`);
    console.log('-'.repeat(40));
  }
}

async function handleClean(args: string[]) {
  // Load existing blacklist from file
  await loadFromFile();
  
  const daysStr = getArgValue(args, '--days');
  const days = daysStr ? parseInt(daysStr) : 7;
  
  if (isNaN(days) || days <= 0) {
    console.log('❌ Error: --days must be a positive number');
    return;
  }

  const removedCount = cleanOldBlacklistEntries(days);
  
  if (removedCount > 0) {
    // Save to file
    await persistToFile();
  }
  
  console.log(`🧹 Cleaned ${removedCount} blacklist entries older than ${days} days.`);
}

function parseUserCriteria(args: string[]) {
  return {
    userName: getArgValue(args, '--name'),
    userEmail: getArgValue(args, '--email'),
    userId: getArgValue(args, '--id')
  };
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
} 