import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Find all threads with adfire in name
  const threads = await sql`SELECT id, name FROM workspace_projects WHERE name ILIKE '%adfire%'`;
  console.log('AdFire projects:', threads);

  // Also check messages table for threads
  const allThreads = await sql`SELECT DISTINCT thread_id FROM messages WHERE thread_id ILIKE '%adfire%'`;
  console.log('Thread IDs with adfire:', allThreads);

  // Get recent messages with audio from any adfire-like thread
  const audioMessages = await sql`
    SELECT id, thread_id, role, 
           audio_url IS NOT NULL as has_audio,
           LENGTH(audio_url) as audio_size,
           LEFT(content, 100) as content_preview,
           created_at
    FROM messages 
    WHERE (thread_id ILIKE '%adfire%' OR thread_id ILIKE '%dev:%')
      AND audio_url IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 50
  `;

  console.log('\n=== Audio Messages ===');
  for (const m of audioMessages) {
    console.log(`${m.created_at} [${m.thread_id}] ${m.role} - audio: ${m.audio_size} chars - ${m.content_preview}...`);
  }

  // Get all recent messages from adfire threads
  const recentMsgs = await sql`
    SELECT id, thread_id, role, 
           audio_url IS NOT NULL as has_audio,
           LENGTH(audio_url) as audio_size,
           LEFT(content, 100) as content_preview,
           created_at
    FROM messages 
    WHERE thread_id ILIKE '%adfire%'
    ORDER BY created_at DESC
    LIMIT 30
  `;

  console.log('\n=== Recent AdFire Messages ===');
  for (const m of recentMsgs) {
    const audio = m.has_audio ? `[AUDIO ${m.audio_size} chars]` : '';
    console.log(`${m.created_at} [${m.role}] ${audio} ${m.content_preview}...`);
  }
}

main().catch(console.error);
