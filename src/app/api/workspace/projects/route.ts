import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { workspaceProjects, messages } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET - List all projects
export async function GET() {
  try {
    const projects = await db
      .select()
      .from(workspaceProjects)
      .orderBy(desc(workspaceProjects.lastActiveAt));

    return NextResponse.json({
      ok: true,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        threadId: p.threadId,
        archived: p.archived,
        createdAt: p.createdAt.getTime(),
        lastActiveAt: p.lastActiveAt.getTime(),
      })),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    
    const now = new Date();
    const id = crypto.randomUUID();
    let threadId = `dev:${slug}`;

    // Check for duplicate thread IDs and make unique
    const existing = await db
      .select({ threadId: workspaceProjects.threadId })
      .from(workspaceProjects);
    
    const existingIds = new Set(existing.map(e => e.threadId));
    let counter = 1;
    while (existingIds.has(threadId)) {
      threadId = `dev:${slug}-${counter}`;
      counter++;
    }

    await db.insert(workspaceProjects).values({
      id,
      name: name.trim(),
      threadId,
      archived: false,
      createdAt: now,
      lastActiveAt: now,
    });

    return NextResponse.json({
      ok: true,
      project: {
        id,
        name: name.trim(),
        threadId,
        archived: false,
        createdAt: now.getTime(),
        lastActiveAt: now.getTime(),
      },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PATCH - Update project (archive, touch lastActiveAt)
export async function PATCH(request: NextRequest) {
  try {
    const { id, archived, touch } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const updates: Partial<{ archived: boolean; lastActiveAt: Date }> = {};
    if (typeof archived === 'boolean') {
      updates.archived = archived;
    }
    if (touch) {
      updates.lastActiveAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    await db
      .update(workspaceProjects)
      .set(updates)
      .where(eq(workspaceProjects.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // First get the project to find its threadId
    const [project] = await db
      .select({ threadId: workspaceProjects.threadId })
      .from(workspaceProjects)
      .where(eq(workspaceProjects.id, id));

    // Delete the project
    await db
      .delete(workspaceProjects)
      .where(eq(workspaceProjects.id, id));

    // Also delete all messages for this project's thread
    if (project?.threadId) {
      await db
        .delete(messages)
        .where(eq(messages.threadId, project.threadId));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
