import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Send, Search, Users, Mail, MessageSquare, Smartphone,
  Globe, Paperclip, MoreVertical, ChevronDown, ArrowLeft,
  CheckCheck, Check, Building2, Circle,
} from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import type { ChannelType, MessageExt, ThreadExt } from '@/mock/data'
import { MOCK_THREADS, MOCK_MESSAGES, MOCK_USERS } from '@/mock/data'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { cn } from '@/shared/components/cn'
import { Avatar } from '@/shared/components/Avatar'

import { G } from '@/shared/components/GrayKpi'

/** Channel accent — minimal color used ONLY for accent bar and dot */
const CHANNEL_ACCENT: Record<ChannelType, string> = {
  internal: G.primary,
  whatsapp: '#22C55E',
  email: '#3B82F6',
  portal: '#8B5CF6',
}
const CHANNEL_META: Record<ChannelType, { label: string; icon: React.ElementType }> = {
  internal: { label: 'Internal', icon: Users },
  whatsapp: { label: 'WhatsApp', icon: Smartphone },
  email: { label: 'Email', icon: Mail },
  portal: { label: 'Portal', icon: Globe },
}

function ChannelBadge({ channel, size = 'sm' }: { channel: ChannelType; size?: 'xs' | 'sm' }) {
  const { label, icon: Icon } = CHANNEL_META[channel]
  const accent = CHANNEL_ACCENT[channel]
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide"
      style={{
        background: G.canvas, border: `1px solid ${G.border}`, color: accent,
        padding: size === 'xs' ? '1px 6px' : '2px 8px', fontSize: size === 'xs' ? '9px' : '10px',
      }}>
      <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </span>
  )
}

function ChannelDot({ channel }: { channel: ChannelType }) {
  return <div className="h-2.5 w-2.5 rounded-full shrink-0"
    style={{ background: CHANNEL_ACCENT[channel] }} title={CHANNEL_META[channel].label} />
}

// ── Format message timestamp ──────────────────────────────
function msgTime(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'd MMM')
}

// ── Thread list item ──────────────────────────────────────
function ThreadItem({ thread, isActive, onClick }: { thread: ThreadExt; isActive: boolean; onClick: () => void }) {
  const meta = CHANNEL_META[thread.channel]
  const isExternal = thread.channel !== 'internal'
  const accent = CHANNEL_ACCENT[thread.channel]

  return (
    <button
      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all group"
      style={isActive
        ? { background: G.canvas, border: `1px solid ${G.border}`, boxShadow: '0 1px 4px rgba(15,23,42,0.08)' }
        : { border: '1px solid transparent' }
      }
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = G.canvas }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      onClick={onClick}
    >
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-sm text-white"
          style={{ background: isExternal ? G.canvas : G.primary, border: isExternal ? `2px solid ${accent}33` : 'none' }}>
          {isExternal
            ? <meta.icon className="h-5 w-5" style={{ color: accent }} />
            : (thread.is_group
              ? <Users className="h-5 w-5 text-white" />
              : <span>{(thread.title ?? 'D')[0]}</span>)
          }
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center"
          style={{ background: accent, border: `2px solid ${G.white}` }}>
          <div className="h-1 w-1 rounded-full bg-white/80" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <p className="text-sm font-semibold truncate flex-1 leading-snug" style={{ color: G.primary }}>
            {thread.title ?? 'Direct Message'}
          </p>
          <span className="shrink-0 text-[10px] tabular-nums" style={{ color: G.icon }}>
            {thread.last_message_at ? msgTime(thread.last_message_at) : ''}
          </span>
        </div>
        <p className="text-xs truncate leading-relaxed" style={{ color: G.secondary }}>{thread.last_message ?? ''}</p>
      </div>

      {(thread.unread_count ?? 0) > 0 && (
        <span className="self-center flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold px-1.5"
          style={{ background: accent, color: '#FFFFFF' }}>
          {thread.unread_count}
        </span>
      )}
    </button>
  )
}

