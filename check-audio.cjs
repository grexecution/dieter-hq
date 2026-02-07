const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const threads = await prisma.thread.findMany({
    where: { name: { contains: 'adfire' } }
  });
  console.log('AdFire threads:', threads.map(t => ({ id: t.id, name: t.name })));
  
  for (const thread of threads) {
    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        role: true,
        content: true,
        audioUrl: true,
        createdAt: true
      }
    });
    
    console.log(`\n--- Thread: ${thread.name} (${messages.length} recent messages) ---`);
    for (const m of messages) {
      const hasAudio = m.audioUrl ? `AUDIO (${m.audioUrl.length} chars)` : '';
      const preview = m.content?.substring(0, 80) || '(no content)';
      console.log(`${m.createdAt.toISOString()} [${m.role}] ${hasAudio} ${preview}...`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
