import { KeyboardEvent, useState } from 'react'
import { sessionState } from '@/store/session'
import { useSnapshot } from 'valtio'
import styles from './PromptComposer.module.scss'

type PromptComposerProps = {
  loading?: boolean
  onSend?: (value: string, files: string[]) => void | Promise<void>
  onStop?: () => void
}

export default function PromptComposer(props: PromptComposerProps) {
  const { loading = false, onSend, onStop } = props
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const session = useSnapshot(sessionState)

  async function submit() {
    const message = value.trim()
    if (!message || loading) return

    try {
      await onSend?.(message, [])
      setValue('')
    } catch {
      // Keep the composed value so the user can retry after a failed send.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const composing =
      // React synthetic event: nativeEvent may expose isComposing
      Boolean((event.nativeEvent as unknown as { isComposing?: boolean })?.isComposing) ||
      // Test helpers often set isComposing on the synthetic event itself
      Boolean((event as unknown as { isComposing?: boolean })?.isComposing)

    if (composing) {
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div
      className={`${styles.composer} ${focused ? styles.composerFocused : ''}`}
      data-testid="prompt-composer"
    >
      <textarea
        aria-label="消息"
        className={styles.input}
        value={value}
        placeholder="向 DeepSearch 提问"
        autoFocus
        rows={1}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="添加附件"
          title="附件上传将在聊天中提供"
          disabled
        >
          +
        </button>

        <span
          className={`${styles.mode} ${session.useDeep ? styles.modeActive : ''}`}
        >
          深度研究
        </span>
        <span
          className={`${styles.mode} ${session.useWeb ? styles.modeActive : ''}`}
        >
          联网
        </span>

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
