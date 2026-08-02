import type {
  ResearchActivityItem,
  StreamStatus,
} from '@/lib/stream/types'
import styles from './ResearchActivity.module.scss'

type ResearchActivityProps = {
  status: StreamStatus
  activities: ResearchActivityItem[]
}

export default function ResearchActivity({ status, activities }: ResearchActivityProps) {
  if (activities.length === 0) return null

  const active = status === 'researching' || status === 'streaming'
  const stateLabel = active ? '思考中' : '已完成'

  return (
    <div className={styles.wrap}>
      <details className={styles.details} open={active}>
        <summary className={styles.summary}>
          <span className={styles.badge}>
            <span className={`${styles.dot} ${active ? styles.dotActive : ''}`} />
            思考过程
          </span>
          <span>
            {stateLabel} · {activities.length} 个步骤
          </span>
          <span className={styles.chevron} aria-hidden>
            ▾
          </span>
        </summary>
        <ol className={styles.timeline}>
          {activities.map((item, index) => {
            const isCurrent = active && index === activities.length - 1
            return (
              <li
                key={`${item.title}-${item.detail}`}
                className={`${styles.step} ${isCurrent ? styles.stepCurrent : ''}`}
              >
                <span className={styles.marker} aria-hidden />
                <div>
                  <strong className={styles.stepTitle}>{item.title}</strong>
                  <p className={styles.stepDetail}>{item.detail}</p>
                </div>
              </li>
            )
          })}
        </ol>
        <p className={styles.disclosure}>
          展示的是可公开的过程摘要，不包含模型内部思维链。
        </p>
      </details>
    </div>
  )
}
