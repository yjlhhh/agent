import * as api from '@/api'
import MessageList from '@/components/message-list/MessageList'
import PromptComposer from '@/components/prompt-composer/PromptComposer'
import { useChatStream } from '@/hooks/useChatStream'
import { initialStreamState } from '@/lib/stream/stream-reducer'
import { mapThinkingToMilestone } from '@/lib/stream/thinking-mapper'
import type { SourceItem, StreamState } from '@/lib/stream/types'
import { sessionState } from '@/store/session'
import { usePageTransport } from '@/utils/usePageTransport'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import styles from './index.module.scss'
import { transportToChatEnter } from './shared'

type SessionHistoryItem = {
  user_question: string
  model_answer: string
  think?: string
  documents?: string
  recommended_questions?: string[]
}

function parseHistorySources(documents?: string): SourceItem[] {
  if (!documents) {
    return []
  }

  try {
    return JSON.parse(documents) as SourceItem[]
  } catch (error) {
    console.error(error)
    return []
  }
}

function parseHistoryRecommendations(recommendedQuestions?: string[]) {
  if (!recommendedQuestions) {
    return []
  }

  try {
    return recommendedQuestions.map((question) => question.replace(/^"/, ''))
  } catch (error) {
    console.error(error)
    return []
  }
}

export function mapSessionHistoryItem(item: SessionHistoryItem): {
  question: string
  state: StreamState
} {
  const milestones = item.think ? [mapThinkingToMilestone(item.think)] : []
  const sources = parseHistorySources(item.documents)
  const recommendations = parseHistoryRecommendations(item.recommended_questions)

  return {
    question: item.user_question,
    state: {
      ...initialStreamState,
      status: item.model_answer ? 'completed' : 'idle',
      content: item.model_answer,
      milestones,
      sources,
      recommendations,
    },
  }
}

export async function loadSessionHistory(sessionId: string) {
  const { data } = await api.session.detail({
    session_id: sessionId,
  })

  return data.map(mapSessionHistoryItem)
}

export default function Chat() {
  const { id = '' } = useParams()
  const session = useSnapshot(sessionState)
  const { state, send: sendStream, stop } = useChatStream()
  const transport = usePageTransport(transportToChatEnter)
  const [question, setQuestion] = useState('')

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
    const message = transport.data?.data.message
    if (message) {
      void send(message, [])
    }
  }, [send, transport.data])

  useEffect(() => () => stop(), [stop])

  return (
    <section className={styles.chat}>
      <MessageList
        question={question}
        state={state}
        onRetry={() => {
          if (question) {
            void send(question, [])
          }
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
