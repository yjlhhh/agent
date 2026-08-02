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
}

export default function AssistantResponse({ state, onRetry }: AssistantResponseProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const hasSources = state.sources.length > 0

  return (
    <article className={styles.response}>
      <ResearchActivity status={state.status} milestones={state.milestones} />
      <MediaGallery images={state.images} />
      <MarkdownContent value={state.content} />
      {state.error ? <p role="alert">{state.error}</p> : null}
      {hasSources ? (
        <button type="button" onClick={() => setSourcesOpen(true)}>
          查看 {state.sources.length} 个来源
        </button>
      ) : null}
      {state.content ? <ResponseActions content={state.content} onRetry={onRetry} /> : null}
      {hasSources ? (
        <SourceDrawer open={sourcesOpen} onClose={() => setSourcesOpen(false)} sources={state.sources} />
      ) : null}
    </article>
  )
}
