"use client";
import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRole } from '@/components/role-provider';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui';

type Thread = { id:string; buyer_id:string; buyer_name:string; created_at:string };
type Message = { id:string; thread_id:string; sender_id:string; body:string; created_at:string };
const PAGE_SIZE = 50;
export function ChatClient() {
  const { user, role, authChecked } = useRole();
  const params = useSearchParams();
  const context = (params.get('mobil') || '').slice(0,120);
  const suggestedMessage = (params.get('pesan') || '').slice(0,2000);
  const [threads,setThreads] = React.useState<Thread[]>([]);
  const [selected,setSelected] = React.useState('');
  const [messages,setMessages] = React.useState<Message[]>([]);
  const [draft,setDraft] = React.useState(suggestedMessage || (context ? `Halo Admin, saya ingin bertanya tentang ${context}.` : ''));
  const [loading,setLoading] = React.useState(true);
  const [sending,setSending] = React.useState(false);
  const [starting,setStarting] = React.useState(false);
  const [error,setError] = React.useState('');
  const [messageError,setMessageError] = React.useState('');
  const [retry,setRetry] = React.useState(0);
  const [limit,setLimit] = React.useState(PAGE_SIZE);
  const end = React.useRef<HTMLDivElement>(null);
  const messageList = React.useRef<HTMLDivElement>(null);
  const previousHeight = React.useRef<number | null>(null);
  const atBottom = React.useRef(true);
  const admin = role === 'admin';
  const current = threads.find(t=>t.id === selected);
  const client = React.useMemo(()=>createClient(),[]);
  const sessionKey = `${user?.id || ''}:${role}`;
  const currentSession = React.useRef(sessionKey); currentSession.current = sessionKey;

  React.useEffect(()=> { setSelected('');setThreads([]);setMessages([]);setSending(false);setStarting(false);setError('');setMessageError('');setLimit(PAGE_SIZE); },[sessionKey]);
  React.useEffect(()=> {
    if (!authChecked || !user) { setLoading(false); return; }
    let stopped=false;
    async function load() {
      if (document.hidden) return;
      const {data,error:failure} = await client.from('support_threads').select('id,buyer_id,buyer_name,created_at').order('created_at',{ascending:false}).limit(500);
      if (stopped) return;
      setLoading(false);
      if (failure) {setError('Chat belum dapat dimuat. Silakan coba lagi.');return;}
      setError('');setThreads(data || []);
      if (!admin) setSelected(data?.[0]?.id || '');
    }
    setLoading(true);void load();
    const timer=setInterval(load,5000);
    window.addEventListener('focus',load);
    return ()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',load);};
  },[authChecked,user?.id,admin,client,retry]);

  React.useEffect(()=> { setMessages([]); setLimit(PAGE_SIZE); atBottom.current=true; previousHeight.current=null; },[selected,sessionKey]);
  React.useLayoutEffect(()=> {
    const list=messageList.current;
    if(list && previousHeight.current !== null) { list.scrollTop += list.scrollHeight-previousHeight.current; previousHeight.current=null; }
  },[messages]);
  React.useEffect(()=> {
    setMessageError('');
    if (!selected) return;
    let stopped=false;
    async function load() {
      if(document.hidden) return;
      const {data,error:failure}=await client.from('support_messages').select('id,thread_id,sender_id,body,created_at').eq('thread_id',selected).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit);
      if(stopped)return;
      if(failure){setMessageError('Pesan belum dapat dimuat. Coba muat ulang.');return;}
      setMessageError('');setMessages((data || []).reverse());
    }
    void load();const timer=setInterval(load,3000);window.addEventListener('focus',load);
    return ()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',load);};
  },[selected,client,limit,retry,sessionKey]);
  React.useEffect(()=> {if(atBottom.current)end.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[messages.at(-1)?.id]);

  async function start() {
    if(!user || starting || admin)return;
    const key=currentSession.current;
    setStarting(true);setError('');
    const {data,error:failure}=await client.from('support_threads').insert({buyer_id:user.id,buyer_name:String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pembeli').slice(0,80)}).select().single();
    if(currentSession.current !== key)return;
    setStarting(false);
    if(failure){ if(failure.code === '23505'){setRetry(n=>n+1);return;}setError('Percakapan belum dapat dibuat. Silakan coba lagi.');return;}
    setThreads([data]);setSelected(data.id);
  }
  async function send(event:React.FormEvent) {
    event.preventDefault();const body=draft.trim();
    if(!body || body.length>2000 || !user || !selected || sending)return;
    const key=currentSession.current;
    const threadId=selected;
    setSending(true);setMessageError('');
    const {data,error:failure}=await client.from('support_messages').insert({thread_id:threadId,sender_id:user.id,body}).select().single();
    if(currentSession.current !== key)return;
    setSending(false);
    if(failure){setMessageError('Pesan belum terkirim. Teks tetap tersimpan di kolom pesan; coba kirim lagi.');return;}
    setDraft('');atBottom.current=true;
    setMessages(prev=>prev.some(m=>m.id===data.id)?prev:[...prev,data].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id)));
    // Refresh other inboxes through the next polling cycle. No optimistic success before DB acknowledgement.
  }
  if(authChecked && !user)return <div className="surface empty-state"><h2>Masuk untuk memulai chat</h2><p>Percakapanmu tersimpan di akun dan hanya dapat dibaca oleh kamu serta admin.</p><Link href="/login" className="button-primary">Masuk ke akun</Link></div>;
  return <div><PageHeader title={admin?'Kotak Masuk':'Chat Admin'} description={admin?'Baca dan balas pertanyaan pembeli.':'Tanyakan informasi kendaraan atau bantuan penggunaan website.'} /><div className={`chat-layout ${admin?'chat-admin':''}`}>{admin?<aside className="surface chat-inbox"><h2 className="text-sm font-semibold">Percakapan pembeli</h2><p className="mt-1 text-[11px] text-slate-500">{threads.length} percakapan · disegarkan otomatis</p><div className="mt-4 space-y-1">{threads.map(t=><button key={t.id} type="button" disabled={sending} aria-pressed={selected===t.id} onClick={()=>{setSelected(t.id);setDraft('');setLimit(PAGE_SIZE);}} className={`chat-thread ${selected===t.id?'is-selected':''}`}><span className="block break-words text-xs font-semibold">{t.buyer_name}</span><span className="mt-1 block text-[10px] text-slate-500">Dibuka {new Date(t.created_at).toLocaleDateString('id-ID')}</span></button>)}</div>{!loading&&!threads.length?<p className="page-description">Belum ada percakapan pembeli.</p>:null}</aside>:null}<section className="surface chat-panel" aria-label="Percakapan">{error?<div role="alert" className="m-5 rounded-lg bg-amber-50 p-4 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{error}<button onClick={()=>setRetry(n=>n+1)} className="ml-3 underline">Coba lagi</button></div>:null}{loading?<p role="status" className="p-6 text-xs text-slate-500">Memuat percakapan…</p>:selected?<><header className="chat-heading"><div><h2 className="text-sm font-semibold">{admin?current?.buyer_name || 'Pembeli':'Admin AutoBuyCars'}</h2><p className="mt-1 text-[10px] text-slate-500">Balasan tampil otomatis. Admin akan merespons saat tersedia.</p></div><span className="soft-icon !h-8 !w-8 text-sm">✉</span></header><div ref={messageList} className="chat-messages" role="log" aria-label="Riwayat pesan" aria-live="polite" onScroll={e=>{const el=e.currentTarget;atBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<70;}}>{messages.length>=limit?<button onClick={()=>{previousHeight.current=messageList.current?.scrollHeight ?? null;atBottom.current=false;setLimit(n=>n+PAGE_SIZE);}} className="button-secondary mx-auto mb-4">Muat pesan sebelumnya</button>:null}{!messages.length?<p className="my-auto text-center text-xs text-slate-500">Belum ada pesan. Mulai percakapan di bawah.</p>:null}{messages.map(m=><article key={m.id} className={`chat-bubble ${m.sender_id===user?.id?'chat-mine':''}`}><p className="mb-1 text-[10px] font-semibold opacity-70">{m.sender_id===user?.id?'Kamu':m.sender_id===current?.buyer_id?'Pembeli':'Admin'}</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p><time className="mt-2 block text-right text-[9px] opacity-60" dateTime={m.created_at}>{new Date(m.created_at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time></article>)}<div ref={end}/></div><form onSubmit={send} className="chat-composer">{messageError?<p role="alert" className="mb-2 text-xs text-red-600">{messageError}<button type="button" onClick={()=>setRetry(n=>n+1)} className="ml-2 underline">Muat ulang</button></p>:null}<label htmlFor="chat-message" className="sr-only">Tulis pesan</label><textarea id="chat-message" value={draft} disabled={sending} onChange={e=>setDraft(e.target.value)} maxLength={2000} rows={2} placeholder="Tulis pesanmu…" className="w-full resize-none border p-3 text-sm" /><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-slate-500">{draft.length}/2000</span><button type="submit" disabled={sending || !draft.trim()} className="button-primary disabled:opacity-40">{sending?'Mengirim…':'Kirim pesan'}</button></div></form></>:!loading&&!error?<div className="empty-state my-auto"><span className="soft-icon">✉</span><h2>{admin?'Pilih percakapan':'Ada yang ingin ditanyakan?'}</h2><p>{admin?'Pilih pembeli dari daftar untuk membaca dan membalas pesannya.':'Mulai chat dengan admin. Pesan akan tersimpan di akunmu.'}</p>{!admin?<button onClick={start} disabled={starting} className="button-primary">{starting?'Menyiapkan…':'Mulai percakapan'}</button>:null}</div>:null}</section></div></div>;
}
