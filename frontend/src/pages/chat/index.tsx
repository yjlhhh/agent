import * as api from '@/api'
import MessageList from '@/components/message-list/MessageList'
import PromptComposer from '@/components/prompt-composer/PromptComposer'
import { useChatStream } from '@/hooks/useChatStream'
import { historyToStreamState } from '@/lib/stream/history'
import type { StreamState } from '@/lib/stream/types'
import { sessionState } from '@/store/session'
import { usePageTransport } from '@/utils/usePageTransport'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import styles from './index.module.scss'
import { transportToChatEnter } from './shared'

export default function Chat() {
  const { id = '' } = useParams()
  const session = useSnapshot(sessionState)
  const { state, send: sendStream, stop } = useChatStream()
  const transport = usePageTransport(transportToChatEnter)
  const [question, setQuestion] = useState('')
  const [historyState, setHistoryState] = useState<StreamState | null>(null)
  const cacheRef = useRef(new Map<string, { question: string; historyState: StreamState | null }>())
  const lastIdRef = useRef<string>('')
  const questionRef = useRef(question)
  const historyStateRef = useRef(historyState)

  const send = useCallback(
    async (message: string, attachments: string[]) => {
      setQuestion(message)
      await sendStream({
        id,
        message,
        attachments,
        webSearch: session.useWeb,
        deepResearch: session.useDeep,
      })
    },
    [id, sendStream, session.useDeep, session.useWeb],
  )

  useEffect(() => {
    questionRef.current = question
  }, [question])

  useEffect(() => {
    historyStateRef.current = historyState
  }, [historyState])

  useEffect(() => {
    // Persist the previous session's view state so switching chats doesn't blank it out.
    const prevId = lastIdRef.current
    if (prevId && prevId !== id) {
      cacheRef.current.set(prevId, {
        question: questionRef.current,
        historyState: historyStateRef.current,
      })
    }
    lastIdRef.current = id

    const message = transport.data?.data.message
    if (message) {
      setHistoryState(null)
      void send(message, [])
      return
    }

    const cached = cacheRef.current.get(id)
    if (cached) {
      setQuestion(cached.question)
      setHistoryState(cached.historyState)
      return
    }

    void api.session.detail({ session_id: id }).then(({ data }) => {
      const last = data.at(-1)
      if (last) {
        setQuestion(last.user_question)
        setHistoryState(historyToStreamState(last))
        return
      }

      setQuestion('')
      setHistoryState(null)
    })
  }, [id, send, transport.data])

  useEffect(() => () => stop(), [stop])

  return (
    <section className={styles.chat}>
      <MessageList
        question={question}
        state={historyState ?? state}
        onRetry={() => {
          if (question) {
            void send(question, [])
          }
        }}
        onAsk={(nextQuestion) => {
          setHistoryState(null)
          void send(nextQuestion, [])
        }}
      />
      <div className={styles.composer}>
        <PromptComposer
          loading={['submitting', 'researching', 'streaming'].includes(state.status)}
          onSend={send}
          onStop={stop}
        />
      </div>
    </section>
  )
}
