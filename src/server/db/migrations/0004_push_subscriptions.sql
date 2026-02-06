-- Push Subscriptions for Web Push Notifications
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "endpoint" text NOT NULL UNIQUE,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_id" text,
  "created_at" timestamp with time zone NOT NULL
);
