// Edge Runtime compatible blacklist system
// Uses in-memory storage with optional persistence through API calls

interface BlacklistEntry {
  userId?: string;
  userEmail?: string;
  userName?: string;
  timestamp: number;
  reason?: string;
}

// In-memory cache (works in both Edge Runtime and Node.js)
let blacklistCache: BlacklistEntry[] = [];
let cacheInitialized = false;

// Initialize with environment variable if available
function initializeBlacklist(): void {
  if (cacheInitialized) return;
  
  try {
    // Try to load from environment variable
    const envBlacklist = process.env.BLACKLIST_DATA;
    if (envBlacklist) {
      blacklistCache = JSON.parse(envBlacklist);
    }
  } catch (error) {
    console.warn('Could not parse BLACKLIST_DATA from environment:', error);
    blacklistCache = [];
  }
  
  cacheInitialized = true;
}

// Add user to blacklist by different criteria
export function blacklistUser(criteria: {
  userId?: string;
  userEmail?: string;
  userName?: string;
  reason?: string;
}): void {
  initializeBlacklist();

  const entry: BlacklistEntry = {
    ...criteria,
    timestamp: Date.now(),
    reason: criteria.reason || 'Manual session termination'
  };

  // Remove existing entry for same user (if any)
  blacklistCache = blacklistCache.filter(item => {
    if (criteria.userId && item.userId === criteria.userId) return false;
    if (criteria.userEmail && item.userEmail === criteria.userEmail) return false;
    if (criteria.userName && item.userName === criteria.userName) return false;
    return true;
  });

  // Add new entry
  blacklistCache.push(entry);

  console.log(`🚫 User blacklisted:`, entry);
}

// Check if user is blacklisted
export function isUserBlacklisted(user: {
  id?: string;
  email?: string;
  name?: string;
}): boolean {
  initializeBlacklist();

  return blacklistCache.some(entry => {
    // Check by user ID
    if (user.id && entry.userId === user.id) return true;
    
    // Check by email (case-insensitive)
    if (user.email && entry.userEmail?.toLowerCase() === user.email.toLowerCase()) return true;
    
    // Check by name (case-insensitive, exact match)
    if (user.name && entry.userName?.toLowerCase() === user.name.toLowerCase()) return true;
    
    return false;
  });
}

// Remove user from blacklist
export function removeFromBlacklist(criteria: {
  userId?: string;
  userEmail?: string;
  userName?: string;
}): boolean {
  initializeBlacklist();

  const initialLength = blacklistCache.length;
  
  blacklistCache = blacklistCache.filter(item => {
    if (criteria.userId && item.userId === criteria.userId) return false;
    if (criteria.userEmail && item.userEmail?.toLowerCase() === criteria.userEmail.toLowerCase()) return false;
    if (criteria.userName && item.userName?.toLowerCase() === criteria.userName.toLowerCase()) return false;
    return true;
  });

  if (blacklistCache.length < initialLength) {
    console.log(`✅ User removed from blacklist:`, criteria);
    return true;
  }

  return false;
}

// Get all blacklisted entries
export function getBlacklistedUsers(): BlacklistEntry[] {
  initializeBlacklist();
  return [...blacklistCache];
}

// Clear old entries (older than specified days)
export function cleanOldBlacklistEntries(days: number = 30): number {
  initializeBlacklist();

  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  const initialLength = blacklistCache.length;
  
  blacklistCache = blacklistCache.filter(entry => entry.timestamp > cutoffTime);
  
  if (blacklistCache.length < initialLength) {
    const removed = initialLength - blacklistCache.length;
    console.log(`🧹 Cleaned ${removed} old blacklist entries`);
    return removed;
  }

  return 0;
}

// Persist to file (only works in Node.js environment, not Edge Runtime)
export async function persistToFile(): Promise<void> {
  try {
    // Dynamic import to avoid Edge Runtime issues
    const { writeFileSync } = await import('fs');
    const { join } = await import('path');
    
    const BLACKLIST_FILE = join(process.cwd(), 'blacklisted-sessions.json');
    writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklistCache, null, 2));
  } catch (error) {
    // Silently fail in Edge Runtime or if file operations aren't available
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not persist blacklist to file:', error);
    }
  }
}

// Load from file (only works in Node.js environment)
export async function loadFromFile(): Promise<void> {
  try {
    // Dynamic import to avoid Edge Runtime issues
    const { readFileSync, existsSync } = await import('fs');
    const { join } = await import('path');
    
    const BLACKLIST_FILE = join(process.cwd(), 'blacklisted-sessions.json');
    
    if (existsSync(BLACKLIST_FILE)) {
      const data = readFileSync(BLACKLIST_FILE, 'utf8');
      blacklistCache = JSON.parse(data);
      cacheInitialized = true;
      console.log(`📄 Loaded ${blacklistCache.length} blacklisted users from file`);
    }
  } catch (error) {
    // Silently fail in Edge Runtime
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not load blacklist from file:', error);
    }
  }
}

// Sync cache with data (for API endpoints)
export function syncBlacklistData(data: BlacklistEntry[]): void {
  blacklistCache = [...data];
  cacheInitialized = true;
} 