import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ minHeight: 'calc(100vh - 54px)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <p style={{ color: 'var(--ds-text-secondary)' }}>404</p>
        <h1>页面不存在</h1>
        <p style={{ color: 'var(--ds-text-secondary)' }}>链接可能已失效，或者页面已被移动。</p>
        <Link to="/">返回首页</Link>
      </div>
    </main>
  )
}
