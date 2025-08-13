# Pricing Migration Guide

## Overview
This guide explains how to apply the pricing fix migration in production to correct incorrect `originalPrice` values in the subscription plans.

## Problem
- **Month plan**: Had `originalPrice` of ₽29,900 instead of ₽6,990
- **Quarter plan**: Had `originalPrice` of ₽99,900 instead of `null`

## Solution
The migration fixes these values to display correct pricing:
- **Week**: ₽1,990 (no strikethrough)
- **Month**: ~~₽6,990~~ ₽2,990 (correct strikethrough)  
- **Quarter**: ₽9,990 (no strikethrough)

## Migration Files
- `scripts/migrations/create-migration-log.sql` - Creates audit log table
- `scripts/migrations/fix-pricing-production.sql` - Main migration script
- `scripts/apply-production-migration.ts` - TypeScript runner with safety checks

## How to Apply Migration

### Option 1: Using npm script (Recommended)
```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Run migration
npm run migrate:pricing
```

### Option 2: Using tsx directly
```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Run migration script
npx tsx scripts/apply-production-migration.ts
```

### Option 3: Direct SQL execution
```bash
# Connect to production database
psql $DATABASE_URL

# Execute migration files in order
\i scripts/migrations/create-migration-log.sql
\i scripts/migrations/fix-pricing-production.sql
```

## Safety Features
- ✅ **Transaction-based**: All changes in single transaction (rollback on error)
- ✅ **Audit logging**: All changes logged to `migration_log` table
- ✅ **Duplicate protection**: Won't apply migration twice
- ✅ **Verification**: Automatic verification of results
- ✅ **Backup logging**: Before/after state saved

## Verification Steps

1. **Check migration log**:
```sql
SELECT * FROM migration_log 
WHERE migration_name = 'fix-pricing-production-2025-01-13'
ORDER BY created_at DESC;
```

2. **Verify pricing data**:
```sql
SELECT name, price_monthly, price_yearly,
  CASE 
    WHEN name = 'Month' AND price_yearly = 6990 THEN '✅ CORRECT'
    WHEN name = 'Quarter' AND price_yearly IS NULL THEN '✅ CORRECT' 
    WHEN name = 'Week' AND price_yearly IS NULL THEN '✅ CORRECT'
    ELSE '❌ NEEDS REVIEW'
  END as status
FROM subscription_plans 
WHERE is_active = true;
```

3. **Test API response**:
```bash
curl https://your-domain.com/api/plans | jq
```

Should return:
```json
{
  "success": true,
  "data": [
    {
      "id": "week",
      "name": "week", 
      "price": 1990,
      "originalPrice": undefined
    },
    {
      "id": "month",
      "name": "month",
      "price": 2990,
      "originalPrice": 6990
    },
    {
      "id": "quarter", 
      "name": "quarter",
      "price": 9990,
      "originalPrice": undefined
    }
  ]
}
```

## Rollback Plan
If needed, rollback can be performed:
```sql
BEGIN;

-- Restore previous values (check migration_log for exact values)
UPDATE subscription_plans SET price_yearly = 29900 WHERE name = 'Month';
UPDATE subscription_plans SET price_yearly = 99900 WHERE name = 'Quarter';

-- Log rollback
INSERT INTO migration_log (migration_name, operation, details) 
VALUES ('fix-pricing-production-2025-01-13', 'ROLLBACK', 'Migration rolled back');

COMMIT;
```

## Post-Migration
After successful migration:
1. Clear browser cache on client devices
2. Monitor for any pricing display issues
3. Verify payment flows work correctly
4. Check analytics for conversion impact

## Contact
If issues arise, check:
- Migration logs in `migration_log` table  
- Application logs for API errors
- Browser console for client-side issues
