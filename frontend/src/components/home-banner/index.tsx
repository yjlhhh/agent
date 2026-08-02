import styles from './index.module.scss'

export default function HomeBanner() {
  return (
    <section className={styles.banner}>
      <div className={styles.eyebrow}><span /> DEEPSEARCH</div>
      <h1 className={styles.title}>今天想探索什么？</h1>
      <p className={styles.subtitle}>
        搜索网络与你的知识库，整理来源，并生成清晰、可执行的答案。
      </p>
    </section>
  )
}
