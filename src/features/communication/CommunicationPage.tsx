import { useState, useRef, useEffect } from 'react'
import {
  Send, Search, Users, Mail, MessageSquare, Smartphone,
  Globe, Paperclip, MoreVertical, ArrowLeft,
  CheckCheck, Plus, Smile, Mic, Bell, User,
} from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import type { ChannelType, MessageExt, ThreadExt } from '@/mock/data'
import { MOCK_THREADS, MOCK_MESSAGES, MOCK_USERS } from '@/mock/data'
import { useAuthStore } from '@/shared/hooks/useAuthStore'
import { cn } from '@/shared/components/cn'
import { Avatar } from '@/shared/components/Avatar'
import { toast } from 'sonner'

/** Communication tab only — charcoal / white / black (30 / 60 / 10) */
const C = {
  canvas: '#FFFFFF',
  white: '#FFFFFF',
  border: '#D4D4D4',
  icon: '#737373',
  secondary: '#525252',
  primary: '#0A0A0A',
  accent: '#0A0A0A',
  charcoal: '#404040',
  highlight: '#F5F5F5',
} as const

const CHANNEL_ACCENT: Record<ChannelType, string> = {
  internal: C.accent,
  whatsapp: '#22C55E',
  email: C.charcoal,
  portal: C.icon,
}
const CHANNEL_META: Record<ChannelType, { label: string; icon: React.ElementType }> = {
  internal: { label: 'Internal', icon: Users },
  whatsapp: { label: 'WhatsApp', icon: Smartphone },
  email: { label: 'Email', icon: Mail },
  portal: { label: 'Portal', icon: Globe },
}

type ChannelFilter = ChannelType | 'all'

function ChannelBadge({ channel, size = 'sm' }: { channel: ChannelType; size?: 'xs' | 'sm' }) {
  const { label, icon: Icon } = CHANNEL_META[channel]
  const accent = CHANNEL_ACCENT[channel]
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide"
      style={{
        background: C.canvas, border: `1px solid ${C.border}`, color: accent,
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

function msgTime(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'd MMM')
}

function threadDisplayName(thread: ThreadExt) {
  if (thread.client_name) return thread.client_name
  return thread.title ?? 'Direct Message'
}

function threadSubtitle(thread: ThreadExt) {
  if (thread.channel !== 'internal' && thread.title) {
    const m = thread.title.match(/^([^(]+)/)
    if (m) return `@${m[1].trim().toLowerCase().replace(/\s+/g, '')}`
  }
  if (thread.is_group) return `${thread.participants?.length ?? 2} members`
  return CHANNEL_META[thread.channel].label
}

function threadAvatarName(thread: ThreadExt) {
  if (thread.client_name) return thread.client_name
  if (thread.title?.includes('—')) return thread.title.split('—')[0].trim()
  return thread.title ?? 'Chat'
}

function ThreadListItem({ thread, isActive, onClick }: { thread: ThreadExt; isActive: boolean; onClick: () => void }) {
  const preview = thread.typing ? 'Typing…' : (thread.last_message ?? '')
  const accent = CHANNEL_ACCENT[thread.channel]

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all"
      style={{
        background: isActive ? '#EFF8FF' : 'transparent',
        border: isActive ? `1px solid ${C.accent}33` : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.canvas }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div className="relative shrink-0">
        <Avatar name={threadAvatarName(thread)} size="md" />
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white"
          style={{ background: accent }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: C.primary }}>
            {threadDisplayName(thread)}
          </p>
          <span className="shrink-0 text-[10px] tabular-nums" style={{ color: C.icon }}>
            {thread.last_message_at ? msgTime(thread.last_message_at) : ''}
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: thread.typing ? C.accent : C.secondary, fontStyle: thread.typing ? 'italic' : 'normal' }}>
          {preview}
        </p>
      </div>

      {(thread.unread_count ?? 0) > 0 && (
        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold px-1.5 text-white"
          style={{ background: C.accent }}>
          {thread.unread_count}
        </span>
      )}
    </button>
  )
}