// ── Message bubble ────────────────────────────────────────
function MessageBubble({ msg, senderName, isOwn }: { msg: MessageExt; senderName: string; isOwn: boolean }) {
  const accent = CHANNEL_ACCENT[msg.source]

  if (msg.source === 'email') {
    return (
      <div className={cn('max-w-[78%]', isOwn ? 'ml-auto' : 'mr-auto')}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <ChannelDot channel={msg.source} />
            <span className="text-xs font-semibold" style={{ color: G.secondary }}>{msg.sender_name ?? senderName}</span>
            <ChannelBadge channel={msg.source} size="xs" />
          </div>
        )}
        <div className="rounded-2xl p-4 shadow-sm"
          style={isOwn
            ? { background: G.primary, boxShadow: '0 2px 8px rgba(15,23,42,0.18)' }
            : { background: G.white, border: `1px solid ${G.border}`, borderLeft: `3px solid ${accent}`, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
          {msg.subject && (
            <div className="flex items-center gap-2 mb-2.5 pb-2.5"
              style={{ borderBottom: `1px solid ${isOwn ? 'rgba(255,255,255,0.15)' : G.border}` }}>
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : accent }} />
              <span className="text-xs font-bold" style={{ color: isOwn ? '#FFFFFF' : G.primary }}>{msg.subject}</span>
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: isOwn ? '#FFFFFF' : G.primary }}>{msg.content}</p>
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {msg.attachments.map(a => (
                <div key={a.name} className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: isOwn ? 'rgba(255,255,255,0.10)' : G.canvas, border: `1px solid ${isOwn ? 'rgba(255,255,255,0.15)' : G.border}` }}>
                  <Paperclip className="h-3.5 w-3.5 shrink-0" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : G.icon }} />
                  <span className="text-xs flex-1 truncate" style={{ color: isOwn ? '#FFFFFF' : G.secondary }}>{a.name}</span>
                  <span className="text-[10px] shrink-0" style={{ color: isOwn ? 'rgba(255,255,255,0.5)' : G.icon }}>{a.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={cn('flex items-center gap-1 mt-1 px-1', isOwn ? 'justify-end' : '')}>
          <span className="text-[10px]" style={{ color: G.icon }}>{msgTime(msg.created_at)}</span>
          {isOwn && <CheckCheck className="h-3 w-3" style={{ color: G.icon }} />}
        </div>
      </div>
    )
  }

  if (msg.source !== 'internal') {
    return (
      <div className={cn('max-w-[72%]', isOwn ? 'ml-auto' : 'mr-auto')}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <ChannelDot channel={msg.source} />
            <span className="text-xs font-semibold" style={{ color: G.secondary }}>{msg.sender_name ?? senderName}</span>
            <ChannelBadge channel={msg.source} size="xs" />
          </div>
        )}
        <div className={cn('rounded-2xl px-4 py-2.5 shadow-sm')}
          style={isOwn
            ? { background: G.primary, boxShadow: '0 2px 8px rgba(15,23,42,0.18)', borderBottomRightRadius: 4 }
            : { background: G.white, border: `1px solid ${G.border}`, borderLeft: `3px solid ${accent}`, borderBottomLeftRadius: 4, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <p className="text-sm leading-relaxed" style={{ color: isOwn ? '#FFFFFF' : G.primary }}>{msg.content}</p>
        </div>
        <div className={cn('flex items-center gap-1 mt-1 px-1', isOwn ? 'justify-end' : '')}>
          <span className="text-[10px]" style={{ color: G.icon }}>{msgTime(msg.created_at)}</span>
          {isOwn && <CheckCheck className="h-3 w-3" style={{ color: G.icon }} />}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-2.5 max-w-[72%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{ background: isOwn ? G.icon : G.primary }}>
        {senderName[0]}
      </div>
      <div>
        {!isOwn && (
          <p className="text-[11px] font-semibold mb-1 px-1" style={{ color: G.secondary }}>{senderName}</p>
        )}
        <div className="rounded-2xl px-4 py-2.5 shadow-sm"
          style={isOwn
            ? { background: G.primary, boxShadow: '0 2px 8px rgba(15,23,42,0.18)', borderBottomRightRadius: 4 }
            : { background: G.white, border: `1px solid ${G.border}`, borderBottomLeftRadius: 4, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <p className="text-sm leading-relaxed" style={{ color: isOwn ? '#FFFFFF' : G.primary }}>{msg.content}</p>
        </div>
        <div className={cn('flex items-center gap-1 mt-1 px-1', isOwn ? 'justify-end' : '')}>
          <span className="text-[10px]" style={{ color: G.icon }}>{msgTime(msg.created_at)}</span>
          {isOwn && <CheckCheck className="h-3 w-3" style={{ color: '#0584C7' }} />}
        </div>
      </div>
    </div>
  )
}

// ── Date divider ──────────────────────────────────────────
function DateDivider({ date }: { date: string }) {
  const d = parseISO(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'd MMMM yyyy')
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: G.border }} />
      <span className="text-[10px] font-semibold uppercase tracking-wider px-2" style={{ color: G.icon }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: G.border }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export function CommunicationPage() {
  const user = useAuthStore(s => s.user)
  const [search, setSearch] = useState('')
  // Default to 'internal' since 'all' is removed
  const [channelFilter, setChannelFilter] = useState<ChannelType>('internal')
  const [selectedId, setSelectedId] = useState<number | null>(MOCK_THREADS[3].id)
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [draft, setDraft] = useState('')
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const threads = MOCK_THREADS.filter(t => {
    if (t.channel !== channelFilter) return false
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selected = MOCK_THREADS.find(t => t.id === selectedId)
  const threadMsgs = selectedId ? (messages[selectedId] ?? []) : []

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [threadMsgs.length, selectedId])

  const handleSend = () => {
    if (!draft.trim() || !selectedId || !user) return
    const newMsg: MessageExt = {
      id: Date.now(), thread_id: selectedId, sender_id: user.id,
      content: draft.trim(), is_read: false, created_at: new Date().toISOString(),
      source: 'internal',
    }
    setMessages(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), newMsg] }))
    setDraft('')
  }

  const getSenderName = (msg: MessageExt): string => {
    if (msg.sender_name) return msg.sender_name
    const u = MOCK_USERS.find(u => u.id === msg.sender_id)
    return u?.full_name ?? 'Unknown'
  }

  const totalUnread = MOCK_THREADS.reduce((s, t) => s + (t.unread_count ?? 0), 0)

  // Unread counts per channel (for badge display in filter pills)
  const unreadByChannel: Record<ChannelType, number> = {
    internal: MOCK_THREADS.filter(t => t.channel === 'internal').reduce((s, t) => s + (t.unread_count ?? 0), 0),
    whatsapp: MOCK_THREADS.filter(t => t.channel === 'whatsapp').reduce((s, t) => s + (t.unread_count ?? 0), 0),
    email: MOCK_THREADS.filter(t => t.channel === 'email').reduce((s, t) => s + (t.unread_count ?? 0), 0),
    portal: MOCK_THREADS.filter(t => t.channel === 'portal').reduce((s, t) => s + (t.unread_count ?? 0), 0),
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${G.border}`, background: G.white }}>
        <div>
          <h1 className="text-base font-bold" style={{ color: G.primary }}>Communication Hub</h1>
          <p className="text-xs" style={{ color: G.secondary }}>
            Internal team + client channels (WhatsApp, Email, Portal)
            {totalUnread > 0 && (
              <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: G.primary, color: '#FFFFFF' }}>{totalUnread} unread</span>
            )}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {(Object.keys(CHANNEL_META) as ChannelType[]).map(ch => (
            <div key={ch} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: CHANNEL_ACCENT[ch] }} />
              <span className="text-[10px]" style={{ color: G.icon }}>{CHANNEL_META[ch].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Thread sidebar ─────────────────────────── */}
        <aside className={cn('flex flex-col w-80 shrink-0', mobileShowThread ? 'hidden' : 'flex', 'lg:flex')}
          style={{ borderRight: `1px solid ${G.border}`, background: G.white }}>

          {/* Search + Filter */}
          <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${G.border}` }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: G.icon }} />
              <input
                type="text" placeholder="Search conversations..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl pl-8 pr-3 py-1.5 text-xs"
                style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }}
              />
            </div>
            {/* Channel filter — only real channels, no "All" */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {(['internal', 'whatsapp', 'email', 'portal'] as const).map(ch => {
                const isSelected = channelFilter === ch
                const accent = CHANNEL_ACCENT[ch]
                const Icon = CHANNEL_META[ch].icon
                const unread = unreadByChannel[ch]
                return (
                  <button key={ch} onClick={() => setChannelFilter(ch)}
                    className="shrink-0 flex items-center gap-1 rounded-full text-[10px] font-semibold transition-all"
                    style={isSelected
                      ? { background: G.primary, color: '#FFFFFF', padding: '3px 10px' }
                      : { background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary, padding: '3px 10px' }
                    }>
                    <Icon className="h-2.5 w-2.5" style={isSelected ? undefined : { color: accent }} />
                    {CHANNEL_META[ch].label}
                    {unread > 0 && (
                      <span className="flex items-center justify-center rounded-full text-[8px] font-bold tabular-nums"
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.25)' : accent,
                          color: '#FFFFFF',
                          minWidth: 14, height: 14, padding: '0 4px',
                        }}>
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Thread list — single section, no headers */}
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <MessageSquare className="h-8 w-8" style={{ color: G.border }} />
                <p className="text-xs" style={{ color: G.icon }}>No {CHANNEL_META[channelFilter].label.toLowerCase()} conversations</p>
              </div>
            ) : (
              threads.map(t => (
                <ThreadItem key={t.id} thread={t} isActive={selectedId === t.id}
                  onClick={() => { setSelectedId(t.id); setMobileShowThread(true) }} />
              ))
            )}
          </div>
        </aside>

        {/* ── Message panel ────────────────────────── */}
        <main className={cn('flex flex-col flex-1 min-w-0', mobileShowThread ? 'flex' : 'hidden', 'lg:flex')}
          style={{ background: G.canvas }}>
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <MessageSquare className="h-16 w-16" style={{ color: G.border }} />
              <p className="text-sm" style={{ color: G.secondary }}>Select a conversation to start</p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-4 py-3 shrink-0"
                style={{ borderBottom: `1px solid ${G.border}`, background: G.white }}>
                <button className="lg:hidden mr-1" style={{ color: G.secondary }} onClick={() => setMobileShowThread(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  {(() => {
                    const ChIcon = CHANNEL_META[selected.channel].icon
                    return selected.channel === 'internal'
                      ? (selected.is_group
                        ? <Users className="h-4 w-4" style={{ color: G.icon }} />
                        : <span className="text-sm font-bold" style={{ color: G.primary }}>{(selected.title ?? 'D')[0]}</span>)
                      : <ChIcon className="h-4 w-4" style={{ color: CHANNEL_ACCENT[selected.channel] }} />
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: G.primary }}>{selected.title ?? 'Direct Message'}</p>
                    <ChannelBadge channel={selected.channel} size="xs" />
                  </div>
                  <p className="text-[10px] truncate" style={{ color: G.secondary }}>
                    {selected.channel === 'internal'
                      ? `${selected.participants?.length ?? 2} participants`
                      : selected.client_name ?? 'External contact'}
                  </p>
                </div>
                <button style={{ color: G.icon }}>
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* External channel notice */}
              {selected.channel !== 'internal' && (() => {
                const ChIcon = CHANNEL_META[selected.channel].icon
                const accent = CHANNEL_ACCENT[selected.channel]
                return (
                  <div className="flex items-center gap-2 px-4 py-2 text-xs shrink-0"
                    style={{ background: G.canvas, borderBottom: `1px solid ${G.border}`, borderLeft: `3px solid ${accent}`, color: G.primary }}>
                    <ChIcon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                    <span className="font-medium">
                      {selected.channel === 'whatsapp' && 'Messages via WhatsApp — replies go out as WhatsApp messages to client'}
                      {selected.channel === 'email' && 'Email thread — your replies will be sent as email'}
                      {selected.channel === 'portal' && 'Client Portal — messages sent through the AuditLens client portal'}
                    </span>
                  </div>
                )
              })()}

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMsgs.map((msg, i) => {
                  const prev = i > 0 ? threadMsgs[i - 1] : null
                  const showDateDiv = !prev || format(parseISO(msg.created_at), 'yyyyMMdd') !== format(parseISO(prev.created_at), 'yyyyMMdd')
                  const isOwn = msg.sender_id === user?.id
                  return (
                    <div key={msg.id}>
                      {showDateDiv && <DateDivider date={msg.created_at} />}
                      <MessageBubble msg={msg} senderName={getSenderName(msg)} isOwn={isOwn} />
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose area */}
              <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${G.border}`, background: G.white }}>
                {selected.channel !== 'internal' && (
                  <div className="flex items-center gap-1.5 mb-2 rounded-xl px-2.5 py-1.5"
                    style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                    {(() => { const ChIcon = CHANNEL_META[selected.channel].icon; return <ChIcon className="h-3 w-3 shrink-0" style={{ color: CHANNEL_ACCENT[selected.channel] }} /> })()}
                    <p className="text-[10px] font-medium" style={{ color: G.secondary }}>
                      Replying via {CHANNEL_META[selected.channel].label} — message sent to client
                    </p>
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-2xl p-1.5"
                  style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={
                      selected.channel === 'internal' ? 'Type a message to your team… (Enter to send)' :
                        selected.channel === 'whatsapp' ? 'Type a WhatsApp message…' :
                          selected.channel === 'email' ? 'Type your email reply…' :
                            'Type a portal message…'
                    }
                    className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none bg-transparent"
                    style={{ color: G.primary }}
                  />
                  <button
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: draft.trim() ? G.primary : G.icon, boxShadow: draft.trim() ? '0 2px 8px rgba(15,23,42,0.20)' : 'none' }}
                    disabled={!draft.trim()}
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[9px] mt-1.5 px-1" style={{ color: G.icon }}>Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}