import type {
  ResearchActivityItem,
  ResearchMilestone,
} from './types'

export function mapThinkingToMilestone(content: string): ResearchMilestone {
  const value = content.toLowerCase()

  if (/search|检索|搜索/.test(value)) return '搜索资料'
  if (/verify|cross|验证/.test(value)) return '交叉验证'
  if (/organize|summary|总结|组织/.test(value)) return '组织结论'

  return '理解问题'
}

const activityByMilestone: Record<ResearchMilestone, ResearchActivityItem> = {
  理解问题: {
    kind: 'analysis',
    title: '理解问题',
    detail: '识别问题目标、上下文与回答约束',
  },
  搜索资料: {
    kind: 'search',
    title: '搜索资料',
    detail: '查找与问题直接相关的信息',
  },
  交叉验证: {
    kind: 'verification',
    title: '交叉验证',
    detail: '比较信息并检查关键事实的一致性',
  },
  组织结论: {
    kind: 'writing',
    title: '组织结论',
    detail: '整理答案结构与关键结论',
  },
}

export function mapThinkingToActivity(content: string): ResearchActivityItem {
  return activityByMilestone[mapThinkingToMilestone(content)]
}
