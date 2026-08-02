import { useState } from 'react'
import MarkdownContent from '@/components/markdown-content/MarkdownContent'
import MediaGallery from '@/components/media-gallery/MediaGallery'
import ResearchActivity from '@/components/research-activity/ResearchActivity'
import ResponseActions from '@/components/response-actions/ResponseActions'
import SourceDrawer from '@/components/source-drawer/SourceDrawer'
import type { StreamState } from '@/lib/stream/types'
import styles from './AssistantResponse.module.scss'

type AssistantResponseProps = {
  state: StreamState
  onRetry?: () => void
  onAsk?: (question: string) => void
}

export default function AssistantResponse({ state, onRetry, onAsk }: AssistantResponseProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const hasSources = state.sources.length > 0
  const hasFollowups = state.status === 'completed' && state.recommendations.length > 0
  const hasFooter = hasSources || Boolean(state.content)

  return (
    <article className={styles.response}>
      <ResearchActivity status={state.status} activities={state.activities} />
      <MediaGallery images={state.images} />
      {state.content ? (
        <div className={styles.markdown}>
          <MarkdownContent value={state.content} />
        </div>
      ) : null}

      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      {hasFollowups ? (
        <section className={styles.followups} aria-label="推荐追问">
          <h2 className={styles.followupsTitle}>你还可以问</h2>
          <div className={styles.followupsGrid}>
            {state.recommendations.slice(0, 4).map((q) => (
              <button
                key={q}
                type="button"
                className={styles.followup}
                onClick={() => onAsk?.(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {hasFooter ? (
        <footer className={styles.footer} aria-label="回答操作">
          <div className={styles.footerLeft}>
            {hasSources ? (
              <button
                className={styles.sourcesMeta}
                type="button"
                onClick={() => setSourcesOpen(true)}
              >
                来源 {state.sources.length}
              </button>
            ) : null}
          </div>
          <div className={styles.footerRight}>
            {state.content ? (
              <ResponseActions content={state.content} onRetry={onRetry} />
            ) : null}
          </div>
        </footer>
      ) : null}

      {hasSources ? (
        <SourceDrawer
          open={sourcesOpen}
          onClose={() => setSourcesOpen(false)}
          sources={state.sources}
        />
      ) : null}
    </article>
  )
}
