-- 0001_create_subscription.sql
-- Migration: Create subscription table
-- user_id uses standard UUIDv4 without Foreign Key constraint
-- Includes credits and credit_balance (creditBalance) columns

CREATE TABLE IF NOT EXISTS "subscription" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" UUID NOT NULL UNIQUE,
    "subscription_id" TEXT NOT NULL UNIQUE,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "recurring_interval" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "current_period_start" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "current_period_end" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_subscription_status" ON "subscription" ("status");

