import { NextRequest, NextResponse } from 'next/server';

/**
 * Share Target API
 * Handles content shared to the PWA from other apps
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const text = formData.get('text') as string;
    const url = formData.get('url') as string;
    const file = formData.get('file') as File | null;

    console.log('[Share Target] Received:', { title, text, url, file: file?.name });

    // Process the shared content
    // For now, redirect to chat with the shared content
    const params = new URLSearchParams();
    
    if (title) params.set('title', title);
    if (text) params.set('text', text);
    if (url) params.set('url', url);

    // If there's a file, you might want to upload it first
    // and then pass the file ID or URL as a parameter

    return NextResponse.redirect(new URL(`/chat?${params.toString()}`, request.url));
  } catch (error) {
    console.error('[Share Target] Error:', error);
    return NextResponse.redirect(new URL('/chat', request.url));
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
