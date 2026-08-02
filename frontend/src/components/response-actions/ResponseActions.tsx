import styles from './ResponseActions.module.scss'

type ResponseActionsProps = {
  content: string
  onRetry?: () => void
}

export default function ResponseActions({ content, onRetry }: ResponseActionsProps) {
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content)
      window.$app?.message.success('已复制 Markdown')
    } catch {
      window.$app?.message.error('复制失败')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      window.$app?.message.success('已复制链接')
    } catch {
      window.$app?.message.error('复制失败')
    }
  }

  return (
    <div className={styles.actions}>
      <button className={styles.button} type="button" onClick={handleCopyLink}>
        复制链接
      </button>
      <button className={styles.button} type="button" onClick={handleCopyMarkdown}>
        复制 Markdown
      </button>
      {onRetry ? (
        <button className={styles.button} type="button" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  )
}