function MessageBubble({ msg, senderName, isOwn }: { msg: MessageExt; senderName: string; isOwn: boolean }) {
  const accent = CHANNEL_ACCENT[msg.source]

  if (msg.source === 'email') {
    return (
      <div className={cn('max-w-[78%]', isOwn ? 'ml-auto' : 'mr-auto')}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <Avatar name={senderName} size="sm" />
            <span className="text-xs font-semibold" style={{ color: C.secondary }}>{msg.sender_name ?? senderName}</span>
            <ChannelBadge channel={msg.source} size="xs" />
          </div>
        )}
        <div className="rounded-2xl p-4"
          style={isOwn
            ? { background: C.accent, boxShadow: '0 2px 8px rgba(5,132,199,0.25)' }
            : { background: C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent}` }}>
          {msg.subject && (
            <div className="flex items-center gap-2 mb-2.5 pb-2.5"
              style={{ borderBottom: `1px solid ${isOwn ? 'rgba(255,255,255,0.15)' : C.border}` }}>
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : accent }} />
              <span className="text-xs font-bold" style={{ color: isOwn ? '#FFFFFF' : C.primary }}>{msg.subject}</span>
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: isOwn ? '#FFFFFF' : C.primary }}>{msg.content}</p>
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {msg.attachments.map(a => (
                <div key={a.name} className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: isOwn ? 'rgba(255,255,255,0.10)' : C.canvas, border: `1px solid ${isOwn ? 'rgba(255,255,255,0.15)' : C.border}` }}>
                  <Paperclip className="h-3.5 w-3.5 shrink-0" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : C.icon }} />
                  <span className="text-xs flex-1 truncate" style={{ color: isOwn ? '#FFFFFF' : C.secondary }}>{a.name}</span>
                  <span className="text-[10px] shrink-0" style={{ color: isOwn ? 'rgba(255,255,255,0.5)' : C.icon }}>{a.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={cn('flex items-center gap-1 mt-1 px-1', isOwn ? 'justify-end' : '')}>
          <span className="text-[10px]" style={{ color: C.icon }}>{msgTime(msg.created_at)}</span>
          {isOwn && <CheckCheck className="h-3 w-3" style={{ color: C.accent }} />}
        </div>
      </div>
    )
  }

  if (msg.source !== 'internal') {
    return (
      <div className={cn('flex items-end gap-2.5 max-w-[75%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
        {!isOwn && <Avatar name={msg.sender_name ?? senderName} size="sm" />}
        <div>
          {!isOwn && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-semibold" style={{ color: C.secondary }}>{msg.sender_name ?? senderName}</span>
              <ChannelBadge channel={msg.source} size="xs" />
            </div>
          )}
          <div className="rounded-2xl px-4 py-2.5"
            style={isOwn
              ? { background: C.accent, color: '#fff', borderBottomRightRadius: 4 }
              : { background: C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent}`, borderBottomLeftRadius: 4 }}>
            <p className="text-sm leading-relaxed" style={{ color: isOwn ? '#FFFFFF' : C.primary }}>{msg.content}</p>
          </div>
          <div className={cn('flex items-center gap-1 mt-1 px-1', isOwn ? 'justify-end' : '')}>
            <span className="text-[10px]" style={{ color: C.icon }}>{msgTime(msg.created_at)}</span>
            {isOwn && <CheckCheck className="h-3 w-3" style={{ color: C.accent }} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-2.5 max-w-[75%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
      <Avatar name={senderName} size="sm" />
      <div>
        {!isOwn && (
          <p className="text-[11px] font-semibold mb-1 px-1" style={{ color: C.secondary }}>{senderName}</p>
        )}
        <div className="rounded-2xl px-4 py-2.5"
          style={isOwn
            ? { background: C.accent, borderBottomRightRadius: 4 }
            : { background: C.white, border: `1px solid ${C.border}`, borderBottomLeftRadius: 4 }}>
          <p className="text-sm leading-relaxed" style={{ color: isOwn ? '#FFFFFF' : C.primary }}>{msg.content}</p>
        </div>
        <div className={cn('flex items-center gap-1 mt-1 px-1', isOwn ? 'justify-end' : '')}>
          <span className="text-[10px]" style={{ color: C.icon }}>{msgTime(msg.created_at)}</span>
          {isOwn && <CheckCheck className="h-3 w-3" style={{ color: C.accent }} />}
        </div>
      </div>
    </div>
  )
}

