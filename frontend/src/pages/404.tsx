import { Link } from 'react-router-dom'
import styles from './404.module.scss'

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>页面不存在</h1>
        <p className={styles.desc}>链接可能已失效，或者页面已被移动。</p>
        <div className={styles.actions}>
          <Link className={styles.primary} to="/">
            返回首页
          </Link>
          <Link className={styles.secondary} to="/repository">
            前往知识库
          </Link>
        </div>
      </div>
    </main>
  )
}
