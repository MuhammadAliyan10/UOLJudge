-- EMERGENCY UNLOCK SCRIPT
-- Run this if the Admin UI freezes and you need to unpause a contest.
-- Usage: docker exec -i uol_judge_db psql -U admin -d uol_judge < panic_unlock.sql

BEGIN;

-- 1. Unpause ALL contests that are currently paused
UPDATE "Contest"
SET "is_paused" = false,
    "paused_at" = NULL
WHERE "is_paused" = true;

-- 2. Log the emergency action
INSERT INTO "SystemLog" ("id", "action", "level", "message", "details", "timestamp")
VALUES (
    gen_random_uuid(),
    'CONTEST_UPDATE',
    'CRITICAL',
    'EMERGENCY UNLOCK TRIGGERED',
    'Manual SQL script execution to unpause contests',
    NOW()
);

COMMIT;

-- Verification
SELECT "id", "name", "is_paused" FROM "Contest";
