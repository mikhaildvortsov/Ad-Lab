interface BlacklistEntry {
  userId?: string;
  userEmail?: string;
  userName?: string;
  timestamp: number;
  reason?: string;
}
let blacklistCache: BlacklistEntry[] = [];
let cacheInitialized = false;
function initializeBlacklist(): void {
  if (cacheInitialized) return;
  try {
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
  blacklistCache = blacklistCache.filter(item => {
    if (criteria.userId && item.userId === criteria.userId) return false;
    if (criteria.userEmail && item.userEmail === criteria.userEmail) return false;
    if (criteria.userName && item.userName === criteria.userName) return false;
    return true;
  });
  blacklistCache.push(entry);
  console.log(`🚫 User blacklisted:`, entry);
}
export function isUserBlacklisted(user: {
  id?: string;
  email?: string;
  name?: string;
}): boolean {
  initializeBlacklist();
  return blacklistCache.some(entry => {
    if (user.id && entry.userId === user.id) return true;
    if (user.email && entry.userEmail?.toLowerCase() === user.email.toLowerCase()) return true;
    if (user.name && entry.userName?.toLowerCase() === user.name.toLowerCase()) return true;
    return false;
  });
}
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
export function getBlacklistedUsers(): BlacklistEntry[] {
  initializeBlacklist();
  return [...blacklistCache];
}
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
export async function persistToFile(): Promise<void> {
  try {
    const { writeFileSync } = await import('fs');
    const { join } = await import('path');
    const BLACKLIST_FILE = join(process.cwd(), 'blacklisted-sessions.json');
    writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklistCache, null, 2));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not persist blacklist to file:', error);
    }
  }
}
export async function loadFromFile(): Promise<void> {
  try {
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
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not load blacklist from file:', error);
    }
  }
}
export function syncBlacklistData(data: BlacklistEntry[]): void {
  blacklistCache = [...data];
  cacheInitialized = true;
}
