import { KeyboardEvent, useState } from 'react'
import styles from './PromptComposer.module.scss'

type PromptComposerProps = {
  loading?: boolean
  onSend?: (value: string, files: string[]) => void | Promise<void>
  onStop?: () => void
}

export default function PromptComposer(props: PromptComposerProps) {
  const { loading = false, onSend, onStop } = props
  const [value, setValue] = useState('')

  async function submit() {
    const message = value.trim()
    if (!message || loading) return

    await onSend?.(message, [])
    setValue('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div className={styles.composer}>
      <textarea
        aria-label="消息"
        className={styles.input}
        value={value}
        placeholder="向 DeepSearch 提问"
        autoFocus
        rows={1}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="添加附件"
        >
          +
        </button>

        <span className={`${styles.mode} ${styles.modeActive}`}>深度研究</span>
        <span className={styles.mode}>联网</span>

        <span className={styles.spacer} />

        {loading ? (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.stopButton}`}
            aria-label="停止生成"
            onClick={onStop}
          >
            ■
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.sendButton}`}
            aria-label="发送"
            onClick={() => void submit()}
          >
            ↑
          </button>
        )}
      </div>
    </div>
  )
}
