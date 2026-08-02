import { KeyboardEvent, forwardRef, useMemo, useState } from 'react'
import { sessionActions, sessionState } from '@/store/session'
import { useSnapshot } from 'valtio'
import styles from './PromptComposer.module.scss'

type PromptComposerProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  autoFocus?: boolean
  loading?: boolean
  onSend?: (value: string, files: string[]) => void | Promise<void>
  onStop?: () => void
}

const PromptComposer = forwardRef<HTMLTextAreaElement, PromptComposerProps>(
  function PromptComposer(props, ref) {
    const {
      value,
      defaultValue = '',
      onValueChange,
      autoFocus = true,
      loading = false,
      onSend,
      onStop,
    } = props

    const [uncontrolled, setUncontrolled] = useState(defaultValue)
    const currentValue = value ?? uncontrolled
    const setCurrentValue = useMemo(() => {
      return (next: string) => {
        onValueChange?.(next)
        if (value === undefined) {
          setUncontrolled(next)
        }
      }
    }, [onValueChange, value])

    const [focused, setFocused] = useState(false)
    const session = useSnapshot(sessionState)

  async function submit() {
    const message = currentValue.trim()
    if (!message || loading) return

    try {
      await onSend?.(message, [])
      setCurrentValue('')
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
        value={currentValue}
        placeholder="向 DeepSearch 提问"
        autoFocus={autoFocus}
        rows={1}
        onChange={(event) => setCurrentValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        ref={ref}
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

        <button
          type="button"
          className={`${styles.mode} ${session.useDeep ? styles.modeActive : ''}`}
          aria-pressed={session.useDeep}
          onClick={() => sessionActions.setUseDeep(!session.useDeep)}
        >
          深度研究
        </button>
        <button
          type="button"
          className={`${styles.mode} ${session.useWeb ? styles.modeActive : ''}`}
          aria-pressed={session.useWeb}
          onClick={() => sessionActions.setUseWeb(!session.useWeb)}
        >
          联网
        </button>

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
  },
)

PromptComposer.displayName = 'PromptComposer'

export default PromptComposer
