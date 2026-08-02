export type StreamStatus =
  | 'idle'
  | 'submitting'
  | 'researching'
  | 'streaming'
  | 'completed'
  | 'stopped'
  | 'failed'

export type ResearchMilestone = '理解问题' | '搜索资料' | '交叉验证' | '组织结论'

export type ResearchActivityKind = 'analysis' | 'search' | 'verification' | 'writing'

export type ResearchActivityItem = {
  kind: ResearchActivityKind
  title: string
  detail: string
}

export type SourceItem = { title: string; url: string; content: string }

export type MediaItem = { title: string; imageUrl: string; link: string; source?: string }

export type StreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'activity'; activity: ResearchActivityItem }
  | { type: 'content'; content: string }
  | { type: 'sources'; sources: SourceItem[] }
  | { type: 'images'; images: MediaItem[] }
  | { type: 'recommendations'; questions: string[] }
  | { type: 'done' }
  | { type: 'protocol-error'; message: string }

export type StreamState = {
  status: StreamStatus
  content: string
  milestones: ResearchMilestone[]
  activities: ResearchActivityItem[]
  sources: SourceItem[]
  images: MediaItem[]
  recommendations: string[]
  error?: string
}
