import PromptComposer from '@/components/prompt-composer/PromptComposer'
import { sessionActions } from '@/store/session'
import useSendMessage from '@/utils/useSendMessage'
import { useCallback, useMemo, useRef, useState } from 'react'
import styles from './index.module.scss'

type QuickAction = {
  title: string
  desc: string
  mode: { deep: boolean; web: boolean }
  template: string
}

export default function Index() {
  const send = useSendMessage()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')

  const quickActions = useMemo(() => {
    return [
      {
        title: '深入研究',
        desc: '把结论、依据和来源写清楚',
        mode: { deep: true, web: true },
        template:
          '请帮我深入研究这个问题：\n\n- 背景：\n- 我已知道的：\n- 我想要的结论：\n\n请输出：\n1) 结论（可执行）\n2) 依据与来源（可核查）\n3) 风险与边界\n4) 下一步行动\n',
      },
      {
        title: '撰写或编辑',
        desc: '帮我润色、改写或结构化表达',
        mode: { deep: false, web: false },
        template:
          '请帮我把下面内容改写得更清晰有说服力（保留关键信息，不要编造）：\n\n【原文】\n\n【目标读者】\n【语气】\n【长度】\n',
      },
      {
        title: '搜索网页',
        desc: '联网查找最新信息并给出处',
        mode: { deep: false, web: true },
        template:
          '请联网搜索并总结：\n\n- 主题：\n- 我关心的点：\n- 时间范围：\n\n请输出要点并附上来源链接。\n',
      },
    ] satisfies QuickAction[]
  }, [])

  const applyQuickAction = useCallback((action: QuickAction) => {
    sessionActions.setUseDeep(action.mode.deep)
    sessionActions.setUseWeb(action.mode.web)
    setDraft(action.template)

    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
  }, [])

  return (
    <section className={styles.home}>
      <div className={styles.center}>
        <h1>准备好了，随时开始</h1>
        <p>搜索、研究并综合可信来源</p>
        <PromptComposer
          ref={inputRef}
          value={draft}
          onValueChange={setDraft}
          onSend={async (message) => {
            await send(message)
            setDraft('')
          }}
        />
        <div className={styles.quickActions} aria-label="快捷入口">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className={styles.quickAction}
              onClick={() => applyQuickAction(action)}
            >
              <span className={styles.quickActionTitle}>{action.title}</span>
              <span className={styles.quickActionDesc}>{action.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <small className={styles.footerTip}>
        DeepSearch 可能会出错，请核查重要信息。
      </small>
    </section>
  )
}
