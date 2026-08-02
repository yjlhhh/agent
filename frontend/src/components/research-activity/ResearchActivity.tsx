import type { ResearchMilestone, StreamStatus } from '@/lib/stream/types'
import styles from './ResearchActivity.module.scss'

type ResearchActivityProps = {
  status: StreamStatus
  milestones: ResearchMilestone[]
}

export default function ResearchActivity({ status, milestones }: ResearchActivityProps) {
  if (milestones.length === 0) return null

  const active = status === 'researching' || status === 'streaming'
  const label = active ? '研究中' : '研究过程'

  return (
    <div className={styles.wrap}>
      <details className={styles.details} open={active}>
        <summary className={styles.summary}>
          <span className={styles.badge}>
            <span className={`${styles.dot} ${active ? styles.dotActive : ''}`} />
            {label}
          </span>
          <span>
            {active ? '进行中' : '已完成'} · {milestones.length} 个步骤
          </span>
          <span className={styles.chevron} aria-hidden>
            ▾
          </span>
        </summary>
        <ol className={styles.list}>
        {milestones.map((item) => (
          <li key={item}>{item}</li>
        ))}
        </ol>
      </details>
    </div>
  )
}
