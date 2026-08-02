import type { ResearchMilestone } from './types'

export function mapThinkingToMilestone(content: string): ResearchMilestone {
  const value = content.toLowerCase()

  if (/search|检索|搜索/.test(value)) return '搜索资料'
  if (/verify|cross|验证/.test(value)) return '交叉验证'
  if (/organize|summary|总结|组织/.test(value)) return '组织结论'

  return '理解问题'
}
