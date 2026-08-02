import { useEffect, useRef, useState } from 'react'
import AssistantResponse from '@/components/assistant-response/AssistantResponse'
import type { StreamState } from '@/lib/stream/types'
import styles from './MessageList.module.scss'

export type MessageTurn = {
  question: string
  state: StreamState
}

type MessageListProps = {
  turns?: MessageTurn[]
  question: string
  state: StreamState
  onRetry?: () => void
  onAsk?: (question: string) => void
}

export default function MessageList(props: MessageListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [away, setAway] = useState(false)

  function scrollToBottom() {
    const node = ref.current
    if (!node) return

    if (typeof node.scrollTo === 'function') {
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
      return
    }

    node.scrollTop = node.scrollHeight
  }

  useEffect(() => {
    if (!away) {
      scrollToBottom()
    }
  }, [props.state.content, props.turns?.length, away])

  function renderTurn(
    turn: MessageTurn,
    key: string,
    actions?: { onRetry?: () => void; onAsk?: (question: string) => void },
  ) {
    return (
      <section className={styles.turn} key={key}>
        {turn.question.trim() ? (
          <div className={styles.question}>{turn.question}</div>
        ) : null}
        <AssistantResponse
          state={turn.state}
          onRetry={actions?.onRetry}
          onAsk={actions?.onAsk}
        />
      </section>
    )
  }

  return (
    <div
      ref={ref}
      role="log"
      className={styles.viewport}
      onScroll={(event) => {
        const node = event.currentTarget
        setAway(node.scrollHeight - node.scrollTop - node.clientHeight > 160)
      }}
    >
      <div className={styles.content}>
        {(props.turns ?? []).map((turn, index) =>
          renderTurn(turn, `history-${index}-${turn.question}`),
        )}
        {renderTurn(
          { question: props.question, state: props.state },
          'current',
          { onRetry: props.onRetry, onAsk: props.onAsk },
        )}
      </div>
      {away ? (
        <button
          type="button"
          className={styles.jump}
          aria-label="滚动到底部"
          onClick={scrollToBottom}
        >
          ↓
        </button>
      ) : null}
    </div>
  )
}
