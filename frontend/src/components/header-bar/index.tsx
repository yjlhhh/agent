import styles from './index.module.scss'

export default function HeaderBar(props: { className?: string }) {
  return (
    <header className={`${styles['header-bar']} ${props.className || ''}`}>
      <div className={styles.mark}>D</div>
      <span className={styles.name}>DeepSearch</span>
      <span className={styles.tagline}>AI research workspace</span>
    </header>
  )
}
