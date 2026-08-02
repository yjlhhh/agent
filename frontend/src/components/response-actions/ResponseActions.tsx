import styles from './ResponseActions.module.scss'

type ResponseActionsProps = {
  content: string
  onRetry?: () => void
}

export default function ResponseActions({ content, onRetry }: ResponseActionsProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      window.$app?.message.success('已复制')
    } catch {
      window.$app?.message.error('复制失败')
    }
  }

  return (
    <div className={styles.actions}>
      <button className={styles.button} type="button" onClick={handleCopy}>
        复制
      </button>
      {onRetry ? (
        <button className={styles.button} type="button" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  )
}
