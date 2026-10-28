import { Suspense } from 'react';
import { ChatClient } from '@/components/chat-client';
export const metadata = { title: 'Chat' };
export default function ChatPage() { return <Suspense fallback={<p className="page-description">Menyiapkan percakapan…</p>}><ChatClient /></Suspense>; }
