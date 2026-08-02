import useSendMessage from '@/utils/useSendMessage'
import { debounce } from 'throttle-debounce'
import styles from './index.module.scss'

interface HotQuestion {
  eyebrow: string
  title: string
}

interface HotQuestionsProps {
  list?: HotQuestion[]
}

const list: HotQuestion[] = [
  {
    eyebrow: '智能座舱',
    title: '星辰电动ES9有智能座舱吗？',
  },
  {
    eyebrow: '价格',
    title: '星辰电动ES9卖多少钱？',
  },
  {
    eyebrow: '产品配置',
    title: '介绍一下星辰电动ES9的配置',
  },
  {
    eyebrow: '竞品研究',
    title: '比较一下华为问界M7和星辰电动ES9',
  },
  {
    eyebrow: '快速开始',
    title: '你好，我想了解一下星辰电动ES9',
  },
]

export default function HotQuestions(props: HotQuestionsProps) {

  const sendMessage = useSendMessage()
  // 使用防抖处理点击事件，300ms内只触发一次
  const handleClick = debounce(300, (question: HotQuestion) => {
    sendMessage(question.title)
  })

  return (
    <div className={styles.hotQuestions}>
      {(props.list ?? list).slice(0, 4).map((question) => (
        <div
          key={question.title}
          className={styles.hotQuestion}
          onClick={() => handleClick(question)}
        >
          <span className={styles.eyebrow}>{question.eyebrow}</span>
          <span className={styles.title}>{question.title}</span>
          <span className={styles.arrow}>↗</span>
        </div>
      ))}
    </div>
  )
}
