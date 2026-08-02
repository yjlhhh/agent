import { Drawer } from 'antd'
import type { SourceItem } from '@/lib/stream/types'

type SourceDrawerProps = {
  open: boolean
  onClose: () => void
  sources: SourceItem[]
}

export default function SourceDrawer({ open, onClose, sources }: SourceDrawerProps) {
  if (sources.length === 0) return null

  return (
    <Drawer title="来源" open={open} onClose={onClose}>
      {sources.map((source) => (
        <article key={source.url}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title}
          </a>
          <p>{source.content}</p>
        </article>
      ))}
    </Drawer>
  )
}
