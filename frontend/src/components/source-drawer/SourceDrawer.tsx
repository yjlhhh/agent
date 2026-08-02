import { Drawer } from 'antd'
import type { SourceItem } from '@/lib/stream/types'
import styles from './SourceDrawer.module.scss'

type SourceDrawerProps = {
  open: boolean
  onClose: () => void
  sources: SourceItem[]
}

export default function SourceDrawer({ open, onClose, sources }: SourceDrawerProps) {
  if (sources.length === 0) return null

  return (
    <Drawer className={styles.drawer} title="来源" open={open} onClose={onClose}>
      <div className={styles.list}>
        {sources.map((source) => (
          <article className={styles.item} key={source.url}>
            <a className={styles.title} href={source.url} target="_blank" rel="noopener noreferrer">
              {source.title}
            </a>
            <span className={styles.url}>{source.url}</span>
            <p className={styles.snippet}>{source.content}</p>
          </article>
        ))}
      </div>
    </Drawer>
  )
}
