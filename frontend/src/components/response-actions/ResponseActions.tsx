type ResponseActionsProps = {
  content: string
  onRetry?: () => void
}

export default function ResponseActions({ content, onRetry }: ResponseActionsProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
  }

  return (
    <div>
      <button type="button" onClick={handleCopy}>
        复制
      </button>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  )
}
