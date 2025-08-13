-- Migration script to update pricing plans with correct prices
-- Run this on production database to ensure correct pricing

-- Update Month plan pricing
UPDATE subscription_plans 
SET 
    price_monthly = 2990.00,
    price_yearly = 6990.00
WHERE name = 'Month';

-- Update Week plan pricing  
UPDATE subscription_plans 
SET 
    price_monthly = 1990.00,
    price_yearly = NULL
WHERE name = 'Week';

-- Update Quarter plan pricing
UPDATE subscription_plans 
SET 
    price_monthly = 9990.00,
    price_yearly = NULL
WHERE name = 'Quarter';

-- Verify the updates
SELECT name, price_monthly, price_yearly FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC;
