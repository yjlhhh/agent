import * as api from '@/api'
import MessageList, {
  type MessageTurn,
} from '@/components/message-list/MessageList'
import PromptComposer from '@/components/prompt-composer/PromptComposer'
import { useChatStream } from '@/hooks/useChatStream'
import { historyToStreamState } from '@/lib/stream/history'
import { initialStreamState } from '@/lib/stream/stream-reducer'
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
  const [turns, setTurns] = useState<MessageTurn[]>([])
  const [question, setQuestion] = useState('')
  const [historyState, setHistoryState] = useState<StreamState | null>(null)
  const cacheRef = useRef(
    new Map<
      string,
      {
        turns: MessageTurn[]
        question: string
        state: StreamState
        usesLiveState: boolean
      }
    >(),
  )
  const streamSessionIdRef = useRef('')
  const turnsRef = useRef(turns)
  const questionRef = useRef(question)
  const currentState =
    historyState ??
    (streamSessionIdRef.current === id ? state : initialStreamState)
  const currentStateRef = useRef(currentState)

  const send = useCallback(
    async (
      message: string,
      attachments: string[],
      archiveCurrent = true,
    ) => {
      const previousQuestion = questionRef.current.trim()
      const previousState = currentStateRef.current
      if (
        archiveCurrent &&
        previousQuestion &&
        previousState.status !== 'idle' &&
        previousState.status !== 'submitting'
      ) {
        setTurns((currentTurns) => [
          ...currentTurns,
          { question: previousQuestion, state: previousState },
        ])
      }

      streamSessionIdRef.current = id
      setQuestion(message)
      setHistoryState(null)
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
    turnsRef.current = turns
  }, [turns])

  useEffect(() => {
    questionRef.current = question
  }, [question])

  useEffect(() => {
    currentStateRef.current = currentState
  }, [currentState])

  useEffect(() => {
    let cancelled = false
    const persistView = () => {
      cancelled = true
      cacheRef.current.set(id, {
        turns: turnsRef.current,
        question: questionRef.current,
        state: currentStateRef.current,
        usesLiveState: streamSessionIdRef.current === id,
      })
    }

    const message = transport.data?.data.message
    if (message) {
      setTurns([])
      setHistoryState(null)
      void send(message, [], false)
      return persistView
    }

    const cached = cacheRef.current.get(id)
    if (cached) {
      setTurns(cached.turns)
      setQuestion(cached.question)
      setHistoryState(
        cached.usesLiveState && streamSessionIdRef.current === id
          ? null
          : cached.state,
      )
      return persistView
    }

    void api.session.detail({ session_id: id }).then(({ data }) => {
      if (cancelled) return

      const historyTurns = data.map((item) => ({
        question: item.user_question,
        state: historyToStreamState(item),
      }))
      const last = historyTurns[historyTurns.length - 1]

      setTurns(historyTurns.slice(0, -1))
      if (last) {
        setQuestion(last.question)
        setHistoryState(last.state)
        return
      }

      setQuestion('')
      setHistoryState(null)
    })

    return persistView
  }, [id, send, transport.data])

  useEffect(() => () => stop(), [stop])

  return (
    <section className={styles.chat}>
      <MessageList
        turns={turns}
        question={question}
        state={currentState}
        onRetry={() => {
          if (question) {
            void send(question, [], false)
          }
        }}
        onAsk={(nextQuestion) => {
          void send(nextQuestion, [])
        }}
      />
      <div className={styles.composer}>
        <PromptComposer
          loading={
            streamSessionIdRef.current === id &&
            ['submitting', 'researching', 'streaming'].includes(state.status)
          }
          onSend={send}
          onStop={stop}
        />
      </div>
    </section>
  )
}
