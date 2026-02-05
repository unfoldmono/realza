'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types/database'
import { sendMessage } from '@/lib/actions/messages'

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function ConversationClient(props: {
  listingId: string
  otherUserId: string
  currentUserId: string
  otherUserName: string
  initialMessages: Message[]
}) {
  const { listingId, otherUserId, currentUserId, otherUserName } = props

  const [messages, setMessages] = useState<Message[]>(props.initialMessages ?? [])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const markRead = async () => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('listing_id', listingId)
      .eq('sender_id', otherUserId)
      .eq('recipient_id', currentUserId)
      .eq('read', false)
  }

  // Keep local state in sync if the server rendered messages change
  useEffect(() => {
    setMessages(props.initialMessages ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, otherUserId])

  useEffect(() => {
    // Mark any existing incoming messages as read when opening the thread
    markRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, otherUserId, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${listingId}:${currentUserId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload) => {
          const m = payload.new as Message

          const inThisThread =
            (m.sender_id === currentUserId && m.recipient_id === otherUserId) ||
            (m.sender_id === otherUserId && m.recipient_id === currentUserId)

          if (!inThisThread) return

          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev
            return [...prev, m]
          })

          if (m.sender_id === otherUserId && m.recipient_id === currentUserId) {
            // We’re viewing the conversation, so mark it read immediately.
            await supabase.from('messages').update({ read: true }).eq('id', m.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, listingId, currentUserId, otherUserId])

  const onSend = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const content = text.trim()
    if (!content) return

    setText('')

    startTransition(async () => {
      const result = await sendMessage(listingId, otherUserId, content)
      if (result?.error) {
        setError(result.error)
        setText(content)
        return
      }

      if (result?.message) {
        setMessages((prev) => {
          if (prev.some((x) => x.id === result.message!.id)) return prev
          return [...prev, result.message as Message]
        })
      }
    })
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="text-sm text-gray-600">
          Chat with <span className="font-medium text-gray-900">{otherUserName}</span>
        </div>
      </div>

      <div className="h-[65vh] overflow-y-auto px-4 py-5 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-16">
            No messages yet. Say hello.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%]`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      mine ? 'bg-[#ff6b4a] text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {m.content}
                  </div>
                  <div className={`text-[11px] mt-1 ${mine ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-4 bg-white">
        {error ? (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSend} className="flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="input flex-1"
            maxLength={2000}
          />
          <button type="submit" className="btn-primary px-5 py-3" disabled={isPending || !text.trim()}>
            {isPending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
