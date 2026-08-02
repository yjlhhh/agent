import PromptComposer from '@/components/prompt-composer/PromptComposer'
import useSendMessage from '@/utils/useSendMessage'
import styles from './index.module.scss'

export default function Index() {
  const send = useSendMessage()

  return (
    <section className={styles.home}>
      <div className={styles.center}>
        <h1>准备好了，随时开始</h1>
        <p>搜索、研究并综合可信来源</p>
        <PromptComposer onSend={(message) => send(message)} />
        <div className={styles.quickActions} aria-label="快捷入口">
          <span>深入研究</span>
          <span>撰写或编辑</span>
          <span>搜索网页</span>
        </div>
      </div>

      <small className={styles.footerTip}>
        DeepSearch 可能会出错，请核查重要信息。
      </small>
    </section>
  )
}
