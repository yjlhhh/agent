import { Button } from 'antd'
import './index.scss'

const plans = [
  { name: '免费版', price: '¥0', description: '适合日常快速搜索', features: ['基础搜索', '有限深度研究', '知识库试用'] },
  { name: '专业版', price: '¥99 / 月', description: '适合高频研究工作', features: ['更多深度研究', '完整来源追踪', '更大知识库'] },
]

export default function Pricing() {
  return (
    <section className="pricing-page">
      <header><h1>选择适合你的方案</h1><p>按需升级，不影响已有对话和资料。</p></header>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.name} className="pricing-card">
            <h2>{plan.name}</h2><strong>{plan.price}</strong><p>{plan.description}</p>
            <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <Button type={plan.name === '专业版' ? 'primary' : 'default'} block>{plan.name === '专业版' ? '升级专业版' : '当前方案'}</Button>
          </article>
        ))}
      </div>
    </section>
  )
}
