-- Voice message fields (Telegram-style) for messages table
ALTER TABLE "messages" ADD COLUMN "audio_url" text;
ALTER TABLE "messages" ADD COLUMN "audio_duration_ms" integer;
ALTER TABLE "messages" ADD COLUMN "transcription" text;