function DateDivider({ date }: { date: string }) {
  const d = parseISO(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'd MMM yyyy')
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: C.border }} />
      <span className="text-[11px] font-medium px-2" style={{ color: C.icon }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
  )
}

function ThreadSection({ label, threads, selectedId, onSelect }: {
  label: string
  threads: ThreadExt[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  if (threads.length === 0) return null
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: C.icon }}>
        {label}
      </p>
      <div className="space-y-0.5">
        {threads.map(t => (
          <ThreadListItem
            key={t.id}
            thread={t}
            isActive={selectedId === t.id}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function CommunicationPage() {
  const user = useAuthStore(s => s.user)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [selectedId, setSelectedId] = useState<number | null>(MOCK_THREADS.find(t => t.pinned)?.id ?? MOCK_THREADS[0]?.id ?? null)
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [draft, setDraft] = useState('')
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const filteredThreads = MOCK_THREADS.filter(t => {
    if (channelFilter !== 'all' && t.channel !== channelFilter) return false
    const q = search.toLowerCase()
    if (q && !t.title?.toLowerCase().includes(q) && !t.client_name?.toLowerCase().includes(q)) return false
    return true
  })

  const pinnedThreads = filteredThreads.filter(t => t.pinned)
  const allThreads = filteredThreads.filter(t => !t.pinned)

  const selected = MOCK_THREADS.find(t => t.id === selectedId)
  const threadMsgs = selectedId ? (messages[selectedId] ?? []) : []

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [threadMsgs.length, selectedId])

  const handleSend = () => {
    if (!draft.trim() || !selectedId || !user) return
    const newMsg: MessageExt = {
      id: Date.now(), thread_id: selectedId, sender_id: user.id,
      content: draft.trim(), is_read: false, created_at: new Date().toISOString(),
      source: selected?.channel === 'internal' ? 'internal' : selected?.channel ?? 'internal',
    }
    setMessages(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), newMsg] }))
    setDraft('')
  }

  const getSenderName = (msg: MessageExt): string => {
    if (msg.sender_name) return msg.sender_name
    const u = MOCK_USERS.find(u => u.id === msg.sender_id)
    return u?.full_name ?? 'Unknown'
  }

  const selectThread = (id: number) => {
    setSelectedId(id)
    setMobileShowThread(true)
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden" style={{ background: C.canvas }}>

      {/* ── Message list (left panel) ─────────────────────── */}
      <aside
        className={cn(
          'flex flex-col shrink-0 w-full md:w-[340px] lg:w-[360px]',
          mobileShowThread ? 'hidden md:flex' : 'flex',
        )}
        style={{ background: C.white, borderRight: `1px solid ${C.border}` }}
      >
        <div className="px-4 pt-5 pb-3 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: C.primary }}>Message</h2>
          </div>
          <button
            type="button"
            onClick={() => toast.info('New message composer')}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white mb-4 transition-all active:scale-[0.98]"
            style={{ background: C.accent }}
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: C.icon }} />
            <input
              type="text"
              placeholder="Search messages…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
              style={{ background: C.canvas, border: `1px solid ${C.border}`, color: C.primary }}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {(['all', 'internal', 'whatsapp', 'email', 'portal'] as const).map(ch => {
              const isSelected = channelFilter === ch
              const label = ch === 'all' ? 'All' : CHANNEL_META[ch].label
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
                  style={isSelected
                    ? { background: C.accent, color: '#fff' }
                    : { background: C.canvas, border: `1px solid ${C.border}`, color: C.secondary }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 px-4">
              <MessageSquare className="h-10 w-10" style={{ color: C.border }} />
              <p className="text-sm text-center" style={{ color: C.secondary }}>No conversations found</p>
            </div>
          ) : (
            <>
              <ThreadSection label="Pinned" threads={pinnedThreads} selectedId={selectedId} onSelect={selectThread} />
              <ThreadSection label="All Message" threads={allThreads} selectedId={selectedId} onSelect={selectThread} />
            </>
          )}
        </div>
      </aside>

      {/* ── Chat window (right panel) ─────────────────────── */}
      <main
        className={cn(
          'flex flex-col flex-1 min-w-0',
          mobileShowThread ? 'flex' : 'hidden md:flex',
        )}
        style={{ background: C.canvas }}
      >
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: C.white, border: `1px solid ${C.border}` }}>
              <MessageSquare className="h-8 w-8" style={{ color: C.icon }} />
            </div>
            <p className="text-sm font-medium" style={{ color: C.secondary }}>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat top bar */}
            <div className="flex items-center gap-3 px-5 py-3 shrink-0"
              style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
              <button type="button" className="md:hidden shrink-0" style={{ color: C.secondary }} onClick={() => setMobileShowThread(false)}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-base font-bold hidden sm:block" style={{ color: C.primary }}>Chat</h1>
              <div className="flex-1" />
              <div className="relative hidden lg:block w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: C.icon }} />
                <input
                  type="text"
                  placeholder="Search in chat…"
                  className="w-full rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none"
                  style={{ background: C.canvas, border: `1px solid ${C.border}`, color: C.primary }}
                />
              </div>
              <button type="button" className="p-2 rounded-xl hidden sm:flex" style={{ color: C.secondary }}>
                <Bell className="h-4 w-4" />
              </button>
            </div>

            {/* Active conversation header */}
            <div className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={threadAvatarName(selected)} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold truncate" style={{ color: C.primary }}>
                  {threadDisplayName(selected)}
                </p>
                <p className="text-xs truncate" style={{ color: C.secondary }}>
                  {threadSubtitle(selected)}
                  <span className="mx-1.5" style={{ color: C.border }}>·</span>
                  <span style={{ color: '#16A34A' }}>Active recently</span>
                </p>
              </div>
              <ChannelBadge channel={selected.channel} />
              <button
                type="button"
                onClick={() => toast.info('View client profile')}
                className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                style={{ background: C.canvas, border: `1px solid ${C.border}`, color: C.secondary }}
              >
                <User className="h-3.5 w-3.5" />
                View Profile
              </button>
              <button type="button" className="p-2 rounded-xl" style={{ color: C.icon }}>
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {selected.channel !== 'internal' && (
              <div className="flex items-center gap-2 px-5 py-2 text-xs shrink-0"
                style={{ background: '#EFF8FF', borderBottom: `1px solid ${C.accent}22`, color: C.primary }}>
                {(() => {
                  const ChIcon = CHANNEL_META[selected.channel].icon
                  return <ChIcon className="h-3.5 w-3.5 shrink-0" style={{ color: CHANNEL_ACCENT[selected.channel] }} />
                })()}
                <span>
                  Replying via {CHANNEL_META[selected.channel].label}
                  {selected.client_name ? ` · ${selected.client_name}` : ''}
                </span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {threadMsgs.map((msg, i) => {
                const prev = i > 0 ? threadMsgs[i - 1] : null
                const showDateDiv = !prev || format(parseISO(msg.created_at), 'yyyyMMdd') !== format(parseISO(prev.created_at), 'yyyyMMdd')
                const isOwn = msg.sender_id === user?.id && msg.sender_id !== 0
                return (
                  <div key={msg.id} className="mb-3">
                    {showDateDiv && <DateDivider date={msg.created_at} />}
                    <MessageBubble msg={msg} senderName={getSenderName(msg)} isOwn={isOwn} />
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Compose bar */}
            <div className="px-5 py-4 shrink-0" style={{ background: C.white, borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toast.info('Attach file')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                  style={{ background: C.canvas, border: `1px solid ${C.border}`, color: C.secondary }}
                >
                  <Plus className="h-5 w-5" />
                </button>

                <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2"
                  style={{ background: C.canvas, border: `1px solid ${C.border}` }}>
                  <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
                    placeholder="Type a message…"
                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                    style={{ color: C.primary }}
                  />
                  <button type="button" className="p-1 shrink-0" style={{ color: C.icon }}>
                    <Smile className="h-5 w-5" />
                  </button>
                  <button type="button" className="p-1 shrink-0" style={{ color: C.icon }}>
                    <Mic className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!draft.trim()}
                  onClick={handleSend}
                  className="flex items-center gap-2 shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: C.accent }}
                >
                  Send
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
